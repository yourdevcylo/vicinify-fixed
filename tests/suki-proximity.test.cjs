const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../js/common.js'),'utf8');
const section=source.slice(source.indexOf('window.Suki = (() => {'),source.indexOf('\n})();',source.indexOf('window.Suki = (() => {'))+5);
function makeSuki({getPosition}={}){
  const w={SukiDesign:{GRADIENTS:{},PATTERNS:{}},matchMedia:()=>({matches:false})};
  const ctx={window:w,navigator:{geolocation:{getCurrentPosition:getPosition||((ok)=>ok({coords:{latitude:14.5995,longitude:120.9842,accuracy:12}}))}},console,Date,Math,Number,Promise};
  vm.runInNewContext(section,ctx);
  return {suki:w.Suki,w,ctx};
}
const shop={id:'shop',lat:14.5995,lng:120.9842};
test('Suki location gate rejects a missing/malformed store pin (never fail-open)',async()=>{
  const {suki}=makeSuki();
  for(const place of [{},{lat:'',lng:120.98},{lat:0,lng:0},{lat:200,lng:121},{lat:null,lng:121}]){
    const result=await suki.verifyScanLocation(place);
    assert.equal(result.ok,false,JSON.stringify(place));
    assert.equal(result.reason,'missing-pin');
  }
});
test('Suki location gate accepts accurate on-site location, rejects distant and inaccurate GPS',()=>{
  const {suki}=makeSuki();
  assert.equal(suki.SUKI_SCAN_RADIUS_M,150);
  assert.equal(suki.checkScanDistance(shop,{coords:{latitude:14.5995,longitude:120.9842,accuracy:20}}).ok,true);
  const far=suki.checkScanDistance(shop,{coords:{latitude:14.61,longitude:120.9842,accuracy:10}});
  assert.equal(far.ok,false);assert.equal(far.reason,'too-far');
  const imprecise=suki.checkScanDistance(shop,{coords:{latitude:14.5995,longitude:120.9842,accuracy:350}});
  assert.equal(imprecise.ok,false);assert.equal(imprecise.reason,'gps-inaccurate');
  const closeButUncertain=suki.checkScanDistance(shop,{coords:{latitude:14.60055,longitude:120.9842,accuracy:40}});
  assert.equal(closeButUncertain.ok,false);
});
test('Suki geo permission denial fails closed',async()=>{
  const {suki}=makeSuki({getPosition:(ok,bad)=>bad({code:1})});
  const denied=await suki.verifyScanLocation(shop);
  assert.equal(denied.ok,false);assert.equal(denied.reason,'gps-denied');
});
test('Suki high-accuracy requests refuse cached GPS coordinates',async()=>{
  let options=null;
  const {suki}=makeSuki({getPosition:(ok,bad,opts)=>{options=opts;ok({coords:{latitude:shop.lat,longitude:shop.lng,accuracy:20}});}});
  assert.equal((await suki.verifyScanLocation(shop)).ok,true);
  assert.equal(options.maximumAge,0);
  assert.equal(options.enableHighAccuracy,true);
});
test('direct stamp requests do not write when GPS is far away',async()=>{
  const {suki,w}=makeSuki({getPosition:(ok)=>ok({coords:{latitude:15.1,longitude:121.1,accuracy:15}})});
  let writes=0;const messages=[];
  w.auth={currentUser:{uid:'customer',emailVerified:true}};
  w.showToast=(s)=>messages.push(s);
  w.db={collection:()=>{writes++;throw new Error('No Firestore requests should run while far away.');}};
  await suki.requestStamp({...shop,owner_uid:'owner'});
  assert.equal(writes,0);assert.match(messages.join(' '),/within 150 m/i);
});
test('nearby stamp request recovers gracefully when composite index is not deployed',async()=>{
  const {suki,w,ctx}=makeSuki();
  let newRequests=0,queries=0;
  w.auth={currentUser:{uid:'customer',emailVerified:true,displayName:'Customer'}};
  w.AppState={userProfile:{fullName:'Customer'}};
  w.showToast=()=>{};
  ctx.firebase={firestore:{FieldValue:{serverTimestamp:()=>123}}};
  w.db={collection:name=>{
    if(name==='stamp_requests')return{
      where:(field,op,value)=>{queries++;if(field==='customerUid')return{get:async()=>({docs:[{data:()=>({customerUid:'customer',placeId:'different',status:'pending'})}]})};
        return {where:()=>({where:()=>({limit:()=>({get:async()=>{throw Object.assign(new Error('Index missing'),{code:'failed-precondition'});}})})})};},
      add:async()=>{newRequests++;return{id:'req'};}
    };
    if(name==='loyalty_cards')return{doc:()=>({set:async()=>{}})};
    throw Error('Unexpected collection '+name);
  }};
  await suki.requestStamp({...shop,owner_uid:'owner'});
  assert.equal(newRequests,1);assert(queries>=2);
});
