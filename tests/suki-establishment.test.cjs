const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../js/common.js'), 'utf8');
const start = source.indexOf('window.SukiDesign = (() => {');
const end = source.indexOf('\n})();',source.indexOf('window.Suki = (() => {')) + 5;
const code = source.slice(start,end);
class FakeElement {
  constructor() { this.innerHTML = ''; this.listeners={}; this.children = []; }
  replaceChildren() { this.innerHTML = ''; this.children=[]; }
  querySelectorAll() { return []; } // skip animation; test the public content
  querySelector(selector) {
    if(!this.innerHTML.includes(selector.replace(/[\[\]]/g,'').split('=')[0]) && !['.suki-qr-img','.suki-qr-count','.suki-qr-token'].includes(selector))return null;
    return {innerHTML:'',addEventListener:(event,fn)=>{this.listeners[selector+':'+event]=fn;},querySelector:()=>({innerHTML:''}),set textContent(v){},get textContent(){return '';}};
  }
}
function harness({owner=false, guest=false, stampError=false}={}){
  const panel = new FakeElement();let data={id:'p1',name:'Cafe 1',suki_enabled:true,suki_stamp_count:8,suki_reward:'Coffee',lat:14.5995,lng:120.9842};
  let reads=0,failPlace=false,pendingError=stampError;
  const w={SukiDesign:null,auth:{currentUser:guest?null:{uid:owner?'owner':'c1',emailVerified:true}},debiased:0,debouncedIcons(){},DashboardPage:{openSukiStudio(){}},matchMedia:()=>({matches:true})};
  const d={getElementById:(id)=>id==='placeSukiSection'?panel:null,createElement:()=>({set src(v){},dataset:{},remove(){}}),head:{append(){}}};
  w.db={collection:(collection)=>{
    if(collection==='places')return {doc:id=>({get:async()=>{reads++;if(failPlace)throw Error('offline');return{exists:true,id,data:()=>data};}})};
    if(collection==='loyalty_cards')return {doc:id=>({get:async()=>({exists:true,id,data:()=>({stamps:3,customerName:'Test customer'})})})};
    if(collection==='stamp_requests')return {where:()=>({where:()=>({where:()=>({limit:()=>({get:async()=>{if(pendingError)throw Error('missing index');return{empty:true,docs:[]};}})})})})};
    throw Error('Unexpected '+collection);
  }};
  vm.runInNewContext(code,{window:w,document:d,console,Promise,Number,Math,Date,parseInt,setInterval,clearInterval,performance:{now:()=>0},requestAnimationFrame:()=>{},cancelAnimationFrame:()=>{},showPage:()=>{} });
  return {w,panel,get reads(){return reads;},setData(v){data=v;},setPendingError(v){pendingError=v;},setFailPlace(v){failPlace=v;}};
}
test('public guest sees card even if map cached Suki disabled',async()=>{
 const x=harness({guest:true});await x.w.Suki.mountPlaceSection({id:'p1',suki_enabled:false},false);
 assert.match(x.panel.innerHTML,/suki-place-preview/);assert.match(x.panel.innerHTML,/Log in to collect stamps/);assert.match(x.panel.innerHTML,/Coffee/);assert.equal(x.reads,1);
});
test('owner sees card preview and QR and Edit, rather than QR only',async()=>{
 const x=harness({owner:true});await x.w.Suki.mountPlaceSection({id:'p1',suki_enabled:false},true);
 assert.match(x.panel.innerHTML,/Store Suki Card/);assert.match(x.panel.innerHTML,/data-suki-card/);
 assert.match(x.panel.innerHTML,/data-suki-qr/);assert.match(x.panel.innerHTML,/data-suki-edit/);
});
test('customer gets existing stamps and scan button from current Firebase configuration',async()=>{
 const x=harness();await x.w.Suki.mountPlaceSection({id:'p1',suki_enabled:false},false);
 assert.match(x.panel.innerHTML,/3 \/ 8/);assert.match(x.panel.innerHTML,/data-suki-scan/);
});
test('pending request error keeps existing card visible but blocks scanning',async()=>{
 const x=harness({stampError:true});await x.w.Suki.mountPlaceSection({id:'p1'},false);
 assert.match(x.panel.innerHTML,/data-suki-card/);assert.match(x.panel.innerHTML,/Retry request status/);assert.doesNotMatch(x.panel.innerHTML,/data-suki-scan/);
});
test('turning Suki off does not remove the mount point; turning back on works',async()=>{
 const x=harness({guest:true});x.setData({id:'p1',name:'Cafe',suki_enabled:false});await x.w.Suki.mountPlaceSection({id:'p1',suki_enabled:true},false);
 assert.equal(x.panel.innerHTML,'');
 x.setData({id:'p1',name:'Cafe',suki_enabled:true});await x.w.Suki.mountPlaceSection({id:'p1',suki_enabled:false},false);
 assert.match(x.panel.innerHTML,/data-suki-card/);
});
test('Firestore place read failures show retry instead of silently hiding the card',async()=>{
 const x=harness();x.setFailPlace(true);await x.w.Suki.mountPlaceSection({id:'p1',suki_enabled:true},false);
 assert.match(x.panel.innerHTML,/data-suki-retry/);assert.match(x.panel.innerHTML,/couldn.t verify/i);
});
