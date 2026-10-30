const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'js/common.js'),'utf8');
const code=source.slice(source.indexOf('window.SukiDesign = (() => {'),source.indexOf('\n})();',source.indexOf('window.Suki = (() => {'))+5);
class FakeNode {
  constructor(){this.innerHTML='';this.listeners={};this.nodes={};}
  querySelector(selector){
    if(selector==='.suki-place-preview'||selector==='.suki-place-actions'){
      if(!this.nodes[selector])this.nodes[selector]=new FakeNode();return this.nodes[selector];
    }
    return {addEventListener:()=>{},getAttribute:()=>null,innerHTML:'',querySelector:()=>null};
  }
  querySelectorAll(){return []}
  replaceChildren(){this.innerHTML=''}
  addEventListener(event,callback){this.listeners[event]=callback}
}
function harness(){
  const panel=new FakeNode(),callbacks={card:null,pending:null},stops={card:0,pending:0};
  let reads=0,cardStamps=3,notifications=[];
  const w={SukiDesign:null,auth:{currentUser:{uid:'customer',emailVerified:true}},matchMedia:()=>({matches:true}),debouncedIcons:()=>{},showToast:msg=>notifications.push(msg)};
  const place={name:'Coffee Shop',suki_enabled:true,suki_stamp_count:8,suki_reward:'Free Coffee',lat:14.5995,lng:120.9842,owner_uid:'store'};
  const stampQuery={where(){return this},limit(){return this},get:async()=>({empty:true,docs:[]}),onSnapshot(next){callbacks.pending=next;return()=>stops.pending++}};
  const cardDoc={get:async()=>({exists:true,id:'shop_customer',data:()=>({stamps:cardStamps,customerName:'Customer'})}),onSnapshot(next){callbacks.card=next;return()=>stops.card++}};
  w.db={collection:name=>{
    if(name==='places')return{doc:()=>({get:async()=>{reads++;return{exists:true,id:'shop',data:()=>place}}})};
    if(name==='loyalty_cards')return{doc:()=>cardDoc};
    if(name==='stamp_requests')return stampQuery;
    throw Error(name);
  }};
  const d={getElementById:id=>id==='placeSukiSection'?panel:null};
  vm.runInNewContext(code,{window:w,document:d,console,Date,Number,Math,Promise,parseInt,setInterval,clearInterval,requestAnimationFrame:()=>{},cancelAnimationFrame:()=>{},performance:{now:()=>0}});
  return{w,panel,callbacks,stops,notifications,get reads(){return reads},setStamp(value){cardStamps=value}};
}
test('owner approval pushes stamp to customer card without refreshing place',async()=>{
  const x=harness();await x.w.Suki.mountPlaceSection({id:'shop'},false);
  assert.match(x.panel.innerHTML,/3 \/ 8/);
  assert.equal(typeof x.callbacks.card,'function');
  x.callbacks.card({exists:true,id:'shop_customer',data:()=>({stamps:4,customerName:'Customer'})});
  assert.match(x.panel.nodes['.suki-place-preview'].innerHTML,/4 \/ 8/);
  assert.equal(x.reads,1,'no repeat establishment read on approval');
  assert.match(x.notifications.join(' '),/stamp added/i);
});
test('request appears and disappears immediately on owner approval and listeners clean up',async()=>{
  const x=harness();await x.w.Suki.mountPlaceSection({id:'shop'},false);
  x.callbacks.pending({docs:[{id:'pending1',data:()=>({placeId:'shop',customerUid:'customer',status:'pending'})}]});
  assert.match(x.panel.nodes['.suki-place-actions'].innerHTML,/Stamp request pending/);
  x.callbacks.pending({docs:[]});
  assert.match(x.panel.nodes['.suki-place-actions'].innerHTML,/Scan store QR/);
  x.w.Suki.unmountPlaceSection();
  assert.equal(x.stops.card,1);assert.equal(x.stops.pending,1);
});
test('suki editor has one Save Changes button in the form, without redundant footer label',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const page=html.split('<main id="page-suki-studio"')[1].split('</main>')[0];
  assert.equal((page.match(/Save Changes/g)||[]).length,1);
  assert.doesNotMatch(page,/Editing Suki Card/);
  assert.match(page,/suki-editor-form-footer/);
  assert.doesNotMatch(page,/suki-editor-savebar/);
});
