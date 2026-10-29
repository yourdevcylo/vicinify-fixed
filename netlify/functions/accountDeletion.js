const crypto=require('node:crypto');
const {services,authenticate,identifier,reply}=require('./lib/admin');
const deletion=require('./lib/account-deletion');
const LEASE=60000;
exports.handler=async event=>{
 if(event.httpMethod!=='POST')return reply(405,{error:'POST only'});
 let ref,lease;
 try{
  if((event.body||'').length>4000)return reply(413,{error:'Request too large.'});
  const body=JSON.parse(event.body||'{}'),{db}=services();
  if(body.action==='continue'){
   const uid=identifier(body.uid);ref=db.collection('account_deletions').doc(uid);
   if(typeof body.resumeToken!=='string'||body.resumeToken.length>100)return reply(403,{error:'Invalid deletion session.'});
   let job;lease=crypto.randomUUID();
   await db.runTransaction(async tx=>{const snap=await tx.get(ref);job=snap.data();if(!job||deletion.digest(body.resumeToken)!==job.tokenHash)throw Object.assign(new Error('Invalid deletion session.'),{status:403});if(job.state==='complete')return;if(job.leaseUntil>Date.now())throw Object.assign(new Error('Cleanup is still running. Wait a minute, then resume.'),{status:409});tx.update(ref,{lease,leaseUntil:Date.now()+LEASE});});
   if(job.state==='complete')return reply(200,{state:'complete'});
   // All steps are retryable. The job secret remains valid if Auth deletion succeeded but the reply was lost.
   const result=await deletion.step(services(),uid,job);
   await db.runTransaction(async tx=>{const current=(await tx.get(ref)).data();if(current.lease!==lease)throw Object.assign(new Error('Cleanup lease changed. Resume again.'),{status:409});if(result.done){tx.set(ref,{state:'complete',tokenHash:job.tokenHash,completedAt:Date.now()});return;}tx.update(ref,{phase:result.advance?job.phase+1:job.phase,cursor:result.advance?null:result.cursor||null,lease:null,leaseUntil:0,updatedAt:Date.now()});});
   return reply(200,{state:result.done?'complete':'running',phase:result.advance?job.phase+1:job.phase,total:deletion.plan(uid,job.places).length});
  }
  const user=await authenticate(event,{allowDeletion:true,allowUnverified:true});ref=db.collection('account_deletions').doc(user.uid);
  const existing=await ref.get();
  if(existing.exists){
   if(existing.data().state==='complete')return reply(200,{state:'complete'});
   if(['check','status'].includes(body.action))return reply(200,{state:'running'});
   if(body.action==='resume'){
    if(Date.now()/1000-Number(user.auth_time||0)>300)return reply(401,{error:'Sign in again before resuming deletion.'});
    const token=crypto.randomBytes(32).toString('base64url');await ref.update({tokenHash:deletion.digest(token)});return reply(200,{state:'running',uid:user.uid,resumeToken:token});
   }
   return reply(409,{error:'Deletion already started. Resume the cleanup.'});
  }
  if(body.action==='status')return reply(200,{state:'ready'});
  const check=await deletion.preflight(db,user.uid);
  if(body.action==='check')return reply(200,{state:'ready',...check});
  if(body.action!=='start')return reply(400,{error:'Choose a deletion action.'});
  if(Date.now()/1000-Number(user.auth_time||0)>300)return reply(401,{error:'Sign in again before deleting your account.'});
  if(check.blockers.length)return reply(409,{error:'Resolve account obligations before deletion.',...check});
  if(check.ownedPlaces.length&&body.closeBusinesses!==true)return reply(409,{error:'Transfer ownership first, or explicitly choose to close your establishments.',...check});
  // Verify the cleanup query and bucket access before creating an irreversible job.
  await db.collectionGroup('events').where('actorUid','==',user.uid).limit(1).get();
  try{await services().storage.bucket().getFiles({prefix:`places/${user.uid}/`,maxResults:1,autoPaginate:false});}catch(error){if(error.code!==404)throw error;}
  const token=crypto.randomBytes(32).toString('base64url');
  await ref.create({state:'running',phase:0,cursor:null,anon:'deleted_'+crypto.randomBytes(16).toString('hex'),places:check.ownedPlaces.map(p=>p.id),tokenHash:deletion.digest(token),createdAt:Date.now(),leaseUntil:0});
  // The lock is visible to client rules and all authenticated functions before the final recheck.
  const finalCheck=await deletion.preflight(db,user.uid);
  if(finalCheck.blockers.length){await ref.delete();return reply(409,{error:'An obligation changed. Resolve it before deleting.',...finalCheck});}
  return reply(200,{state:'running',uid:user.uid,resumeToken:token,phase:0,total:deletion.plan(user.uid,check.ownedPlaces.map(p=>p.id)).length});
 }catch(error){
  if(ref&&lease)try{await services().db.runTransaction(async tx=>{const current=(await tx.get(ref)).data();if(current?.lease===lease)tx.update(ref,{lease:null,leaseUntil:0});});}catch{}
  console.error('Account deletion failed:',error.code||error.status||'server_error');
  return reply(error.status||500,{error:error.status?error.message:'Account cleanup paused. Your deletion session is saved. Try resuming.'});
 }
};
