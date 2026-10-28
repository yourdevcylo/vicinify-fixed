const { services, authenticate, identifier, limit, reply } = require('./lib/admin');
const { createBooking } = require('./lib/booking-create');
const { transition } = require('./lib/booking-policy');
exports.handler = async event => {
    if (event.httpMethod !== 'POST') return reply(405, { error: 'POST only' });
    try {
        const user = await authenticate(event);
        if ((event.body || '').length > 16000) return reply(413, { error: 'Request is too large.' });
        const body = JSON.parse(event.body || '{}');
        const { db, FieldValue } = services();
        if (body.action === 'create') {
            const input = body.request || {};
            const placeId = identifier(input.placeId);
            await limit(user.uid, 'booking_create', 6);
            const placeRef = db.collection('places').doc(placeId);
            const ref = db.collection('bookings').doc();
            const card = db.collection('messages').doc();
            await db.runTransaction(async transaction => {
                const place = await transaction.get(placeRef);
                const profile = await transaction.get(db.collection('users').doc(user.uid));
                if (!place.exists) throw Object.assign(new Error('Establishment not found.'), {status:404});
                const order = {...createBooking(input,user,place.data(),profile.data()), transactionId:ref.id,
                    createdAt:FieldValue.serverTimestamp(), updatedAt:FieldValue.serverTimestamp()};
                transaction.create(ref,order);
                transaction.create(card,{...order,type:'booking_card',bookingId:ref.id,bookingStatus:'pending',
                    senderUid:user.uid,senderRole:'customer',senderName:order.userName,createdBy:user.uid,reply:null});
            });
            return reply(200, {saved:true,bookingId:ref.id});
        }
        if (body.action && body.action !== 'update') return reply(400,{error:'Unknown booking action.'});
        const bookingId = identifier(body.bookingId);
        const ref = db.collection('bookings').doc(bookingId);
        await db.runTransaction(async transaction => {
            const booking = await transaction.get(ref);
            if (!booking.exists) throw Object.assign(new Error('Booking not found.'), { status: 404 });
            const order = booking.data();
            const place = await transaction.get(db.collection('places').doc(order.placeId));
            const profile = await transaction.get(db.collection('users').doc(user.uid));
            const admin = profile.data()?.role === 'admin' || user.uid === 'Z45NZhQTgsTUX79WJ5ksCH8N3c02';
            const actor = place.data()?.owner_uid === user.uid || admin ? 'owner' : order.userId === user.uid ? 'customer' : null;
            if (!actor) throw Object.assign(new Error('Not authorized for this booking.'), { status: 403 });
            const change = transition(order, actor, body.patch || {});
            if (!change) return;
            const cards = await transaction.get(db.collection('messages').where('bookingId', '==', bookingId).where('type', '==', 'booking_card').limit(50));
            change.updatedAt = FieldValue.serverTimestamp();
            if (change.status === 'payment_confirmed') change.paymentVerifiedAt = FieldValue.serverTimestamp();
            if (change.paymentReviewDecision) { change.paymentReviewedBy = user.uid; change.paymentReviewedAt = FieldValue.serverTimestamp(); }
            if (change.status === 'received') change.customerConfirmedAt = FieldValue.serverTimestamp();
            if (change.status === 'cancelled') change.cancelledAt = FieldValue.serverTimestamp();
            if (order.status === 'payment_submitted' && change.status === 'accepted') {
                change.paymentProofPath = FieldValue.delete(); change.paymentProofUrl = FieldValue.delete();
                // Keep the decline reason and decision supplied by the policy.
            }
            transaction.update(ref, change);
            cards.forEach(card => transaction.update(card.ref, { ...change, bookingStatus: change.status }));
            transaction.create(ref.collection('events').doc(), { actorUid: user.uid, from: order.status, to: change.status, paymentReviewDecision: change.paymentReviewDecision || null, paymentReviewNote: change.paymentReviewNote || null, createdAt: FieldValue.serverTimestamp() });
        });
        return reply(200, { saved: true });
    } catch (error) { return reply(error.status || (error instanceof SyntaxError ? 400 : 500), { error: error.status ? error.message : 'Booking could not be updated.' }); }
};

