'use strict';
// Trusted Suki award ledger. All awarded stamp days use the same transaction,
// regardless of whether the source is an in-store approval or an online order.
const crypto = require('node:crypto');
const { paidCents } = require('./business-analytics');
// The Philippines does not observe daylight saving time.
function manilaDay(now = Date.now()) {
    return new Date(now + 8 * 3600000).toISOString().slice(0,10).replaceAll('-','');
}

function stampDayId(placeId, customerUid, day) {
    return crypto.createHash('sha256').update(JSON.stringify([placeId, customerUid, day])).digest('hex');
}
function nonnegativeInt(value) {
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}
function stampTarget(place) {
    const count = Number.parseInt(place.suki_stamp_count, 10);
    return Number.isFinite(count) ? Math.max(2, Math.min(24, count)) : 8;
}
function knownRedemptions(card) {
    return card.redemptionCount == null && card.claimed ? 1 : nonnegativeInt(card.redemptionCount);
}

// tx reads must occur before any tx writes. The source-specific callers read
// the request/booking and place before invoking this helper.
async function awardInsideTransaction({ tx, db, FieldValue, placeId, customerUid, place, day, source, sourceId, customerName }) {
    if (!place?.suki_enabled) return { awarded: false, qualified: false, reason: 'disabled' };
    if (!customerUid || place.owner_uid === customerUid) return { awarded: false, qualified: false, reason: 'invalid-customer' };
    const dayRef = db.collection('suki_daily_stamps').doc(stampDayId(placeId, customerUid, day));
    const cardRef = db.collection('loyalty_cards').doc(`${placeId}_${customerUid}`);
    const orderRef = source === 'online_order' ? db.collection('suki_order_awards').doc(sourceId) : null;
    const [daySnap, cardSnap, orderSnap] = await Promise.all([
        tx.get(dayRef), tx.get(cardRef), orderRef ? tx.get(orderRef) : Promise.resolve(null)
    ]);
    if (orderSnap?.exists) return {awarded:false,qualified:false,reason:'order-already-counted',day};
    if (daySnap.exists) {
        // A second completed order on the same day earns no extra stamp.
        // It is permanently marked processed to prevent next-day replays.
        if (orderRef) tx.create(orderRef,{bookingId:sourceId,placeId,customerUid,day,
            awarded:false,reason:'daily-limit',createdAt:FieldValue.serverTimestamp()});
        return { awarded: false, qualified: false, reason: 'daily-limit', day };
    }
    const oldCard = cardSnap.exists ? cardSnap.data() || {} : {};
    const target = stampTarget(place);
    const prior = Math.max(0, nonnegativeInt(oldCard.stamps));
    const wasClaimed = !!oldCard.claimed;
    const newStamps = wasClaimed ? 1 : Math.min(target, prior + 1);
    const awarded = newStamps > prior || wasClaimed;
    const previousDays = nonnegativeInt(oldCard.verifiedPurchaseDays);
    // One immutable record per establishment/customer/Manila calendar day.
    // A full stamp card still earns a qualifying *loyalty day*; it cannot mint
    // extra stamps until the card is redeemed.
    tx.create(dayRef, {
        placeId, customerUid, day, source, sourceId,
        awarded, createdAt: FieldValue.serverTimestamp()
    });
    if (orderRef) tx.create(orderRef,{bookingId:sourceId,placeId,customerUid,day,
        awarded,reason:awarded?'awarded':'card-full',createdAt:FieldValue.serverTimestamp()});
    const data = {
        placeId, customerUid,
        customerName: String(customerName || oldCard.customerName || 'Customer').slice(0,120),
        stamps: newStamps,
        redemptionCount: knownRedemptions(oldCard),
        claimed: false,
        claimRequested: wasClaimed ? false : !!oldCard.claimRequested,
        verifiedPurchaseDays: previousDays + 1,
        lastStampDay: day,
        updatedAt: FieldValue.serverTimestamp()
    };
    if (cardSnap.exists) tx.update(cardRef, data);
    else tx.create(cardRef, data);
    return { awarded, qualified: true, day, stamps: newStamps, verifiedPurchaseDays: previousDays + 1, reason: awarded ? 'awarded' : 'card-full' };
}

async function approveInStore({ db, FieldValue, actorUid, requestId, isAdmin = false, now = Date.now() }) {
    const day = manilaDay(now);
    return db.runTransaction(async tx => {
        const requestRef = db.collection('stamp_requests').doc(requestId);
        const requestSnap = await tx.get(requestRef);
        if (!requestSnap.exists) throw Object.assign(new Error('Stamp request not found.'), {status:404});
        const request = requestSnap.data();
        if (request.status !== 'pending') throw Object.assign(new Error('This stamp request has already been handled.'), {status:409});
        if (typeof request.placeId !== 'string' || typeof request.customerUid !== 'string')
            throw Object.assign(new Error('Invalid stamp request.'), {status:400});
        const placeSnap = await tx.get(db.collection('places').doc(request.placeId));
        if (!placeSnap.exists) throw Object.assign(new Error('Establishment not found.'), {status:404});
        const place = placeSnap.data();
        if (!isAdmin && place.owner_uid !== actorUid) throw Object.assign(new Error('Only the establishment owner can approve a stamp.'), {status:403});
        const award = await awardInsideTransaction({tx,db,FieldValue,placeId:request.placeId,customerUid:request.customerUid,place,day,source:'in_store',sourceId:requestId,customerName:request.customerName});
        if (award.reason === 'disabled' || award.reason === 'invalid-customer') throw Object.assign(new Error('This stamp request cannot be approved.'), {status:409});
        tx.update(requestRef, { status: award.reason === 'daily-limit' ? 'rejected' : 'approved',
            ...(award.reason === 'daily-limit' ? { rejectionReason:'daily-limit' } : {}),
            approvedBy: award.reason === 'daily-limit' ? null : actorUid,
            updatedAt: FieldValue.serverTimestamp(),
            ...(award.qualified ? {approvedAt: FieldValue.serverTimestamp()} : {})
        });
        return award;
    });
}

async function awardConfirmedOrder({ db, FieldValue, bookingId, now = Date.now() }) {
    return db.runTransaction(async tx => {
        const bookingSnap = await tx.get(db.collection('bookings').doc(bookingId));
        if (!bookingSnap.exists) throw Object.assign(new Error('Order not found.'), {status:404});
        const order = bookingSnap.data();
        // New menu-backed order, finished by the business and acknowledged by
        // the customer. Pure table reservations do not earn an order stamp.
        // Phase 10 audit: receipt confirmation alone is NOT payment verification.
        // Match the paid-and-completed eligibility used by Business Analytics.
        // A refunded/reversed transaction must never mint a new loyalty day.
        if (paidCents(order) === null ||
            (order.refundStatus && order.refundStatus !== 'not_required') ||
            !Array.isArray(order.menuLines) || !order.menuLines.length)
            return {awarded:false, qualified:false, reason:'not-eligible'};
        const placeSnap = await tx.get(db.collection('places').doc(order.placeId));
        if (!placeSnap.exists) return {awarded:false, qualified:false, reason:'place-missing'};
        // Preserve the original customer-confirmation day on late retries.
        const confirmedAt=order.customerConfirmedAt;
        const confirmedMs=typeof confirmedAt?.toMillis==='function'?confirmedAt.toMillis()
            : Number.isFinite(confirmedAt?.seconds)?confirmedAt.seconds*1000
            : now;
        const day=manilaDay(confirmedMs);
        return awardInsideTransaction({tx,db,FieldValue,placeId:order.placeId,customerUid:order.userId,
            place:placeSnap.data(),day,source:'online_order',sourceId:bookingId,customerName:order.userName});
    });
}

async function redeem({db,FieldValue,actorUid,cardId,isAdmin=false}) {
    return db.runTransaction(async tx => {
        const ref=db.collection('loyalty_cards').doc(cardId),snap=await tx.get(ref);
        if(!snap.exists)throw Object.assign(new Error('Suki Card not found.'),{status:404});
        const card=snap.data();
        const placeSnap=await tx.get(db.collection('places').doc(card.placeId));
        if(!placeSnap.exists)throw Object.assign(new Error('Establishment not found.'),{status:404});
        const place=placeSnap.data();
        if(!isAdmin&&place.owner_uid!==actorUid)throw Object.assign(new Error('Only the establishment owner can confirm this claim.'),{status:403});
        if(!card.claimRequested||card.claimed)throw Object.assign(new Error('No active reward claim to complete.'),{status:409});
        const target=stampTarget(place),count=nonnegativeInt(card.stamps);
        if(count<target)throw Object.assign(new Error('Not enough stamps for this reward.'),{status:409});
        const newCount=knownRedemptions(card)+1;
        tx.update(ref,{stamps:count-target,claimed:false,claimRequested:false,redemptionCount:newCount,
            claimedAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
        return {redeemed:true,redemptionCount:newCount};
    });
}

module.exports={stampDayId,stampTarget,manilaDay,awardInsideTransaction,approveInStore,awardConfirmedOrder,redeem};
