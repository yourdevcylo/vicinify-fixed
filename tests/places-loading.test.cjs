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
