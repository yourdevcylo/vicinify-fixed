const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
function schedule(now,date,time){
 const dom=new JSDOM('<input id="bookDate" type="date" required><input id="bookTime" type="time" required>');
 const doc=dom.window.document;doc.getElementById('bookDate').value=date;doc.getElementById('bookTime').value=time;
 const source=fs.readFileSync(require.resolve('../js/map.js'),'utf8');
 const snippet=source.slice(source.indexOf('    function syncBookingSchedule()'),source.indexOf('    window.openBookingModal ='));
 let current=now;
 class Clock extends Date{constructor(...args){super(...(args.length?args:[current]));}}
 const ctx={document:doc,Date:Clock};vm.createContext(ctx);vm.runInContext(snippet,ctx);
 return {doc,run:()=>ctx.syncBookingSchedule(),setNow:n=>current=n,close:()=>dom.window.close()};
}
test('past date and earlier time today are rejected; calendar minimum is today',()=>{
 const s=schedule(new Date("2026-10-27T14:30:25+08:00").getTime(),'2026-10-26','15:00');s.run();const date=s.doc.getElementById('bookDate'),time=s.doc.getElementById('bookTime');assert.equal(date.min,'2026-10-27');assert.equal(date.checkValidity(),false);
 date.value='2026-10-27';time.value='14:30';s.run();assert.equal(time.checkValidity(),false);assert.equal(time.min,'14:31');
 time.value='14:31';s.run();assert.equal(time.checkValidity(),true);s.close();
});
test('future dates allow earlier clock times and clear old validity errors',()=>{
 const s=schedule(new Date("2026-10-27T14:30:00+08:00").getTime(),'2026-10-27','08:00');s.run();assert.equal(s.doc.getElementById('bookTime').checkValidity(),false);
 s.doc.getElementById('bookDate').value='2026-10-28';s.run();assert.equal(s.doc.getElementById('bookTime').min,'');assert.equal(s.doc.getElementById('bookTime').checkValidity(),true);s.close();
});
test('schedule guard refreshes after midnight and rejects time elapsed while form was open',()=>{
 const s=schedule(new Date("2026-10-27T23:58:00+08:00").getTime(),'2026-10-27','23:59');s.run();assert.equal(s.doc.getElementById('bookTime').checkValidity(),true);
 s.setNow(new Date("2026-10-28T00:01:00+08:00").getTime());s.run();assert.equal(s.doc.getElementById('bookDate').min,'2026-10-28');assert.equal(s.doc.getElementById('bookDate').checkValidity(),false);s.close();
});

function requestRuntime(){
 const html=fs.readFileSync(require.resolve('../index.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
 const dom=new JSDOM(html,{runScripts:'outside-only'}),w=dom.window,calls=[],toasts=[];
 w.requireVerifiedUser=async()=>({uid:'customer',displayName:'Customer'});w.AppState={userProfile:{fullName:'Customer'}};
 w.testPlaces=[{id:'shop',name:'Real Shop',owner_uid:'owner',refund_percent:50}];w.lockBodyScroll=()=>{};w.debouncedIcons=()=>{};
 w.escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 w.showToast=(...args)=>toasts.push(args);w.firebase={firestore:{FieldValue:{serverTimestamp:()=>123}}};w.ViciData={command:async(...args)=>calls.push(args)};
 const source=fs.readFileSync(require.resolve('../js/map.js'),'utf8');
 w.eval('const cloudPlaces=window.testPlaces;'+source.slice(source.indexOf('    function getRequestMetaForSubmit('),source.indexOf('    window.deletePlacePost =')));
 return{dom,w,calls,toasts};
}
async function fillRequest(r,type='table_reservation'){
 const {w}=r;await w.openBookingModal('shop','Real Shop');w.setRequestTypeChoice(type);
 w.document.getElementById('bookDate').value='2099-10-30';w.document.getElementById('bookTime').value='08:15';
 w.document.getElementById('bookDetails').value='Please keep this note.';
 const items=w.document.getElementById('bookItems');if(items)items.value='1x Chicken meal\n2x Rice';
}
test('all five requests review inside one sheet without writing, preserve drafts and send only on confirmation',async()=>{
 for(const type of ['table_reservation','food_reservation','pickup_order','delivery_order','advance_order']){
  const r=requestRuntime();try{
   await fillRequest(r,type);await r.w.confirmBookingSubmit();assert.equal(r.calls.length,0,type);
   const d=r.w.document;assert.equal(d.getElementById('bookingDetailsStep').classList.contains('hidden'),true);assert.equal(d.querySelectorAll('[role=alertdialog]').length,0);
   assert.match(d.getElementById('bookingReviewStep').textContent,/Please keep this note/);assert(!d.getElementById('bookingReviewStep').textContent.includes('No preference'));
   r.w.bookingBackOrCancel();assert.equal(d.getElementById('bookDetails').value,'Please keep this note.');assert.equal(d.getElementById('bookingDetailsStep').classList.contains('hidden'),false);
   await r.w.confirmBookingSubmit();await r.w.confirmBookingSubmit();assert.equal(r.calls.length,1,type);assert.equal(r.calls[0][1].request.requestType,type);assert.equal(r.calls[0][1].request.status,'pending');
  }finally{r.dom.window.close();}
 }
});
test('request review escapes user content, requires re-review after edits and guards concurrent sends',async()=>{
 const r=requestRuntime();try{
  await fillRequest(r);const d=r.w.document;d.getElementById('bookDetails').value='<img src=x onerror=alert(1)>';
  await r.w.confirmBookingSubmit();assert.equal(d.querySelector('#bookingReviewStep img'),null);assert.match(d.getElementById('bookingReviewStep').textContent,/<img/);
  d.getElementById('bookDetails').value='Changed after review';await r.w.confirmBookingSubmit();assert.equal(r.calls.length,0);assert.match(d.getElementById('bookingReviewStep').textContent,/Changed after review/);
  let finish;r.w.ViciData.command=async(...args)=>{r.calls.push(args);await new Promise(resolve=>finish=resolve)};
  const a=r.w.confirmBookingSubmit(),b=r.w.confirmBookingSubmit();await new Promise(resolve=>setImmediate(resolve));assert.equal(r.calls.length,1);assert.equal(d.getElementById('confirmBookingBtn').disabled,true);
  r.w.bookingBackOrCancel();assert.equal(d.getElementById('bookingDetailsStep').classList.contains('hidden'),true);
  finish();await Promise.all([a,b]);assert.equal(d.getElementById('confirmBookingBtn').disabled,false);
 }finally{r.dom.window.close();}
});
test('request validation writes nothing and server failure preserves review for retry',async()=>{
 const r=requestRuntime();try{
  await fillRequest(r,'pickup_order');r.w.document.getElementById('bookItems').value='';await r.w.confirmBookingSubmit();assert.equal(r.calls.length,0);assert.equal(r.w.document.getElementById('bookingReviewStep').classList.contains('hidden'),true);
  r.w.document.getElementById('bookItems').value='1x Meal';await r.w.confirmBookingSubmit();r.w.ViciData.command=async()=>{throw Error('Connection failed')};await r.w.confirmBookingSubmit();assert.match(r.toasts.at(-1)[0],/Connection failed/);assert.equal(r.w.document.getElementById('confirmBookingBtn').disabled,false);assert.equal(r.w.document.getElementById('bookItems').value,'1x Meal');
 }finally{r.dom.window.close();}
});
