const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root,'js/common.js'),'utf8');
const start=source.indexOf('window.SukiDesign = (() => {');
const end=source.indexOf('\n})();',source.indexOf('window.Suki = (() => {'))+5;
const w={};
vm.runInNewContext(source.slice(start,end),{window:w,console,Number,Math,Date,parseInt,clearInterval,setInterval});
const tinyWebP='data:image/webp;base64,UklGRg==';

test('Suki renderer applies valid custom card background on front and back', () => {
  const card=w.Suki.renderCard({name:'Kusina Lipa',suki_background_image:tinyWebP,suki_stamp_count:8}, {stamps:4,redemptionCount:2,customerName:'Ada'});
  assert.equal((card.match(/url\(&quot;data:image\/webp;base64,UklGRg==&quot;\)/g)||[]).length,2);
  assert.match(card,/4 \/ 8/);
  assert.match(card,/2<\/b> rewards redeemed/);
  assert.match(card,/Ada/);
});

test('reject SVG, remote URLs, and injected CSS background data',()=>{
  for(const val of [
    'data:image/svg+xml;base64,PHN2Zz4=',
    'https://malicious.example/image.png',
    'data:image/webp;base64,UklGRg==\');background:red;--x:1',
    'data:image/webp;base64,'+'A'.repeat(150001)
  ]) {
    assert.equal(w.Suki.validBackgroundImage(val),'');
    const html=w.Suki.renderCard({suki_background_image:val},{stamps:1});
    assert.doesNotMatch(html,/background-image:linear-gradient\(rgba\(0,0,0,.38\)/);
  }
});

test('legacy Suki design remains unchanged without custom image',()=>{
  const html=w.Suki.renderCard({name:'Kusina Lipa',suki_color:'#237e72'},{stamps:2});
  assert.match(html,/background:#237e72/);
  assert.doesNotMatch(html,/url\(&quot;data:image\/webp/);
});

test('studio has upload, reset and secure raster validation',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const dash=fs.readFileSync(path.join(root,'js/dashboard.js'),'utf8');
  assert.match(html,/id="sukiBackgroundFile"[^>]*accept="image\/png,image\/jpeg,image\/webp"/);
  assert.match(html,/id="sukiBackgroundReset"/);
  assert.match(dash,/suki_background_image: window.Suki\?\.validBackgroundImage/);
  assert.match(dash,/Math\.abs\(\(img\.naturalWidth \/ img\.naturalHeight\)/);
  assert.match(dash,/canManagePlaceId\(id\)/);
});

function imageHarness({width=1012,height=638,encodedSize=60}={}) {
  const dash=fs.readFileSync(path.join(root,'js/dashboard.js'),'utf8');
  const start=dash.indexOf('    async function sukiCompressBackground(file) {');
  const end=dash.indexOf('    function sukiStudioInit(place) {',start);
  assert.ok(start>0&&end>start);
  let revoked=false;
  class ImageStub {set src(val){ this.naturalWidth=width;this.naturalHeight=height;this.onload?.();}}
  const canvas={width:0,height:0,getContext:()=>({drawImage(){}}),toDataURL:()=> 'data:image/webp;base64,'+'A'.repeat(encodedSize)};
  const fakeUrl={createObjectURL:()=> 'blob:test',revokeObjectURL:()=>{revoked=true;}};
  const env={URL:fakeUrl,Image:ImageStub,document:{createElement:()=>canvas},Error,Math,Promise};
  vm.createContext(env);
  vm.runInContext(source.slice(0,0)+dash.slice(start,end)+'; globalThis.testCompress = sukiCompressBackground;',env);
  return {compress:env.testCompress,get revoked(){return revoked;}};
}

test('background upload converts valid image into constrained WebP and revokes object URL',async()=>{
  const h=imageHarness();
  const result=await h.compress({type:'image/png',size:22000});
  assert.match(result,/^data:image\/webp;base64,/);
  assert.equal(h.revoked,true);
});

test('wrong ratio and SVG upload are rejected',async()=>{
  const h=imageHarness({width:1024,height:1024});
  await assert.rejects(h.compress({type:'image/jpeg',size:50000}),/Wrong proportions/);
  assert.equal(h.revoked,true);
  const other=imageHarness();
  await assert.rejects(other.compress({type:'image/svg+xml',size:1200}),/PNG, JPG, or WebP/);
});

test('oversized file is rejected before decode',async()=>{
  const h=imageHarness();
  await assert.rejects(h.compress({type:'image/png',size:7*1024*1024}),/smaller than 6 MB/);
});
