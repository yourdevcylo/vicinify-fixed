const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,updateDoc,writeBatch,collection,query,where,getDocs,serverTimestamp}=require('firebase/firestore');
const fs=require('node:fs'),path=require('node:path');
let env;
const projectId='demo-vicinify';
const verified={email_verified:true};
const dbFor=uid=>env.authenticatedContext(uid,verified).firestore();
async function gatedWrite(uid,scope,id,data) {
 const db=dbFor(uid),batch=writeBatch(db),collectionName=scope==='menu'?'place_posts':scope==='buzz'?'buzz_posts':'messages';
 if(collectionName==='messages'){
  const gate=doc(db,'message_limits',uid),snap=await getDoc(gate),old=snap.exists()?snap.data():null;
  const reset=!old||Date.now()-old.windowStartedAt.toMillis()>=60000;
  batch.set(gate,{uid,targetId:id,at:serverTimestamp(),windowStartedAt:reset?serverTimestamp():old.windowStartedAt,count:reset?1:old.count+1});
 }else batch.set(doc(db,'write_cooldowns',uid+'_'+scope),{uid,scope,targetId:id,at:serverTimestamp()});
 batch.set(doc(db,collectionName,id),{...(scope==='buzz'?{type:'general'}:{}),...data,createdAt:serverTimestamp()});return batch.commit();
}
before(async()=>{
 env=await initializeTestEnvironment({projectId,firestore:{rules:fs.readFileSync(path.join(__dirname,'../firestore.rules'),'utf8')},storage:{rules:fs.readFileSync(path.join(__dirname,'../storage.rules'),'utf8')}});
 await env.clearFirestore();
 await env.withSecurityRulesDisabled(async ctx=>{
  const db=ctx.firestore();
  for(const [id,data] of Object.entries({
   'users/customer':{uid:'customer',role:'user',email:'private@example.test'},
   'users/owner':{uid:'owner',role:'user'},
   'places/shop':{owner_uid:'owner',addedBy:'owner',approval_status:'approved',name:'Shop',refund_percent:35,reviewCount:0,ratingSum:0},
   'places/pending':{owner_uid:null,addedBy:'owner',approval_status:'pending'},
   'reviews/private':{userId:'customer',placeId:'shop',isPublic:false,rating:4},
   'reviews/public':{userId:'customer',placeId:'shop',isPublic:true,rating:5},
   'bookings/order':{userId:'customer',placeId:'shop',status:'accepted',refundPercent:35,transactionId:'order'},
   'messages/text':{userId:'customer',placeId:'shop',senderUid:'owner',createdBy:'owner',senderRole:'owner',type:'text',text:'Hello',status:'sent'},
   'messages/card':{userId:'customer',placeId:'shop',senderUid:'customer',createdBy:'customer',senderRole:'customer',type:'booking_card',bookingId:'order',transactionId:'order',status:'accepted',bookingStatus:'accepted',refundPercent:35},
   'buzz_posts/post':{authorUid:'owner',body:'Hello',likes:0,likedBy:[],comments:[]},
   'business_claims/claim':{userId:'customer',status:'pending'}
  }))await setDoc(doc(db,id),data);
 });
});
after(async()=>{await env?.cleanup();});
test('private profiles and pending listings cannot be read by outsiders',async()=>{
 await assertFails(getDoc(doc(dbFor('stranger'),'users/customer')));
 await assertSucceeds(getDoc(doc(dbFor('customer'),'users/customer')));
 await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'places/pending')));
 await assertSucceeds(getDoc(doc(env.unauthenticatedContext().firestore(),'places/shop')));
});
test('public profile projection is limited to a display name',async()=>{
 await assertSucceeds(setDoc(doc(dbFor('customer'),'public_profiles/customer'),{fullName:'Test'}));
 await assertFails(setDoc(doc(dbFor('customer'),'public_profiles/customer'),{fullName:'Test',email:'secret'}));
});
test('private feedback stays private including public queries',async()=>{
 const publicDb=env.unauthenticatedContext().firestore();
 await assertFails(getDoc(doc(publicDb,'reviews/private')));
 await assertSucceeds(getDoc(doc(dbFor('customer'),'reviews/private')));
 await assertSucceeds(getDoc(doc(dbFor('owner'),'reviews/private')));
 await assertSucceeds(getDocs(query(collection(publicDb,'reviews'),where('isPublic','==',true))));
 await assertFails(setDoc(doc(dbFor('customer'),'reviews/forged'),{userId:'customer',rating:5,placeId:'shop',verifiedTransaction:true}));
});
test('trust and rating fields cannot be forged',async()=>{
 await assertFails(updateDoc(doc(dbFor('customer'),'places/shop'),{avgRating:5}));
 await assertFails(updateDoc(doc(dbFor('owner'),'places/shop'),{ratingSum:500}));
 await assertFails(setDoc(doc(dbFor('customer'),'places/fake'),{name:'Fake',addedBy:'customer',owner_uid:null,approval_status:'pending',is_verified:true}));
});
test('booking and card creation cannot bypass the server endpoint',async()=>{
 const db=dbFor('customer');const batch=writeBatch(db);
 const order={userId:'customer',placeId:'shop',status:'pending',refundPercent:35,transactionId:'neworder'};
 batch.set(doc(db,'bookings/neworder'),order);
 batch.set(doc(db,'messages/newcard'),{...order,type:'booking_card',bookingId:'neworder',bookingStatus:'pending',senderUid:'customer',createdBy:'customer',senderRole:'customer',createdAt:serverTimestamp()});
 await assertFails(batch.commit());
 await assertFails(setDoc(doc(db,'bookings/badrefund'),{...order,transactionId:'badrefund',refundPercent:100}));
 await assertFails(updateDoc(doc(db,'bookings/order'),{status:'received'}));
 await assertFails(updateDoc(doc(db,'bookings/order'),{refundPercent:100}));
});
test('message identities, text content and canonical card state are protected',async()=>{
 const db=dbFor('customer');
 await assertFails(setDoc(doc(db,'messages/forged'),{userId:'customer',placeId:'shop',senderUid:'owner',createdBy:'owner',senderRole:'owner',type:'text'}));
 await assertFails(updateDoc(doc(db,'messages/text'),{text:'Forged'}));
 await assertFails(updateDoc(doc(db,'messages/card'),{status:'received',bookingStatus:'received'}));
 await assertSucceeds(updateDoc(doc(db,'messages/text'),{status:'seen'}));
 await assertSucceeds(updateDoc(doc(db,'messages/card'),{customerReadBy:['customer'],customerReadAt:new Date()}));
});
test('Buzz users may change only their own reaction and append their own comments',async()=>{
 const db=dbFor('customer'),ref=doc(db,'buzz_posts/post');
 await assertSucceeds(updateDoc(ref,{likes:1,likedBy:['customer']}));
 await assertFails(updateDoc(ref,{likes:2,likedBy:['customer','stranger']}));
 const comment={authorUid:'customer',authorName:'C',text:'Hello',createdAt:1};
 const commentBatch=writeBatch(db);
 commentBatch.set(doc(db,'write_cooldowns/customer_comment'),{uid:'customer',scope:'comment',targetId:'post',at:serverTimestamp()});
 commentBatch.update(ref,{comments:[comment]});await assertSucceeds(commentBatch.commit());
 await assertFails(updateDoc(ref,{comments:[{...comment,text:'Rewritten'}]}));
 await assertFails(updateDoc(doc(db,'business_claims/claim'),{status:'approved'}));
});
test('server booking transaction authorizes actors and mirrors canonical state',async()=>{
 const adminApp=require('firebase-admin/app'),firestore=require('firebase-admin/firestore');
 const app=adminApp.initializeApp({projectId},'integration');
 const db=firestore.getFirestore(app);
 const helpers=require('../netlify/functions/lib/admin');
 const originals={...helpers};let actor='customer';
 helpers.services=()=>({db,FieldValue:firestore.FieldValue});
 helpers.authenticate=async()=>({uid:actor,email_verified:true});
 helpers.limit=async()=>{};
 try {
  const handler=require('../netlify/functions/booking').handler;
  const call=patch=>handler({httpMethod:'POST',body:JSON.stringify({bookingId:'order',patch}),headers:{}});
  assert.equal((await call({status:'accepted'})).statusCode,200);
  actor='stranger';assert.equal((await call({status:'fulfilled'})).statusCode,403);
  actor='owner';assert.equal((await call({status:'fulfilled'})).statusCode,200);
  actor='customer';assert.equal((await call({status:'received'})).statusCode,200);
  assert.equal((await db.doc('messages/card').get()).data().bookingStatus,'received');
  const review=require('../netlify/functions/review').handler;
  const submit=rating=>review({httpMethod:'POST',body:JSON.stringify({placeId:'shop',bookingId:'order',rating,isPublic:false}),headers:{}});
  assert.equal((await submit(5)).statusCode,200);
  assert.equal((await submit(3)).statusCode,200);
  const place=(await db.doc('places/shop').get()).data();
  assert.equal(place.reviewCount,1);assert.equal(place.ratingSum,3);
 } finally {Object.assign(helpers,originals);await adminApp.deleteApp(app);}
});


test('pending bookings cannot smuggle confirmed payments or target own/unapproved business',async()=>{
 const db=dbFor('customer');
 const base={userId:'customer',placeId:'shop',status:'pending',refundPercent:35,transactionId:'spoof'};
 for(const field of ['paymentStatus','paymentReference','paymentAmount','paymentVerifiedAt','paymentReviewedBy'])
  await assertFails(setDoc(doc(db,'bookings/spoof'),{...base,[field]:'confirmed'}));
 await assertFails(setDoc(doc(db,'bookings/unapproved'),{...base,placeId:'pending',transactionId:'unapproved',refundPercent:50}));
 await assertFails(setDoc(doc(dbFor('owner'),'bookings/self'),{...base,userId:'owner',transactionId:'self'}));
});
test('business cannot forge canonical card payment state through auxiliary message updates',async()=>{
 await assertFails(updateDoc(doc(dbFor('owner'),'messages/card'),{paymentStatus:'confirmed'}));
 await assertFails(updateDoc(doc(dbFor('owner'),'messages/card'),{transactionStatus:'delivered'}));
});
test('business cannot transfer a public post to another establishment',async()=>{
 const db=dbFor('owner');
 await assertSucceeds(gatedWrite('owner','menu','ownpost',{placeId:'shop',body:'Menu'}));
 await assertFails(updateDoc(doc(db,'place_posts/ownpost'),{placeId:'pending',body:'Forged menu'}));
});
test('chat text requires real sender, server timestamp, and bounded content',async()=>{
 const db=dbFor('customer');const base={placeId:'shop',userId:'customer',senderUid:'customer',createdBy:'customer',senderRole:'customer',type:'text',status:'sent',createdAt:serverTimestamp()};
 await assertSucceeds(gatedWrite('customer','chat','validtext',{...base,text:'Hello'}));
 await assertFails(setDoc(doc(db,'messages/longtext'),{...base,text:'x'.repeat(4001)}));
 await assertFails(setDoc(doc(db,'messages/backdated'),{...base,text:'Hello',createdAt:new Date(2000,0,1)}));
});

test('cleanup is account-scoped and cannot hide active bookings or other participants',async()=>{
 const db=dbFor('owner');
 await assertFails(updateDoc(doc(db,'bookings/order'),{deletedBy:['customer','owner_deleted']}));
 await assertFails(updateDoc(doc(db,'messages/text'),{deletedBy:['owner','owner_deleted']}));
 await assertSucceeds(updateDoc(doc(db,'messages/text'),{deletedBy:['owner']}));
});

test('storage rejects cross-account uploads and all public access to payment proofs',async()=>{
 const {ref,uploadBytes,getBytes}=require('firebase/storage');
 const own=env.authenticatedContext('customer',verified).storage();
 const image=new Uint8Array([255,216,255,217]);
 await assertSucceeds(uploadBytes(ref(own,'places/customer/photo.jpg'),image,{contentType:'image/jpeg'}));
 await assertFails(uploadBytes(ref(own,'places/owner/photo.jpg'),image,{contentType:'image/jpeg'}));
 await assertFails(uploadBytes(ref(own,'places/customer/file.svg'),image,{contentType:'image/svg+xml'}));
 await assertFails(uploadBytes(ref(own,'payment_proofs/order/proof.jpg'),image,{contentType:'image/jpeg'}));
 await assertFails(getBytes(ref(env.unauthenticatedContext().storage(),'payment_proofs/order/proof.jpg')));
});

test('private ownership contact data is not readable by customers or business accounts',async()=>{
 await env.withSecurityRulesDisabled(async ctx=>setDoc(doc(ctx.firestore(),'private_places/shop'),{owner_email:'private@example.test'}));
 await assertFails(getDoc(doc(dbFor('customer'),'private_places/shop')));
 await assertFails(getDoc(doc(dbFor('owner'),'private_places/shop')));
 await assertFails(setDoc(doc(dbFor('owner'),'private_places/shop'),{owner_email:'forged'}));
});

test('console writes cannot skip message gates, exceed word limits or send a burst',async()=>{
 const uid='limituser',db=dbFor(uid),base={placeId:'shop',userId:uid,senderUid:uid,createdBy:uid,senderRole:'customer',type:'text',status:'sent',text:'Hello',createdAt:serverTimestamp()};
 await assertFails(setDoc(doc(db,'messages/directbypass'),base));
 await assertSucceeds(gatedWrite(uid,'chat','firstvalid',base));
 await assertFails(gatedWrite(uid,'chat','secondfast',base));
 await assertFails(updateDoc(doc(db,'message_limits',uid),{count:0}));
 await assertFails(updateDoc(doc(db,'message_limits',uid),{at:new Date(2000,0,1)}));
 const wordUid='worduser',words={...base,userId:wordUid,senderUid:wordUid,createdBy:wordUid,text:Array(301).fill('a').join(' ')};
 await assertFails(gatedWrite(wordUid,'chat','wordoverflow',words));
});
test('console writes cannot bypass name or post limits',async()=>{
 await assertFails(updateDoc(doc(dbFor('customer'),'users/customer'),{fullName:'a'.repeat(81)}));
 await assertFails(updateDoc(doc(dbFor('customer'),'users/customer'),{fullName:Array(13).fill('ab').join(' ')}));
 await assertFails(gatedWrite('customer','buzz','manywords',{authorUid:'customer',body:Array(101).fill('ab').join(' '),likes:0,likedBy:[],comments:[]}));
 await assertFails(gatedWrite('customer','buzz','unicodewords',{authorUid:'customer',body:Array(101).fill('ab').join('\u00a0'),likes:0,likedBy:[],comments:[]}));
 await assertFails(gatedWrite('customer','buzz','padding',{authorUid:'customer',body:'  a  ',likes:0,likedBy:[],comments:[]}));
 await assertSucceeds(gatedWrite('postuser','buzz','validpost',{authorUid:'postuser',body:'Hello neighborhood',likes:0,likedBy:[],comments:[]}));
 await assertFails(gatedWrite('postuser','buzz','burstpost',{authorUid:'postuser',body:'Second post too soon',likes:0,likedBy:[],comments:[]}));
});

test('editing the console cannot promote a standard account or create another identity',async()=>{
 const db=dbFor('customer');
 await assertFails(updateDoc(doc(db,'users/customer'),{role:'admin'}));
 await assertFails(updateDoc(doc(db,'users/customer'),{uid:'owner'}));
 await assertFails(setDoc(doc(dbFor('newuser'),'users/newuser'),{uid:'newuser',role:'admin',fullName:'New User'}));
 await assertFails(setDoc(doc(dbFor('newuser'),'users/victim'),{uid:'victim',role:'user',fullName:'New User'}));
 await assertSucceeds(setDoc(doc(dbFor('newuser'),'users/newuser'),{uid:'newuser',role:'user',fullName:'New User'}));
});

test('reply edits cannot evade message length and gate requirements',async()=>{
 await assertFails(updateDoc(doc(dbFor('owner'),'messages/text'),{reply:'a'.repeat(2001)}));
 await assertFails(updateDoc(doc(dbFor('owner'),'messages/text'),{reply:'Direct edit without a gate'}));
});

test('only the business can configure bounded auto replies; customers cannot forge automatic messages',async()=>{
 const db=dbFor('owner');
 await assertSucceeds(updateDoc(doc(db,'places/shop'),{auto_reply_enabled:true,auto_reply_answers:{menu:'Please view our saved menu.'}}));
 await assertFails(updateDoc(doc(dbFor('customer'),'places/shop'),{auto_reply_enabled:true}));
 await assertFails(updateDoc(doc(db,'places/shop'),{auto_reply_enabled:'yes'}));
 await assertFails(updateDoc(doc(db,'places/shop'),{auto_reply_answers:{menu:'a'.repeat(501)}}));
 await assertFails(updateDoc(doc(db,'places/shop'),{auto_reply_answers:{other:'Unknown FAQ'}}));
 const uid='faq-user',data={userId:uid,placeId:'shop',senderUid:uid,createdBy:uid,senderRole:'customer',type:'text',status:'sent',text:'Hi! Can I see your menu, please?',quickQuestion:'menu'};
 await assertFails(gatedWrite(uid,'chat','forgedauto',{...data,isAutoReply:true}));
 await assertSucceeds(gatedWrite(uid,'chat','validfaq',data));
});

test('deleting accounts cannot write, recreate profiles, upload or self-transfer ownership',async()=>{
 const {deleteDoc}=require('firebase/firestore'),{ref,uploadBytes}=require('firebase/storage');
 await env.withSecurityRulesDisabled(async ctx=>{await setDoc(doc(ctx.firestore(),'users/deleting'),{uid:'deleting',role:'user',fullName:'Deleting User'});await setDoc(doc(ctx.firestore(),'account_deletions/deleting'),{state:'running'});});
 await assertFails(updateDoc(doc(dbFor('deleting'),'users/deleting'),{fullName:'Changed Name'}));
 await assertFails(setDoc(doc(dbFor('deleting'),'ownership_transfers/shop'),{fromUid:'deleting',toUid:'other',status:'accepted'}));
 await assertFails(setDoc(doc(dbFor('deleting'),'account_deletions/deleting'),{state:'complete'}));
 await assertFails(deleteDoc(doc(dbFor('customer'),'users/customer')));
 await assertFails(uploadBytes(ref(env.authenticatedContext('deleting',verified).storage(),'places/deleting/photo.jpg'),new Uint8Array([255,216,255,217]),{contentType:'image/jpeg'}));
});
test('closed-owner tombstones expose only server-sanitized listing records for retained transaction history',async()=>{await env.withSecurityRulesDisabled(async ctx=>setDoc(doc(ctx.firestore(),'places/closed_deleted'),{name:'Closed establishment',owner_uid:'deleted_random',approval_status:'archived',status:'closed',accountDeleted:true}));await assertSucceeds(getDoc(doc(env.unauthenticatedContext().firestore(),'places/closed_deleted')));await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'places/pending')));});
