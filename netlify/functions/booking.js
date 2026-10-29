const { services, authenticate, identifier, limit, reply } = require('./lib/admin');
const { createBooking } = require('./lib/booking-create');
const PaymentPolicy = require('../../js/payment-policy');
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
                const deletionLock = await transaction.get(db.collection('account_deletions').doc(user.uid));
                if(deletionLock.exists)throw Object.assign(new Error('Account deletion is in progress.'),{status:409});
                const place = await transaction.get(placeRef);
                if(place.data()?.owner_uid && (await transaction.get(db.collection('account_deletions').doc(place.data().owner_uid))).exists)throw Object.assign(new Error('This business is closing its account.'),{status:409});
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
        if (body.action && body.action!=='update') return reply(400,{error:'Unknown booking action.'});
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
            let requirementMessage=null,requirementRequest=null,requirementResponse=null;
            let inputPatch=body.patch || {};
            if(inputPatch.requirements){
                inputPatch={...inputPatch,requirements:{...inputPatch.requirements}};
                const action=inputPatch.requirements.action;
                if(action==='request'){requirementMessage=db.collection('messages').doc();inputPatch.requirements.requestId=requirementMessage.id;}
                else {
                    inputPatch.requirements.requestId=identifier(inputPatch.requirements.requestId);
                    requirementRequest=db.collection('messages').doc(inputPatch.requirements.requestId);
                    const request=await transaction.get(requirementRequest);
                    if(!request.exists||request.data().bookingId!==bookingId)throw Object.assign(new Error('Requirements do not belong to this transaction.'),{status:403});
                    if(action==='submit'){requirementMessage=db.collection('messages').doc();inputPatch.requirements.responseId=requirementMessage.id;}
                    else if(order.requirementsState?.responseId){requirementResponse=db.collection('messages').doc(order.requirementsState.responseId);await transaction.get(requirementResponse);}
                }
            }
            let change;
            change = transition(order, actor, inputPatch);
            if (!change) return;
            const cards = await transaction.get(db.collection('messages').where('bookingId', '==', bookingId).where('type', '==', 'booking_card').limit(50));
            change.updatedAt = FieldValue.serverTimestamp();
            if(change.paymentTermsVersion){change.paymentTermsUpdatedAt=FieldValue.serverTimestamp();change.paymentTermsUpdatedBy=user.uid;}
            if(change.refundStatus){change.refundUpdatedAt=FieldValue.serverTimestamp();change.refundUpdatedBy=user.uid;if(change.refundStatus==='approved'){change.refundApprovedAt=FieldValue.serverTimestamp();change.refundApprovedBy=user.uid;}if(change.refundStatus==='sent')change.refundSentAt=FieldValue.serverTimestamp();if(change.refundStatus==='received')change.refundReceivedAt=FieldValue.serverTimestamp();}
            const nextStatus=change.status || order.status;
            if(PaymentPolicy.conversationClosed({...order,...change}))change.conversationArchivedAt=FieldValue.serverTimestamp();
            if (change.status === 'payment_confirmed') change.paymentVerifiedAt = FieldValue.serverTimestamp();
            if (change.paymentReviewDecision) { change.paymentReviewedBy = user.uid; change.paymentReviewedAt = FieldValue.serverTimestamp(); }
            if (change.status === 'received') change.customerConfirmedAt = FieldValue.serverTimestamp();
            if (change.status === 'cancelled') change.cancelledAt = FieldValue.serverTimestamp();
            if (order.status === 'payment_submitted' && change.status === 'accepted') {
                change.paymentProofPath = FieldValue.delete(); change.paymentProofUrl = FieldValue.delete();
                // Keep the decline reason and decision supplied by the policy.
            }
            if(change.requirementsState){
                const state=change.requirementsState,action=inputPatch.requirements.action;
                if(requirementMessage){
                    const common={bookingId,transactionId:bookingId,canonicalRequirements:true,placeId:order.placeId,placeName:order.placeName||place.data()?.name||'',userId:order.userId,userName:order.userName||'Customer',requirements:state.required,createdAt:FieldValue.serverTimestamp(),createdBy:user.uid,senderUid:user.uid,senderRole:actor,senderName:actor==='owner'?(order.placeName||'Business'):(order.userName||'Customer'),reply:null,requirementStatus:state.status};
                    transaction.create(requirementMessage,action==='request'?{...common,type:'requirement_request',notes:state.notes,text:'Business requested transaction details.'}:{...common,...state.data,type:'requirement_response',requestMessageId:state.requestId,text:'Customer submitted the requested transaction details.'});
                }
                if(requirementRequest)transaction.update(requirementRequest,{requirementStatus:state.status,updatedAt:FieldValue.serverTimestamp()});
                if(requirementResponse)transaction.update(requirementResponse,{requirementStatus:state.status,updatedAt:FieldValue.serverTimestamp()});
            }
            transaction.update(ref, change);
            cards.forEach(card => transaction.update(card.ref, { ...change, bookingStatus: nextStatus }));
            transaction.create(ref.collection('events').doc(), { actorUid: user.uid, from: order.status, to: nextStatus, action:body.action || (body.patch?.paymentTerms?'payment_terms':body.patch?.requirements?'requirements_'+body.patch.requirements.action:body.patch?.deliveryDetails?'delivery_details':body.patch?.refundStatus?'refund_update':'status_update'), paymentAmountDue:change.paymentAmountDue || null, refundAmount:change.refundAmount || order.refundAmount || null, refundStatus:change.refundStatus || null, paymentReviewDecision: change.paymentReviewDecision || null, paymentReviewNote: change.paymentReviewNote || null, createdAt: FieldValue.serverTimestamp() });
        });
        return reply(200, { saved: true });
    } catch (error) { return reply(error.status || (error instanceof SyntaxError ? 400 : 500), { error: error.status ? error.message : 'Booking could not be updated.' }); }
};

