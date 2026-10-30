const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const commerce=fs.readFileSync(path.join(__dirname,'../js/vici-commerce.js'),'utf8');
const ui=fs.readFileSync(path.join(__dirname,'../js/ui.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../css/vici-chat.css'),'utf8');
test('menu form has a focusable drop area with a native fallback picker',()=>{
 assert.match(commerce,/data-menu-photo-drop role="button" tabindex="0"/);
 assert.match(commerce,/data-menu-photo-file hidden/);
 assert.match(commerce,/photoZone\.addEventListener\('keydown'/);
});
test('drop selects file for Firestore save without relying on setting input.files',()=>{
 assert.match(commerce,/photoZone\.addEventListener\('drop'/);
 assert.match(commerce,/choosePhoto\(files\[0\]\)/);
 assert.match(commerce,/const selected=selectedPhotoFile\|\|f\.elements\.photoFile\?\.files\?\.\[0\]/);
 assert.match(commerce,/photoData=await photoToFirestoreData\(selected\)/);
});
test('validation rejects other files, oversized files and multi-drop',()=>{
 assert.match(commerce,/\['image\/jpeg','image\/png','image\/webp'\]/);
 assert.match(commerce,/file\.size>5\*1024\*1024/);
 assert.match(commerce,/if\(files\.length!==1\)/);
});
test('invalid file cannot leave old dropped selection pending save',()=>{
 assert.match(commerce,/function rejectPhoto\(message\)/);
 assert.match(commerce,/selectedPhotoFile=null;photoInput\.value='';showPhotoPreview\(\)/);
});
test('preview and drop styles clean up on replace/close',()=>{
 assert.match(commerce,/URL\.createObjectURL\(selectedPhotoFile\)/);
 assert.match(commerce,/URL\.revokeObjectURL\(previewObjectUrl\)/);
 assert.match(commerce,/d\.addEventListener\('close',releasePreview/);
 assert.match(css,/commerce-photo-preview/);
 assert.match(css,/commerce-photo-dropzone\.is-dragover/);
});
test('normal photo picker enhancer does not override menu dropzone',()=>{
 assert.match(ui,/input\.closest\('\.commerce-photo-dropzone'\)/);
});
