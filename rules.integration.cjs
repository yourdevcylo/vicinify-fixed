const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,updateDoc,writeBatch,collection,query,where,getDocs}=require('firebase/firestore');
const fs=require('node:fs'),path=require('node:path');
let env;
const projectId='demo-vicinify';
const verified={email_verified:true};
const dbFor=uid=>env.authenticatedContext(uid,verified).firestore();
before(async()=>{
 env=await initializeTestEnvironment({projectId,firestore:{rules:fs.readFileSync(path.join(__dirname,'../firestore.rules'),'utf8')}});
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
test('booking and card create succeeds atomically but refund spoof fails',async()=>{
 const db=dbFor('customer');const batch=writeBatch(db);
 const order={userId:'customer',placeId:'shop',status:'pending',refundPercent:35,transactionId:'neworder'};
 batch.set(doc(db,'bookings/neworder'),order);
 batch.set(doc(db,'messages/newcard'),{...order,type:'booking_card',bookingId:'neworder',bookingStatus:'pending',senderUid:'customer',createdBy:'customer',senderRole:'customer'});
 await assertSucceeds(batch.commit());
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
 await assertSucceeds(updateDoc(ref,{comments:[comment]}));
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

