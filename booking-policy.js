const { isOnline } = require('../../../js/payment-policy');
function transition(order, actor, patch) {
    const current = order.status || 'pending';
    const next = patch.status;
    if (typeof next !== 'string') throw Object.assign(new Error('Choose a booking action.'), { status: 400 });
    const ownerSteps = {
        pending: ['accepted', 'rejected'], accepted: ['preparing', 'fulfilled'],
        payment_submitted: ['payment_confirmed', 'accepted'], payment_confirmed: ['preparing', 'fulfilled'],
        preparing: ['ready', 'fulfilled', 'out_for_delivery'], ready: ['fulfilled'], out_for_delivery: ['delivered']
    };
    if (actor === 'owner' && (ownerSteps[current] || []).includes(next)) {
        if (next === 'out_for_delivery' && !['delivery_order', 'delivery'].includes(order.requestType))
            throw Object.assign(new Error('Only delivery orders can be marked out for delivery.'), { status: 409 });
        if (current === 'accepted' && ['preparing', 'fulfilled'].includes(next) && isOnline(order))
            throw Object.assign(new Error('Verify the online payment proof before preparation.'), { status: 409 });
        if (current === 'payment_submitted' && next === 'accepted') {
            const note = typeof patch.paymentReviewNote === 'string' ? patch.paymentReviewNote.trim() : '';
            if (note.length < 5 || note.length > 500) throw Object.assign(new Error('Explain why the payment details were declined (5–500 characters).'), { status: 400 });
            return { status: next, paymentStatus: 'correction_requested', paymentReviewDecision: 'declined', paymentReviewNote: note };
        }
        if (next === 'payment_confirmed') {
            if (!order.paymentProofPath && !order.paymentProofUrl && !(order.paymentReference && Number(order.paymentAmount) > 0))
                throw Object.assign(new Error('No receipt or manual payment reference was submitted. Ask the customer for payment details.'), { status: 409 });
            return { status: next, paymentStatus: 'confirmed', paymentReviewDecision: 'accepted' };
        }
        return { status: next };
    }
    if (actor === 'customer' && next === 'cancelled' && ['pending', 'accepted', 'payment_submitted'].includes(current)) {
        const rate = Number(order.refundPercent ?? 50);
        return { status: next, refundPercent: current === 'pending' ? 100 : Number.isFinite(rate) ? Math.max(0, Math.min(100, rate)) : 50 };
    }
    if (actor === 'customer' && next === 'received' && ['fulfilled', 'ready', 'delivered', 'ready_for_pickup'].includes(current)) return { status: next, customer_confirmed: true };
    if (current === next) return null;
    throw Object.assign(new Error('This action is not allowed at the current booking stage. Refresh and try again.'), { status: 409 });
}
module.exports = { transition };
