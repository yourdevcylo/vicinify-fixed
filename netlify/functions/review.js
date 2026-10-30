const {ratingChange}=require('./lib/ratings');
const ContentPolicy = require('../../js/content-policy');
const { services, authenticate, identifier, limit, reply } = require('./lib/admin');

exports.handler = async event => {
    if (event.httpMethod !== 'POST') return reply(405, { error: 'POST only' });
    try {
        const user = await authenticate(event);
        if ((event.body || '').length > 12000) return reply(413, { error: 'Review is too large.' });
        const body = JSON.parse(event.body || '{}');
        const placeId = identifier(body.placeId);
        const feedbackMessageId=body.feedbackMessageId?identifier(body.feedbackMessageId):null;
        const rating = Number(body.rating);
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) return reply(400, { error: 'Choose a rating from 1 to 5.' });
        if (typeof body.feedback !== 'undefined' && (typeof body.feedback !== 'string' || body.feedback.length > 2000)) return reply(400, { error: 'Feedback must be at most 2,000 characters.' });
        const feedbackProblem = body.feedback && ContentPolicy.error('review',body.feedback);
        if(feedbackProblem) return reply(400,{error:feedbackProblem});
        const ratingOnly=body.action==='rate'||(!body.action&&!body.bookingId&&body.createOnly!==true&&body.feedback===undefined&&body.satisfaction===undefined&&!body.feedbackMessageId);
        if(ratingOnly){
            if(Object.keys(body).some(key=>!['action','placeId','rating','isPublic'].includes(key)))return reply(400,{error:'Star ratings cannot include a written review or transaction fields.'});
            await limit(user.uid,'rating',30);
            const {db,FieldValue}=services();
            await db.runTransaction(async tx=>{
                const ref=db.collection('places').doc(placeId),place=await tx.get(ref);
                if(!place.exists||place.data().accountDeleted||place.data().approval_status&&place.data().approval_status!=='approved')throw Object.assign(new Error('This establishment is not available for rating.'),{status:403});
                if(place.data().owner_uid===user.uid)throw Object.assign(new Error('You cannot rate your own establishment.'),{status:403});
                const change=await ratingChange(tx,db,place,user.uid,placeId,rating,FieldValue);
                tx.set(change.ref,change.data);tx.update(ref,change.aggregate);
            });
            return reply(200,{ratingSaved:true});
        }
        if(body.action && body.action!=='feedback')return reply(400,{error:'Unknown review action.'});
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
            const [booking, place, previous, profile, feedbackRequest] = await Promise.all([
                transaction.get(db.collection('bookings').doc(bookingId)), transaction.get(placeRef),
                transaction.get(reviewRef), transaction.get(db.collection('users').doc(user.uid)),
                feedbackMessageId?transaction.get(db.collection('messages').doc(feedbackMessageId)):Promise.resolve(null)
            ]);
            const order = booking.data();
            if (!order || order.userId !== user.uid || order.placeId !== placeId || order.status !== 'received' || !place.exists || place.data().owner_uid === user.uid) {
                throw Object.assign(new Error('A completed transaction with this establishment is required.'), { status: 403 });
            }
            // A transaction can be reviewed once, even if a caller omits createOnly.
            if (previous.exists || order.feedbackSubmittedAt) {
                throw Object.assign(new Error('You already submitted feedback for this transaction.'), { status: 409 });
            }
            if(feedbackRequest?.exists){
                const request=feedbackRequest.data();
                if(request.userId!==user.uid||request.placeId!==placeId||request.bookingId!==bookingId||request.type!=='feedback_request')throw Object.assign(new Error('Invalid feedback request.'),{status:403});
            }
            const stars=await ratingChange(transaction,db,place,user.uid,placeId,rating,FieldValue);
            transaction.set(reviewRef, {
                userId: user.uid, userName: String(profile.data()?.fullName || user.name || 'Customer').slice(0, 120),
                placeId, bookingId, transactionId: bookingId, rating, feedback: body.feedback || '',
                satisfaction: String(body.satisfaction || '').slice(0, 80), isPublic: body.isPublic !== false,
                verifiedTransaction: true, reviewSource: 'completed_transaction', requestType: order.requestType || 'table_reservation',
                createdAt: previous.data()?.createdAt || FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp()
            });
            transaction.update(db.collection('bookings').doc(bookingId),{feedbackSubmittedAt:FieldValue.serverTimestamp(),feedbackStatus:'feedback_submitted',reviewId,...(require('../../js/payment-policy').conversationClosed({...order,feedbackStatus:'feedback_submitted',feedbackSubmittedAt:true})?{conversationArchivedAt:FieldValue.serverTimestamp()}:{})});
            if(feedbackRequest?.exists)transaction.update(db.collection('messages').doc(feedbackMessageId),{feedbackStatus:'feedback_submitted',rating,satisfaction:String(body.satisfaction||'').slice(0,80),feedback:body.feedback||'',updatedAt:FieldValue.serverTimestamp()});
            transaction.set(stars.ref,stars.data);
            transaction.update(placeRef,stars.aggregate);
        });
        return reply(200, { reviewId });
    } catch (error) {
        return reply(error.status || (error instanceof SyntaxError ? 400 : 500), { error: error.status ? error.message : 'Review could not be saved. Please try again.' });
    }
};
