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
        const termsReady=order.paymentFlowVersion!==2 || !order.paymentMethod || !!(order.paymentAmountDue&&order.paymentInstructions&&!order.paymentTermsNeedReview);
        const addressReady=order.paymentFlowVersion!==2 || !['delivery','delivery_order'].includes(order.requestType) || !!order.deliveryAddress;
        const awaitingProof = online && status === 'accepted' && termsReady;
        const reviewing = online && status === 'payment_submitted';
        const requirementsReady=!order.requirementsState||['confirmed','waived'].includes(order.requirementsState.status);
        const canPrepare = requirementsReady && addressReady && status === 'payment_confirmed';
        return { online, verified, closed, awaitingProof, reviewing, canPrepare, termsReady, addressReady, requirementsReady };
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
    function money(value) {
        const text=String(value ?? '').trim();
        if(!/^\d+(\.\d{1,2})?$/.test(text) || !Number.isSafeInteger(Math.round(Number(text)*100)) || Number(text)<=0) throw Object.assign(new Error('Enter a valid amount greater than zero, with up to two decimal places.'),{status:400});
        return Math.round(Number(text)*100);
    }
    function cancellation(order) {
        const status=order.status || order.bookingStatus || 'pending';
        const evidence=!!(order.paymentReference || order.paymentProofPath || order.paymentProofUrl || order.paymentStatus==='confirmed' || status==='payment_confirmed');
        const paid=order.paymentStatus==='confirmed' || status==='payment_confirmed';
        const raw=Number(order.refundPercent ?? 50),rate=Number.isFinite(raw)?Math.max(0,Math.min(100,raw)):50;
        return {allowed:['pending','accepted','payment_submitted','payment_confirmed'].includes(status),paid,evidence,rate:status==='pending'?100:evidence?rate:100,
            refundStatus:evidence?(paid?'pending':'needs_verification'):'not_required'};
    }
    function refundTransition(order,actor,patch) {
        const fail=message=>{throw Object.assign(new Error(message),{status:409})};
        if(order.status!=='cancelled')return fail('Cancel the request before recording a refund.');
        const current=order.refundStatus,next=patch.refundStatus;
        const reference=(value,label)=>{if(typeof value!=='string'||value.trim().length<3||value.length>200)throw Object.assign(new Error(label),{status:400});return value.trim()};
        if(actor==='owner'&&current==='needs_verification'&&next==='pending') {
            const received=money(patch.receivedAmount),submitted=Number(order.paymentAmount)>0?money(order.paymentAmount):null;
            if(submitted!=null&&received>submitted)return fail('The received amount cannot exceed the submitted payment.');
            const amount=Math.round(received*cancellation(order).rate/100);
            return {refundStatus:amount===0?'not_required':'pending',refundBaseAmount:(received/100).toFixed(2),refundAmount:(amount/100).toFixed(2),refundPaymentVerified:true};
        }
        if(actor==='owner'&&current==='needs_verification'&&next==='payment_not_found')return {refundStatus:next,refundNote:reference(patch.refundNote,'Explain why the payment was not found.')};
        if(actor==='customer'&&current==='payment_not_found'&&next==='needs_verification')return {refundStatus:next};
        if(actor==='owner'&&current==='pending'&&next==='approved') {
            if(!order.refundPaymentVerified || Number(order.refundAmount)<=0)return fail('Verify the received payment and refundable amount first.');
            if(patch.confirmRefund!==true)return fail('Confirm the refund amount before approving it.');
            return {refundStatus:'approved'};
        }
        if(actor==='owner'&&['approved','disputed'].includes(current)&&next==='sent') {
            if(!order.refundPaymentVerified || Number(order.refundAmount)<=0)return fail('Verify the received payment and refundable amount first.');
            if(patch.confirmTransferred!==true)return fail('Confirm you transferred the refund before recording it.');
            return {refundStatus:'sent',refundReference:reference(patch.refundReference,'Enter the refund transfer reference.')};
        }
        if(actor==='customer'&&current==='sent'&&next==='received') {
            if(patch.confirmReceived!==true)return fail('Check your account and confirm the refund was received.');
            return {refundStatus:'received'};
        }
        if(actor==='customer'&&current==='sent'&&next==='disputed')return {refundStatus:'disputed',refundNote:reference(patch.refundNote,'Explain why the refund was not received.')};
        if(current===next)return null;
        return fail('This refund action is not available for your account or the current stage.');
    }
    function paymentTerms(order,actor,input) {
        if(actor!=='owner'||order.status!=='accepted')throw Object.assign(new Error('Only the business can set payment instructions before payment review.'),{status:409});
        if(order.paymentFlowVersion===2&&['delivery','delivery_order'].includes(order.requestType)&&!order.deliveryAddress)throw Object.assign(new Error('Wait for the delivery address before setting the final amount.'),{status:409});
        if(order.requirementsState&&!['confirmed','waived'].includes(order.requirementsState.status))throw Object.assign(new Error('Review the requested details before setting the amount.'),{status:409});
        if(order.paymentFlowVersion===2&&!order.requirementsState&&!order.paymentTermsVersion)throw Object.assign(new Error('Confirm the requirements or choose no additional details first.'),{status:409});
        const amount=money(input.amount);
        if(typeof input.instructions!=='string'||input.instructions.trim().length<8||input.instructions.length>1000)throw Object.assign(new Error('Enter the payment recipient and instructions (8–1000 characters).'),{status:400});
        const method=String(input.paymentMethod||order.paymentMethod||'GCash').trim();
        if(!['GCash','Maya','Bank Transfer'].includes(method))throw Object.assign(new Error('Choose GCash, Maya or Bank Transfer. Payment is required before preparation.'),{status:400});
        return {paymentMethod:method,paymentFlowVersion:2,paymentAmountDue:(amount/100).toFixed(2),paymentInstructions:input.instructions.trim(),paymentTermsVersion:2,paymentTermsNeedReview:false};
    }
    function conversationClosed(order) {
        const status=order.status||order.bookingStatus;
        const refundPending=!!order.refundStatus&&!['received','not_required'].includes(order.refundStatus);
        if(refundPending)return false;
        if(status==='cancelled')return ['received','not_required'].includes(order.refundStatus);
        if(status==='rejected')return true;
        const detailsPending=order.requirementsState&&!['confirmed','waived'].includes(order.requirementsState.status);
        const feedbackPending=order.feedbackStatus==='feedback_waiting'&&!order.feedbackSubmittedAt;
        return status==='received'&&!detailsPending&&!feedbackPending;
    }
    const api = { conversationClosed, isOnline, flow, details, money, cancellation, refundTransition, paymentTerms };
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.PaymentPolicy = api;
})(typeof window !== 'undefined' ? window : globalThis);
