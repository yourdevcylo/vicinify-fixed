'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {memory} = require('./helpers/memory-admin.cjs');
const Menu = require('../netlify/functions/lib/menu');
const {discountRate,withVipDiscount} = require('../netlify/functions/lib/vip-pricing');
const Policy = require('../js/payment-policy');

const shop={name:'Kusina Lipa',approval_status:'approved',owner_uid:'owner',accepts_orders:true,accepts_booking:true,
 accepts_advance_booking:true,delivery_inhouse:true,suki_enabled:true,suki_vip_enabled:true,suki_vip_discount_percent:10,
 suki_vip_benefit:'Priority requests',reservation_tables:[{id:'table-4',name:'Family table',seats:4}]};
const food={name:'Chicken Adobo',description:'Adobo meal',category:'Meals',priceCents:50000,
 available:true,archived:false,optionGroups:[],version:1};
const card={placeId:'shop',customerUid:'customer',verifiedPurchaseDays:12,stamps:4,
 redemptionCount:3,vipActive:true,vipExpiresAt:null};
const lines=[{itemId:'adobo',quantity:1,options:{}}];

function fixture() {
 const store=memory({'places/shop':shop,'places/other':{...shop,owner_uid:'someone-else'},
   'places/shop/menu_items/adobo':food,'loyalty_cards/shop_customer':card,
   'loyalty_cards/other_customer':{...card,placeId:'other'},
   'users/customer':{fullName:'Customer'},'users/owner':{fullName:'Owner'}});
 let actor='customer';
 const location=require.resolve('../netlify/functions/lib/admin');
 const old=require.cache[location];
 require.cache[location]={id:location,filename:location,loaded:true,exports:{
   authenticate:async()=>({uid:actor}),services:()=>store,limit:async()=>{},
   identifier:v=>{if(typeof v!=='string'||!/^[a-zA-Z0-9_-]{1,180}$/.test(v))throw Object.assign(new Error('bad id'),{status:400});return v;},
   reply:(statusCode,body)=>({statusCode,body:JSON.stringify(body)})
 }};
 const paths=['orderQuote','booking'];
 for(const n of paths)delete require.cache[require.resolve(`../netlify/functions/${n}`)];
 const endpoints=Object.fromEntries(paths.map(n=>[n,require(`../netlify/functions/${n}`).handler]));
 const call=async(name,body)=>{
   const res=await endpoints[name]({httpMethod:'POST',body:JSON.stringify(body)});
   return {status:res.statusCode,data:JSON.parse(res.body)};
 };
 const close=()=>{for(const n of paths)delete require.cache[require.resolve(`../netlify/functions/${n}`)];if(old)require.cache[location]=old;else delete require.cache[location];};
 const create=(digest,key='vip-phase5')=>call('booking',{action:'create',idempotencyKey:key,confirmed:true,expectedQuoteDigest:digest,
    request:{placeId:'shop',requestType:'pickup_order',bookingDate:'2099-01-01',bookingTime:'17:00',paymentMethod:'GCash',
      menuLines:lines,estimatedTotalCents:1,vipDiscountPercent:99,vipDiscountCents:49999}});
 return {store,call,create,close,actor:v=>actor=v};
}

const withFixture=async fn=>{const f=fixture();try{await fn(f);}finally{f.close();}};

test('one-cent menu amounts never produce a zero-payable VIP request',async()=>{
 const store=memory({'loyalty_cards/shop_customer':card});
 const quote={totalCents:1,digest:'test-digest',lines:[],currency:'PHP'};
 const result=await store.db.runTransaction(tx=>withVipDiscount({tx,db:store.db,quote,place:shop,placeId:'shop',customerUid:'customer'}));
 assert.equal(result.vipDiscountCents,0);assert.equal(result.estimatedTotalCents,1);
});

test('approved VIP receives a server-only discount with separate gross and net amounts',async()=>withFixture(async f=>{
 const r=await f.call('orderQuote',{placeId:'shop',requestType:'pickup_order',lines, vipDiscountPercent:90});
 assert.equal(r.status,200,JSON.stringify(r.data));
 assert.equal(r.data.totalCents,50000);
 assert.equal(r.data.vipDiscountPercent,10);
 assert.equal(r.data.vipDiscountCents,5000);
 assert.equal(r.data.estimatedTotalCents,45000);
 assert.equal(r.data.vipApplied,true);
 const plainDigest=(await f.store.db.runTransaction(tx=>Menu.quote(tx,f.store.db,'shop',lines))).digest;
 assert.notEqual(r.data.digest,plainDigest);
 const created=await f.create(r.data.digest);
 assert.equal(created.status,200,JSON.stringify(created.data));
 const saved=f.store.rows.get('bookings/'+created.data.bookingId);
 assert.equal(saved.vipDiscountPercent,10);assert.equal(saved.vipDiscountCents,5000);
 assert.equal(saved.estimatedSubtotalCents,50000);assert.equal(saved.estimatedTotalCents,45000);
 assert.equal(saved.status,'pending');assert.equal(saved.redemptionCount,undefined);
 const repeated=await f.create(r.data.digest);assert.equal(repeated.status,200);assert.equal(repeated.data.repeated,true);
}));

test('non-VIPs, disabled programs, expired memberships and wrong-store cards receive no discount',async()=>withFixture(async f=>{
 const q=()=>f.call('orderQuote',{placeId:'shop',lines});
 f.store.rows.delete('loyalty_cards/shop_customer');
 let r=await q();assert.equal(r.data.vipDiscountCents,0);assert.equal(r.data.totalCents,r.data.estimatedTotalCents);
 f.store.rows.set('loyalty_cards/shop_customer',card);
 f.store.rows.get('places/shop').suki_vip_enabled=false;
 r=await q();assert.equal(r.data.vipDiscountCents,0);
 f.store.rows.get('places/shop').suki_vip_enabled=true;
 f.store.rows.get('loyalty_cards/shop_customer').vipActive=false;
 r=await q();assert.equal(r.data.vipDiscountCents,0);
 Object.assign(f.store.rows.get('loyalty_cards/shop_customer'),{vipActive:true,vipExpiresAt:'2020-01-01T00:00:00Z'});
 r=await q();assert.equal(r.data.vipDiscountCents,0);
 f.store.rows.get('loyalty_cards/shop_customer').vipExpiresAt=null;
 f.store.rows.get('loyalty_cards/shop_customer').placeId='other';
 r=await q();assert.equal(r.data.vipDiscountCents,0);
 f.store.rows.get('loyalty_cards/shop_customer').placeId='shop';
 f.store.rows.get('places/shop').suki_vip_discount_percent=90;
 r=await q();assert.equal(r.data.vipDiscountCents,0);
}));

test('VIP revocation, expiry, or percent changes between review and confirmation invalidate quote',async()=>withFixture(async f=>{
 let q=(await f.call('orderQuote',{placeId:'shop',lines})).data;
 f.store.rows.get('places/shop').suki_vip_discount_percent=15;
 let result=await f.create(q.digest,'vip-stale-rate');assert.equal(result.status,409);assert.match(result.data.error,/prices|options/i);
 f.store.rows.get('places/shop').suki_vip_discount_percent=10;
 f.store.rows.get('loyalty_cards/shop_customer').vipActive=false;
 result=await f.create(q.digest,'vip-revoked');assert.equal(result.status,409);
 f.store.rows.get('loyalty_cards/shop_customer').vipActive=true;
 f.store.rows.get('loyalty_cards/shop_customer').vipExpiresAt='2020-01-01T00:00:00Z';
 result=await f.create(q.digest,'vip-expired');assert.equal(result.status,409);
 assert.equal([...f.store.rows.keys()].filter(k=>k.startsWith('bookings/')).length,0);
}));

test('malicious customer VIP claim or pricing fields do not grant a discount',async()=>withFixture(async f=>{
 f.store.rows.get('loyalty_cards/shop_customer').vipActive=false;
 const q=(await f.call('orderQuote',{placeId:'shop',lines,discount:90,vip:true})).data;
 assert.equal(q.vipDiscountCents,0);
 const result=await f.create(q.digest,'not-eligible');assert.equal(result.status,200);
 const saved=f.store.rows.get('bookings/'+result.data.bookingId);
 assert.equal(saved.vipDiscountPercent,0);assert.equal(saved.vipDiscountCents,0);
 assert.equal(saved.estimatedTotalCents,50000);
}));

test('server calculates VIP final amount and only permits disclosed additional fees',async()=>withFixture(async f=>{
 const q=(await f.call('orderQuote',{placeId:'shop',lines})).data;
 const b=await f.create(q.digest,'vip-payment');assert.equal(b.status,200);
 const bookingId=b.data.bookingId;
 f.actor('owner');
 assert.equal((await f.call('booking',{bookingId,patch:{status:'accepted'}})).status,200);
 assert.equal((await f.call('booking',{bookingId,patch:{requirements:{action:'not_required'}}})).status,200);
 let r=await f.call('booking',{bookingId,patch:{paymentTerms:{paymentMethod:'GCash',amount:'500.00',instructions:'GCash receiver account 12345'}}});
 assert.equal(r.status,400,'VIP total cannot be set from a client amount');
 r=await f.call('booking',{bookingId,patch:{paymentTerms:{paymentMethod:'GCash',extraFee:'40.00',extraFeeReason:'Delivery fee',instructions:'GCash receiver account 12345'}}});
 assert.equal(r.status,200,JSON.stringify(r.data));
 const saved=f.store.rows.get('bookings/'+bookingId);
 assert.equal(saved.paymentAmountDue,'490.00');
 assert.equal(saved.additionalFeeCents,4000);
 assert.equal(saved.additionalFeeReason,'Delivery fee');
 assert.equal(saved.vipDiscountCents,5000);
 assert.equal(saved.estimatedTotalCents,45000);
 const copy=f.store.rows.get('messages/request_'+bookingId);
 assert.equal(copy.paymentAmountDue,'490.00');
 assert.equal(copy.vipDiscountCents,5000);
}));

test('payment terms reject tampered VIP totals, undisclosed fees, and bogus legacy fields',()=>{
 const order={status:'accepted',requirementsState:{status:'waived'},paymentFlowVersion:2,
   paymentMethod:'GCash',estimatedSubtotalCents:50000,estimatedTotalCents:45000,
   vipDiscountCents:5000,vipDiscountPercent:10};
 const terms=v=>Policy.paymentTerms(order,'owner',{paymentMethod:'GCash',instructions:'GCash recipient 11111',...v});
 assert.equal(terms({extraFee:'0'}).paymentAmountDue,'450.00');
 assert.equal(terms({extraFee:'10.25',extraFeeReason:'Order packaging'}).paymentAmountDue,'460.25');
 for(const value of ['-1','1.009','abc','9999999'])assert.throws(()=>terms({extraFee:value}),{status:400});
 assert.throws(()=>terms({extraFee:'20.00'}),{status:400});
 assert.throws(()=>terms({amount:'1.00'}),{status:400});
 assert.throws(()=>Policy.paymentTerms({...order,estimatedTotalCents:49000},'owner',{extraFee:'0',instructions:'GCash recipient'}),{status:409});
 assert.equal(Policy.paymentTerms({...order,vipDiscountCents:0},'owner',{amount:'500.00',instructions:'GCash recipient'}).paymentAmountDue,'500.00');
});

test('saved accepted VIP discount remains fixed even if program changes after booking',async()=>withFixture(async f=>{
 const q=(await f.call('orderQuote',{placeId:'shop',lines})).data;
 const b=await f.create(q.digest,'vip-locked');assert.equal(b.status,200);
 f.store.rows.get('loyalty_cards/shop_customer').vipActive=false;
 f.store.rows.get('places/shop').suki_vip_discount_percent=0;
 f.actor('owner');
 assert.equal((await f.call('booking',{bookingId:b.data.bookingId,patch:{status:'accepted'}})).status,200);
 assert.equal((await f.call('booking',{bookingId:b.data.bookingId,patch:{requirements:{action:'not_required'}}})).status,200);
 assert.equal((await f.call('booking',{bookingId:b.data.bookingId,patch:{paymentTerms:{extraFee:'0',instructions:'GCash owner bank account'}}})).status,200);
 assert.equal(f.store.rows.get('bookings/'+b.data.bookingId).paymentAmountDue,'450.00');
}));

test('Phase 5 UI includes explicit percentages and discounted totals without changing approval rules',()=>{
 const page=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 const dashboard=fs.readFileSync(path.join(__dirname,'../js/dashboard.js'),'utf8');
 const cart=fs.readFileSync(path.join(__dirname,'../js/vici-commerce.js'),'utf8');
 const map=fs.readFileSync(path.join(__dirname,'../js/map.js'),'utf8');
 const common=fs.readFileSync(path.join(__dirname,'../js/common.js'),'utf8');
 const rules=fs.readFileSync(path.join(__dirname,'../firestore.rules'),'utf8');
 assert.match(page,/sukiVipDiscountPercent/);
 assert.match(dashboard,/suki_vip_discount_percent: sd.vipDiscountPercent/);
 assert.match(cart,/Discounted menu total/);
 assert.match(map,/VIP discount/);
 assert.match(common,/Additional fees only/);
 assert.match(rules,/match \/loyalty_cards\//);
 assert.match(rules,/match \/bookings\//);
});
