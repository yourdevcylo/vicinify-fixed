const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const policy=require('../js/payment-policy');const {transition}=require('../netlify/functions/lib/booking-policy');
test('cash/COD/pay-on-pickup have no online proof requirement; wallets/bank do',()=>{
 for(const paymentMethod of ['Cash','Cash on Pickup','Cash on Delivery','COD','Pay upon Pickup','Pay at store'])assert.equal(policy.isOnline({paymentMethod}),false,paymentMethod);
 for(const paymentMethod of ['GCash','Maya','Bank Transfer'])assert.equal(policy.isOnline({paymentMethod}),true,paymentMethod);
});
test('online payment cannot skip proof verification to preparing or fulfilled',()=>{
 for(const paymentMethod of ['GCash','Maya','Bank Transfer'])for(const status of ['preparing','fulfilled'])assert.throws(()=>transition({status:'accepted',paymentMethod},'owner',{status}),{status:409});
 assert.deepEqual(transition({status:'accepted',paymentMethod:'COD'},'owner',{status:'preparing'}),{status:'preparing'});
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
 assert.equal(policy.flow({status:'accepted',paymentMethod:'COD'}).canPrepare,true);
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
