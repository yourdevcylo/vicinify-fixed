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
