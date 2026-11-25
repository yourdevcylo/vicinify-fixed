'use strict';
const crypto = require('node:crypto');
const {vipPolicy, activeVip} = require('./suki-vip');

// The business must explicitly configure a numeric online-menu discount.
// Freeform benefit text never authorizes price changes.
function discountRate(place) {
    const value = place?.suki_vip_discount_percent;
    return Number.isInteger(value) && value >= 1 && value <= 50 ? value : 0;
}
async function withVipDiscount({tx, db, quote, place, placeId, customerUid, now=Date.now()}) {
    const gross = quote.totalCents;
    const base = { ...quote, vipDiscountPercent:0, vipDiscountCents:0,
        estimatedTotalCents:gross, vipApplied:false };
    if (!vipPolicy(place).enabled || !discountRate(place) || gross <= 0 || place.owner_uid === customerUid)
        return base;
    const cardSnap = await tx.get(db.collection('loyalty_cards').doc(`${placeId}_${customerUid}`));
    if (!cardSnap.exists) return base;
    const card = cardSnap.data() || {};
    if (card.placeId !== placeId || card.customerUid !== customerUid || !activeVip(card,now)) return base;
    const rate = discountRate(place);
    // Very small menu prices can round to zero; never create a zero/negative
    // payable total for an online-order payment workflow.
    const saving = Math.min(gross - 1, Math.round(gross * rate / 100));
    if (saving < 1) return base;
    const net = gross - saving;
    // The saved quote includes the price and the VIP rate. Revocation, expiry,
    // or changes to the owner's percentage before confirmation invalidate it.
    const digest = crypto.createHash('sha256').update(JSON.stringify({
        menuDigest:quote.digest, vipDiscountPercent:rate, vipDiscountCents:saving,
        estimatedTotalCents:net
    })).digest('hex');
    return {...base, vipDiscountPercent:rate, vipDiscountCents:saving,
        estimatedTotalCents:net, vipApplied:true, digest,
        notice:'VIP discount applied to menu items only. The business may add separately itemized delivery or service fees before payment. No payment is collected in Vicinify.'};
}
module.exports={discountRate,withVipDiscount};
