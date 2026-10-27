const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {transition}=require('../netlify/functions/lib/booking-policy');
test('customer cannot accept or alter payment state',()=>{
 for(const status of ['accepted','preparing','payment_confirmed','fulfilled'])
  assert.throws(()=>transition({status:'pending'},'customer',{status}),{status:409});
});
test('refund policy ignores caller value and fulfilled requires customer confirmation',()=>{
 assert.deepEqual(transition({status:'accepted',refundPercent:35},'customer',{status:'cancelled',refundPercent:100}),{status:'cancelled',refundPercent:35});
 assert.deepEqual(transition({status:'fulfilled'},'customer',{status:'received'}),{status:'received',customer_confirmed:true});
 assert.throws(()=>transition({status:'pending'},'customer',{status:'received'}));
 assert.equal(transition({status:'received'},'customer',{status:'received'}),null);
});
test('owner transitions are constrained',()=>{
 assert.deepEqual(transition({status:'pending'},'owner',{status:'accepted'}),{status:'accepted'});
 assert.throws(()=>transition({status:'received'},'owner',{status:'pending'}));
});
test('all shipped JavaScript parses',()=>{
 function visit(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  if(['node_modules','.git'].includes(entry.name))continue;
  const p=path.join(dir,entry.name);if(entry.isDirectory())visit(p);
  else if(p.endsWith('.js'))assert.doesNotThrow(()=>new vm.Script(fs.readFileSync(p,'utf8'),{filename:p}));
 }}visit(path.resolve(__dirname,'..'));
});
test('API and payment responses never enter service worker cache',()=>{
 let listener;const context={self:{location:{origin:'https://test.invalid'},addEventListener:(type,fn)=>{if(type==='fetch')listener=fn;}},URL};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8'),context);
 for(const name of ['catalog','proof','booking']) {
  let intercepted=false;
  listener({request:{method:'GET',url:'https://test.invalid/.netlify/functions/'+name},respondWith:()=>{intercepted=true;}});
  assert.equal(intercepted,false);
 }
});
test('shared subscription detaches only when last consumer leaves',async()=>{
 const {JSDOM}=require('jsdom');const dom=new JSDOM('<body></body>',{runScripts:'outside-only'});
 const win=dom.window;win.eval(fs.readFileSync(path.join(__dirname,'../js/data.js'),'utf8'));
 let starts=0,stops=0,notify;const q={onSnapshot(fn){starts++;notify=fn;return()=>stops++;}};
 const a=[],b=[];const ua=win.ViciData.listen('a',q,s=>a.push(s));
 notify(7);const ub=win.ViciData.listen('a',q,s=>b.push(s));await Promise.resolve();
 assert.equal(starts,1);assert.deepEqual(a,[7]);assert.deepEqual(b,[7]);
 ua();assert.equal(stops,0);ub();assert.equal(stops,1);dom.window.close();
});

