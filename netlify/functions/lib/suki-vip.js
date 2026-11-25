'use strict';
const MAX_DAYS = 365;
function vipPolicy(place = {}) {
    const days = Number(place.suki_vip_days);
    const duration = Number(place.suki_vip_duration_days);
    return {
        enabled: place.suki_enabled === true && place.suki_vip_enabled === true,
        days: Number.isSafeInteger(days) && days >= 1 && days <= MAX_DAYS ? days : 10,
        durationDays: [0,30,90,365].includes(duration) ? duration : 0,
        benefit: String(place.suki_vip_benefit || '').trim().slice(0,120)
    };
}
function activeVip(card = {}, now = Date.now()) {
    const end = card.vipExpiresAt;
    const until = end && typeof end.toMillis === 'function' ? end.toMillis()
        : typeof end?.seconds === 'number' ? end.seconds*1000
        : end instanceof Date ? end.getTime()
        : typeof end === 'string' ? Date.parse(end) : null;
    return card.vipActive === true && (!end || (Number.isFinite(until) && until > now));
}
async function setVip({db,FieldValue,actorUid,isAdmin=false,placeId,customerUid,grant,reason='',now=Date.now()}) {
    const cleanReason = String(reason || '').trim();
    if (cleanReason.length > 200) throw Object.assign(new Error('Review note is too long.'), {status:400});
    return db.runTransaction(async tx => {
        const placeRef = db.collection('places').doc(placeId);
        const cardRef = db.collection('loyalty_cards').doc(`${placeId}_${customerUid}`);
        const [placeSnap,cardSnap] = await Promise.all([tx.get(placeRef),tx.get(cardRef)]);
        if (!placeSnap.exists) throw Object.assign(new Error('Establishment not found.'), {status:404});
        const place = placeSnap.data();
        if (!isAdmin && place.owner_uid !== actorUid) throw Object.assign(new Error('Only this business owner can manage VIP status.'),{status:403});
        if (!cardSnap.exists || cardSnap.data().placeId !== placeId || cardSnap.data().customerUid !== customerUid)
            throw Object.assign(new Error('No eligible Suki Card found for this customer.'),{status:404});
        if (place.owner_uid === customerUid) throw Object.assign(new Error('The owner cannot receive their own VIP card.'),{status:409});
        const old = cardSnap.data();
        const policy = vipPolicy(place);
        const currentlyActive = activeVip(old,now);
        if (grant) {
            if (!policy.enabled) throw Object.assign(new Error('Enable Suki and the VIP program before granting VIP.'),{status:409});
            if (currentlyActive) throw Object.assign(new Error('Customer is already VIP.'),{status:409});
            const days = Number.isSafeInteger(old.verifiedPurchaseDays) && old.verifiedPurchaseDays >= 0 ? old.verifiedPurchaseDays : 0;
            if (days < policy.days && cleanReason.length < 8)
                throw Object.assign(new Error('Manual VIP grants below the requirement need a review reason (8+ characters).'),{status:400});
        } else {
            if (!currentlyActive) throw Object.assign(new Error('Customer has no active VIP status.'),{status:409});
            if (cleanReason.length < 8) throw Object.assign(new Error('Revocation reason must contain at least 8 characters.'),{status:400});
        }
        const after = grant && policy.durationDays ? new Date(now + policy.durationDays * 86400000) : null;
        const eventRef = db.collection('suki_vip_events').doc();
        tx.update(cardRef,{
            vipActive: !!grant,
            vipGrantedAt: grant ? FieldValue.serverTimestamp() : (old.vipGrantedAt || null),
            vipExpiresAt: grant ? after : null,
            vipUpdatedBy: actorUid,
            vipUpdatedAt: FieldValue.serverTimestamp(),
            vipGrantReason: grant ? (cleanReason || 'Verified purchase-day eligibility') : (old.vipGrantReason || ''),
            vipRevocationReason: !grant ? cleanReason : '',
            updatedAt: FieldValue.serverTimestamp()
        });
        tx.create(eventRef,{placeId,customerUid,action:grant?'grant':'revoke',actorUid,reason:cleanReason,
            verifiedPurchaseDays:old.verifiedPurchaseDays||0,requiredDays:policy.days,
            expiresAt:after,createdAt:FieldValue.serverTimestamp()});
        return {vipActive:!!grant,verifiedPurchaseDays:old.verifiedPurchaseDays||0,expiresAt:after?.toISOString()||null};
    });
}
module.exports={vipPolicy,activeVip,setVip};
