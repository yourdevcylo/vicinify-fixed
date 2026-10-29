const { isOnline, cancellation, refundTransition, paymentTerms, money } = require('../../../js/payment-policy');
function transition(order, actor, patch) {
    if(patch.requirements)return requirementsTransition(order,actor,patch.requirements);
    if(patch.refundStatus)return refundTransition(order,actor,patch);
    if(patch.paymentTerms)return paymentTerms(order,actor,patch.paymentTerms);
    if(patch.deliveryDetails){
        if(actor!=='customer'||order.status!=='accepted'||!['delivery','delivery_order'].includes(order.requestType))throw Object.assign(new Error('Delivery details can only be submitted by the customer after acceptance.'),{status:409});
        const fields=['houseStreet','barangay','city','landmark'].map(key=>{const value=patch.deliveryDetails[key];if(typeof value!=='string'||value.trim().length<2||value.length>200)throw Object.assign(new Error('Complete the delivery address and landmark.'),{status:400});return value.trim()});
        return {deliveryAddress:fields.join(', '),deliveryDetailsSubmitted:true};
    }
    const current = order.status || 'pending';
    const next = patch.status;
    if (typeof next !== 'string') throw Object.assign(new Error('Choose a booking action.'), { status: 400 });
    const ownerSteps = {
        pending: ['accepted', 'rejected'], accepted: ['preparing', 'fulfilled'],
        payment_submitted: ['payment_confirmed', 'accepted'], payment_confirmed: ['preparing', 'fulfilled'],
        preparing: ['ready', 'fulfilled', 'out_for_delivery'], ready: ['fulfilled'], out_for_delivery: ['delivered']
    };
    if (actor === 'owner' && (ownerSteps[current] || []).includes(next)) {
        if(['preparing','fulfilled'].includes(next)&&order.requirementsState&&!['confirmed','waived'].includes(order.requirementsState.status))throw Object.assign(new Error('Review or waive the requested details before preparation.'),{status:409});
        if(order.paymentFlowVersion===2&&['preparing','fulfilled'].includes(next)){
            if(['delivery','delivery_order'].includes(order.requestType)&&!order.deliveryAddress)throw Object.assign(new Error('The delivery address is required before preparation.'),{status:409});
            if(order.paymentMethod&&(!order.paymentAmountDue||!order.paymentInstructions||order.paymentTermsNeedReview))throw Object.assign(new Error('Set the agreed amount and payment instructions before preparation.'),{status:409});
        }
        if (['delivery_order','delivery'].includes(order.requestType) && next === 'fulfilled')
            throw Object.assign(new Error('Delivery must pass through preparation, dispatch and delivery confirmation.'),{status:409});
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
    if (actor === 'customer' && next === 'cancelled' && cancellation(order).allowed) {
        const info=cancellation(order),change={status:'cancelled',refundPercent:info.rate,refundStatus:info.refundStatus};
        if(info.paid && Number(order.paymentAmount)>0){const cents=money(order.paymentAmount);change.refundBaseAmount=(cents/100).toFixed(2);change.refundAmount=(Math.round(cents*info.rate/100)/100).toFixed(2);change.refundPaymentVerified=true;}else if(info.paid){change.refundStatus='needs_verification';}
        return change;
    }
    if (actor === 'customer' && next === 'received' && ['fulfilled', 'ready', 'delivered', 'ready_for_pickup'].includes(current)) return { status: next, customer_confirmed: true };
    if (current === next) return null;
    throw Object.assign(new Error('This action is not allowed at the current booking stage. Refresh and try again.'), { status: 409 });
}
function requirementsTransition(order,actor,input) {
    const fail=(message,status=409)=>{throw Object.assign(new Error(message),{status})};
    if(order.status!=='accepted')return fail('Requirements can only be changed after acceptance and before payment review or preparation.');
    const state=order.requirementsState;
    if(input.action==='request'){
        if(actor!=='owner')return fail('Only the business can request details.',403);
        if(state&&['waiting_customer','submitted'].includes(state.status))return fail('Review or waive the current requirements before creating another request.');
        const flags={address:input.required?.address===true,location:input.required?.location===true,orderDetails:input.required?.orderDetails===true};
        if(!Object.values(flags).some(Boolean))return fail('Choose at least one requirement.',400);
        const notes=typeof input.notes==='string'?input.notes.trim():'';
        if(notes.length>1000)return fail('Requirement notes are too long.',400);
        const problem=notes&&require('../../../js/content-policy').error('chat',notes);if(problem)return fail(problem,400);
        return {requirementsState:{requestId:input.requestId,status:'waiting_customer',required:flags,notes,data:{}},paymentTermsNeedReview:order.paymentFlowVersion===2&&!!order.paymentMethod};
    }
    if(!state)return fail('No requirements are attached to this transaction.');
    if(input.requestId!==state.requestId)return fail('These requirements were replaced. Open the current transaction summary.');
    if(input.action==='submit'){
        if(actor!=='customer')return fail('Only the customer can submit the requested details.',403);
        if(state.status!=='waiting_customer')return fail('These details have already been submitted.');
        const data={},source=input.data||{},text=key=>{const value=source[key];if(typeof value!=='string'||!value.trim()||value.length>1000)return fail('Complete all requested details.',400);return value.trim()};
        if(state.required.address)for(const key of ['houseStreet','barangay','city','landmark'])data[key]=text(key);
        if(state.required.location){if(typeof source.lat!=='number'||typeof source.lng!=='number'||!Number.isFinite(source.lat)||!Number.isFinite(source.lng)||Math.abs(source.lat)>90||Math.abs(source.lng)>180)return fail('Attach a valid current location.',400);data.lat=source.lat;data.lng=source.lng;}
        if(state.required.orderDetails){data.orderDetails=text('orderDetails');const problem=require('../../../js/content-policy').error('chat',data.orderDetails);if(problem)return fail(problem,400);}
        const change={requirementsState:{...state,status:'submitted',responseId:input.responseId,data}};
        if(state.required.address)change.deliveryAddress=[data.houseStreet,data.barangay,data.city,data.landmark].join(', ');
        return change;
    }
    if(actor!=='owner')return fail('Only the business can review requirements.',403);
    if(input.action==='confirm'){
        if(state.status==='confirmed')return null;
        if(state.status!=='submitted'||input.responseId!==state.responseId)return fail('The customer must submit the current requirements first.');
        return {requirementsState:{...state,status:'confirmed'}};
    }
    if(input.action==='waive'){
        if(state.status==='waived')return null;
        if(!['waiting_customer','submitted'].includes(state.status))return fail('These requirements are already closed.');
        return {requirementsState:{...state,status:'waived'}};
    }
    return fail('Choose a valid requirements action.',400);
}
module.exports = { transition, requirementsTransition };
