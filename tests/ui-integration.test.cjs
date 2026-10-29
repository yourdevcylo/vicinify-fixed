const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

async function loginDOM() {
 const html=read('index.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'');
 const dom=new JSDOM(html,{runScripts:'outside-only'}),w=dom.window;
 w.AppState={};w.debouncedIcons=()=>{};
 const common=read('js/common.js');
 w.eval(common.slice(common.indexOf('function initLogin() {'),common.indexOf('\nwindow.resendVerificationEmail'))+'\ninitLogin();');
 w.eval(read('js/ui.js'));
 await new Promise(resolve=>w.document.addEventListener('DOMContentLoaded',resolve,{once:true}));
 return dom;
}

test('login keyboard tabs change the actual auth mode, ARIA selection and terms gate',async()=>{
 const dom=await loginDOM(),w=dom.window,d=w.document;
 try {
  const signIn=d.getElementById('authTabSignIn'),signUp=d.getElementById('authTabSignUp');
  signIn.focus();signIn.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
  assert.equal(d.activeElement,signUp);
  assert.equal(signUp.getAttribute('aria-selected'),'true');
  assert.equal(signIn.getAttribute('aria-selected'),'false');
  assert.equal(signUp.tabIndex,0);assert.equal(signIn.tabIndex,-1);
  assert.equal(d.getElementById('authForm').getAttribute('aria-labelledby'),signUp.id);
  assert.equal(d.getElementById('loginBtn').textContent,'Create Account');
  assert.equal(d.getElementById('loginBtn').disabled,true);
  const terms=d.getElementById('agreeTerms');terms.checked=true;terms.dispatchEvent(new w.Event('change'));
  assert.equal(d.getElementById('loginBtn').disabled,false);
  signUp.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Home',bubbles:true}));
  assert.equal(d.activeElement,signIn);assert.equal(signIn.getAttribute('aria-selected'),'true');
  assert.equal(d.getElementById('loginBtn').textContent,'Sign in');
  signIn.dispatchEvent(new w.KeyboardEvent('keydown',{key:'End',bubbles:true}));
  assert.equal(d.activeElement,signUp);
  signUp.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));
  assert.equal(d.activeElement,signIn);
 } finally {await new Promise(resolve=>dom.window.setTimeout(resolve,0));dom.window.close();}
});

test('footer and programmatic auth changes keep tab selection synchronized',async()=>{
 const dom=await loginDOM(),d=dom.window.document;
 try {
  d.getElementById('toggleAuthBtn').click();
  assert.equal(d.getElementById('authTabSignUp').getAttribute('aria-selected'),'true');
  d.getElementById('authTabSignUp').classList.remove('active');
  d.getElementById('authTabSignIn').classList.add('active');
  await new Promise(resolve=>dom.window.queueMicrotask(resolve));
  assert.equal(d.getElementById('authTabSignIn').getAttribute('aria-selected'),'true');
  assert.equal(d.getElementById('authForm').getAttribute('aria-labelledby'),'authTabSignIn');
 } finally {await new Promise(resolve=>dom.window.setTimeout(resolve,0));dom.window.close();}
});

test('fresh service-worker install serves the versioned local UI assets offline',async()=>{
 const origin='https://vicinify.test/';const listeners={},saved=new Map();
 const url=request=>new URL(typeof request==='string'?request:request.url,origin).href;
 const cache={addAll:async names=>{for(const name of names){const target=new URL(name,origin);const file=target.pathname==='/'?'index.html':target.pathname.slice(1);saved.set(url(name),read(file));}},put:async()=>{}};
 vm.runInNewContext(read('sw.js'),{
  self:{location:{origin:new URL(origin).origin},addEventListener:(name,fn)=>listeners[name]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}},
  caches:{open:async()=>cache,match:async request=>saved.has(url(request))?new Response(saved.get(url(request))):undefined},
  fetch:async()=>{throw Error('offline');},URL,Response
 });
 let installed;listeners.install({waitUntil:promise=>installed=promise});await installed;
 const html=new JSDOM(read('index.html'),{url:origin});
 try {
  for(const element of html.window.document.querySelectorAll('link[rel="stylesheet"][href],script[src]')) {
   const target=new URL(element.getAttribute('href')||element.getAttribute('src'),origin);
   if(target.origin!==new URL(origin).origin)continue;
   assert.ok(saved.has(target.href),'Not precached with its version query: '+target.href);
  }
 } finally {html.window.close();}
 for(const asset of [...read('index.html').matchAll(/(?:src|href)="((?:css|js)\/[^"]+)"/g)].map(match=>match[1])){
  let pending;listeners.fetch({request:{method:'GET',url:new URL(asset,origin).href,destination:asset.startsWith('css/')?'style':'script',mode:'same-origin'},respondWith:promise=>pending=promise});
  const response=await pending;assert.equal(response.status,200);assert.equal(await response.text(),read(asset.split('?')[0]));
 }
});

function discoveryDOM() {
 const html=read('index.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'');
 const dom=new JSDOM(html,{runScripts:'outside-only'}),w=dom.window;
 w.AppState={radius:300,mapFilters:{}};w.refreshPlaces=()=>{};w.debouncedIcons=()=>{};
 return dom;
}

test('changing radius preserves List selection and Map can be selected again',()=>{
 const dom=discoveryDOM(),w=dom.window,d=w.document;
 try {
  const map=read('js/map.js');
  w.eval(map.slice(map.indexOf('function initRadius() {'),map.indexOf('    function initCats()'))+'\ninitRadius();');
  const script=[...read('index.html').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('window.toggleView = function(view)'));
  w.eval(script);w.toggleView('list');
  d.querySelector('[data-radius="5000"]').click();
  assert.equal(w.AppState.radius,5000);
  assert.equal(d.getElementById('page-map').dataset.view,'list');
  assert.equal(d.getElementById('btnListView').getAttribute('aria-pressed'),'true');
  assert.equal(d.getElementById('map').hidden,true);
  assert.equal(d.getElementById('listViewContainer').hidden,false);
  w.toggleView('map');
  assert.equal(d.getElementById('btnMapView').getAttribute('aria-pressed'),'true');
  assert.equal(d.getElementById('btnListView').getAttribute('aria-pressed'),'false');
  assert.equal(d.getElementById('map').hidden,false);
  assert.equal(d.getElementById('listViewContainer').hidden,true);
 } finally {dom.window.close();}
});

test('More filters communicates expansion and preserves selected advanced filters when collapsed',()=>{
 const dom=discoveryDOM(),w=dom.window,d=w.document;
 try {
  const map=read('js/map.js');
  w.eval(map.slice(map.indexOf('function initSmartFilters() {'),map.indexOf('    // ---- Base map:'))+'\ninitSmartFilters();\ninitSmartFilters();');
  const toggle=d.getElementById('mapFilterToggle'),row=d.getElementById('mapSmartFilters');
  assert.equal(d.querySelectorAll('.map-smart-filter').length,6);
  assert.equal(toggle.querySelector('span').textContent,'More filters');
  assert.equal(toggle.getAttribute('aria-expanded'),'false');
  assert.equal(toggle.getAttribute('aria-controls'),row.id);
  toggle.click();
  assert.equal(toggle.querySelector('span').textContent,'Show less');
  assert.equal(toggle.getAttribute('aria-expanded'),'true');
  assert.equal(row.classList.contains('open'),true);
  d.querySelector('[data-filter="delivery"]').click();toggle.click();
  assert.equal(row.classList.contains('open'),false);
  assert.equal(toggle.querySelector('span').textContent,'More filters');
  assert.equal(w.AppState.mapFilters.delivery,true);
  assert.equal(d.getElementById('mapFilterCount').textContent,'1');
  assert.equal(d.getElementById('mapFilterCount').classList.contains('hidden'),false);
 } finally {dom.window.close();}
});

test('post form keeps types accessible and Publish follows text, photo, and reopen state',()=>{
 const dom=discoveryDOM(),w=dom.window,d=w.document;
 try {
  w.getCurrentUser=()=>({uid:'preview-user'});w.fetchUserEstablishments=()=>{};
  w.URL.createObjectURL=()=> 'blob:preview-photo';
  const buzz=read('js/buzz.js');
  w.eval('let selectedMediaFile=null,isBusinessPost=false;\n'+buzz.slice(buzz.indexOf('function buildModernModal() {'),buzz.indexOf('    function initModal()'))+'\nbuildModernModal();\n'+buzz.slice(buzz.indexOf('function openModal() {'),buzz.indexOf('    function closeModal()')));
  const publish=d.getElementById('publishPostBtn'),body=d.getElementById('postBody');
  assert.equal(publish.disabled,true);
  body.value='   ';body.dispatchEvent(new w.Event('input'));assert.equal(publish.disabled,true);
  body.value='Local update';body.dispatchEvent(new w.Event('input'));assert.equal(publish.disabled,false);
  assert.equal(d.getElementById('charCount').textContent,'12/500');
  d.querySelector('#postModal [data-val="announcement"]').click();
  assert.equal(d.querySelectorAll('#postModal .type-chip[aria-pressed="true"]').length,1);
  assert.equal(d.querySelector('#postModal [data-val="announcement"]').getAttribute('aria-pressed'),'true');
  assert.equal(d.querySelector('label[for="postBody"]').textContent,'Post details');
  assert.equal(body.getAttribute('aria-describedby'),'charCount');
  w.openModal();assert.equal(body.value,'');assert.equal(publish.disabled,true);
  assert.equal(d.getElementById('postModal').getAttribute('aria-hidden'),'false');
  const input=d.getElementById('postMedia');Object.defineProperty(input,'files',{value:[new w.File(['photo'],'photo.png',{type:'image/png'})],configurable:true});
  input.dispatchEvent(new w.Event('change'));assert.equal(publish.disabled,false);
  assert.equal(d.getElementById('mediaPreviewWrap').style.display,'block');
  d.getElementById('removeMediaBtn').click();assert.equal(publish.disabled,true);
  assert.equal(d.getElementById('mediaPreviewWrap').style.display,'none');
  d.getElementById('toggleBizPostBtn').click();assert.equal(d.getElementById('toggleBizPostBtn').getAttribute('aria-pressed'),'true');
  w.openModal();assert.equal(d.getElementById('toggleBizPostBtn').getAttribute('aria-pressed'),'false');
 } finally {dom.window.close();}
});

test('destructive confirmation exposes danger styling and cancellation keeps its behavior',async()=>{
 const dom=discoveryDOM(),w=dom.window,d=w.document;
 try {
  const locks=[];w.lockBodyScroll=locked=>locks.push(locked);
  const common=read('js/common.js'),start=common.indexOf('window.vConfirm = function(');
  w.eval(common.slice(start,common.indexOf('\n};',start)+3));
  const result=w.vConfirm('Delete <sample>?','Confirm only in the test.','Delete',true);
  const confirm=d.querySelector('[id^="confirmBtn_"]');
  assert.equal(confirm.dataset.danger,'true');assert.equal(confirm.textContent,'Delete');
  assert.equal(d.querySelector('[data-vconfirm-title]').textContent,'Delete <sample>?');
  d.querySelector('[id^="cancelBtn_"]').click();assert.equal(await result,false);
  assert.deepEqual(locks,[true,false]);assert.equal(d.querySelector('[id^="confirmBtn_"]'),null);
 } finally {dom.window.close();}
});

test('navigation highlights only the current page, clearing stale selections',()=>{
 const dom=discoveryDOM(),w=dom.window,d=w.document;
 try {
  d.querySelectorAll('.page').forEach(e=>e.classList.toggle('active',e.id==='page-map'));
  d.querySelectorAll('.bottom-nav .nav-item').forEach(e=>e.classList.add('active'));
  w.eval(read('js/ui.js'));w.AppShell.sync();
  assert.equal(d.querySelectorAll('.bottom-nav .nav-item.active').length,1);
  assert.equal(d.querySelector('.bottom-nav .nav-item.active').dataset.goto,'page-map');
  assert.equal(d.querySelectorAll('.bottom-nav [aria-current="page"]').length,1);
  d.getElementById('page-map').classList.remove('active');d.getElementById('page-add').classList.add('active');w.AppShell.sync();
  assert.equal(d.querySelectorAll('.bottom-nav .nav-item.active').length,1);
  assert.equal(d.querySelector('.bottom-nav .nav-item.active').dataset.goto,'page-add');
 } finally {dom.window.close();}
});

test('returning from establishment preserves the selected List or Map discovery view',()=>{
 const dom=new JSDOM('<main id="page-map" class="page"></main><main id="page-place" class="page"></main>',{runScripts:'outside-only'}),w=dom.window;
 try {
  w.AppState={activePage:'page-map'};w.applyViciPageScrollState=()=>{};w.resetViciPageScroll=()=>{};w.requestAnimationFrame=()=>{};w.setTimeout=()=>{};
  const page=w.document.getElementById('page-map');
  w.toggleView=view=>{page.dataset.view=view;};
  const code=read('js/common.js');w.eval(code.slice(code.indexOf('function showPage(pageId)'),code.indexOf('function initNav()')));
  for(const view of ['list','map']) {page.dataset.view=view;w.showPage('page-place');w.showPage('page-map');assert.equal(page.dataset.view,view);assert.equal(w.AppState.activePage,'page-map');}
 } finally {dom.window.close();}
});

function languageDOM(content){
 const dom=new JSDOM(content||read('index.html').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,''),{url:'https://vicinify.test/',runScripts:'outside-only'}),w=dom.window;
 const source=read('js/common.js');w.eval(source.slice(source.indexOf('window.LangManager ='),source.indexOf('// Patakbuhin agad')));
 return dom;
}
test('English/Tagalog switches preserve icons, input values and user-authored content',()=>{
 const dom=languageDOM('<button id="control" aria-label="Send request"><svg></svg>Send request</button><input id="field" placeholder="Search places..." value="My business"><p id="label">Pending Approvals</p><p class="buzz-feed-body">Settings</p><h2 id="listPreviewTitle">Delivery</h2><p class="chat-message-text">Send request</p><span data-no-translate>Admin Hub</span><select><option value="pending">Pending</option></select>'),w=dom.window,d=w.document;
 try{w.LangManager.setLanguage('ph');assert.match(d.querySelector('#control').textContent,/Ipadala ang kahilingan/);assert(d.querySelector('#control svg'));assert.equal(d.querySelector('#control').getAttribute('aria-label'),'Ipadala ang kahilingan');assert.equal(d.querySelector('#field').placeholder,'Maghanap ng lugar...');assert.equal(d.querySelector('#field').value,'My business');assert.equal(d.querySelector('.buzz-feed-body').textContent,'Settings');assert.equal(d.querySelector('#listPreviewTitle').textContent,'Delivery');assert.equal(d.querySelector('.chat-message-text').textContent,'Send request');assert.equal(d.querySelector('option').value,'pending');assert.equal(d.querySelector('option').textContent,'Naghihintay');assert.equal(d.documentElement.lang,'tl');w.LangManager.setLanguage('en');assert.equal(d.querySelector('#control').textContent,'Send request');assert.equal(d.querySelector('#field').placeholder,'Search places...');assert.equal(d.querySelector('#label').textContent,'Pending Approvals');assert(d.querySelector('#control svg'));}finally{w.close();}
});
test('new and edited dynamic labels translate in place without moving focus',async()=>{
 const dom=languageDOM('<input id="focus"><div id="items"></div>'),w=dom.window,d=w.document;
 try{w.LangManager.init();await new Promise(resolve=>w.setTimeout(resolve,0));w.LangManager.setLanguage('ph');d.querySelector('#focus').focus();const button=d.createElement('button');button.textContent='Approve';d.querySelector('#items').append(button);await new Promise(resolve=>w.setTimeout(resolve,90));assert.equal(button.textContent,'Aprubahan');button.firstChild.data='Reject';await new Promise(resolve=>w.setTimeout(resolve,90));assert.equal(button.textContent,'Tanggihan');assert.equal(d.activeElement.id,'focus');w.LangManager.setLanguage('en');assert.equal(button.textContent,'Reject');}finally{w.close();}
});
test('admin, owner and customer shell titles stay role-correct in both languages',async()=>{
 const dom=languageDOM(),w=dom.window,d=w.document;
 try{w.AppState={userProfile:{role:'admin',fullName:'Settings'}};w.eval(read('js/ui.js'));d.querySelectorAll('.page').forEach(e=>e.classList.toggle('active',e.id==='page-dashboard'));for(const [role,title,tagalog] of [['admin','Admin Hub','Sentro ng Tagapangasiwa'],['business','Business Hub','Sentro ng Negosyo'],['user','My Activity','Aking Gawain']]){w.AppState.userProfile.role=role;w.LangManager.setLanguage('en');w.AppShell.sync();assert.equal(d.querySelector('#workspaceTitle').textContent,title);w.LangManager.setLanguage('ph');w.AppShell.sync();w.LangManager.translateDOM();assert.equal(d.querySelector('#workspaceTitle').textContent,tagalog);assert.equal(d.querySelector('#accountName').textContent,'Settings');} }finally{w.close();}
});

test('translated photo picker preserves the native file and filename without changing uploaded content',()=>{
 const dom=languageDOM('<input id="photo" type="file" accept="image/*">'),w=dom.window,d=w.document;
 try{w.LangManager.setLanguage('ph');const ui=read('js/ui.js');w.eval(ui.slice(ui.indexOf('// Localized photo picker:')));w.ViciPhotoPicker.enhance();assert.equal(d.querySelectorAll('.vici-photo-picker').length,1);const input=d.querySelector('#photo');assert.equal(input.accept,'image/*');assert.equal(d.querySelector('button').textContent,'Pumili ng larawan');assert.equal(d.querySelector('.vici-photo-selection').textContent,'Walang napiling larawan');const file=new w.File(['actual image bytes'],'Settings.jpg',{type:'image/jpeg'});Object.defineProperty(input,'files',{value:[file],configurable:true});input.dispatchEvent(new w.Event('change',{bubbles:true}));w.LangManager.translateDOM();assert.equal(input.files[0],file);assert.equal(d.querySelector('.vici-photo-selection').textContent,'Settings.jpg');w.LangManager.setLanguage('en');assert.equal(d.querySelector('button').textContent,'Choose photo');assert.equal(d.querySelector('.vici-photo-selection').textContent,'Settings.jpg');w.ViciPhotoPicker.enhance();assert.equal(d.querySelectorAll('.vici-photo-picker').length,1);}finally{w.close();}
});
test('Tagalog selection still works when browser storage is unavailable',()=>{
 const dom=languageDOM('<button>Admin Hub</button><textarea placeholder="Write a comment..."></textarea>'),w=dom.window,d=w.document;
 try{Object.defineProperty(w,'localStorage',{get(){throw new Error('Blocked storage')}});w.LangManager.setLanguage('ph');assert.equal(w.LangManager.getLanguage(),'ph');assert.equal(d.querySelector('button').textContent,'Sentro ng Tagapangasiwa');assert.equal(d.querySelector('textarea').placeholder,'Sumulat ng komento...');w.LangManager.setLanguage('en');assert.equal(d.querySelector('button').textContent,'Admin Hub');}finally{w.close();}
});

function feedbackRuntime(){
 const dom=new JSDOM('<body></body>',{runScripts:'outside-only'}),w=dom.window,calls=[],alerts=[];
 w.auth={currentUser:{uid:'customer'}};w.AppState={userProfile:{fullName:'Customer'}};w.lockBodyScroll=()=>{};w.alert=text=>alerts.push(text);
 w.getRequestMeta=()=>({key:'pickup_preorder',shortLabel:'Pickup Pre-order'});w.getPlaceDisplayName=async()=> 'Real Shop';w.addSystemUpdate=async()=>{};
 w.firebase={firestore:{FieldValue:{serverTimestamp:()=>123}}};
 w.db={collection:kind=>({doc:()=>({get:async()=>{
  if(kind==='reviews')throw Error('Missing or insufficient permissions.');
  return{exists:true,data:()=>({requestType:'pickup_preorder'})};
 }})})};
 w.ContentPolicy={create:async()=>{},updateMessage:async()=>{}};
 w.ViciData={command:async(name,payload)=>calls.push({name,payload})};
 const s=read('js/common.js'),a=s.indexOf('window.openFeedbackModal =');w.eval(s.slice(a,s.indexOf('window.viewSharedLocation =',a)));
 return{dom,w,calls,alerts};
}
test('feedback submits without reading an absent protected review and ignores a second tap',async()=>{
 const r=feedbackRuntime();try{
  let complete;r.w.ViciData.command=async(name,payload)=>{r.calls.push({name,payload});await new Promise(resolve=>complete=resolve)};
  await r.w.openFeedbackModal('shop','order');const button=r.w.document.querySelector('[id^=submit_feedbackModal]');
  const pending=button.onclick();await button.onclick();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(r.calls.length,1);assert.equal(r.calls[0].payload.createOnly,true);assert.equal(button.disabled,true);
  complete();await pending;assert.equal(r.w.document.querySelector('[id^=feedbackModal]'),null);assert.match(r.alerts.at(-1),/Thank you/);
 }finally{r.dom.window.close();}
});
test('failed review keeps the draft and re-enables retry; saved review does not become an error when chat sync fails',async()=>{
 const r=feedbackRuntime();try{
  await r.w.openFeedbackModal('shop','order','request');const button=r.w.document.querySelector('[id^=submit_feedbackModal]'),comment=r.w.document.querySelector('textarea');comment.value='Keep my feedback.';
  r.w.ViciData.command=async()=>{throw Error('Please try again.')};await button.onclick();assert.equal(button.disabled,false);assert.equal(comment.value,'Keep my feedback.');assert.match(r.alerts.at(-1),/Error submitting feedback/);
  r.w.ViciData.command=async()=>({reviewId:'customer_shop_order'});r.w.ContentPolicy.updateMessage=async()=>{throw Error('Missing or insufficient permissions.')};r.w.console.warn=()=>{};
  await button.onclick();assert.match(r.alerts.at(-1),/Thank you/);assert.equal(r.w.document.querySelector('[id^=feedbackModal]'),null);
 }finally{r.dom.window.close();}
});



test('transaction requirements form hides payment controls and sends one canonical request on double tap',async()=>{
 const dom=new JSDOM('<input id="chatPlaceId" value="shop"><input id="chatPlaceName" value="Shop"><input id="chatCustomerUid" value="customer">',{runScripts:'outside-only'}),w=dom.window,calls=[];let finish;
 try{
  w.auth={currentUser:{uid:'owner'}};w.chatDeskSelected='order';w.chatDeskOrders=[{id:'order',placeId:'shop',userId:'customer'}];w.deskOrder=()=>w.chatDeskOrders[0];w.lockBodyScroll=()=>{};w.debouncedIcons=()=>{};w.alert=()=>{};
  w.ViciData={command:async(name,body)=>{calls.push({name,body});await new Promise(resolve=>finish=resolve)}};
  const s=read('js/common.js'),a=s.indexOf('window.openRequirementRequestModal =');w.eval(s.slice(a,s.indexOf('window.openRequirementResponseModal =',a)));
  w.openRequirementRequestModal();const modal=w.document.querySelector('.req-modal'),payment=w.document.querySelector('[id^=reqPayment_]');assert.equal(payment.closest('label').hidden,true);assert.equal(w.document.querySelector('[id^=reqAmount_]').closest('.req-field').hidden,true);
  w.document.querySelector('[id^=reqAddress_]').checked=true;const button=w.document.querySelector('[id^=send_reqRequestModal]'),pending=button.onclick();await button.onclick();assert.equal(calls.length,1);assert.equal(calls[0].body.bookingId,'order');assert.equal(calls[0].body.patch.requirements.required.payment,false);assert.equal(button.disabled,true);
  finish();await pending;assert.equal(modal.isConnected,false);
 }finally{w.close()}
});
test('customer canonical requirement submission preserves the transaction link and avoids separate client writes',async()=>{
 const dom=new JSDOM('<body></body>',{runScripts:'outside-only'}),w=dom.window,calls=[];
 try{
  w.auth={currentUser:{uid:'customer'}};w.AppState={userProfile:{fullName:'Customer'}};w.escapeHtml=s=>String(s??'');w.lockBodyScroll=()=>{};w.debouncedIcons=()=>{};w.alert=()=>{};w.firebase={firestore:{FieldValue:{serverTimestamp:()=>123}}};w.ContentPolicy={create:()=>{throw Error('Client message write must not run')}};
  w.db={collection:()=>({doc:()=>({get:async()=>({exists:true,data:()=>({placeId:'shop',placeName:'Shop',bookingId:'order',canonicalRequirements:true,requirements:{address:true}})})})})};w.ViciData={command:async(name,body)=>calls.push({name,body})};
  const s=read('js/common.js'),a=s.indexOf('window.openRequirementResponseModal =');w.eval(s.slice(a,s.indexOf('window.confirmRequirementResponse =',a)));
  await w.openRequirementResponseModal('request');for(const [prefix,value]of [['resHouse','10 Test'],['resBarangay','West'],['resCity','Lipa'],['resLandmark','Green gate']])w.document.querySelector('[id^='+prefix+'_]').value=value;
  await w.document.querySelector('[id^=submit_reqResponseModal]').onclick();assert.equal(calls.length,1);assert.equal(calls[0].body.bookingId,'order');assert.equal(calls[0].body.patch.requirements.requestId,'request');assert.equal(calls[0].body.patch.requirements.data.houseStreet,'10 Test');assert.equal(w.document.querySelector('.req-modal'),null);
 }finally{w.close()}
});
