const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../js/demo-switcher.js'), 'utf8');
const markup = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const style = fs.readFileSync(path.join(__dirname, '../css/demo-switcher.css'), 'utf8');
function boot({query='',stored='',userEmail='', loginEmail='', browserUrl='https://vici.example/'}={}) {
  const storage=new Map(stored ? [['vicinify.capstone.defaultRole.v1',stored]] : []);
  const calls=[]; const handlers={};
  const buttons=Object.fromEntries(['standard','business','admin'].map(role=>[role,{
    dataset:{demoSwitchRole:role},attrs:{},indicator:{textContent:''},
    setAttribute(k,v){this.attrs[k]=v;},querySelector(k){return k==='.demo-dev-role-indicator'?this.indicator:null;},
    addEventListener(k,cb){handlers[role+'.'+k]=cb;},focus(){activeElement=this;}
  }]));
  let activeElement={isConnected:true,focus(){activeElement=this;}};
  const dialog={isConnected:true,focus(){activeElement=this;},querySelectorAll(k){return k==='button:not([disabled])'?[...Object.values(buttons),closeBtn]:[];}};
  const overlay={hidden:true,attrs:{'aria-hidden':'true'},
    setAttribute(k,v){this.attrs[k]=v;},querySelector(k){return k==='.demo-dev-dialog'?dialog:null;},
    querySelectorAll(k){return k==='[data-demo-switch-role]'?Object.values(buttons):k==='[data-demo-close]'?[backdrop]:[];}};
  const closeBtn={isConnected:true,addEventListener(k,cb){handlers['close.'+k]=cb;},focus(){activeElement=this;}};
  const backdrop={addEventListener(k,cb){handlers['backdrop.'+k]=cb;}};
  const status={textContent:''};
  const emailInput={value:loginEmail};
  const document={readyState:'complete',
    get activeElement(){return activeElement;},getElementById(k){return ({demoDevOverlay:overlay,demoDevClose:closeBtn,demoDevStatus:status,loginEmail:emailInput})[k] || null;},
    addEventListener(k,cb){handlers['document.'+k]=cb;}}
  const location={search:query,href:new URL(query,browserUrl).href,pathname:'/',assign(url){calls.push(['navigate',url]);}};
  const ctx={document,location,localStorage:{getItem(k){return storage.get(k)||null;},setItem(k,v){storage.set(k,v);}},window:{},URL,URLSearchParams,Object,console};
  vm.runInNewContext(source,ctx);
  const auth={currentUser:userEmail?{email:userEmail}:null,onAuthStateChanged(cb){cb(this.currentUser);this.fire=cb;}};
  ctx.firebase={initializeApp(_config,name){calls.push(['app',name||'[DEFAULT]']);return {name:name||'[DEFAULT]'};}};
  const app=ctx.window.VicinifyDemoSwitch.initializeFirebaseApp({});
  ctx.window.VicinifyDemoSwitch.init(auth);
  function key({ctrlKey=false,altKey=false,metaKey=false,shiftKey=false,code='',key='' }={}) {
    const event={ctrlKey,altKey,metaKey,shiftKey,code,key,defaultPrevented:false,
      preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.stopped=true;}};
    handlers['document.keydown'](event);return event;
  }
  const hotkey=()=>key({ctrlKey:true,altKey:true,code:'KeyD',key:'d'});
  return {app,calls,buttons,overlay,handlers,auth,status,emailInput,storage,document,hotkey,key,closeBtn};
}
test('no visible DEMO dropdown in the header or sign-in screen',()=>{
  assert.doesNotMatch(markup,/id="demoQuickSwitch"|id="demoSwitchTrigger"|id="demoLoginOptions"|id="demoSignInHint"/);
  assert.match(markup,/<button type="button" class="account-button"/);
  assert.match(markup,/id="demoDevOverlay"[^>]*hidden/);
  assert.match(style,/\.demo-dev-overlay\[hidden\]\s*\{\s*display:none !important/);
});
test('normal visitor cannot open the console or navigate using the shortcut',()=>{
  const r=boot({userEmail:'non-demo@example.com'});
  assert.equal(r.app.name,'[DEFAULT]');
  assert.equal(r.hotkey().defaultPrevented,false);
  assert.equal(r.overlay.hidden,true);
  r.handlers['admin.click']();
  assert.equal(r.calls.filter(x=>x[0]==='navigate').length,0);
});
test('Standard demo account opens console with Ctrl+Alt+D and sees current role',()=>{
  const r=boot({userEmail:'PROJECTFREEDOM12110@GMAIL.COM'});
  assert.equal(r.hotkey().defaultPrevented,true);
  assert.equal(r.overlay.hidden,false);
  assert.equal(r.overlay.attrs['aria-hidden'],'false');
  assert.equal(r.buttons.standard.attrs['aria-current'],'true');
  assert.equal(r.buttons.business.attrs['aria-current'],'false');
  assert.equal(r.storage.get('vicinify.capstone.defaultRole.v1'),'standard');
});
test('Business demo account can switch to Admin via real auth session navigation',()=>{
  const r=boot({userEmail:'detorresmarc08@gmail.com'});
  r.hotkey();r.handlers['admin.click']();
  assert.deepEqual(r.calls.filter(x=>x[0]==='navigate'),[['navigate','/?demoRole=admin']]);
  assert.equal(r.overlay.hidden,true);
  assert.equal(r.storage.get('vicinify.capstone.previousRole.v1'),'business');
});
test('Admin demo account can switch back to Standard',()=>{
  const r=boot({query:'?demoRole=admin',stored:'business',userEmail:'yourdevcylo@gmail.com'});
  assert.equal(r.app.name,'vicinify-capstone-admin');
  r.hotkey();r.handlers['standard.click']();
  assert.equal(r.calls.at(-1)[1],'/?demoRole=standard');
});
test('login screen can open console after a demo session has been bootstrapped',()=>{
  const r=boot({query:'?demoRole=standard',stored:'business'});
  assert.equal(r.app.name,'vicinify-capstone-standard');
  assert.equal(r.emailInput.value,'projectfreedom12110@gmail.com');
  r.hotkey();
  assert.equal(r.overlay.hidden,false);
  assert.match(r.status.textContent,/Sign in/);
  r.handlers['business.click']();
  assert.equal(r.calls.at(-1)[1],'/?demoRole=business');
});
test('console can be closed by escape, second hotkey, backdrop or X',()=>{
  const r=boot({userEmail:'yourdevcylo@gmail.com'});
  r.hotkey();r.key({key:'Escape'});assert.equal(r.overlay.hidden,true);
  r.hotkey();r.hotkey();assert.equal(r.overlay.hidden,true);
  r.hotkey();r.handlers['backdrop.click']();assert.equal(r.overlay.hidden,true);
  r.hotkey();r.handlers['close.click']();assert.equal(r.overlay.hidden,true);
});
test('unbootstrapped signed-out visitors cannot reveal demo panel',()=>{
  const r=boot();r.hotkey();assert.equal(r.overlay.hidden,true);
});
test('non-demo authenticated user cannot use a locally bootstrapped demo slot',()=>{
  const r=boot({query:'?demoRole=standard',stored:'business',userEmail:'outsider@example.com'});
  r.hotkey();assert.equal(r.overlay.hidden,true);
});
test('non-shortcut or modified shortcuts do not open console',()=>{
  const r=boot({userEmail:'yourdevcylo@gmail.com'});
  r.key({ctrlKey:true,code:'KeyD',key:'d'});
  r.key({ctrlKey:true,altKey:true,shiftKey:true,code:'KeyD',key:'D'});
  r.key({ctrlKey:true,altKey:true,code:'KeyE',key:'e'});
  assert.equal(r.overlay.hidden,true);
});
test('the console remains hidden after an authenticated demo user changes to non-demo user',()=>{
  const r=boot({userEmail:'yourdevcylo@gmail.com'});
  r.hotkey();assert.equal(r.overlay.hidden,false);
  r.auth.currentUser={email:'non-demo@example.com'};r.auth.fire(r.auth.currentUser);
  assert.equal(r.overlay.hidden,true);
});
test('session isolation remains on three independent firebase apps',()=>{
  const r=boot({query:'?demoRole=admin',stored:'standard',userEmail:'yourdevcylo@gmail.com'});
  assert.equal(r.app.name,'vicinify-capstone-admin');
  assert.equal(r.storage.get('vicinify.capstone.defaultRole.v1'),'standard');
  assert.ok(![...r.storage.keys()].some(k=>/token|password|secret/i.test(k)));
  assert.doesNotMatch(source,/setCustomUserClaims|update\(\s*\{\s*role\s*:/);
});
test('URL query and hash remain intact when switching',()=>{
  const r=boot({query:'?demoRole=business&view=map#foo',stored:'business',userEmail:'detorresmarc08@gmail.com'});
  r.hotkey();r.handlers['admin.click']();
  assert.equal(r.calls.at(-1)[1],'/?demoRole=admin&view=map#foo');
});
