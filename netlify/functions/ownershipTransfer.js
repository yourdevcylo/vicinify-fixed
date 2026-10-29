const crypto=require('node:crypto');
const {services,authenticate,identifier,limit,reply}=require('./lib/admin');
const {obligation,eachPage}=require('./lib/account-deletion');
const {migrateAssets}=require('./lib/transfer-assets');
async function settled(db,id){let active=false;await eachPage(db.collection('bookings').where('placeId','==',id),doc=>{if(obligation(doc.data()))active=true;});if(active)throw Object.assign(new Error('Complete transactions and refunds before transferring this establishment.'),{status:409});}
exports.handler=async event=>{
 if(event.httpMethod!=='POST')return reply(405,{error:'POST only'});let lockedRef,lockId;
 try{
 const user=await authenticate(event);const {db,auth,storage,FieldValue}=services();const body=JSON.parse(event.body||'{}');
 if(body.action==='list'){
  const items=new Map();for(const field of ['fromUid','toUid']){const snap=await db.collection('ownership_transfers').where(field,'==',user.uid).orderBy('updatedAt','desc').limit(20).get();snap.docs.forEach(doc=>items.set(doc.id,{id:doc.id,...doc.data()}));}
  return reply(200,{transfers:[...items.values()].map(d=>({placeId:d.id,placeName:d.placeName,status:d.status,incoming:d.toUid===user.uid,recipientEmail:d.fromUid===user.uid?d.recipientEmail:undefined,fromName:d.fromName}))});
 }
 const id=identifier(body.placeId),placeRef=db.collection('places').doc(id),ref=db.collection('ownership_transfers').doc(id);
 if(body.action==='request'){
  if(Date.now()/1000-Number(user.auth_time||0)>300)return reply(401,{error:'Confirm your current password before requesting an ownership transfer.'});
  if(typeof body.email!=='string'||body.email.length>254)return reply(400,{error:'Enter the new owner email.'});await limit(user.uid,'ownership_transfer',5);
  const place=await placeRef.get();if(place.data()?.owner_uid!==user.uid)return reply(403,{error:'Only the current owner can transfer this establishment.'});
  let recipient;try{recipient=await auth.getUserByEmail(body.email.trim().toLowerCase());}catch(error){if(error.code==='auth/user-not-found')return reply(400,{error:'The recipient must have a registered, verified business account.'});throw error;}
  const recipientProfile=(await db.collection('users').doc(recipient.uid).get()).data();if(recipient.uid===user.uid||!recipient.emailVerified||recipient.disabled||recipientProfile?.role!=='business')return reply(400,{error:'Choose another verified business account.'});
  await settled(db,id);
  await db.runTransaction(async tx=>{
   const [current,previous,fromLock,toLock]=await Promise.all([tx.get(placeRef),tx.get(ref),tx.get(db.collection('account_deletions').doc(user.uid)),tx.get(db.collection('account_deletions').doc(recipient.uid))]);
   if(fromLock.exists||toLock.exists||current.data()?.owner_uid!==user.uid)throw Object.assign(new Error('Ownership or account status changed.'),{status:409});
   if(['pending','preparing'].includes(previous.data()?.status))throw Object.assign(new Error('A transfer is already pending. Cancel it before choosing another recipient.'),{status:409});
   tx.set(ref,{fromUid:user.uid,toUid:recipient.uid,recipientEmail:recipient.email,fromName:String(user.name||'Current owner').slice(0,120),placeName:current.data().name||'Establishment',status:'pending',updatedAt:FieldValue.serverTimestamp()});
  });return reply(200,{saved:true});
 }
 if(['cancel','decline'].includes(body.action)){
  await db.runTransaction(async tx=>{const transfer=(await tx.get(ref)).data();const current=await tx.get(placeRef);if(!transfer||!['pending','preparing'].includes(transfer.status)||(body.action==='cancel'?transfer.fromUid:transfer.toUid)!==user.uid)throw Object.assign(new Error('This transfer action is unavailable.'),{status:403});if(transfer.leaseUntil>Date.now())throw Object.assign(new Error('Wait for the current transfer attempt to finish before cancelling.'),{status:409});tx.update(ref,{status:body.action==='cancel'?'cancelled':'declined',updatedAt:FieldValue.serverTimestamp()});if(current.data()?.owner_uid===transfer.fromUid)tx.update(placeRef,{ownershipTransferPending:false});});return reply(200,{saved:true});
 }
 if(body.action!=='accept')return reply(400,{error:'Choose a transfer action.'});
 const profile=(await db.collection('users').doc(user.uid).get()).data();if(profile?.role!=='business')return reply(403,{error:'A business account is required.'});
 await settled(db,id);let transfer,place;lockId=crypto.randomUUID();lockedRef=ref;
 await db.runTransaction(async tx=>{
  const [record,current,lock]=await Promise.all([tx.get(ref),tx.get(placeRef),tx.get(db.collection('account_deletions').doc(user.uid))]);transfer=record.data();place=current.data();
  if(!transfer||transfer.toUid!==user.uid||!['pending','preparing'].includes(transfer.status)||place?.owner_uid!==transfer.fromUid||lock.exists)throw Object.assign(new Error('This transfer is unavailable.'),{status:409});
  if(transfer.leaseUntil>Date.now())throw Object.assign(new Error('The transfer is still processing. Wait a minute before retrying.'),{status:409});
  tx.update(ref,{status:'preparing',lease:lockId,leaseUntil:Date.now()+60000,updatedAt:FieldValue.serverTimestamp()});tx.update(placeRef,{ownershipTransferPending:true});
 });
 await settled(db,id);const assets=await migrateAssets(storage,id,transfer.fromUid,place);
 await db.runTransaction(async tx=>{
  const [record,current,fromLock,toLock,privatePlace]=await Promise.all([tx.get(ref),tx.get(placeRef),tx.get(db.collection('account_deletions').doc(transfer.fromUid)),tx.get(db.collection('account_deletions').doc(user.uid)),tx.get(db.collection('private_places').doc(id))]);
  if(record.data()?.lease!==lockId||current.data()?.owner_uid!==transfer.fromUid||fromLock.exists||toLock.exists)throw Object.assign(new Error('Transfer status changed. Retry or contact support.'),{status:409});
  tx.update(placeRef,{...assets,owner_uid:user.uid,owner_email:user.email,ownershipTransferPending:false,updatedAt:FieldValue.serverTimestamp()});
  if(privatePlace.exists)tx.update(privatePlace.ref,{owner_uid:user.uid,owner_email:user.email});
  tx.update(ref,{status:'accepted',lease:null,leaseUntil:0,recipientEmail:FieldValue.delete(),updatedAt:FieldValue.serverTimestamp()});
  tx.create(db.collection('admin_audit').doc(),{action:'OWNERSHIP_TRANSFER_ACCEPTED',target:'places',targetId:id,fromUid:transfer.fromUid,toUid:user.uid,createdAt:FieldValue.serverTimestamp()});
 });return reply(200,{saved:true});
 }catch(error){
  if(lockedRef&&lockId)try{await services().db.runTransaction(async tx=>{const record=await tx.get(lockedRef);if(record.data()?.lease===lockId)tx.update(lockedRef,{lease:null,leaseUntil:0});});}catch{}
  console.error('Ownership transfer failed:',error.code||error.status||'server_error');return reply(error.status||500,{error:error.status?error.message:'Transfer paused. The recipient can retry accepting it.'});
 }
};
