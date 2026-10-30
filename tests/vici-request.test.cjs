const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {prepare,clean}=require('../js/vici-request');
const now=Date.parse('2026-10-30T23:30:00+08:00'),places=[{id:'cafe',name:'Everyday Cafe',accepts_booking:true,delivery_inhouse:true},{id:'other',name:'Closed Shop',accepts_booking:false}];
test('bilingual draft is explicit, future Philippine date and time, never a confirmed booking',()=>{
 const r=prepare({query:'Mag-book ako sa Everyday Cafe bukas 6 PM apat kami',places,now});
 assert.equal(r.state,'ready');assert.equal(r.draft.date,'2026-10-31');assert.equal(r.draft.time,'18:00');assert.equal(r.draft.guests,4);assert.equal(r.draft.placeId,'cafe');assert(!('status'in r.draft));assert(!('paymentStatus'in r.draft));
});
test('missing information is collected across turns and choosing a place preserves earlier details',()=>{
 let r=prepare({query:'Book tomorrow at 6 PM for 4 people',places,now});assert.equal(r.state,'choose_place');assert.equal(r.draft.guests,4);
 r=prepare({query:'Everyday Cafe',previous:r.draft,places,now});assert.equal(r.state,'ready');assert.equal(r.draft.time,'18:00');
 r=prepare({query:'Make it 6 people',previous:r.draft,places,now});assert.equal(r.draft.guests,6);
 const partial=prepare({query:'Book Everyday Cafe',places,now});assert.deepEqual(partial.missing,['date','time','guests']);
});
test('unsupported bookings, ambiguity, bad dates and times cannot become a ready draft',()=>{
 assert.equal(prepare({query:'Book Closed Shop tomorrow 6 PM for 4 people',places,now}).state,'unavailable');
 assert.equal(prepare({query:'book tomorrow at 6 PM',places,focus:['cafe','other'],now}).state,'choose_place');
 assert.equal(prepare({query:'Book at Unknown Cafe tomorrow 6 PM',places,focus:['cafe'],now}).state,'choose_place');
 for(const date of ['2026-02-30','2026-10-01']){const r=prepare({query:`Book Everyday Cafe ${date} 6 PM for 4 people`,places,now});assert(r.missing.includes('date'));}
 const r=prepare({query:'Book Everyday Cafe today at 6 PM for 4 people',places,now});assert(r.missing.includes('date'));
 assert.equal(clean({active:true,status:'accepted',paymentMethod:'Cash',guests:999,placeId:'../bad'}).placeId,'');
});
test('orders require explicit items, no inferred payment/address, draft cancellation is local only',()=>{
 const r=prepare({query:'Pickup order Everyday Cafe tomorrow 6 PM Items: 2 chicken meals',places,now});assert.equal(r.state,'ready');assert.equal(r.draft.requestType,'pickup_order');assert.equal(r.draft.items,'2 chicken meals');assert(!('deliveryAddress'in r.draft));
 assert.equal(prepare({query:'cancel draft',previous:r.draft,places,now}).state,'discarded');
 assert.equal(prepare({query:'What are their hours?',previous:r.draft,places,now}),null);
 assert.equal(prepare({query:'What is my booking?',places,now}),null);
});
test('review action only opens the explicit draft form and menu remains a separate action',async()=>{
 const {JSDOM}=require('jsdom'),dom=new JSDOM('<body class="vicinify-ui"></body>',{runScripts:'outside-only',url:'https://vici.test'}),w=dom.window;w.auth={currentUser:{uid:'alice'}};w.ViciRequest={clean};w.debouncedIcons=()=>{};w.eval(fs.readFileSync(require.resolve('../js/vici-chat.js'),'utf8'));
 let reviews=0,menus=0;const draft=prepare({query:'Book Everyday Cafe tomorrow 6 PM for 4 people',places,now}).draft;
 w.ViciChat.configure({ask:async()=>({answer:'Review first. Nothing submitted.',requestDraft:draft,requestReady:true,picks:[{id:'cafe',name:'Everyday Cafe'}]}),reviewRequest:async d=>{reviews++;assert.equal(d.guests,4);return true;},viewMenu:async id=>{menus++;assert.equal(id,'cafe');}});
 try{await w.ViciChat.send('Book Everyday Cafe');assert.equal(reviews,0);await w.ViciChat.send('Make it 4 people');assert.equal(w.document.querySelectorAll('[data-action=request]').length,1);w.document.querySelector('[data-action=menu]').click();await Promise.resolve();assert.equal(menus,1);assert(w.ViciChat.isOpen());w.document.querySelector('[data-action=request]').click();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(reviews,1);assert(!w.ViciChat.isOpen());w.ViciChat.configure({ask:async()=>({answer:'Draft discarded. Nothing cancelled.',requestDraft:clean(),requestReady:false})});await w.ViciChat.send('cancel draft');assert.equal(w.document.querySelectorAll('[data-action=request]').length,0);}finally{w.close();}
});

test('disabled request setting is enforced again by the booking server',()=>{
 const {createBooking}=require('../netlify/functions/lib/booking-create');assert.throws(()=>createBooking({requestType:'table_reservation'}, {uid:'customer'}, {approval_status:'approved',owner_uid:'owner',accepts_booking:false},{}),{status:409});
});
