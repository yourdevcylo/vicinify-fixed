function transition(order, actor, patch) {
    const current = order.status || 'pending';
    const next = patch.status;
    if (typeof next !== 'string') throw Object.assign(new Error('Choose a booking action.'), { status: 400 });
    const ownerSteps = {
        pending: ['accepted', 'rejected'], accepted: ['preparing', 'fulfilled'],
        payment_submitted: ['payment_confirmed', 'accepted'], payment_confirmed: ['preparing', 'fulfilled'],
        preparing: ['ready', 'fulfilled'], ready: ['fulfilled']
    };
    if (actor === 'owner' && (ownerSteps[current] || []).includes(next)) return { status: next };
    if (actor === 'customer' && next === 'cancelled' && ['pending', 'accepted', 'payment_submitted'].includes(current)) {
        return { status: next, refundPercent: current === 'pending' ? 100 : Number(order.refundPercent ?? 50) };
    }
    if (actor === 'customer' && next === 'received' && ['fulfilled', 'ready', 'delivered', 'ready_for_pickup'].includes(current)) return { status: next, customer_confirmed: true };
    if (current === next) return null;
    throw Object.assign(new Error('This action is not allowed at the current booking stage. Refresh and try again.'), { status: 409 });
}
module.exports = { transition };
