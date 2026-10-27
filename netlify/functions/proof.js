const crypto = require('node:crypto');
const { services, authenticate, identifier, limit, reply } = require('./lib/admin');
exports.handler = async event => {
    if (event.httpMethod !== 'POST') return reply(405, { error: 'POST only' });
    try {
        const user = await authenticate(event);
        if ((event.body || '').length > 1500000) return reply(413, { error: 'Image is too large.' });
        const body = JSON.parse(event.body || '{}');
        const bookingId = identifier(body.bookingId);
        const { db, storage, FieldValue } = services();
        const ref = db.collection('bookings').doc(bookingId);
        const booking = await ref.get();
        if (!booking.exists) return reply(404, { error: 'Booking not found.' });
        const order = booking.data();
        const place = await db.collection('places').doc(order.placeId).get();
        if (!['read', 'upload', undefined].includes(body.action)) return reply(400, { error: 'Unknown proof action.' });
        if (body.action === 'read') {
            if (order.userId !== user.uid && place.data()?.owner_uid !== user.uid) return reply(403, { error: 'Not authorized.' });
            const objectPath = order.paymentProofPath;
            if (!objectPath || !objectPath.startsWith(`payment_proofs/${bookingId}/`)) return reply(404, { error: 'No proof is available.' });
            const [bytes] = await storage.bucket().file(objectPath).download();
            return { statusCode: 200, headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' }, isBase64Encoded: true, body: bytes.toString('base64') };
        }
        if (order.userId !== user.uid || !['accepted', 'payment_submitted'].includes(order.status)) return reply(403, { error: 'This booking is not awaiting payment proof.' });
        if (typeof body.image !== 'string' || !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(body.image)) return reply(400, { error: 'Upload a JPEG image.' });
        const bytes = Buffer.from(body.image.split(',')[1], 'base64');
        if (bytes.length > 1000000 || bytes.length < 4 || bytes[0] !== 255 || bytes[1] !== 216) return reply(400, { error: 'Invalid or oversized image.' });
        await limit(user.uid, 'proof', 5);
        const objectPath = `payment_proofs/${bookingId}/${crypto.createHash('sha256').update(bytes).digest('hex')}.jpg`;
        await storage.bucket().file(objectPath).save(bytes, { contentType: 'image/jpeg', metadata: { cacheControl: 'private,no-store' } });
        await db.runTransaction(async transaction => {
            const current = await transaction.get(ref);
            if (current.data()?.userId !== user.uid || !['accepted', 'payment_submitted'].includes(current.data()?.status)) throw Object.assign(new Error('Booking status changed. Please refresh.'), { status: 409 });
            const cards = await transaction.get(db.collection('messages').where('bookingId', '==', bookingId).where('type', '==', 'booking_card').limit(20));
            const patch = { status: 'payment_submitted', paymentProofPath: objectPath, paymentProofUrl: FieldValue.delete(), paymentProofAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() };
            transaction.update(ref, patch);
            cards.forEach(card => transaction.update(card.ref, { ...patch, bookingStatus: 'payment_submitted' }));
        });
        return reply(200, { saved: true });
    } catch (error) { return reply(error.status || (error instanceof SyntaxError ? 400 : 500), { error: error.status ? error.message : 'Proof could not be processed. Please try again.' }); }
};

