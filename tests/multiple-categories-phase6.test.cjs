const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('Phase 6 forms use checkbox groups and keep primary category controls',()=>{
 const html=read('index.html');
 for(const id of ['bizCat','bizPortalCat','editCategory']){
  assert.match(html,new RegExp(`id="${id}Choices"`));
  assert.match(html,new RegExp(`id="${id}"`));
 }
 assert.match(read('js/dashboard.js'),/id="dynCatChoices"/);
});
test('creation and both edits save primary and selected categories',()=>{
 const add=read('js/add.js'),dash=read('js/dashboard.js');
 assert.match(add,/getSelection\('bizCat'\)/);
 assert.match(add,/categories: selectedCategories\.categories/);
 assert.match(dash,/getSelection\('dynCat'\)/);
 assert.match(dash,/getSelection\('bizPortalCat'\)/);
 assert.equal((dash.match(/categories: selectedCategories\.categories/g)||[]).length,2);
});
test('Map, search, admin filters, AI context handle multiple categories',()=>{
 const map=read('js/map.js'),ai=read('netlify/functions/askVici.js'),dash=read('js/dashboard.js');
 assert.match(map,/const catOk.*p\.categories/);
 assert.match(map,/categories: cats/);
 assert.match(map,/place\.categories\)\?place\.categories/);
 assert.match(ai,/categories:Array\.isArray\(p\.categories\)/);
 assert.match(read('netlify/functions/lib/catalog.js'),/'categories'/);
 assert.match(dash,/data-categories=/);
});
test('Phase 6 category rules stay intact; Phase 7 adds private application rules only',()=>{
 const {execFileSync}=require('node:child_process');
 const python=`import zipfile,sys\nwith zipfile.ZipFile(sys.argv[1]) as z:sys.stdout.buffer.write(z.read('firestore.rules'))\n`;
 const baseline=execFileSync('python',['-c',python,path.join(root,'..','Vicinify_VIP_Discounts_Phase5.zip')]).toString();
 const updated=read('firestore.rules');
 const privateRules=`    // Phase 7: permits, applications and verified-ownership grants are server-only.\n    // Never put permits in public place, photo or Buzz collections.\n    match /business_applications/{applicationId} { allow read, write: if false; }\n    match /business_application_files/{fileId} { allow read, write: if false; }\n    match /verified_businesses/{businessId} { allow read, write: if false; }\n\n`;
 const restored=updated.replace(privateRules,'').replace(`            && !request.resource.data.diff(resource.data).affectedKeys()\n                 .hasAny(['businessVerificationStatus', 'businessApplicationId'])\n`,'');
 assert.equal(restored,baseline);
});
const vm=require('node:vm');
function createFixture(){
 class FakeElement{
  constructor(id,value=''){this.id=id;this.value=value;this.dataset={};this.listeners={};this.attributes={};this._html='';}
  set innerHTML(value){this._html=String(value);}
  get innerHTML(){return this._html;}
  setAttribute(key,val){this.attributes[key]=val;}
  addEventListener(type,fn){this.listeners[type]=fn;}
  trigger(type,target){this.listeners[type]?.({target});}
 }
 const elements={};
 for(const id of ['bizCat','bizPortalCat','dynCat','editCategory']){
  elements[id]=new FakeElement(id,id==='bizCat'?'':'restaurant');
  elements[id+'Choices']=new FakeElement(id+'Choices');
 }
 const document={readyState:'complete',getElementById:id=>elements[id]||null};
 const window={AppState:{activeCat:'all'},addEventListener(){},dispatchEvent(){}};
 const context={window,document,CustomEvent:class{}};
 vm.runInNewContext(read('js/categories.js'),context,{filename:'js/categories.js'});
 return {api:window.VicinifyCategories,elements};
}

test('Controller restores legacy single category and stores multiple selections',()=>{
 const {api}=createFixture();
 assert.equal(api.getSelection('bizCat').categories.length,0);
 api.setSelection('bizPortalCat',{category:'cafe'});
 assert.equal(api.getSelection('bizPortalCat').category,'cafe');
 assert.deepEqual([...api.getSelection('bizPortalCat').categories],['cafe']);
 api.setSelection('dynCat',{category:'restaurant',categories:['restaurant','cafe','milktea']});
 assert.equal(api.getSelection('dynCat').category,'restaurant');
 assert.equal(api.getSelection('dynCat').categories.length,3);
});

test('Controller keeps primary selected, limits to 3 and supports reset',()=>{
 const {api,elements}=createFixture();
 api.setSelection('bizCat',['restaurant','cafe','bakery','dessert']);
 assert.deepEqual([...api.getSelection('bizCat').categories],['restaurant','cafe','bakery']);
 assert.match(elements.bizCatChoices.innerHTML,/value="dessert"[^>]*disabled/);
 elements.bizCat.value='cafe';elements.bizCat.trigger('change');
 assert.equal(api.getSelection('bizCat').category,'cafe');
 assert.deepEqual([...api.getSelection('bizCat').categories],['cafe','restaurant','bakery']);
 api.setSelection('bizCat',[]);
 assert.deepEqual([...api.getSelection('bizCat').categories],[]);
});

test('Controller preserves primary when older document has divergent category list',()=>{
 const {api}=createFixture();
 api.setSelection('bizPortalCat',{category:'restaurant',categories:['cafe','bakery']});
 assert.deepEqual([...api.getSelection('bizPortalCat').categories],['restaurant','cafe','bakery']);
});
test('Checkbox change events enforce cap and removing selection changes primary',()=>{
 const {api,elements}=createFixture();
 const group=elements.bizCatChoices;
 const select=elements.bizCat;
 function change(value,checked){const input={value,checked,closest(){return this}};group.trigger('change',input);return input;}
 change('restaurant',true);change('cafe',true);change('bakery',true);
 assert.equal(api.getSelection('bizCat').categories.length,3);
 const fourth=change('dessert',true);
 assert.equal(fourth.checked,false);
 assert.equal(api.getSelection('bizCat').categories.length,3);
 select.value='cafe';select.trigger('change');
 change('cafe',false);
 assert.equal(api.getSelection('bizCat').category,'restaurant');
 assert.equal(api.getSelection('bizCat').categories.length,2);
 change('dessert',true);
 assert.equal(api.getSelection('bizCat').categories.length,3);
});
