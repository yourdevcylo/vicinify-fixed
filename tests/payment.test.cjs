const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const policy=require('../js/payment-policy');const {transition}=require('../netlify/functions/lib/booking-policy');
test('cash/COD/pay-on-pickup have no online proof requirement; wallets/bank do',()=>{
 for(const paymentMethod of ['Cash','Cash on Pickup','Cash on Delivery','COD','Pay upon Pickup','Pay at store'])assert.equal(policy.isOnline({paymentMethod}),false,paymentMethod);
 for(const paymentMethod of ['GCash','Maya','Bank Transfer'])assert.equal(policy.isOnline({paymentMethod}),true,paymentMethod);
});
test('online payment cannot skip proof verification to preparing or fulfilled',()=>{
 for(const paymentMethod of ['GCash','Maya','Bank Transfer'])for(const status of ['preparing','fulfilled'])assert.throws(()=>transition({status:'accepted',paymentMethod},'owner',{status}),{status:409});
 assert.throws(()=>transition({status:'accepted',paymentMethod:'COD'},'owner',{status:'preparing'}),{status:409});
});
test('only owner can verify submitted proof and no proof cannot become confirmed',()=>{
 assert.throws(()=>transition({status:'payment_submitted',paymentMethod:'GCash'},'owner',{status:'payment_confirmed'}),{status:409});
 assert.throws(()=>transition({status:'payment_submitted',paymentProofPath:'private/proof.jpg'},'customer',{status:'payment_confirmed'}),{status:409});
 const verified=transition({status:'payment_submitted',paymentProofPath:'private/proof.jpg'},'owner',{status:'payment_confirmed'});assert.equal(verified.paymentStatus,'confirmed');
 assert.deepEqual(transition({status:'payment_confirmed',paymentMethod:'GCash'},'owner',{status:'preparing'}),{status:'preparing'});
});
test('delivery stages advance through dispatch and delivery; non-delivery cannot dispatch',()=>{
 assert.deepEqual(transition({status:'preparing',requestType:'delivery_order'},'owner',{status:'out_for_delivery'}),{status:'out_for_delivery'});
 assert.deepEqual(transition({status:'out_for_delivery',requestType:'delivery_order'},'owner',{status:'delivered'}),{status:'delivered'});
 assert.throws(()=>transition({status:'preparing',requestType:'pickup_order'},'owner',{status:'out_for_delivery'}),{status:409});
});
test('payment UI separates proof review from verification and no false pending verification',()=>{
 assert.equal(policy.flow({status:'pending',paymentStatus:'confirmed'}).verified,false);
 assert.equal(policy.flow({status:'payment_submitted',paymentMethod:'GCash'}).verified,false);
 assert.equal(policy.flow({status:'accepted',paymentMethod:'GCash'}).canPrepare,false);
 assert.equal(policy.flow({status:'accepted',paymentMethod:'COD'}).canPrepare,false);
 assert.equal(policy.flow({status:'preparing',paymentStatus:'confirmed',paymentMethod:'GCash'}).verified,true);
});
function renderers(){const s=fs.readFileSync(require.resolve('../js/common.js'),'utf8'),context={window:{PaymentPolicy:policy},escapeHtml:x=>String(x??'').replace(/</g,'&lt;')};vm.createContext(context);vm.runInContext(s.slice(s.indexOf('function renderPaymentFlowCard('),s.indexOf('function renderInlineTransactionProgress')),context);return context;}
test('customer online upload, cash instructions and downpayment notes are distinct',()=>{
 const r=renderers(),base={id:'m',bookingId:'b',status:'accepted'};
 assert.match(r.renderPaymentFlowCard({...base,paymentMethod:'GCash'},false),/payment-proof-upload/);
 assert(!r.renderPaymentFlowCard({...base,paymentMethod:'COD'},false).includes('payment-proof-upload'));
 assert.match(r.renderPaymentFlowCard({...base,paymentMethod:'GCash',paymentType:'Downpayment'},false),/not marked paid in full/);
 assert(!r.renderPaymentFlowCard({...base,paymentMethod:'GCash'},true).includes('payment-proof-upload'));
 assert.equal(r.renderBookingNextAction({...base,paymentMethod:'GCash'}),'');
 assert.match(r.renderBookingNextAction({...base,status:'payment_confirmed',paymentMethod:'GCash'}),/Start preparing/);
});

test('manual reference and amount are normalized while invalid details are rejected',()=>{
 assert.deepEqual(policy.details('  REF-123456  ','588.5'),{paymentReference:'REF-123456',paymentAmount:'588.50'});
 for(const [reference,amount] of [['','100'],['AB','100'],['REF\n123','100'],['REF123','0'],['REF123','-5'],['REF123','NaN'],['REF123','1.001']])assert.throws(()=>policy.details(reference,amount));
});
test('manual reference submissions require owner verification and never confirm automatically',()=>{
 const order={status:'payment_submitted',paymentMethod:'GCash',paymentReference:'REF-123',paymentAmount:'588.00'};
 assert.equal(policy.flow(order).verified,false);
 assert.throws(()=>transition(order,'customer',{status:'payment_confirmed'}),{status:409});
 assert.deepEqual(transition(order,'owner',{status:'payment_confirmed'}),{status:'payment_confirmed',paymentStatus:'confirmed',paymentReviewDecision:'accepted'});
 assert.throws(()=>transition({...order,paymentAmount:'0'},'owner',{status:'payment_confirmed'}),{status:409});
});
test('reference-only submissions persist to booking and chat card without accessing Storage',async()=>{
 const admin=require('../netlify/functions/lib/admin'),old={services:admin.services,authenticate:admin.authenticate,limit:admin.limit};let storageCalls=0;const updates=[];
 const order={userId:'customer',placeId:'cafe',status:'accepted',paymentMethod:'GCash'};
 const ref={get:async()=>({exists:true,data:()=>order})};const query={where(){return this;},limit(){return this;}};
 const db={collection(name){if(name==='bookings')return{doc:()=>ref};if(name==='places')return{doc:()=>({get:async()=>({data:()=>({owner_uid:'owner'})})})};if(name==='messages')return query;throw Error(name);},runTransaction:async fn=>fn({get:async target=>target===ref?{data:()=>order}:{forEach:fn=>fn({ref:{id:'message'}})},update:(target,patch)=>updates.push(patch)})};
 admin.authenticate=async()=>({uid:'customer'});admin.limit=async()=>{};admin.services=()=>({db,storage:{bucket(){storageCalls++;throw Error('Should not use Storage');}},FieldValue:{delete:()=>null,serverTimestamp:()=>123}});
 try{delete require.cache[require.resolve('../netlify/functions/proof')];const {handler}=require('../netlify/functions/proof');const response=await handler({httpMethod:'POST',body:JSON.stringify({bookingId:'booking',reference:'REF-123456',amount:'588.5'})});assert.equal(response.statusCode,200,response.body);assert.equal(storageCalls,0);assert.equal(updates.length,2);for(const patch of updates){assert.equal(patch.paymentReference,'REF-123456');assert.equal(patch.paymentAmount,'588.50');assert.equal(patch.status,'payment_submitted');assert.equal(patch.paymentStatus,'pending_confirmation');}
 const bad=await handler({httpMethod:'POST',body:JSON.stringify({bookingId:'booking',reference:'AB',amount:'0'})});assert.equal(bad.statusCode,400);assert.equal(updates.length,2);
 }finally{Object.assign(admin,old);delete require.cache[require.resolve('../netlify/functions/proof')];}
});

test('business decline requires a reason, preserves the order and cannot be done by the customer',()=>{
 const order={status:'payment_submitted',paymentMethod:'GCash',paymentReference:'REF123',paymentAmount:'100.00'};
 assert.throws(()=>transition(order,'owner',{status:'accepted'}),{status:400});
 assert.throws(()=>transition(order,'customer',{status:'accepted',paymentReviewNote:'Wrong amount'}),{status:409});
 const result=transition(order,'owner',{status:'accepted',paymentReviewNote:'  Reference was not found in the account.  '});
 assert.equal(result.status,'accepted');assert.equal(result.paymentStatus,'correction_requested');assert.equal(result.paymentReviewDecision,'declined');assert.equal(result.paymentReviewNote,'Reference was not found in the account.');
 assert.equal(policy.flow({...order,...result}).canPrepare,false);assert.equal(policy.flow({...order,...result}).awaitingProof,true);
});
test('customer sees the business decline reason escaped in the payment card',()=>{const r=renderers();const html=r.renderPaymentFlowCard({status:'accepted',paymentMethod:'GCash',paymentReviewDecision:'declined',paymentReviewNote:'Check <script>reference</script>'},false);assert.match(html,/Correction needed/);assert.match(html,/&lt;script>/);assert(!html.includes('<script>'));assert.match(html,/still accepted/);});

test('new online requests need agreed terms before proof; only owner can set or change terms before review',()=>{
 const order={status:'accepted',paymentMethod:'GCash',paymentFlowVersion:2};assert.equal(policy.flow(order).awaitingProof,false);
 const terms=transition(order,'owner',{paymentTerms:{amount:'500',instructions:'GCash 09171234567 · Juan Dela Cruz'}});assert.equal(terms.paymentAmountDue,'500.00');assert.equal(policy.flow({...order,...terms}).awaitingProof,true);
 assert.throws(()=>transition(order,'customer',{paymentTerms:{amount:'1',instructions:'My fake account'}}),{status:409});assert.throws(()=>transition({...order,status:'payment_submitted'},'owner',{paymentTerms:{amount:'5',instructions:'Changed account'}}),{status:409});
});
test('refund ledger verifies actual paid money, freezes server amount, and requires customer acknowledgement',()=>{
 const order={status:'payment_submitted',paymentMethod:'GCash',paymentReference:'REF123',paymentAmount:'500.00',refundPercent:70};
 const cancelled={...order,...transition(order,'customer',{status:'cancelled',refundPercent:100,refundAmount:'500'})};assert.equal(cancelled.refundStatus,'needs_verification');assert.equal(cancelled.refundAmount,undefined);
 assert.throws(()=>transition(cancelled,'customer',{refundStatus:'pending',receivedAmount:'500'}),{status:409});assert.throws(()=>transition(cancelled,'owner',{refundStatus:'pending',receivedAmount:'600'}),{status:409});
 const verified={...cancelled,...transition(cancelled,'owner',{refundStatus:'pending',receivedAmount:'500'})};assert.equal(verified.refundAmount,'350.00');assert.equal(verified.status,'cancelled');
 assert.throws(()=>transition(verified,'customer',{refundStatus:'sent',refundReference:'FAKE'}),{status:409});assert.throws(()=>transition(verified,'owner',{refundStatus:'received'}),{status:409});
 const approved={...verified,...transition(verified,'owner',{refundStatus:'approved',confirmRefund:true})};
 const sent={...approved,...transition(approved,'owner',{refundStatus:'sent',refundReference:'REFUND123',refundAmount:'999',confirmTransferred:true})};assert.equal(sent.refundAmount,'350.00');assert.equal(sent.refundStatus,'sent');assert.equal(transition(sent,'customer',{refundStatus:'received',confirmReceived:true}).refundStatus,'received');
 assert.equal(transition(sent,'owner',{refundStatus:'sent',refundReference:'DOUBLE'}),null);
});
test('verified paid cancellation before preparation computes cents and later stages reject cancellation',()=>{
 const base={status:'payment_confirmed',paymentStatus:'confirmed',paymentAmount:'100.01',paymentReference:'R123',refundPercent:50};const change=transition(base,'customer',{status:'cancelled'});assert.equal(change.refundAmount,'50.01');assert.equal(change.refundStatus,'pending');
 assert.throws(()=>transition({...base,status:'preparing'},'customer',{status:'cancelled'}),{status:409});
 const unknown=transition({...base,paymentAmount:undefined},'customer',{status:'cancelled'});assert.equal(unknown.refundStatus,'needs_verification');assert.equal(unknown.refundAmount,undefined);
});
test('payment not found can be rechecked but neither party can fake a completed refund',()=>{
 const order={status:'cancelled',refundStatus:'needs_verification'};
 assert.throws(()=>transition(order,'owner',{refundStatus:'sent',refundReference:'FAKE'}),{status:409});
 const missing={...order,...transition(order,'owner',{refundStatus:'payment_not_found',refundNote:'Reference not found in the account.'})};assert.equal(transition(missing,'customer',{refundStatus:'needs_verification'}).refundStatus,'needs_verification');
});

test('new delivery flow collects an address before quoting and preparing, including cash orders',()=>{
 const order={status:'accepted',paymentFlowVersion:2,requestType:'delivery_order',paymentMethod:'COD'};
 assert.equal(policy.flow(order).canPrepare,false);assert.throws(()=>transition(order,'owner',{paymentTerms:{amount:'500',instructions:'Cash on delivery'}}),{status:409});assert.throws(()=>transition(order,'owner',{status:'preparing'}),{status:409});
 assert.throws(()=>transition(order,'owner',{deliveryDetails:{houseStreet:'10 Test',barangay:'West',city:'Lipa',landmark:'Gate'}}),{status:409});
 const address=transition(order,'customer',{deliveryDetails:{houseStreet:'10 Test',barangay:'West',city:'Lipa',landmark:'Gate'}});assert.equal(address.deliveryAddress,'10 Test, West, Lipa, Gate');
 const located={...order,...address};
 assert.throws(()=>transition(located,'owner',{paymentTerms:{amount:'500',instructions:'Cash on delivery'}}),{status:400});
 const terms=transition(located,'owner',{paymentTerms:{paymentMethod:'GCash',amount:'500',instructions:'GCash recipient account'}});assert.equal(policy.flow({...located,...terms}).canPrepare,false);assert.equal(policy.flow({...located,...terms}).awaitingProof,true);
 assert.throws(()=>transition({...located,...terms},'owner',{status:'preparing'}),{status:409});
 assert.deepEqual(transition({...located,...terms,status:'payment_confirmed'},'owner',{status:'preparing'}),{status:'preparing'});
});

test('requirements are transaction-scoped, role-restricted and distinct from payment verification',()=>{
 const {requirementsTransition}=require('../netlify/functions/lib/booking-policy');
 let order={status:'accepted',paymentFlowVersion:2,paymentMethod:'GCash',paymentAmountDue:'500.00',paymentInstructions:'GCash receiver'};
 const ask={action:'request',requestId:'req',required:{address:true,orderDetails:true,payment:true},notes:'Address and order details please.'};
 assert.throws(()=>requirementsTransition(order,'customer',ask),{status:403});order={...order,...requirementsTransition(order,'owner',ask)};
 assert.equal(order.requirementsState.required.payment,undefined);assert.equal(policy.flow(order).requirementsReady,false);assert.equal(policy.flow(order).termsReady,false);
 assert.throws(()=>transition(order,'owner',{status:'preparing'}),{status:409});assert.throws(()=>transition(order,'owner',{paymentTerms:{amount:'500',instructions:'GCash receiver'}}),{status:409});
 const data={houseStreet:'10 Test Street',barangay:'West',city:'Lipa',landmark:'Green gate',orderDetails:'Two meals, no nuts.',paymentStatus:'confirmed'};
 assert.throws(()=>requirementsTransition(order,'customer',{action:'submit',requestId:'wrong',responseId:'resp',data}),{status:409});
 assert.throws(()=>requirementsTransition(order,'owner',{action:'submit',requestId:'req',responseId:'resp',data}),{status:403});
 order={...order,...requirementsTransition(order,'customer',{action:'submit',requestId:'req',responseId:'resp',data})};assert.equal(order.requirementsState.status,'submitted');assert.equal(order.paymentStatus,undefined);assert.equal(order.requirementsState.data.paymentStatus,undefined);assert.match(order.deliveryAddress,/Green gate/);
 assert.throws(()=>requirementsTransition(order,'customer',{action:'confirm',requestId:'req',responseId:'resp'}),{status:403});
 order={...order,...requirementsTransition(order,'owner',{action:'confirm',requestId:'req',responseId:'resp'})};assert.equal(order.requirementsState.status,'confirmed');assert.equal(order.paymentStatus,undefined);assert.equal(policy.flow(order).termsReady,false);
 order={...order,...transition(order,'owner',{paymentTerms:{amount:'500',instructions:'GCash receiver'}})};assert.equal(policy.flow(order).awaitingProof,true);assert.equal(policy.flow(order).canPrepare,false);
});
test('owner can waive unavailable requirements; invalid location and stale responses are rejected',()=>{
 const {requirementsTransition}=require('../netlify/functions/lib/booking-policy');
 let order={status:'accepted',requirementsState:{requestId:'req',status:'waiting_customer',required:{location:true},data:{}}};
 assert.throws(()=>requirementsTransition(order,'customer',{action:'submit',requestId:'req',responseId:'resp',data:{lat:91,lng:121}}),{status:400});
 assert.throws(()=>requirementsTransition(order,'customer',{action:'waive',requestId:'req'}),{status:403});
 order={...order,...requirementsTransition(order,'owner',{action:'waive',requestId:'req'})};assert.equal(policy.flow(order).requirementsReady,true);
 assert.throws(()=>requirementsTransition(order,'customer',{action:'submit',requestId:'req',responseId:'resp',data:{lat:14,lng:121}}),{status:409});
});
test('all requests need verified payment before preparation, including legacy no-payment reservations',()=>{for(const requestType of ['table_reservation','food_reservation','pickup_order','delivery_order','advance_order'])for(const paymentMethod of [undefined,'COD','Cash on Pickup','GCash'])assert.throws(()=>transition({status:'accepted',requestType,paymentMethod},'owner',{status:'preparing'}),{status:409});});
test('new reservations accept prepaid methods only and never accept client-confirmed payment',()=>{const {createBooking}=require('../netlify/functions/lib/booking-create');const input={placeId:'shop',requestType:'table_reservation',bookingDate:'2026-11-02',bookingTime:'12:00',guestCount:2},user={uid:'customer'},place={approval_status:'approved',owner_uid:'owner'},now=new Date('2026-10-29T00:00:00Z').getTime();for(const paymentMethod of ['Cash','Cash on Pickup','COD','Others'])assert.throws(()=>createBooking({...input,paymentMethod},user,place,{},now),{status:400});const order=createBooking({...input,paymentMethod:'GCash',paymentStatus:'confirmed'},user,place,{},now);assert.equal(order.paymentMethod,'GCash');assert.equal(order.status,'pending');assert.notEqual(order.paymentStatus,'confirmed');});

test('refund approval, sender confirmation and recipient confirmation cannot be skipped',()=>{
 const pending={status:'cancelled',refundStatus:'pending',refundPaymentVerified:true,refundAmount:'100.00'};
 assert.throws(()=>transition(pending,'customer',{refundStatus:'approved',confirmRefund:true}));assert.throws(()=>transition(pending,'owner',{refundStatus:'approved'}));assert.throws(()=>transition(pending,'owner',{refundStatus:'sent',confirmTransferred:true,refundReference:'R123'}));
 const approved={...pending,...transition(pending,'owner',{refundStatus:'approved',confirmRefund:true})};assert.throws(()=>transition(approved,'owner',{refundStatus:'sent',refundReference:'R123'}));
 const sent={...approved,...transition(approved,'owner',{refundStatus:'sent',refundReference:'R123',confirmTransferred:true})};assert.throws(()=>transition(sent,'customer',{refundStatus:'received'}));assert.throws(()=>transition(sent,'owner',{refundStatus:'received',confirmReceived:true}));
 const disputed={...sent,...transition(sent,'customer',{refundStatus:'disputed',refundNote:'No transfer in my account'})};assert.equal(require('../js/payment-policy').conversationClosed(disputed),false);assert.equal(require('../js/payment-policy').conversationClosed({...sent,refundStatus:'received'}),true);
});
