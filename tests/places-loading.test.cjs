const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
function setup(get,storage){
 const source=fs.readFileSync(require.resolve('../js/map.js'),'utf8');
 const start=source.indexOf('    let _placesInFlight = null;');
 const end=source.indexOf('\n\n    function clearAcceptedMarkers',start);
 const calls=[],toasts=[];
 const query={where(...args){calls.push(['where',...args]);return this;},limit(n){calls.push(['limit',n]);return this;},get};
 const context={cloudPlaces:[],normalizePlace:p=>p,Date,console:{warn(){}},window:{sessionStorage:storage,db:{collection(name){calls.push(['collection',name]);return query;}},showToast:(...args)=>toasts.push(args)}};
 vm.createContext(context);vm.runInContext(source.slice(start,end),context);
 return {load:force=>context.getAcceptedPlaces(force),invalidate:()=>context.window.invalidatePlacesCache(),calls,toasts};
}
const snapshot=(docs=[])=>({docs,size:docs.length});
test('approved places load directly from Firebase, share pending reads and cache results',async()=>{
 let finish,reads=0;const x=setup(()=>{reads++;return new Promise(resolve=>finish=resolve);});
 const a=x.load(),b=x.load();finish(snapshot([{id:'real',data:()=>({id:'spoof',name:'Cafe'})}]));
 assert.equal((await a)[0].id,'real');await b;await x.load();assert.equal(reads,1);
 assert.deepEqual(x.calls,[['collection','places'],['where','approval_status','==','approved'],['limit',2001]]);
 x.invalidate();const fresh=x.load();finish(snapshot());await fresh;assert.equal(reads,2);
});
test('empty catalogs are cached',async()=>{
 let reads=0;const x=setup(async()=>{reads++;return snapshot();});await x.load();await x.load();assert.equal(reads,1);
});
test('failed refresh retains results, throttles retries and does not duplicate notifications',async()=>{
 let fail=false,reads=0;const x=setup(async()=>{reads++;if(fail)throw {code:'permission-denied'};return snapshot([{id:'a',data:()=>({name:'Cafe'})}]);});
 await x.load();fail=true;assert.equal((await x.load(true)).length,1);await x.load();await x.load(true);
 assert.equal(reads,3);assert.equal(x.toasts.length,1);assert.match(x.toasts[0][0],/Firebase blocked/);
});
test('invalidated in-flight results cannot repopulate the cache',async()=>{
 let finish;const x=setup(()=>new Promise(resolve=>finish=resolve));const pending=x.load();x.invalidate();finish(snapshot([{id:'old',data:()=>({})}]));assert.equal((await pending).length,0);
});
test('catalog cap is explicit and warns when results are truncated',async()=>{
 const docs=Array.from({length:2001},(_,id)=>({id:String(id),data:()=>({})}));const x=setup(async()=>snapshot(docs));assert.equal((await x.load()).length,2000);assert.equal(x.toasts[0][1],'info');
});

test('public catalog cache survives reload without caching private fields and invalidates explicitly',async()=>{
 const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 let reads=0;const get=async()=>{reads++;return snapshot([{id:'shop',data:()=>({name:'Shop',approval_status:'approved',owner_email:'private@example.test',updatedAt:{toDate:()=>new Date('2026-10-28T00:00:00Z')}})}]);};
 await setup(get,storage).load();const reload=setup(get,storage);const places=await reload.load();assert.equal(reads,1);assert.equal(places[0].name,'Shop');assert.equal(places[0].updatedAt,'2026-10-28T00:00:00.000Z');assert(![...values.values()][0].includes('private@example.test'));
 reload.invalidate();await reload.load();assert.equal(reads,2);
});
test('expired or corrupt public session cache is not trusted',async()=>{
 for(const value of ['not JSON',JSON.stringify({at:Date.now()-300001,places:[]}),JSON.stringify({at:Date.now(),places:[{id:'private',name:'Pending',approval_status:'pending'}]})]){
  let reads=0;await setup(async()=>{reads++;return snapshot();},{getItem:()=>value,setItem(){}}).load();assert.equal(reads,1);
 }
});

function navigationSetup(){
 const source=fs.readFileSync(require.resolve('../js/map.js'),'utf8');
 const timers=new Map(),controls=[],requests=[],pans=[],fits=[];let seq=0,watch;
 const map={invalidateSize(){},stop(){},removeControl(){},removeLayer(){},fitBounds:(...x)=>fits.push(x),panTo:(...x)=>pans.push(x),flyTo(){}};
 const ctx={map,routingControl:null,userDot:null,radiusCircle:null,Date,Number,Math,queueMicrotask,console,
  setTimeout:fn=>{timers.set(++seq,fn);return seq;},clearTimeout:id=>timers.delete(id),
  AppState:{userLocation:{lat:13.94,lng:121.16}},escapeHtml:String,showPage(){},
  document:{querySelector:()=>null,getElementById:()=>null},
  navigator:{geolocation:{watchPosition:fn=>{watch=fn;return 1},clearWatch:()=>{watch=null}}},
  window:{showToast(){},addEventListener(){}},
  L:{latLng:(lat,lng)=>({lat,lng}),latLngBounds:x=>x,Routing:{
   osrmv1:()=>({route:(points,cb)=>{requests.push(points);cb(null,[{summary:{totalDistance:100,totalTime:10},coordinates:[{lat:13.94,lng:121.16}],instructions:[]}]);}}),
   control:()=>{const c={handlers:{},addTo(){controls.push(this);return this},on(name,fn){this.handlers[name]=fn;return this}};return c;}
  }}
 };vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('    // ---- Navigation v12:'),source.indexOf('    // v53BA:')),ctx);
 vm.runInContext('ensureNavUI=()=>{};removeNavUI=()=>{};',ctx);
 return {ctx,timers,controls,requests,pans,fits,watch:()=>watch,flush:()=>{for(const [id,fn] of [...timers]){timers.delete(id);fn();}}};
}
test('navigation duplicate taps start once, cancelled starts do not fire, stale results are ignored',()=>{
 const x=navigationSetup(),go=x.ctx.window.routeToPlace;
 go(13.95,121.17,'Cafe');go(13.95,121.17,'Cafe');assert.equal(x.timers.size,1);x.flush();assert.equal(x.controls.length,1);
 const old=x.controls[0];go(13.96,121.18,'Other');x.flush();old.handlers.routesfound({routes:[{coordinates:[{lat:0,lng:0}],summary:{},instructions:[]}]});assert.equal(x.fits.length,0);
 x.ctx.window.cancelNavigation();assert.equal(x.watch(),null);
 go(13.95,121.17);x.ctx.window.cancelNavigation();x.flush();assert.equal(x.controls.length,2);
});
test('navigation reuses a recent route instead of repeating its routing request',async()=>{
 const x=navigationSetup(),router=vm.runInContext('navigationRouter()',x.ctx),points=[{latLng:{lat:13.94,lng:121.16}},{latLng:{lat:13.95,lng:121.17}}];
 const route=()=>new Promise((resolve,reject)=>router.route(points,(err,result)=>err?reject(err):resolve(result)));
 assert.equal((await route()).length,1);await route();assert.equal(x.requests.length,1);
});
test('live GPS ignores stationary jitter and does not queue pan animations',()=>{
 const x=navigationSetup();x.ctx.window.routeToPlace(13.95,121.17);x.flush();x.controls[0].handlers.routesfound({routes:[{coordinates:[{lat:13.94,lng:121.16}],summary:{totalDistance:100},instructions:[]}]});
 const update=x.watch();update({coords:{latitude:13.94,longitude:121.16,accuracy:10}});update({coords:{latitude:13.940001,longitude:121.160001,accuracy:10}});
 assert.equal(x.pans.length,1);assert.equal(x.pans[0][1].animate,false);assert.equal(x.fits.length,1);
});
