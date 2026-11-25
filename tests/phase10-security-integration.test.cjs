'use strict';
// Phase 10: offline cross-module security / functional checks. These use an
// in-memory Firestore-shaped test double; they do not claim live Firebase E2E.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {awardConfirmedOrder,approveInStore,redeem,manilaDay}=require('../netlify/functions/lib/suki-stamps');
const {withVipDiscount}=require('../netlify/functions/lib/vip-pricing');
const {qualifies,aggregateBookings}=require('../netlify/functions/lib/business-analytics');
const {transition}=require('../netlify/functions/lib/booking-policy');
const {activeVip}=require('../netlify/functions/lib/suki-vip');
const FieldValue={serverTimestamp:()=>({serverTime:true})};
class DB{
  constructor(data){this.docs=new Map(Object.entries(data));this.queue=Promise.resolve()}
  collection(name){return{doc:id=>({key:name+'/'+id})}}
  runTransaction(callback){
    const run=async()=>{
      const writes=[];
      const tx={
        get:async ref=>({exists:this.docs.has(ref.key),data:()=>structuredClone(this.docs.get(ref.key))}),
        create:(ref,data)=>writes.push(['create',ref.key,data]),
        update:(ref,data)=>writes.push(['update',ref.key,data])
      };
      const result=await callback(tx);
      for(const [action,key]of writes)if(action==='create'&&this.docs.has(key))throw Error('Duplicate key');
      for(const [action,key,val]of writes)this.docs.set(key,structuredClone(action==='create'?val:{...this.docs.get(key),...val}));
      return result;
    };
    const result=this.queue.then(run,run);this.queue=result.catch(()=>{});return result;
  }
  get(key){return this.docs.get(key)}
}
const now=Date.parse('2026-11-24T10:00:00+08:00');
function fixture({order={},place={},card={}}={}){
  const shop={owner_uid:'owner',suki_enabled:true,suki_stamp_count:8,suki_vip_enabled:true,suki_vip_days:10,suki_vip_discount_percent:10,...place};
  const paid={placeId:'store',userId:'customer',userName:'Customer',status:'received',customer_confirmed:true,
    customerConfirmedAt:new Date(now-10000),paymentStatus:'confirmed',paymentVerifiedAt:new Date(now-20000),
    paymentAmount:'500.00',paymentAmountDue:'500.00',requestType:'pickup_order',menuLines:[{itemId:'food',name:'Food',quantity:1}],
    ...order};
  return new DB({'places/store':shop,'bookings/order-1':paid,
     'stamp_requests/request-1':{placeId:'store',customerUid:'customer',customerName:'Customer',status:'pending'},
     ...(card?{'loyalty_cards/store_customer':{placeId:'store',customerUid:'customer',stamps:0,verifiedPurchaseDays:0,redemptionCount:0,...card}}:{})});
}
const award=db=>awardConfirmedOrder({db,FieldValue,bookingId:'order-1',now});
test('Phase 10: customer-received but unverified payment earns NO automatic Suki stamp',async()=>{
  for(const order of [{paymentStatus:'pending'},{paymentVerifiedAt:null},{paymentStatus:'rejected'},
                     {paymentAmountDue:'600.00'},{paymentAmount:null},{paymentAmountDue:null},
                     {status:'fulfilled'},{customer_confirmed:false},{refundStatus:'approved'},
                     {refundStatus:'sent'},{refundStatus:'received'}]){
    const db=fixture({order});const result=await award(db);
    assert.equal(result.reason,'not-eligible',JSON.stringify(order));
    assert.equal(db.get('suki_daily_stamps/any'),undefined);
    assert.equal(db.get('loyalty_cards/store_customer').verifiedPurchaseDays,0);
  }
});
test('Phase 10: verified paid + received menu order earns one loyalty day only once',async()=>{
  const db=fixture();const a=await award(db),b=await award(db);
  assert.equal(a.qualified,true);assert.equal(a.awarded,true);
  assert.equal(b.reason,'order-already-counted');
  assert.equal(db.get('loyalty_cards/store_customer').stamps,1);
  assert.equal(db.get('loyalty_cards/store_customer').verifiedPurchaseDays,1);
  assert.equal([...db.docs.keys()].filter(x=>x.startsWith('suki_daily_stamps/')).length,1);
});
test('Phase 10: online + in-store cannot both award same local day',async()=>{
  const db=fixture();await award(db);
  const result=await approveInStore({db,FieldValue,actorUid:'owner',requestId:'request-1',now});
  assert.equal(result.reason,'daily-limit');
  assert.equal(db.get('loyalty_cards/store_customer').stamps,1);
});
test('Phase 10: refunded order cannot gain a stamp via next-day retry',async()=>{
  const db=fixture({order:{refundStatus:'received'}});
  const result=await awardConfirmedOrder({db,FieldValue,bookingId:'order-1',now:now+86400000});
  assert.equal(result.reason,'not-eligible');
});
test('Phase 10: offline business-attested stamp is owner-only, cannot mint twice',async()=>{
  const db=fixture();
  await assert.rejects(approveInStore({db,FieldValue,actorUid:'outsider',requestId:'request-1',now}),/Only the establishment owner/);
  const result=await approveInStore({db,FieldValue,actorUid:'owner',requestId:'request-1',now});
  assert.equal(result.awarded,true);assert.equal(db.get('loyalty_cards/store_customer').stamps,1);
});
test('Phase 10: VIP benefits apply only with active card and approved enabled owner policy',async()=>{
  const gross={totalCents:50000,digest:'canonical',lines:[]};
  const p=fixture({card:{vipActive:true}});
  const quote=await p.runTransaction(async tx=>withVipDiscount({tx,db:p,quote:gross,place:p.get('places/store'),placeId:'store',customerUid:'customer',now}));
  assert.equal(quote.vipApplied,true);assert.equal(quote.vipDiscountCents,5000);
  assert.equal(quote.estimatedTotalCents,45000);
  const expired=fixture({card:{vipActive:true,vipExpiresAt:new Date(now-1000)}});
  const no=await expired.runTransaction(async tx=>withVipDiscount({tx,db:expired,quote:gross,place:expired.get('places/store'),placeId:'store',customerUid:'customer',now}));
  assert.equal(no.vipApplied,false);assert.equal(no.estimatedTotalCents,50000);
  assert.equal(activeVip(expired.get('loyalty_cards/store_customer'),now),false);
});
test('Phase 10: recorded sales exclude unpaid orders that are ineligible for Suki',()=>{
  const db=fixture({order:{paymentStatus:'not_confirmed'}});const order=db.get('bookings/order-1');
  assert.equal(qualifies(order),false);
  const report=aggregateBookings([order],now);
  assert.equal(report.totalQualified,0);
  assert.equal(report.views.monthly.series.at(-1).verifiedSalesCents,0);
});
test('Phase 10: booking status transitions reject payment confirmation by customer',()=>{
  const order={status:'payment_submitted',paymentProofUrl:'proof',paymentAmount:'500.00'};
  assert.throws(()=>transition(order,'customer',{status:'payment_confirmed'}),/not allowed/i);
  const approved=transition(order,'owner',{status:'payment_confirmed'});
  assert.equal(approved.paymentStatus,'confirmed');
});
test('Phase 10: privacy rules deny browser writes to applications, permits, VIP and stamps',()=>{
  const rules=fs.readFileSync(path.join(__dirname,'../firestore.rules'),'utf8');
  for(const name of ['business_applications','business_application_files','verified_businesses','suki_daily_stamps','suki_order_awards','suki_vip_events'])
    assert.match(rules,new RegExp('match /'+name+'/\\{[^}]+\\} \\{ allow read, write: if false; \\}'));
  assert.match(rules,/match \/bookings\/\{bookingId\}[\s\S]*?allow create: if false;/);
});
test('Phase 10: anonymous and unverified requests must be authenticated by protected endpoints',()=>{
  for(const file of ['booking.js','sukiStamp.js','businessRegistration.js','businessAnalytics.js','businessPlace.js','orderQuote.js']){
    const source=fs.readFileSync(path.join(__dirname,'../netlify/functions',file),'utf8');
    assert.match(source,/authenticate\(event\)/,file);
  }
});
test('Phase 10: date logic is Manila-based, including rollover',()=>{
  assert.equal(manilaDay(Date.parse('2026-11-23T23:59:59+08:00')),'20261123');
  assert.equal(manilaDay(Date.parse('2026-11-24T00:00:00+08:00')),'20261124');
});
