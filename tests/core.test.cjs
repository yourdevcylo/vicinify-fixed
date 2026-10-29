const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {transition}=require('../netlify/functions/lib/booking-policy');
test('customer cannot accept or alter payment state',()=>{
 for(const status of ['accepted','preparing','payment_confirmed','fulfilled'])
  assert.throws(()=>transition({status:'pending'},'customer',{status}),{status:409});
});
test('refund policy ignores caller value and fulfilled requires customer confirmation',()=>{
 assert.deepEqual(transition({status:'accepted',refundPercent:35},'customer',{status:'cancelled',refundPercent:100}),{status:'cancelled',refundPercent:100,refundStatus:'not_required'});
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
  else if(p.endsWith('.js')){
   if(p.includes(path.sep+'netlify'+path.sep+'edge-functions'+path.sep)){const result=require('node:child_process').spawnSync(process.execPath,['--input-type=module','--check'],{input:fs.readFileSync(p,'utf8'),encoding:'utf8'});assert.equal(result.status,0,p+' '+result.stderr);}
   else assert.doesNotThrow(()=>new vm.Script(fs.readFileSync(p,'utf8'),{filename:p}));
  }
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


test('manual app update clears only its own cache and worker after validating the downloaded build',async()=>{
 const html=fs.readFileSync(path.join(__dirname,'../update.html'),'utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
 for(const mode of ['ok','offline','wrong-build']){
  const removed=[],stopped=[],opened=[],handlers={},nodes={update:{addEventListener:(event,fn)=>handlers[event]=fn},status:{},build:{textContent:'BUILD_TEST'},site:{}};
  const ctx={URL,Date,Promise,Error,document:{getElementById:id=>nodes[id]},location:{href:'https://app.test/update.html',host:'app.test',replace:url=>opened.push(url)},navigator:{onLine:mode!=='offline',serviceWorker:{getRegistrations:async()=>[{scope:'https://app.test/',unregister:async()=>stopped.push('own')},{scope:'https://app.test/other/',unregister:async()=>stopped.push('other')}] }},window:{caches:true},caches:{keys:async()=>['vicinify-ui-old','unrelated-cache'],delete:async key=>removed.push(key)},fetch:async()=>({ok:true,text:async()=>mode==='wrong-build'?'DIFFERENT':'BUILD_TEST'})};
  vm.runInNewContext(script,ctx);await handlers.click();
  if(mode==='ok'){assert.deepEqual(stopped,['own']);assert.deepEqual(removed,['vicinify-ui-old']);assert.equal(opened.length,1);assert.match(opened[0],/^https:\/\/app.test\/index.html\?update=/);}
  else{assert.equal(stopped.length,0);assert.equal(removed.length,0);assert.equal(opened.length,0);}
 }
 assert(!/localStorage\.clear|indexedDB\.deleteDatabase|document\.cookie\s*=/.test(script));
});
