const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Hours=require('../js/business-hours.js');
const root=path.resolve(__dirname,'..');
const at=(day,time)=>new Date(`${day}T${time}:00Z`); // test UTC instant, engine uses Asia/Manila
const store=(operating_hours,status='closed',status_mode=undefined)=>({operating_hours,status,status_mode});

test('uses Philippine time, not the device/server timezone',()=>{
 const s=store({saturday:'8AM - 9PM'},'closed');
 assert.equal(Hours.getState(s,at('2026-10-31','00:30')).status,'open'); // PH 8:30AM
 assert.equal(Hours.getState(s,at('2026-10-31','13:00')).status,'closed'); // PH 9PM exactly
 assert.equal(Hours.philippineClock(at('2026-10-31','16:05')).day,0); // Sunday 00:05
});
test('start inclusive; closing time exclusive; following day closed',()=>{
 const s=store({saturday:'8:30AM - 9:30PM',sunday:'Closed'},'open');
 assert.equal(Hours.getState(s,at('2026-10-31','00:29')).isOpen,false);
 assert.equal(Hours.getState(s,at('2026-10-31','00:30')).isOpen,true);
 assert.equal(Hours.getState(s,at('2026-10-31','13:29')).isOpen,true);
 assert.equal(Hours.getState(s,at('2026-10-31','13:30')).isOpen,false);
 assert.equal(Hours.getState(s,at('2026-10-31','16:30')).isOpen,false);
});
test('overnight opening respects previous day (including next day Closed)',()=>{
 const s=store({saturday:'6PM - 2AM',sunday:'Closed'});
 assert.equal(Hours.getState(s,at('2026-10-31','10:00')).isOpen,true); // 6PM
 assert.equal(Hours.getState(s,at('2026-10-31','15:55')).isOpen,true); // 11:55PM
 assert.equal(Hours.getState(s,at('2026-10-31','16:30')).isOpen,true); // Sun 00:30
 assert.equal(Hours.getState(s,at('2026-10-31','17:59')).isOpen,true); // 1:59AM
 assert.equal(Hours.getState(s,at('2026-10-31','18:00')).isOpen,false); // 2:00AM
});
test('24/7, 24 hours, closed, and 24-hour clock supported',()=>{
 assert.equal(Hours.parseHours('24/7').end,1440);
 assert.equal(Hours.getState(store({saturday:'24 hours'}),at('2026-10-31','11:00')).isOpen,true);
 assert.equal(Hours.getState(store({saturday:'08:00 - 21:00'}),at('2026-10-31','12:00')).isOpen,true);
 assert.equal(Hours.getState(store({saturday:'Closed'},'open'),at('2026-10-31','11:00')).isOpen,false);
});
test('manual closure or busy overrides schedule; Auto resumes immediately',()=>{
 const s=store({saturday:'8AM - 9PM'},'closed','manual');
 assert.equal(Hours.getState(s,at('2026-10-31','01:00')).isOpen,false);
 s.status='busy';
 assert.equal(Hours.getState(s,at('2026-10-31','01:00')).status,'busy');
 s.status_mode='auto';
 assert.equal(Hours.getState(s,at('2026-10-31','01:00')).status,'open');
});
test('old manual status retained when no usable weekly schedule',()=>{
 const s=store({},'busy');
 assert.equal(Hours.getState(s,at('2026-10-31','02:00')).status,'busy');
 const partial=store({monday:'9AM - 5PM'},'open');
 assert.equal(Hours.getState(partial,at('2026-10-31','02:00')).status,'closed');
});
test('invalid range does not accidentally show open',()=>{
 assert.equal(Hours.parseHours('25AM - 9PM'),null);
 assert.equal(Hours.parseHours('8AM - 9:72PM'),null);
 assert.equal(Hours.parseHours('8AM - 8AM'),null);
 assert.equal(Hours.getState(store({saturday:'bad',friday:'Closed'},'open'),at('2026-10-31','04:00')).isOpen,false);
});
test('frontend status displays and filters share central calculation',()=>{
 const map=fs.readFileSync(path.join(root,'js/map.js'),'utf8');
 const common=fs.readFileSync(path.join(root,'js/common.js'),'utf8');
 const dash=fs.readFileSync(path.join(root,'js/dashboard.js'),'utf8');
 const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const worker=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 const ai=fs.readFileSync(path.join(root,'netlify/functions/askVici.js'),'utf8');
 assert.match(map,/function getBusinessOpenState\(place\)\s*\{\s*return window\.ViciBusinessHours\.getState\(place\)/);
 assert.match(map,/setInterval\(refreshHoursIfVisible, 60000\)/);
 assert.match(common,/const currentStatus = window\.ViciBusinessHours\.getState\(place\)\.status/);
 assert.match(dash,/status_mode: autoMode \? 'auto' : 'manual'/);
 assert.match(dash,/data-val="auto"/);
 assert.match(dash,/setInterval\(refreshDashboardBusinessHours, 60000\)/);
 assert.match(index,/js\/business-hours\.js\?v=/);
 assert.match(worker,/js\/business-hours\.js\?v=/);
 assert.match(ai,/BusinessHours\.getState\(p\)\.status/);
});
