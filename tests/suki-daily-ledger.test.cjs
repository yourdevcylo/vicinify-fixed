'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {stampDayId,manilaDay,approveInStore,awardConfirmedOrder,redeem}=require('../netlify/functions/lib/suki-stamps');
class FakeFirestore {
  constructor(initial={}) { this.docs=new Map(Object.entries(initial)); this.queue=Promise.resolve(); }
  collection(name) {return {doc:id=>({key:`${name}/${id}`})};}
  async runTransaction(callback){
    const run=async()=>{
      const buffered=[];
      const transaction={
        get:async ref=>({exists:this.docs.has(ref.key),data:()=>structuredClone(this.docs.get(ref.key))}),
        create:(ref,data)=>buffered.push({op:'create',ref,data}),
        update:(ref,data)=>buffered.push({op:'update',ref,data})
      };
      const result=await callback(transaction);
      for(const write of buffered)if(write.op==='create'&&this.docs.has(write.ref.key))throw Error('duplicate doc');
      for(const write of buffered){const prev=this.docs.get(write.ref.key)||{};this.docs.set(write.ref.key,structuredClone(write.op==='create'?write.data:{...prev,...write.data}));}
      return result;
    };
    const out=this.queue.then(run,run);this.queue=out.catch(()=>{});return out;
  }
  data(path){return this.docs.get(path);}
}
const FieldValue={serverTimestamp:()=>({serverTime:true})};
const utc=(value)=>new Date(value).getTime();
const store={owner_uid:'owner',suki_enabled:true,suki_stamp_count:8};
const request=(id='r1',customerUid='c')=>({placeId:'shop',customerUid,customerName:'Customer',status:'pending'});
function fresh(){return new FakeFirestore({'places/shop':store,'stamp_requests/r1':request(),'stamp_requests/r2':request('r2')});}
function approve(db,id='r1',now='2026-11-02T01:00:00+08:00',actorUid='owner'){
  return approveInStore({db,FieldValue,requestId:id,actorUid,now:utc(now)});
}
test('Manila calendar day switches at 00:00 Philippine time (not UTC midnight)',()=>{
  assert.equal(manilaDay(utc('2026-11-01T23:59:59+08:00')),'20261101');
  assert.equal(manilaDay(utc('2026-11-02T00:00:00+08:00')),'20261102');
  assert.equal(stampDayId('shop','c','20261102').length,64);
  assert.notEqual(stampDayId('shop','c','20261102'),stampDayId('shop','other','20261102'));
});
test('two concurrent owner approvals same day create one stamp and exactly one ledger entry',async()=>{
  const db=fresh();const results=await Promise.all([approve(db,'r1'),approve(db,'r2')]);
  assert.equal(results.filter(r=>r.qualified).length,1);
  assert.equal(results.filter(r=>r.reason==='daily-limit').length,1);
  assert.equal(db.data('loyalty_cards/shop_c').stamps,1);
  assert.equal(db.data('loyalty_cards/shop_c').verifiedPurchaseDays,1);
  const daily=[...db.docs.keys()].filter(x=>x.startsWith('suki_daily_stamps/'));
  assert.equal(daily.length,1);
  assert.deepEqual([db.data('stamp_requests/r1').status,db.data('stamp_requests/r2').status].sort(),['approved','rejected']);
});
test('next-day owner approval grants new stamp without resetting redemption totals',async()=>{
  const db=fresh();await approve(db,'r1','2026-11-02T22:00:00+08:00');
  const result=await approve(db,'r2','2026-11-03T00:00:00+08:00');
  assert.equal(result.awarded,true);assert.equal(db.data('loyalty_cards/shop_c').stamps,2);
  assert.equal(db.data('loyalty_cards/shop_c').verifiedPurchaseDays,2);
});
test('owner verification rejects unauthorized actor and disabled business',async()=>{
  const db=fresh();await assert.rejects(approve(db,'r1',undefined,'hacker'),/Only the establishment owner/);
  assert.equal(db.data('stamp_requests/r1').status,'pending');
  db.docs.set('places/shop',{...store,suki_enabled:false});
  await assert.rejects(approve(db),/cannot be approved/);
});
test('customer-confirmed menu-backed order gets automatic stamp and blocks in-store duplicate on same day',async()=>{
  const db=fresh();db.docs.set('bookings/order1',{placeId:'shop',userId:'c',userName:'Customer',status:'received',customer_confirmed:true,paymentStatus:'confirmed',paymentVerifiedAt:new Date('2026-11-02T01:00:00Z'),paymentAmount:'150.00',paymentAmountDue:'150.00',menuLines:[{menuItemId:'adobo',quantity:1}]});
  const orderResult=await awardConfirmedOrder({db,FieldValue,bookingId:'order1',now:utc('2026-11-02T10:00:00+08:00')});
  assert.equal(orderResult.awarded,true);
  assert.equal(db.data('loyalty_cards/shop_c').stamps,1);
  const manualResult=await approve(db,'r1');
  assert.equal(manualResult.reason,'daily-limit');
  assert.equal(db.data('loyalty_cards/shop_c').verifiedPurchaseDays,1);
});
test('retrying the same completed order cannot double-count a day',async()=>{
  const db=fresh();db.docs.set('bookings/order1',{placeId:'shop',userId:'c',status:'received',customer_confirmed:true,paymentStatus:'confirmed',paymentVerifiedAt:new Date('2026-11-02T01:00:00Z'),paymentAmount:'150.00',paymentAmountDue:'150.00',menuLines:[{quantity:1}]});
  const args={db,FieldValue,bookingId:'order1',now:utc('2026-11-02T09:00:00+08:00')};
  assert.equal((await awardConfirmedOrder(args)).qualified,true);
  assert.equal((await awardConfirmedOrder(args)).reason,'order-already-counted');
  assert.equal(db.data('loyalty_cards/shop_c').stamps,1);
});
test('pending, owner-only fulfilled and foodless table reservations cannot auto-award',async()=>{
  const db=fresh();for(const [id,status,confirmed,lines] of [['a','pending',false,[{}]],['b','fulfilled',false,[{}]],['c','received',true,[]]]){
    db.docs.set('bookings/'+id,{placeId:'shop',userId:'c',status,customer_confirmed:confirmed,menuLines:lines});
    const result=await awardConfirmedOrder({db,FieldValue,bookingId:id});
    assert.equal(result.reason,'not-eligible');
  }
  assert.equal(db.data('loyalty_cards/shop_c'),undefined);
});
test('full reward card does not overfill, but new verified purchase day still counts toward VIP eligibility',async()=>{
  const db=fresh();db.docs.set('loyalty_cards/shop_c',{placeId:'shop',customerUid:'c',stamps:8,redemptionCount:4,verifiedPurchaseDays:7,claimRequested:true});
  const result=await approve(db,'r1');
  assert.equal(result.awarded,false);assert.equal(result.reason,'card-full');assert.equal(result.qualified,true);
  assert.equal(db.data('loyalty_cards/shop_c').stamps,8);
  assert.equal(db.data('loyalty_cards/shop_c').verifiedPurchaseDays,8);
  assert.equal(db.data('loyalty_cards/shop_c').redemptionCount,4);
});
test('redemption is owner-verified, preserves lifetime days and prevents duplicate claim',async()=>{
  const db=fresh();db.docs.set('loyalty_cards/shop_c',{placeId:'shop',customerUid:'c',stamps:8,redemptionCount:3,verifiedPurchaseDays:10,claimRequested:true,claimed:false});
  await assert.rejects(redeem({db,FieldValue,cardId:'shop_c',actorUid:'stranger'}),/Only the establishment owner/);
  const done=await redeem({db,FieldValue,cardId:'shop_c',actorUid:'owner'});
  assert.equal(done.redemptionCount,4);
  assert.equal(db.data('loyalty_cards/shop_c').stamps,0);
  assert.equal(db.data('loyalty_cards/shop_c').verifiedPurchaseDays,10);
  await assert.rejects(redeem({db,FieldValue,cardId:'shop_c',actorUid:'owner'}),/No active reward claim/);
});
test('security rules deny owner direct stamp minting and daily-ledger access',()=>{
  const fs=require('node:fs'),path=require('node:path');const rules=fs.readFileSync(path.join(__dirname,'../firestore.rules'),'utf8');
  const card=rules.slice(rules.indexOf('match /loyalty_cards/'),rules.indexOf('match /stamp_requests/'));
  assert.doesNotMatch(card,/allow update: if isAdmin\(\)/);
  assert.doesNotMatch(card,/allow update: if isPlaceOwner/);
  assert.match(rules,/match \/suki_daily_stamps\/\{dayId\} \{ allow read, write: if false; \}/);
});
test('same completed booking cannot count again the following day, even if sync repeats',async()=>{
  const db=fresh();db.docs.set('bookings/order1',{placeId:'shop',userId:'c',status:'received',customer_confirmed:true,paymentStatus:'confirmed',paymentVerifiedAt:new Date('2026-11-02T01:00:00Z'),paymentAmount:'150.00',paymentAmountDue:'150.00',customerConfirmedAt:{seconds:utc('2026-11-02T09:00:00+08:00')/1000},menuLines:[{quantity:1}]});
  const once=await awardConfirmedOrder({db,FieldValue,bookingId:'order1',now:utc('2026-11-02T10:00:00+08:00')});
  const replay=await awardConfirmedOrder({db,FieldValue,bookingId:'order1',now:utc('2026-11-03T10:00:00+08:00')});
  assert.equal(once.qualified,true);assert.equal(replay.reason,'order-already-counted');
  assert.equal(db.data('loyalty_cards/shop_c').verifiedPurchaseDays,1);
});
test('second order on one day is never eligible for re-award on later day',async()=>{
  const db=fresh();
  for(const [id,hour] of [['o1',9],['o2',14]])db.docs.set('bookings/'+id,{placeId:'shop',userId:'c',status:'received',customer_confirmed:true,paymentStatus:'confirmed',paymentVerifiedAt:new Date('2026-11-02T01:00:00Z'),paymentAmount:'150.00',paymentAmountDue:'150.00',customerConfirmedAt:{seconds:utc(`2026-11-02T${String(hour).padStart(2,'0')}:00:00+08:00`)/1000},menuLines:[{quantity:1}]});
  await awardConfirmedOrder({db,FieldValue,bookingId:'o1'});
  assert.equal((await awardConfirmedOrder({db,FieldValue,bookingId:'o2'})).reason,'daily-limit');
  assert.equal((await awardConfirmedOrder({db,FieldValue,bookingId:'o2',now:utc('2026-11-04T13:00:00+08:00')})).reason,'order-already-counted');
  assert.equal(db.data('loyalty_cards/shop_c').stamps,1);
  assert.equal(db.data('loyalty_cards/shop_c').verifiedPurchaseDays,1);
});
