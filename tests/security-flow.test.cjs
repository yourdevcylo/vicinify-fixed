const {test}=require('node:test'),assert=require('node:assert/strict');
const {createBooking}=require('../netlify/functions/lib/booking-create');
const {transition}=require('../netlify/functions/lib/booking-policy');
const now=Date.parse('2026-10-28T04:00:00Z');
const user={uid:'customer'},place={name:'Real cafe',owner_uid:'owner',approval_status:'approved',refund_percent:35};
const input={placeId:'shop',requestType:'pickup_order',bookingDate:'2026-10-29',bookingTime:'10:00',orderItems:'One coffee',paymentMethod:'GCash'};
test('server creation ignores forged identities, trust and pre-paid state',()=>{
 const order=createBooking({...input,userId:'victim',placeName:'Fake',status:'received',paymentStatus:'confirmed',refundPercent:100,requestIcon:'<img onerror=alert(1)>'},user,place,{fullName:'Real customer'},now);
 assert.equal(order.userId,'customer');assert.equal(order.status,'pending');assert.equal(order.placeName,'Real cafe');assert.equal(order.refundPercent,35);assert(!('paymentStatus' in order));assert(!order.requestIcon.includes('<'));assert.equal(order.scheduledAt.toISOString(),'2026-10-29T02:00:00.000Z');
});
test('server rejects elapsed or impossible dates, own business, unapproved and malformed orders',()=>{
 for(const patch of [{bookingDate:'2026-10-27'},{bookingDate:'2026-02-30'},{bookingTime:'25:00'},{requestType:'unknown'},{orderItems:''},{paymentMethod:''},{requestType:'delivery_order',deliveryAddress:''},{requestType:'table_reservation',guestCount:0}])assert.throws(()=>createBooking({...input,...patch},user,place,{},now),{status:400});
 for(const patch of [{owner_uid:'customer'},{owner_uid:null},{approval_status:'pending'}])assert.throws(()=>createBooking(input,user,{...place,...patch},{},now),{status:409});
});
test('delivery cannot jump directly to fulfilled or customer receipt before delivery',()=>{
 for(const status of ['accepted','preparing','payment_confirmed'])assert.throws(()=>transition({status,requestType:'delivery_order'},'owner',{status:'fulfilled'}),{status:409});
 assert.throws(()=>transition({status:'out_for_delivery',requestType:'delivery_order'},'customer',{status:'received'}),{status:409});
 assert.deepEqual(transition({status:'delivered',requestType:'delivery_order'},'customer',{status:'received'}),{status:'received',customer_confirmed:true,feedbackStatus:'feedback_waiting'});
});
test('server atomically creates a pending booking and matching chat card',async()=>{
 const helpers=require('../netlify/functions/lib/admin'),old={...helpers},state=require('./helpers/memory-admin.cjs').memory({['places/'+input.placeId]:place});
 helpers.authenticate=async()=>user;helpers.limit=async()=>{};helpers.services=()=>state;
 try {
  delete require.cache[require.resolve('../netlify/functions/booking')];
  const {handler}=require('../netlify/functions/booking');
  const request={...input,bookingDate:'2099-10-29'};
  const response=await handler({httpMethod:'POST',body:JSON.stringify({action:'create',confirmed:true,idempotencyKey:'test-confirmation',request})});
  assert.equal(response.statusCode,200,response.body);const id=JSON.parse(response.body).bookingId,order=state.rows.get('bookings/'+id),card=state.rows.get('messages/request_'+id);assert.equal(order.transactionId,card.bookingId);assert.equal(card.bookingStatus,'pending');assert.equal(card.userId,'customer');
 } finally {Object.assign(helpers,old);delete require.cache[require.resolve('../netlify/functions/booking')];}
});

test('session reset removes private dashboard content from the previous account',()=>{
 const {JSDOM}=require('jsdom'),fs=require('node:fs');
 const dom=new JSDOM('<div id="pendingList">Private admin data</div><div id="biz-panel-messages">Private chat</div><div id="adminSidePanelOverlay" class="show"><div class="panel-body">Private edit</div></div>',{runScripts:'outside-only'});
 try {const w=dom.window;w.eval(fs.readFileSync(require.resolve('../js/dashboard.js'),'utf8'));w.DashboardPage.resetSession();assert.equal(w.document.getElementById('pendingList').textContent,'');assert.equal(w.document.getElementById('biz-panel-messages').textContent,'');assert.equal(w.document.querySelector('.panel-body').textContent,'');assert(w.document.getElementById('adminSidePanelOverlay').classList.contains('hidden'));}finally{dom.window.close();}
});
