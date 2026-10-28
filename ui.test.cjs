const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
test('list actions preserve untrusted names, use current render and do not trigger card navigation',()=>{
 const dom=new JSDOM('<div id="listViewContainer"></div>',{runScripts:'dangerously'}),w=dom.window;
 const source=fs.readFileSync(path.join(__dirname,'../js/common.js'),'utf8');
 const start=source.indexOf('window.renderListView = function(');
 const end=source.indexOf('\n};',start)+3;
 w.escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 w.safeImageUrl=()=>'';w.__injected=false;
 w.eval(source.slice(start,end));
 let calls=[],opened=[];
 w.openChatModal=(...args)=>calls.push(args);w.viewPlace=id=>opened.push(id);
 w.openBookingModal=(...args)=>calls.push(args);w.routeToPlace=(...args)=>calls.push(args);w.toggleFavorite=()=>{};
 const payload="Cafe &#39;);window.__injected=true;// <img src=x onerror=window.__injected=true>";
 w.renderListView([{id:'first',name:payload,status:'open',lat:14,lng:121}]);
 w.document.querySelector('[data-action="chat"]').click();
 assert.deepEqual(calls[0],['first',payload]);assert.equal(opened.length,0);assert.equal(w.__injected,false);
 w.renderListView([{id:'second',name:'Updated',lat:14,lng:121}]);
 w.document.querySelector('[data-action="booking"]').click();
 assert.deepEqual(calls[1],['second','Updated']);
 w.document.querySelector('[data-action="route"]').click();
 assert.deepEqual(calls[2],[14,121,'Updated']);
 w.document.querySelector('[data-place-card]').click();assert.deepEqual(opened,['second']);
 w.renderListView([]);assert.equal(w.document.querySelector('[data-place-card]'),null);
 dom.window.close();
});
test('remaining inline string helpers survive HTML parsing without executing user text',()=>{
 for(const name of ['map','settings','dashboard','buzz']){
  const source=fs.readFileSync(path.join(__dirname,'../js/'+name+'.js'),'utf8');
  const helper=source.match(/function (safeString|safeJsString)\(str\) \{[^\n]*\}/)[0];
  const dom=new JSDOM('<body></body>',{runScripts:'dangerously'}),w=dom.window;
  w.eval(helper);const encode=w.safeString||w.safeJsString;
  const payload="&#39;);window.__injected=true;//\n'\"\\<&";
  w.__injected=false;let received;w.receive=s=>received=s;
  w.document.body.innerHTML='<button onclick="receive(\''+encode(payload)+'\')">Test</button>';
  w.document.querySelector('button').click();
  assert.equal(received,payload);assert.equal(w.__injected,false);dom.window.close();
 }
});

