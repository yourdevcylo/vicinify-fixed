(function(root) {
    function isOnline(order) {
        const method = String(order.paymentMethod || '').trim().toLowerCase();
        return !!method && !(/\bcash\b|\bcod\b|pay (upon|on) pickup|pay at (store|pickup)/.test(method));
    }
    function flow(order) {
        const status = order.bookingStatus || order.status || 'pending';
        const online = isOnline(order);
        const verified = status === 'payment_confirmed' || (order.paymentStatus === 'confirmed' && !['pending','accepted','payment_submitted'].includes(status));
        const closed = ['cancelled','rejected'].includes(status);
        const awaitingProof = online && status === 'accepted';
        const reviewing = online && status === 'payment_submitted';
        const canPrepare = status === 'payment_confirmed' || (status === 'accepted' && !online);
        return { online, verified, closed, awaitingProof, reviewing, canPrepare };
    }
    function details(reference, amount) {
        if (typeof reference !== 'string' || reference.trim().length < 3 || reference.trim().length > 80 || /[\x00-\x1f\x7f]/.test(reference))
            throw new Error('Enter a reference number between 3 and 80 characters.');
        const text = typeof amount === 'string' ? amount.trim() : '';
        const number = Number(text);
        if (!/^\d+(\.\d{1,2})?$/.test(text) || !Number.isFinite(number) || number <= 0 || !Number.isSafeInteger(Math.round(number * 100)))
            throw new Error('Enter a valid amount paid greater than zero, with up to two decimal places.');
        return { paymentReference: reference.trim(), paymentAmount: number.toFixed(2) };
    }
    const api = { isOnline, flow, details };
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.PaymentPolicy = api;
})(typeof window !== 'undefined' ? window : globalThis);
