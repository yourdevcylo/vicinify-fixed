const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const mapSource = read('js/map.js');
const commonSource = read('js/common.js');
const index = read('index.html');

function mountMapNavigation() {
  // Test the production map-action section without Firebase, GPS or Leaflet network.
  const start = mapSource.indexOf('    // One entry point for any map-directed action: Vici AI');
  const stop = mapSource.indexOf('    // v53BA: show user message + typing indicator immediately', start);
  assert.ok(start > 0 && stop > start);
  const source=mapSource.slice(start, stop);
  const page = {dataset: {view:'list'},classList: {contains: v => v === 'active'}};
  let pageCalls=[], toggles=[], resizes=0, closes=0, notifications=[];
  let lastDestination=null;
  const map = {invalidateSize(){resizes++},stop(){},removeControl(){},removeLayer(){},flyTo(coords){lastDestination=coords}};
  const window = {PlacePreview:{close(){closes++}},showToast:(message,level)=>notifications.push({message,level})};
  const context = {
    window, AppState:{userLocation:null,activePage:'page-place'},
    document:{getElementById: id=>id==='page-map'?page:null},
    map, showPage:(id,opts={})=>{pageCalls.push([id,opts]);page.dataset.view=opts.discoveryView || 'list';},
    requestAnimationFrame:fn=>fn(),setTimeout:()=>0, clearTimeout:()=>{},
    refresh:()=>{},locate:async()=>false,
    navDest:null, navPending:false, navRoute:null,
    L:{Routing:{}}, console,
  };
  window.toggleView = mode => {toggles.push(mode);page.dataset.view=mode};
  vm.createContext(context);
  vm.runInContext(source, context);
  return {context,window,page, pageCalls,toggles, get resizes(){return resizes}, get closes(){return closes},get lastDestination(){return lastDestination},notifications};
}

test('AI directions from List switch to visible Map before asking GPS permission',async()=>{
  const app=mountMapNavigation();
  const started=app.window.routeToPlace(13.9417,121.1678,'Timpla ni Juan');
  assert.equal(started,true);
  assert.equal(app.page.dataset.view,'map');
  assert.equal(app.pageCalls[0][0],'page-map');
  assert.equal(app.pageCalls[0][1].discoveryView,'map');
  assert.ok(app.toggles.includes('map'));
  assert.ok(app.resizes > 0);
  assert.equal(app.closes,1);
  assert.equal(app.lastDestination.join(','),'13.9417,121.1678');
  await Promise.resolve();
});

test('Map focus reopens map from other pages, not the old List view',()=>{
  const app=mountMapNavigation();
  assert.equal(app.window.focusViciMap(), true);
  assert.equal(app.page.dataset.view,'map');
  assert.equal(app.pageCalls[0][1].discoveryView,'map');
});

test('missing coordinates cannot trigger a route or leave list state ambiguous',()=>{
  const app=mountMapNavigation();
  assert.equal(app.window.routeToPlace(NaN,121),false);
  assert.equal(app.page.dataset.view,'list');
  assert.ok(app.notifications.some(x=>x.level==='error'));
});

test('all route buttons delegate to routeToPlace; AI map and directions use central map focusing',()=>{
  for(const needle of [
    'window.routeToPlace(${p.lat}, ${p.lng})',
    'window.routeToPlace(latitude, longitude, place.name || "Establishment")',
    'return window.routeToPlace(lat, lng, p.name || "Establishment") === true',
    'if(!focusMapForNavigation())',
    'window.focusViciMap = focusMapForNavigation',
  ]) assert.ok(mapSource.includes(needle)||commonSource.includes(needle), needle);
  assert.ok(index.includes('onclick="window.toggleView(\'map\')"'));
  assert.ok(index.includes('onclick="window.toggleView(\'list\')"'));
  assert.ok(!mapSource.includes('document.addEventListener("click", function(e) {\n    const btnMap = e.target.closest("#btnMapView")'), 'duplicate map view DOM handler must not return');
});

test('showPage allows forced discovery map and preserves previous mode for normal navigation',()=>{
  assert.ok(commonSource.includes("const requestedView = options.discoveryView"));
  assert.ok(commonSource.includes("requestedView === 'map' || requestedView === 'list'"));
  assert.ok(index.includes('page.dataset.view = isList ? "list" : "map"'));
  assert.ok(index.includes('btnMap.setAttribute("aria-pressed", String(!isList))'));
});


test('canonical toggleView updates both DOM panes, aria and remembered view',()=>{
  const extract=index.slice(index.indexOf('window.toggleView = function(view) {'),index.indexOf('    </script>',index.indexOf('window.toggleView = function(view) {')));
  function classList(){const names=new Set();return {toggle(key,value){if(value)names.add(key);else names.delete(key)},contains(key){return names.has(key)}};}
  function elem(){return {dataset:{view:'list'},classList:classList(),style:{display:''},hidden:false,attrs:{},setAttribute(k,v){this.attrs[k]=v}};}
  const ids=Object.fromEntries(['page-map','btnMapView','btnListView','map','listViewContainer'].map(id=>[id,elem()]));
  const root={MapPage:{refresh(){}}};
  vm.runInNewContext(extract, {window:root,document:{getElementById:id=>ids[id]},setTimeout:()=>{}});
  root.toggleView('list');
  assert.equal(ids['map'].hidden,true);
  assert.equal(ids['page-map'].dataset.view,'list');
  assert.equal(ids['btnMapView'].attrs['aria-pressed'],'false');
  root.toggleView('map');
  assert.equal(ids['map'].hidden,false);
  assert.equal(ids['map'].style.display,'block');
  assert.equal(ids['listViewContainer'].hidden,true);
  assert.equal(ids['page-map'].dataset.view,'map');
  assert.equal(ids['btnMapView'].attrs['aria-pressed'],'true');
});

test('establishment owner photos no longer require Storage, with progress and visible error UI',()=>{
  const dashboard=read('js/dashboard.js');
  const profileSave=dashboard.slice(dashboard.indexOf('async function saveBusinessPortal()'),dashboard.indexOf('    // 🔥 ESTABLISHMENT POSTS',dashboard.indexOf('async function saveBusinessPortal()')));
  assert.ok(profileSave.includes('bizSmallWebPData(coverInput.files[0], "cover")'));
  assert.ok(profileSave.includes('bizSmallWebPData(logoInputEl.files[0], "logo")'));
  assert.ok(!profileSave.includes('uploadImageFileToStorage'));
  assert.ok(profileSave.includes('setBizSaveState("Not saved: " + detail, "error")'));
  assert.ok(profileSave.includes('bizSaveWithDeadline(window.db.collection("places").doc(id).update(updateData))'));
  assert.ok(index.includes('id="bizPortalSaveStatus"'));
  assert.ok(read('css/components.css').includes('.biz-upload-spinner'));
});
