'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const app = path.resolve(__dirname, '..');
const common = fs.readFileSync(path.join(app,'js/common.js'),'utf8');
const commerce = fs.readFileSync(path.join(app,'js/vici-commerce.js'),'utf8');
const css = fs.readFileSync(path.join(app,'css/components.css'),'utf8');
const vConfirm = common.split('window.vConfirm = function(')[1].split('// ---------- FIREBASE CONFIGURATION ----------')[0];
test('global confirmation uses native dialog in browser top layer',()=>{
 assert.match(vConfirm,/nativeConfirm\s*=\s*typeof HTMLDialogElement/);
 assert.match(vConfirm,/const tag = nativeConfirm \? 'dialog' : 'div'/);
 assert.match(vConfirm,/modalEl\.showModal\(\)/);
});
test('native dialog closes before restoring focus to the editor',()=>{
 assert.match(vConfirm,/if\(nativeConfirm && modalEl\.open\) modalEl\.close\(\);\s*modalEl\.remove\(\);\s*if\(previousFocus/);
});
test('Escape and the native cancel event dismiss without accepting',()=>{
 assert.match(vConfirm,/event\.key==='Escape'.*cleanup\(false\)/);
 assert.match(vConfirm,/addEventListener\('cancel',\s*event=>\{event\.preventDefault\(\);cleanup\(false\);\}\)/);
});
test('menu removal still requires confirmation and runs the archive call once',()=>{
 assert.match(commerce,/if\(!await root\.vConfirm\('Remove menu item'/);
 assert.match(commerce,/action:'archive',placeId:place\.id,itemId:existing\.id/);
});
test('native confirmation is responsive and uses a separate backdrop',()=>{
 assert.match(css,/dialog\.vici-confirm-layer\[open\]/);
 assert.match(css,/dialog\.vici-confirm-layer::backdrop/);
});
