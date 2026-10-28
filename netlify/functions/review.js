const ContentPolicy = require('../../js/content-policy');
const { services, authenticate, identifier, limit, reply } = require('./lib/admin');

exports.handler = async event => {
    if (event.httpMethod !== 'POST') return reply(405, { error: 'POST only' });
    try {
        const user = await authenticate(event);
        if ((event.body || '').length > 12000) return reply(413, { error: 'Review is too large.' });
        const body = JSON.parse(event.body || '{}');
        const placeId = identifier(body.placeId);
        const rating = Number(body.rating);
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) return reply(400, { error: 'Choose a rating from 1 to 5.' });
        if (typeof body.feedback !== 'undefined' && (typeof body.feedback !== 'string' || body.feedback.length > 2000)) return reply(400, { error: 'Feedback must be at most 2,000 characters.' });
        const feedbackProblem = body.feedback && ContentPolicy.error('review',body.feedback);
        if(feedbackProblem) return reply(400,{error:feedbackProblem});
        await limit(user.uid, 'review', 10);
        const { db, FieldValue } = services();
        let bookingId = body.bookingId;
        if (!bookingId) {
            const eligible = await db.collection('bookings').where('userId', '==', user.uid).where('placeId', '==', placeId).where('status', '==', 'received').limit(1).get();
            if (eligible.empty) return reply(403, { error: 'Complete and confirm a transaction before reviewing this establishment.' });
            bookingId = eligible.docs[0].id;
        }
        identifier(bookingId);
        const reviewId = `${user.uid}_${placeId}_${bookingId}`;
        const reviewRef = db.collection('reviews').doc(reviewId);
        const placeRef = db.collection('places').doc(placeId);
        await db.runTransaction(async transaction => {
            const [booking, place, previous, profile] = await Promise.all([
                transaction.get(db.collection('bookings').doc(bookingId)), transaction.get(placeRef),
                transaction.get(reviewRef), transaction.get(db.collection('users').doc(user.uid))
            ]);
            const order = booking.data();
            if (!order || order.userId !== user.uid || order.placeId !== placeId || order.status !== 'received' || !place.exists || place.data().owner_uid === user.uid) {
                throw Object.assign(new Error('A completed transaction with this establishment is required.'), { status: 403 });
            }
            let sum = place.data().ratingSum;
            let count = place.data().reviewCount || 0;
            if (!Number.isFinite(sum)) {
                const existing = await transaction.get(db.collection('reviews').where('placeId', '==', placeId));
                sum = 0; count = 0;
                existing.forEach(document => { const value = Number(document.data().rating); if (value >= 1 && value <= 5) { sum += value; count++; } });
            }
            const oldRating = Number(previous.data()?.rating);
            if (oldRating >= 1 && oldRating <= 5) sum -= oldRating; else count++;
            sum += rating;
            transaction.set(reviewRef, {
                userId: user.uid, userName: String(profile.data()?.fullName || user.name || 'Customer').slice(0, 120),
                placeId, bookingId, transactionId: bookingId, rating, feedback: body.feedback || '',
                satisfaction: String(body.satisfaction || '').slice(0, 80), isPublic: body.isPublic !== false,
                verifiedTransaction: true, reviewSource: 'completed_transaction', requestType: order.requestType || 'table_reservation',
                createdAt: previous.data()?.createdAt || FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp()
            });
            transaction.update(placeRef, { ratingSum: sum, reviewCount: count, avgRating: Number((sum / count).toFixed(1)) });
        });
        return reply(200, { reviewId });
    } catch (error) {
        return reply(error.status || (error instanceof SyntaxError ? 400 : 500), { error: error.status ? error.message : 'Review could not be saved. Please try again.' });
    }
};
