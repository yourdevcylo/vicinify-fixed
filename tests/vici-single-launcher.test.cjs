const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const read = file=>fs.readFileSync(path.join(root,file),'utf8');

test('one AI launcher is linked from the map, with no floating script or minimize control',()=>{
 const html=read('index.html'),chat=read('js/vici-chat.js'),map=read('js/map.js'),sw=read('sw.js');
 assert.equal((html.match(/id="openViciChatBtn"/g)||[]).length,1);
 assert(html.includes('onclick="window.toggleViciAI(true)"'));
 assert(!html.includes('src="js/vici-launcher.js'));
 assert(!sw.includes('"./js/vici-launcher.js'));
 assert(!map.includes('ensureViciAIBubble()'));
 assert(!map.includes('FloatingVici?.mount'));
 assert(!chat.includes('data-action="minimize"'));
 assert(!chat.includes("resume=document.createElement('button')"));
 assert(!html.includes('VICINIFY_MOBILE_AI_UI_20261030'));
});
test('map location button remains a geolocation button after removing duplicate AI launcher',()=>{
 const html=read('index.html'),map=read('js/map.js');
 assert.match(html, /id="locateBtn"[^>]*aria-label="Use my location"/);
 assert.match(map,/if \(locateBtn\)\s*\{\s*locateBtn\.addEventListener\("click", locate\)/);
 assert(!map.includes('locateBtn.classList.add("vici-ai-bubble-launcher")'));
});
test('chat open/close hides dialog/backdrop, removes legacy resume and preserves session',()=>{
 const chat=read('js/vici-chat.js');
 const begin=chat.indexOf('    function open() {'),end=chat.indexOf('    async function send(',begin);
 assert(begin>=0 && end>begin);
 const history={removed:false};
 const legacy={remove(){history.removed=true;}};
 const panel={hidden:true,classList:{values:new Set(['hidden']),remove(v){this.values.delete(v)},add(v){this.values.add(v)}}};
 const backdrop={hidden:true};
 let renderCalls=0,focusCalls=0,stopCalls=0;
 const ctx={
  panel,backdrop,
  document:{getElementById:id=>id==='viciAiResume'?legacy:null,activeElement:{focus(){focusCalls++}}},
  ensure:()=>panel,syncOwner:()=>{},render:()=>{renderCalls++},
  root:{PlacePreview:{close:()=>{}}},
  previousFocus:{focus(){focusCalls++}},stopStatuses:()=>{stopCalls++}
 };
 vm.createContext(ctx);vm.runInContext(chat.slice(begin,end),ctx);
 ctx.open();assert.equal(panel.hidden,false);assert.equal(backdrop.hidden,false);
 ctx.close();assert.equal(panel.hidden,true);assert.equal(backdrop.hidden,true);
 assert(panel.classList.values.has('hidden'));
 assert(history.removed);
 ctx.open();assert.equal(panel.hidden,false);assert.equal(renderCalls,2);
 ctx.close();assert.equal(stopCalls,2);assert.equal(focusCalls,2);
});
test('built HTML points to current fingerprinted Vici chat script and SW cache',()=>{
 const html=read('dist/index.html'),sw=read('dist/sw.js');
 const match=html.match(/js\/vici-chat\.js\?v=(VICI_[a-f0-9]{16})/);
 assert(match,'build must fingerprint vici-chat.js');
 assert(sw.includes(`js/vici-chat.js?v=${match[1]}`));
 assert(!sw.includes('vici-launcher.js'));
});
