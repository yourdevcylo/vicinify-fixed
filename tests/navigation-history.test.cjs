const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../js/common.js'),'utf8');
const navigation=source.slice(source.indexOf('const ViciNavigation = (() => {'),source.indexOf('function initNav()'));
function runtime(){
 const listeners={}; const entries=[{state:null}]; let cursor=0;
 const pages=['page-login','page-map','page-dashboard','page-suki-studio','page-place','page-settings','page-add','page-biz-edit','page-buzz'];
 const noOp=()=>{};
 const element=(id)=>({id,scrollTop:0,scrollLeft:0,style:{},dataset:{},classList:{add:noOp,remove:noOp,toggle:noOp},scrollTo:noOp});
 const pageObjects=new Map(pages.map(id=>[id,element(id)]));
 const document={
  body:element('body'),documentElement:element('html'),scrollingElement:element('scrolling'),
  getElementById:id=>pageObjects.get(id)||null,
  querySelectorAll:selector=>selector==='.page'?[...pageObjects.values()]:[],
  querySelector:selector=>selector==='.bottom-nav'?element('bottom-nav'):null,
 };
 document.documentElement.style={}; document.body.style={};
 const window={location:{href:'https://vicinify.example/'},scrollTo:noOp,addEventListener:(name,callback)=>{listeners[name]=callback},
  history:{
   get state(){return entries[cursor]?.state},
   pushState(state){entries.splice(++cursor);entries.push({state})},
   replaceState(state){entries[cursor]={state}},
   back(){this.go(-1)}, forward(){this.go(1)},go(delta){const next=cursor+delta;if(next<0||next>=entries.length)return;cursor=next;listeners.popstate?.({state:entries[cursor].state})}
  },
  DashboardPage:{render:noOp,stopAllListeners:noOp,confirmLeaveSukiStudio:async()=>true,cleanupSukiStudio:noOp},
  MapPage:{refresh:noOp,stopPlaceListeners:noOp},SettingsPage:{render:noOp,stopAllListeners:noOp},BuzzPage:{render:noOp,stopListeners:noOp},
  FloatingOrderWindow:{render:noOp}, matchMedia:()=>({matches:true})
 };
 const AppState={activePage:'page-login',user:{uid:'test'},userProfile:{}};
 const ctx=vm.createContext({window,document,AppState,console,Math,Date,Promise,requestAnimationFrame:noOp,setTimeout:noOp,applyViciPageScrollState:noOp,resetViciPageScroll:noOp});
 vm.runInContext(navigation,ctx);
 return {ctx,window,AppState,entries,get cursor(){return cursor},flush:async()=>{for(let i=0;i<7;i++)await Promise.resolve()}};
}
test('three nested pages go back in visited order, never jump to Map',async()=>{
 const r=runtime();r.ctx.showPage('page-map',{resetHistory:true});r.ctx.showPage('page-dashboard');r.ctx.showPage('page-suki-studio');
 assert.equal(r.AppState.activePage,'page-suki-studio');
 r.window.viciGoBack();await r.flush();assert.equal(r.AppState.activePage,'page-dashboard');
 r.window.viciGoBack();await r.flush();assert.equal(r.AppState.activePage,'page-map');
 r.window.history.forward();await r.flush();assert.equal(r.AppState.activePage,'page-dashboard');
 r.window.history.forward();await r.flush();assert.equal(r.AppState.activePage,'page-suki-studio');
});
test('from settings to establishment, Back returns to settings',async()=>{
 const r=runtime();r.ctx.showPage('page-map',{resetHistory:true});r.ctx.showPage('page-settings');
 r.window.currentPlaceReviewId='store-123';r.ctx.showPage('page-place');
 r.window.viciGoBack();await r.flush();assert.equal(r.AppState.activePage,'page-settings');
});
test('direct Suki entry retains fallback, and canceled native Back keeps draft',async()=>{
 const r=runtime();r.ctx.showPage('page-map',{resetHistory:true});r.ctx.showPage('page-suki-studio');
 r.window.DashboardPage.confirmLeaveSukiStudio=async()=>false;
 r.window.history.back();await r.flush();
 assert.equal(r.AppState.activePage,'page-suki-studio');assert.equal(r.cursor,1);
 r.window.DashboardPage.confirmLeaveSukiStudio=async()=>true;
 r.window.history.back();await r.flush();
 assert.equal(r.AppState.activePage,'page-map');
});
test('sign-out reset never revisits previous user pages',async()=>{
 const r=runtime();r.ctx.showPage('page-map',{resetHistory:true});r.ctx.showPage('page-dashboard');r.AppState.user=null;
 r.ctx.showPage('page-login',{resetHistory:true});r.window.history.back();await r.flush();
 assert.equal(r.AppState.activePage,'page-login');
});
test('same-page rerenders do not pollute Back history',async()=>{
 const r=runtime();r.ctx.showPage('page-map',{resetHistory:true});r.ctx.showPage('page-settings');
 r.ctx.showPage('page-settings');r.ctx.showPage('page-settings');
 assert.equal(r.window.ViciNavigation.debugState().routes.length,2);
 r.window.viciGoBack();await r.flush();assert.equal(r.AppState.activePage,'page-map');
});
test('Vici AI View Restaurant Back restores chat overlay exactly once',async()=>{
 const r=runtime();let opens=0;r.window.ViciChat={open:()=>{opens++}};
 r.ctx.showPage('page-map',{resetHistory:true});
 r.window.ViciNavigation.markViciReturn();
 r.window.currentPlaceReviewId='test-cafe';r.ctx.showPage('page-place');
 r.window.history.back();await r.flush();
 assert.equal(r.AppState.activePage,'page-map');assert.equal(opens,1);
 r.window.history.forward();await r.flush();
 r.window.history.back();await r.flush();
 assert.equal(opens,1,'AI should not automatically reopen after a later unrelated Back');
});
