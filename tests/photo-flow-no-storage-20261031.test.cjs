const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root,name),'utf8');
const rules = read('firestore.rules');
const common = read('js/common.js');
const map = read('js/map.js');
const buzz = read('js/buzz.js');

test('photo submission uses Firestore without Firebase Storage on all public posting surfaces',()=>{
 assert.match(map,/mediaUrl\s*=\s*await placePostPhotoDataUrl\(file\)/);
 const placePublish=map.slice(map.indexOf('window.submitPlacePost ='),map.indexOf('window.closePlacePostMenus ='));
 assert.doesNotMatch(placePublish,/storage\.ref|uploadImageFileToStorage|uploadFileToStorage/);
 assert.match(placePublish,/await window\.ContentPolicy\.create\(window\.db, 'place_posts'/);
 assert.match(map,/sharePublishedPlacePost/);
 assert.match(buzz,/optimizeBuzzPhoto\(selectedMediaFile\)/);
 assert.match(buzz,/hasInlineMedia:\s*!!inlineMedia/);
 assert.match(buzz,/mediaDataUrl:inlineMedia/);
 assert.doesNotMatch(buzz,/storage\.ref|uploadImageFileToStorage/);
});
test('Buzz photos use an atomic private writer and publicly viewable small media',()=>{
 const policy=read('js/content-policy.js');
 assert.match(policy,/batch\.set\(db\.collection\('buzz_media'\)\.doc\(ref\.id\)/);
 assert.match(policy,/batch\.set\(ref,payload\);await batch\.commit\(\)/);
 assert.match(rules,/match \/buzz_media\/\{postId\}/);
 assert.match(rules,/getAfter\(\/databases\/\$\(database\)\/documents\/buzz_posts\/\$\(postId\)\)/);
 assert.match(buzz,/resolveSharedPlacePhotos/);
 assert.match(buzz,/resolveInlineBuzzPhotos/);
 assert.match(buzz,/!postBodyEl\?\.value\.trim\(\) && !selectedMediaFile/);
 assert.match(buzz,/if \(mediaSnap\.exists\) batch\.delete\(media\)/);
});
test('Buzz personal mode does not borrow business credentials',()=>{
 assert.match(buzz,/const selectedBizId = isBusinessPost \?/);
 assert.match(buzz,/isBusinessPost:\s*isBusinessPost/);
 assert.match(buzz,/establishmentId: isBusinessPost \? selectedBizId : null/);
 assert.match(buzz,/toggleBtn\.setAttribute\("aria-pressed", String\(isBusinessPost\)\)/);
 assert.match(rules,/!request\.resource\.data\.get\("isBusinessPost",false\)/);
});
test('chat photos are visible only to conversation participants and bounded to 62k WebP',()=>{
 assert.match(read('index.html'),/id="chatPhotoFile"/);
 assert.match(common,/window\.clearChatPhoto/);
 assert.match(common,/window\.viciPhotoToInlineData\(photoFile, 62000\)/);
 assert.match(common,/\.\.\.\(inlinePhoto \? \{photoData:inlinePhoto\} : \{\}\)/);
 assert.match(common,/class="chat-attachment-image"/);
 assert.match(rules,/request\.resource\.data\.photoData\.size\(\) <= 62000/);
 assert.match(rules,/match \/messages\/\{msgId\}/);
 assert.match(rules,/allow read: if participant\(\)/);
 assert.match(rules,/\'photoData\'\]\)\)\)/);
});
test('all client uploaded photos are decoded and re-encoded before Firestore storage',()=>{
 assert.match(common,/window\.compressImageFile = async function/);
 assert.match(common,/Invalid photo content/);
 assert.match(common,/image\/webp/);
 assert.match(common,/window\.viciPhotoToInlineData/);
 assert.match(common,/typeof createImageBitmap === 'function'/);
 assert.match(read('js/add.js'),/photos\.push\(await window\.viciPhotoToInlineData\(file, 34000\)\)/);
 assert.match(read('js/add.js'),/const logoUrl = logoFile \? await window\.viciPhotoToInlineData/);
 assert.match(read('js/vici-commerce.js'),/photoToFirestoreData/);
 assert.match(read('js/dashboard.js'),/webp|WebP|photo/i);
});
test('payment receipts are protected by server auth with no Storage bucket',()=>{
 const proof=read('netlify/functions/proof.js');
 assert.doesNotMatch(proof,/storage\.bucket\(\)/);
 assert.match(proof,/db\.collection\('payment_proofs'\)\.doc\(bookingId\)/);
 assert.match(proof,/imageBase64:bytes\.toString\('base64'\)/);
 assert.match(proof,/order\.userId !== user\.uid && place\.data\(\)\?\.owner_uid !== user\.uid/);
 assert.match(proof,/transaction\.set\(db\.collection\('payment_proofs'\)/);
 assert.match(rules,/match \/payment_proofs\/\{bookingId\} \{ allow read, write: if false; \}/);
 assert.match(common,/compressPaymentReceipt/);
 assert.match(common,/for\(const \[width,quality\] of \[\[900/);
});
test('published photos and chat attachments do not become unsafe URL schemes',()=>{
 assert.match(common,/safeImageUrl\(rawUrl\)/);
 assert.match(common,/data:image\\\/\(png\|jpe\?g\|webp\|gif\)/);
 assert.match(common,/escapeHtml\(d\.photoData\)/);
});
test('photo-only Buzz posting has a nonempty default caption for existing posting rules',()=>{
 assert.match(buzz,/rawBody \|\| \(selectedMediaFile \? 'Photo update' : ''\)/);
});

function makeProof() {
 let receipt;
 const reads=[];const writes=[];
 const order={ userId:'customer',status:'accepted',placeId:'place',paymentAmountDue:'50.00',paymentFlowVersion:1};
 const proofRef={kind:'proof'};
 const bookingRef={kind:'booking',get:async()=>({exists:true,data:()=>order})};
 const placeRef={kind:'place',get:async()=>({data:()=>({owner_uid:'owner'})})};
 const query={kind:'cards'};
 const db={
  collection(name){return {doc(id){return name==='bookings'?bookingRef:name==='places'?placeRef:({...proofRef,id})},where(){return {where(){return {limit(){return query}}}}}}},
  runTransaction:async fn=>fn({get:async obj=>obj===bookingRef?{data:()=>order}:obj===query?{docs:[],forEach() {}}:{data:()=>null},update:(...args)=>writes.push(['update',...args]),set:(ref,payload)=>{writes.push(['set',ref,payload]);if(ref.kind==='proof')receipt=payload},delete:ref=>writes.push(['delete',ref])})
 };
 const env={
  services:()=>({db,FieldValue:{delete:()=>({delete:true}),serverTimestamp:()=>99}}),
  authenticate:async()=>({uid:'customer'}),
  identifier:x=>x,
  limit:async()=>{},
  reply:(statusCode,data)=>({statusCode,body:JSON.stringify(data)})
 };
 const pay={isOnline:()=>true,details:(ref,amount)=>({paymentReference:ref,paymentAmount:String(amount)}),flow:()=>({requirementsReady:true})};
 const mod={exports:{}};
 vm.runInNewContext(read('netlify/functions/proof.js'),{
  module:mod,exports:mod.exports,require:name=>name==='node:crypto'?require('node:crypto'):name==='../../js/payment-policy'?pay:env,Buffer,console
 });
 return {handler:mod.exports.handler,reads,writes,get receipt(){return receipt}};
}
test('private receipt uploads atomically save an image in Firestore, not Storage',async()=>{
 const p=makeProof();const raw=Buffer.from([255,216,255,4,5,6,7,8,9]);
 const result=await p.handler({httpMethod:'POST',body:JSON.stringify({action:'upload',bookingId:'book1',reference:'TX',amount:'50.00',image:'data:image/jpeg;base64,'+raw.toString('base64')})});
 assert.equal(result.statusCode,200,result.body);
 assert.ok(p.receipt?.imageBase64);
 assert.deepEqual(Buffer.from(p.receipt.imageBase64,'base64'),raw);
 assert.match(p.receipt.objectPath,/^payment_proofs\/book1\/[a-f0-9]{64}\.jpg$/);
 assert(p.writes.some(row=>row[0]==='update'&&row[2].paymentProofPath===p.receipt.objectPath));
});
test('oversized receipt fails before any database mutation',async()=>{
 const p=makeProof();const raw=Buffer.alloc(450001,88);raw[0]=255;raw[1]=216;raw[2]=255;
 const result=await p.handler({httpMethod:'POST',body:JSON.stringify({bookingId:'book1',reference:'TX',amount:'50.00',image:'data:image/jpeg;base64,'+raw.toString('base64')})});
 assert.equal(result.statusCode,400);
 assert.equal(p.writes.length,0);
});
