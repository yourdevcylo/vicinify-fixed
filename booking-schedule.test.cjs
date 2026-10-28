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
 const s=schedule(new Date(2026,9,27,14,30,25).getTime(),'2026-10-26','15:00');s.run();const date=s.doc.getElementById('bookDate'),time=s.doc.getElementById('bookTime');assert.equal(date.min,'2026-10-27');assert.equal(date.checkValidity(),false);
 date.value='2026-10-27';time.value='14:30';s.run();assert.equal(time.checkValidity(),false);assert.equal(time.min,'14:31');
 time.value='14:31';s.run();assert.equal(time.checkValidity(),true);s.close();
});
test('future dates allow earlier clock times and clear old validity errors',()=>{
 const s=schedule(new Date(2026,9,27,14,30).getTime(),'2026-10-27','08:00');s.run();assert.equal(s.doc.getElementById('bookTime').checkValidity(),false);
 s.doc.getElementById('bookDate').value='2026-10-28';s.run();assert.equal(s.doc.getElementById('bookTime').min,'');assert.equal(s.doc.getElementById('bookTime').checkValidity(),true);s.close();
});
test('schedule guard refreshes after midnight and rejects time elapsed while form was open',()=>{
 const s=schedule(new Date(2026,9,27,23,58).getTime(),'2026-10-27','23:59');s.run();assert.equal(s.doc.getElementById('bookTime').checkValidity(),true);
 s.setNow(new Date(2026,9,28,0,1).getTime());s.run();assert.equal(s.doc.getElementById('bookDate').min,'2026-10-28');assert.equal(s.doc.getElementById('bookDate').checkValidity(),false);s.close();
});
