const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const agg=require('../netlify/functions/lib/business-analytics');
const now=new Date('2026-11-23T04:00:00Z').getTime();
const day=(value)=>new Date(value);
function order(id,patch={}){
  return {status:'received',customer_confirmed:true,paymentStatus:'confirmed',
    paymentVerifiedAt:day('2026-11-20T04:01:00Z'),
    customerConfirmedAt:day('2026-11-20T04:05:00Z'),createdAt:day('2026-11-20T03:00:00Z'),
    userId:id,requestType:'pickup_order',paymentAmount:'500.00',paymentAmountDue:'500.00',
    menuLines:[{itemId:'food123',name:'Adobo',quantity:2}],...patch};
}
function monthly(data){return data.views.monthly.series.at(-1)}
test('Philippine-local calendar day rolls over at midnight, not UTC',()=>{
  assert.equal(agg.phDay('2026-11-22T15:59:59Z'),'2026-11-22');
  assert.equal(agg.phDay('2026-11-22T16:00:00Z'),'2026-11-23');
});
test('only customer-received AND owner-verified transactions counted',()=>{
  const rows=[order('a'),order('b',{status:'fulfilled'}),order('c',{customer_confirmed:false}),
    order('d',{paymentStatus:'pending_confirmation'}),order('e',{paymentVerifiedAt:null}),
    order('f',{status:'cancelled'}),order('g',{status:'rejected'})];
  const result=agg.aggregateBookings(rows,now);const last=monthly(result);
  assert.equal(last.completedOrders,1);assert.equal(last.paidOrders,1);
  assert.equal(last.verifiedSalesCents,50000);assert.equal(result.totalQualified,1);
});
test('missing, mismatched, and refunded amounts never inflate recorded sales',()=>{
  const rows=[order('a'),order('b',{paymentAmount:'499.00'}),order('c',{paymentAmountDue:null}),
    order('d',{refundStatus:'received',refundAmount:'250.00'}),order('e',{paymentAmount:'xyz'})];
  const last=monthly(agg.aggregateBookings(rows,now));
  assert.equal(last.completedOrders,5);assert.equal(last.paidOrders,1);
  assert.equal(last.unpricedOrders,4);assert.equal(last.verifiedSalesCents,50000);
});
test('counts unique customers, reservation transactions, and canonical menu-item quantities',()=>{
  const first=order('same',{requestType:'table_reservation',menuLines:[{itemId:'a',name:'Tea',quantity:3}]});
  const second=order('same',{requestType:'pickup_order',menuLines:[{itemId:'a',name:'Tea',quantity:4}]});
  const third=order('another',{requestType:'delivery_order',menuLines:[{itemId:'b',name:'Rice',quantity:1}]});
  const result=agg.aggregateBookings([first,second,third],now),last=monthly(result);
  assert.equal(last.completedOrders,3);assert.equal(last.uniqueCustomers,2);
  assert.equal(last.reservationCount,1);assert.equal(last.itemsSold,8);
  assert.equal(result.topItems[0].quantity,7);assert.equal(result.topItems[0].name,'Tea');
});
test('completion timestamp used for reporting buckets over creation timestamp',()=>{
  const r=order('a',{createdAt:day('2026-10-31T06:00:00Z'),customerConfirmedAt:day('2026-11-01T08:00:00Z')});
  const result=agg.aggregateBookings([r],now);
  assert.equal(result.views.monthly.series.at(-1).completedOrders,1);
  assert.equal(result.views.monthly.series.at(-2).completedOrders,0);
});
test('legacy transaction dates fallback explicitly tracked',()=>{
  const result=agg.aggregateBookings([order('a',{customerConfirmedAt:null})],now);
  assert.equal(result.legacyDateCount,1);
  assert.equal(monthly(result).completedOrders,1);
});
test('weekly buckets begin Monday in Philippine local time',()=>{
  assert.equal(agg.monday('2026-11-23'),'2026-11-23');
  assert.equal(agg.monday('2026-11-29'),'2026-11-23');
  assert.equal(agg.monday('2026-11-22'),'2026-11-16');
});
test('returns previous period percentage and warns about partial datasets',()=>{
  const p=order('a',{customerConfirmedAt:day('2026-10-20T07:00:00Z'),paymentAmount:'250.00',paymentAmountDue:'250.00'});
  const r=agg.aggregateBookings([p,order('b')],now,{partial:true,scanned:4000});
  assert.equal(r.views.monthly.changePercent,100);
  assert.equal(r.partial,true);assert.equal(r.scanned,4000);
});
function makeHandler({ownerUid='owner-1',rows=[],calls=[]}={}){
  const code=fs.readFileSync(path.join(__dirname,'../netlify/functions/businessAnalytics.js'),'utf8');
  const fakePlace={exists:true,data:()=>({owner_uid:ownerUid,name:'Kusina Lipa'})};
  let page=0;
  const query={where(){return this;},orderBy(){return this;},startAfter(){return this;},limit(){return this;},
    async get(){calls.push('bookings.query');return page++===0?{empty:!rows.length,docs:rows.map((data,i)=>({data:()=>data,id:'b'+i})),size:rows.length}:{empty:true,docs:[],size:0};}};
  const db={collection(name){return name==='places'?{doc(){return{get:async()=>fakePlace}}}:query;}};
  const fakeAdmin={authenticate:async()=>({uid:'owner-1'}),limit:async()=>{},identifier:v=>v,
    services:()=>({db}),reply:(code,obj)=>({statusCode:code,body:JSON.stringify(obj)})};
  const module={exports:{}};
  vm.runInNewContext(code,{module,exports:module.exports,console,Date,require:request=>{
    if(request==='./lib/admin')return fakeAdmin;
    if(request==='./lib/business-analytics')return agg;
    if(request==='firebase-admin/firestore')return{Timestamp:{fromDate:d=>d}};
    throw Error('Unexpected dependency '+request);
  }}, {filename:'businessAnalytics.js'});
  return module.exports.handler;
}
test('business report endpoint checks ownership before fetching private transactions',async()=>{
  const calls=[],handler=makeHandler({ownerUid:'another-owner',rows:[order('a')],calls});
  const response=await handler({httpMethod:'POST',body:JSON.stringify({placeId:'abc'})});
  assert.equal(response.statusCode,403);assert.deepEqual(calls,[]);
});
test('authorized endpoint returns aggregates and no customer identifiers',async()=>{
  const handler=makeHandler({rows:[order('secret-uid-123')]});
  const response=await handler({httpMethod:'POST',body:JSON.stringify({placeId:'abc'})});
  assert.equal(response.statusCode,200);
  assert.equal(JSON.parse(response.body).placeName,'Kusina Lipa');
  assert.doesNotMatch(response.body,/secret-uid-123/);
});
test('UI and Firestore query require a selected establishment; no public analytics fields',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  const js=fs.readFileSync(path.join(__dirname,'../js/business-analytics.js'),'utf8');
  assert.match(html,/businessAnalyticsSection/);assert.match(html,/data-analytics-view="weekly"/);
  assert.match(html,/data-analytics-view="annual"/);assert.match(js,/ViciData\.command\('businessAnalytics'/);
  assert.match(fs.readFileSync(path.join(__dirname,'../netlify/functions/businessAnalytics.js'),'utf8'),/owner_uid!==user.uid/);
});
