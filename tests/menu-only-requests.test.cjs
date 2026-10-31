const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createBooking}=require('../netlify/functions/lib/booking-create');
const Menu=require('../netlify/functions/lib/menu');
const {requirementsTransition}=require('../netlify/functions/lib/booking-policy');
const owner={approval_status:'approved',name:'Kape Corner',owner_uid:'owner',accepts_booking:true,accepts_orders:true,accepts_advance_booking:true,delivery_inhouse:true,reservation_tables:[{id:'table_1',name:'Couple Table',seats:2},{id:'table_2',name:'Family Table',seats:6}]};
const buyer={uid:'user',name:'Customer'};
const base={placeId:'place_1',requestType:'table_reservation',bookingDate:'2099-01-10',bookingTime:'18:30',guestCount:2,paymentMethod:'GCash',tableId:'table_1'};
function create(input,place=owner){return createBooking({...base,...input},buyer,place,{fullName:'Demo Customer'});}
const source=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
test('Table reservation requires real owner-listed table and supports no food pre-order',()=>{
 const res=create({});assert.equal(res.tableId,'table_1');assert.equal(res.tableName,'Couple Table');assert.equal(res.orderItems,null);assert.equal(res.guestCount,2);
});
test('Table selection cannot invent table or exceed owner-listed capacity',()=>{
 assert.throws(()=>create({tableId:'table_404'}),/business-listed tables/);
 assert.throws(()=>create({guestCount:5}),/fewer seats/);
 assert.equal(create({tableId:'table_2',guestCount:5}).tableName,'Family Table');
});
test('Table requires configuration by the business',()=>{
 assert.throws(()=>create({}, {...owner,reservation_tables:[]}),/No reservation tables are configured/);
});
test('Table cannot sneak in typed, unlisted food',()=>{
 assert.throws(()=>create({orderItems:'3x fake special'}),/saved menu/);
});
test('Table can optionally include verified menu lines',()=>{
 const r=create({menuLines:[{itemId:'rice',quantity:2,options:{}}],orderItems:'2 × Rice'});
 assert.equal(r.orderItems,'2 × Rice');
});
for(const type of ['food_reservation','pickup_order','delivery_order','advance_order']){
 test(`${type}: no free-text food requests`,()=>{
  assert.throws(()=>create({requestType:type,orderItems:'3x unlisted item',menuLines:undefined}),/business menu/);
  assert.throws(()=>create({requestType:type,orderItems:'3x unlisted item',menuLines:[]}),/business menu/);
  const selected=create({requestType:type,menuLines:[{itemId:'rice',quantity:1,options:{}}],orderItems:'1 × Rice'});
  assert.equal(selected.orderItems,'1 × Rice');
 });
}
test('Mandatory option choices, unavailable menu items, and prices are verified server-side',async()=>{
 const fake={rice:{name:'Chicken Rice',priceCents:19900,category:'Meals',description:'',available:true,optionGroups:[{id:'g1',name:'Size',required:true,maxSelect:1,choices:[{id:'c1',name:'Regular',priceCents:0,available:true},{id:'c2',name:'Large',priceCents:3000,available:true}]}]}};
 const tx={get:async ref=>{const row=fake[ref.id];return {exists:!!row,id:ref.id,data:()=>row};}};
 const db={collection:()=>({doc:()=>({collection:()=>({doc:id=>({id})})})})};
 const lines=[{itemId:'rice',quantity:2,options:{g1:['c2']}}];
 const quote=await Menu.quote(tx,db,'place_1',lines);
 assert.equal(quote.totalCents,45800);assert.equal(quote.lines[0].name,'Chicken Rice');
 assert.equal(quote.lines[0].optionLabels[0],'Size: Large');
 await assert.rejects(Menu.quote(tx,db,'place_1',[{itemId:'rice',quantity:2,options:{}}]),/required options/);
 await assert.rejects(Menu.quote(tx,db,'place_1',[{itemId:'not_listed',quantity:1,options:{}}]),/no longer listed/);
 fake.rice.available=false;
 await assert.rejects(Menu.quote(tx,db,'place_1',lines),/unavailable/);
 fake.rice.available=true;fake.rice.priceCents=21500;
 const newQuote=await Menu.quote(tx,db,'place_1',lines);
 assert.notEqual(quote.digest,newQuote.digest);
});
test('New menu-based transactions cannot request typed replacement order details later',()=>{
 const order={status:'accepted',requestType:'delivery_order',menuLines:[{itemId:'rice',quantity:1}]};
 assert.throws(()=>requirementsTransition(order,'owner',{action:'request',required:{orderDetails:true},requestId:'r1'}),/already selected/);
 const address=requirementsTransition(order,'owner',{action:'request',required:{address:true},requestId:'r2'});
 assert.equal(address.requirementsState.required.address,true);
 assert.throws(()=>requirementsTransition({status:'accepted',requestType:'table_reservation',tableId:'table_1'},'owner',{action:'request',required:{orderDetails:true},requestId:'r3'}),/already selected/);
});
test('Customer UI contains table dropdown and menu picker, not typed food textarea',()=>{
 const map=source('js/map.js');
 assert.match(map,/id="bookTable"/);
 assert.match(map,/data-book-menu/);
 assert.doesNotMatch(map,/<textarea id="bookItems"/);
 assert.match(map,/expectedQuoteDigest:menuQuote\?\.digest/);
 const dashboard=source('js/dashboard.js');
 assert.match(dashboard,/reservation_tables: reservationTables/);
 const backend=source('netlify/functions/booking.js');
 assert.match(backend,/Typed food items are not accepted/);
});
