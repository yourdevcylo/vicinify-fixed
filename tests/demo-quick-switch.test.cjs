const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '../js/demo-switcher.js'), 'utf8');
function boot({query='',stored='',userEmail=''} = {}) {
  const storage = new Map(stored ? [['vicinify.capstone.defaultRole.v1',stored]] : []);
  const calls = [];
  const handlers = {};
  const loginButtons=Object.fromEntries(['standard','business','admin'].map(role=>[role,{
    attrs:{'data-demo-login-role':role},dataset:{demoLoginRole:role},disabled:false,
    getAttribute(key){return this.attrs[key]},setAttribute(key,value){this.attrs[key]=value},
    addEventListener(n,fn){if(n==='click')this.onClick=fn;}
  }]));
  const buttons = Object.fromEntries(['standard','business','admin'].map(role => [role,{
    attrs:{'data-demo-switch-role':role}, addEventListener(event,fn){ if(event==='click') this.onClick=fn; },
    getAttribute(key){return this.attrs[key];}, setAttribute(key,val){this.attrs[key]=val;},
    querySelector(selector){ return selector==='.demo-role-check' ? {textContent:''} : null; },
    dataset:{demoSwitchRole:role}
  }]));
  const elements = {
    demoQuickSwitch: { hidden:true },
    demoSwitchCurrent: { textContent:'' },
    demoSwitchTrigger: {attrs:{}, setAttribute(k,v){this.attrs[k]=v;}, addEventListener(n,f){handlers['trigger.'+n]=f;}},
    demoSwitchOptions: {hidden:true, querySelectorAll(){return Object.values(buttons);},contains(){return false;}},
    demoSignInHint: {hidden:true,textContent:''},
    demoLoginOptions:{hidden:true,querySelectorAll(){return Object.values(loginButtons);}},
    demoLoginBack:{hidden:true,textContent:'',addEventListener(n,fn){if(n==='click')this.onClick=fn;}},
    loginEmail: {value:''}
  };
  const classNames=new Set(['vicinify-ui','on-login']);
  const document = {readyState:'complete',body:{classList:{toggle(k,enabled){if(enabled)classNames.add(k);else classNames.delete(k);},contains(k){return classNames.has(k);}}},getElementById(k){return elements[k]||null;},querySelectorAll(){return [];},addEventListener(){}};
  const location = {search:query,href:'https://viciweb.netlify.app/'+query,pathname:'/',assign(v){calls.push(['navigate',v]);}};
  const window = {};
  const ctx={window,document,location,localStorage:{getItem(k){return storage.get(k)||null;},setItem(k,v){storage.set(k,v);}},URLSearchParams,URL,Object,console};
  vm.runInNewContext(source,ctx);
  const mockAuth = {currentUser:userEmail?{email:userEmail}:null,onAuthStateChanged(callback){callback(this.currentUser);this.fire=callback;}};
  const firebase={initializeApp(config,name){calls.push(['app',name||'[DEFAULT]']);return {name:name||'[DEFAULT]'};}};
  ctx.firebase=firebase;
  const app=window.VicinifyDemoSwitch.initializeFirebaseApp({});
  window.VicinifyDemoSwitch.init(mockAuth);
  return {app,calls,elements,mockAuth,storage,window,buttons,loginButtons,document};
}
test('normal non-demo visitors remain on the default Firebase app without demo controls',()=>{
  const r=boot({userEmail:'someone@example.com'});
  assert.equal(r.app.name,'[DEFAULT]');
  assert.equal(r.elements.demoQuickSwitch.hidden,true);
  assert.equal(r.storage.size,0);
});
test('initial demo login retains original default Firebase session as bootstrap role',()=>{
  const r=boot({userEmail:'detorresmarc08@gmail.com'});
  assert.equal(r.storage.get('vicinify.capstone.defaultRole.v1'),'business');
  assert.equal(r.elements.demoQuickSwitch.hidden,false);
  assert.equal(r.elements.demoSwitchCurrent.textContent,'Business User');
});
test('standard user role uses independent named app when business session is bootstrap',()=>{
  const r=boot({query:'?demoRole=standard',stored:'business'});
  assert.equal(r.app.name,'vicinify-capstone-standard');
  assert.equal(r.elements.demoQuickSwitch.hidden,false);
  assert.equal(r.document.body.classList.contains('demo-switch-visible'),true);
  assert.equal(r.elements.demoSwitchCurrent.textContent,'Standard User · Sign in');
  assert.equal(r.elements.loginEmail.value,'projectfreedom12110@gmail.com');
});
test('admin role uses independent named app and prefilled email, with no password cached',()=>{
  const r=boot({query:'?demoRole=admin',stored:'business'});
  assert.equal(r.app.name,'vicinify-capstone-admin');
  assert.equal(r.elements.loginEmail.value,'yourdevcylo@gmail.com');
  assert.equal(r.elements.demoSignInHint.hidden,false);
  assert.equal([...r.storage.keys()].length,1);
});
test('returning to bootstrap role uses existing default Firebase auth persistence',()=>{
  const r=boot({query:'?demoRole=business',stored:'business',userEmail:'detorresmarc08@gmail.com'});
  assert.equal(r.app.name,'[DEFAULT]');
  assert.equal(r.elements.demoQuickSwitch.hidden,false);
});
test('authenticated demo user can recover via dropdown even when wrong slot is selected',()=>{
  const r=boot({query:'?demoRole=admin',stored:'business',userEmail:'detorresmarc08@gmail.com'});
  assert.equal(r.elements.demoQuickSwitch.hidden,false);
  assert.match(r.elements.demoSignInHint.textContent,/different account/);
  r.buttons.business.onClick();
  assert.ok(r.calls.some(c=>c[0]==='navigate'&&c[1]==='/?demoRole=business'));
});

test('authenticated demo user switches to a different actual Firebase role session by URL',()=>{
  const r=boot({userEmail:'detorresmarc08@gmail.com'});
  r.buttons.admin.onClick();
  assert.ok(r.calls.some(c=>c[0]==='navigate'&&c[1]==='/?demoRole=admin'));
});
test('regular non-demo user cannot trigger demo session switch',()=>{
  const r=boot({userEmail:'unknown@example.com'});
  r.buttons.admin.onClick();
  assert.ok(!r.calls.some(c=>c[0]==='navigate'));
});

test('first-time login to selected role shows simple role chooser and return button',()=>{
  const r=boot({query:'?demoRole=admin',stored:'business'});
  assert.equal(r.elements.demoLoginOptions.hidden,false);
  assert.match(r.elements.demoSignInHint.textContent,/Admin User selected/);
  assert.equal(r.elements.demoLoginBack.hidden,false);
  assert.match(r.elements.demoLoginBack.textContent,/Business User/);
  assert.equal(r.loginButtons.admin.disabled,true);
  r.elements.demoLoginBack.onClick();
  assert.ok(r.calls.some(c=>c[0]==='navigate'&&c[1]==='/?demoRole=business'));
});
test('first-time login lets users pick other demo role without being authenticated in target slot',()=>{
  const r=boot({query:'?demoRole=admin',stored:'business'});
  r.loginButtons.standard.onClick();
  assert.ok(r.calls.some(c=>c[0]==='navigate'&&c[1]==='/?demoRole=standard'));
});
test('regular login has no demo setup navigation',()=>{
  const r=boot();
  assert.equal(r.elements.demoLoginOptions.hidden,true);
  assert.equal(r.elements.demoLoginBack.hidden,true);
  assert.equal(r.elements.demoSignInHint.hidden,true);
});
test('switching stores previous role for one-tap return without saving credentials',()=>{
  const r=boot({userEmail:'projectfreedom12110@gmail.com'});
  r.buttons.admin.onClick();
  assert.equal(r.storage.get('vicinify.capstone.previousRole.v1'),'standard');
  assert.equal(r.storage.get('vicinify.capstone.defaultRole.v1'),'standard');
  assert.ok(![...r.storage.keys()].some(k=>/password|token/i.test(k)));
});

test('logged-out demo target can use top dropdown to return to an authenticated slot',()=>{
  const r=boot({query:'?demoRole=admin',stored:'business'});
  assert.equal(r.elements.demoQuickSwitch.hidden,false);
  r.buttons.business.onClick();
  assert.ok(r.calls.some(c=>c[0]==='navigate'&&c[1]==='/?demoRole=business'));
});
test('signing out one demo slot does not reveal a non-demo visitor controls',()=>{
  const r=boot({query:'?demoRole=standard',stored:'business',userEmail:'outside@example.com'});
  assert.equal(r.elements.demoQuickSwitch.hidden,true);
  assert.equal(r.document.body.classList.contains('demo-switch-visible'),false);
  r.buttons.admin.onClick();
  assert.equal(r.calls.filter(c=>c[0]==='navigate').length,0);
});
test('top header remains visible on demo first-sign-in screens only',()=>{
  const css=fs.readFileSync(require('node:path').join(__dirname,'../css/demo-switcher.css'),'utf8');
  assert.match(css,/on-login\.demo-switch-visible #main-content \.workspace-header/);
  assert.match(css,/display:flex !important/);
  const nonDemo=boot();
  assert.equal(nonDemo.document.body.classList.contains('demo-switch-visible'),false);
});
test('switcher stays visible through a demo session auth loading and sign-out transition',()=>{
  const r=boot({query:'?demoRole=admin',stored:'business',userEmail:'yourdevcylo@gmail.com'});
  assert.equal(r.elements.demoQuickSwitch.hidden,false);
  r.mockAuth.currentUser=null;
  r.mockAuth.fire(null);
  assert.equal(r.elements.demoQuickSwitch.hidden,false);
  assert.equal(r.document.body.classList.contains('demo-switch-visible'),true);
  assert.equal(r.elements.demoSwitchCurrent.textContent,'Admin User · Sign in');
});
test('switcher never grants administrator permission or stores credentials',()=>{
  assert.doesNotMatch(source,/setCustomUserClaims|\.update\(\{\s*role\s*:/);
  const r=boot({query:'?demoRole=admin',stored:'standard'});
  assert.equal(r.app.name,'vicinify-capstone-admin');
  assert.equal(r.elements.demoQuickSwitch.hidden,false);
  assert.equal(r.mockAuth.currentUser,null);
  assert.equal(r.storage.get('vicinify.capstone.defaultRole.v1'),'standard');
});
