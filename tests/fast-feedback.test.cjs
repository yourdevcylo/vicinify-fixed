const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const common = fs.readFileSync(path.join(root, 'js/common.js'), 'utf8');
const map = fs.readFileSync(path.join(root, 'js/map.js'), 'utf8');
const commerce = fs.readFileSync(path.join(root, 'js/vici-commerce.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function ratingHarness() {
  let resolve, reject;
  const sent=[];
  const buttonStates = Array.from({length:5},()=>new Set());
  const buttons = buttonStates.map(set=>({
    disabled:false,
    classList:{contains:x=>set.has(x),toggle:(x,yes)=>yes?set.add(x):set.delete(x)}
  }));
  const heading={textContent:'Rate this establishment'};
  let status;
  const livePanel={isConnected:true,querySelector:s=>s==='.place-rating-save-status'?status:s==='h4'?heading:null};
  const panel={querySelectorAll:s=>s==='.star-btn'?buttons:[],closest:()=>livePanel,insertAdjacentElement:(where,x)=>{status=x;}};
  const window={currentPlaceReviewId:'place-1',ViciData:{command:(name,body)=>{sent.push({name,body});return new Promise((res,rej)=>{resolve=res;reject=rej;});}},invalidatePlacesCache:()=>{window.invalidated=true},showToast:(msg,kind)=>{window.toast=[msg,kind]},viewPlace:()=>{throw Error('viewPlace reload must not occur');}};
  const document={getElementById:id=>id==='starInputContainer'?panel:null,createElement:()=>({className:'',setAttribute(){},textContent:''})};
  const start=common.indexOf('let isRatingProcessing = false;');
  const end=common.indexOf('// =========================================\n// 📋 CONNECTED LIST VIEW',start);
  assert(start!==-1&&end>start);
  vm.runInNewContext(common.slice(start,end),{window,document,Number});
  return {window,buttons,heading,get status(){return status},resolve:v=>resolve(v),reject:e=>reject(e),sent};
}

test('rating shows immediate pending state and confirms without reloading the establishment',async()=>{
  const h=ratingHarness();
  const work=h.window.submitRating('place-1',4);
  assert.equal(h.status.textContent,'Saving your rating…');
  assert.deepEqual(h.buttons.map(b=>b.classList.contains('active')),[true,true,true,true,false]);
  assert(h.buttons.every(b=>b.disabled));
  assert.equal(h.sent.length,1);
  h.resolve({ratingSaved:true});await work;
  assert.match(h.status.textContent,/Saved: 4 stars/);
  assert(h.buttons.every(b=>!b.disabled));
  assert.equal(h.window.invalidated,true);
});

test('rating reverts its selected stars on server failure',async()=>{
  const h=ratingHarness();
  const work=h.window.submitRating('place-1',5);
  h.reject(new Error('Network unavailable'));await work;
  assert(h.buttons.every(b=>!b.classList.contains('active')));
  assert.match(h.status.textContent,/Could not save/);
  assert(h.buttons.every(b=>!b.disabled));
});

function postsHarness(storageFails=false, firestoreFails=false){
  const fields={
    placePostModal:{dataset:{editPostId:''}},
    placePostPlaceId:{value:'place-1'},
    placePostBody:{value:''},
    placePostMedia:{files:[{name:'test.jpeg',type:'image/jpeg'}]},
    submitPlacePostBtn:{disabled:false,textContent:'Post Update'},
    placePostUploadStatus:{textContent:''}
  };
  let payload,created=false;
  const window={
    uploadImageFileToStorage:async()=>{if(storageFails)throw Error('Storage unavailable');return 'https://storage.example/small.jpg';},
    compressImageFile:async()=>({dataUrl:'data:image/jpeg;base64,'+'a'.repeat(1200)}),
    ContentPolicy:{error:()=>null,create:async(db,collection,value)=>{payload=value;if(firestoreFails)throw Error('Firestore unavailable');created=true;}},
    showToast:(text,type)=>{window.toast=[text,type]},
    closePlacePostModal:()=>{window.closed=true}
  };
  const document={getElementById:id=>fields[id]};
  const start=map.indexOf('    window.submitPlacePost = async function () {');
  const end=map.indexOf('    window.closePlacePostMenus = function()',start);
  assert(start!==-1&&end>start);
  vm.runInNewContext(map.slice(start,end),{
    window,document,requireVerifiedUser:async()=>({uid:'owner-1'}),canManagePlace:async()=>true,
    AppState:{userProfile:{fullName:'Owner'}},firebase:{firestore:{FieldValue:{serverTimestamp:()=>123}}},
  });
  return {window,fields,get payload(){return payload},get created(){return created}};
}

test('post photo uses compact Firestore thumbnail only when Storage is unavailable',async()=>{
  const h=postsHarness(true);
  await h.window.submitPlacePost();
  assert.equal(h.created,true);
  assert.match(h.payload.mediaUrl,/^data:image\/jpeg;base64,/);
  assert(h.payload.mediaUrl.length<24000);
  assert.match(h.window.toast[0],/low-resolution photo/);
  assert.equal(h.window.closed,true);
});

test('post stays unconfirmed if final Firestore write fails',async()=>{
  const h=postsHarness(true,true);
  await h.window.submitPlacePost();
  assert.equal(h.created,false);
  assert.equal(h.window.closed,undefined);
  assert.match(h.fields.placePostUploadStatus.textContent,/Not published/);
  assert.equal(h.fields.submitPlacePostBtn.disabled,false);
});

test('menu mounts Firestore live subscription, updates list and unsubscribes',async()=>{
  let callback,stopped=false;
  const initial=[{id:'a',name:'Coffee',category:'Drinks',description:'Cup',priceCents:5000,available:true}];
  const query={get:async()=>({docs:initial.map(item=>({id:item.id,data:()=>item}))}),onSnapshot:fn=>{callback=fn;return()=>{stopped=true}}};
  const db={collection:()=>({doc:id=>({get:async()=>({exists:true,data:()=>({owner_uid:'owner-1',accepts_orders:true})}),collection:()=>({where:()=>({limit:()=>query})})})})};
  const input={value:'',oninput:null},select={value:'',innerHTML:'',onchange:null},grid={innerHTML:''};
  const wrap={isConnected:true,innerHTML:'',querySelector:sel=>({
    'input[type=search]':input,select,'.commerce-menu-grid':grid
  })[sel]||null,querySelectorAll:()=>[],closest:()=>null};
  const window={db,auth:{currentUser:{uid:'owner-1'},onAuthStateChanged:()=>{}},ViciData:{},showToast:()=>{},invalidatePlacesCache:()=>{}};
  const document={querySelectorAll:()=>[]};
  vm.runInNewContext(commerce,{window,document,console,Date,Promise,URL});
  await window.ViciCommerce.mountMenu(wrap,'place-1',true);
  assert.equal(typeof callback,'function');
  callback({docs:[...initial,{id:'b',name:'Buko Juice',category:'Drinks',description:'Cold',priceCents:4000,available:true}].map(item=>({id:item.id,data:()=>item}))});
  assert.match(grid.innerHTML,/Buko Juice/);
  wrap._menuLiveUnsub();
  assert.equal(stopped,true);
});

test('live post fallback and real-time place ratings are wired and photo preview is visible',()=>{
  assert.match(map,/placeRatingUnsub = window\.db\.collection\('places'\)\.doc\(p\.id\)\.onSnapshot/);
  assert.match(map,/const missingIndex = err\?\.code === 'failed-precondition'/);
  assert.match(map,/q = useFallback \? q\.limit\(60\) : q\.orderBy\('createdAt','desc'\)/);
  assert.match(html,/id="placePostImagePreview"/);
  assert.match(map,/previewSelectedPlacePhoto/);
});
