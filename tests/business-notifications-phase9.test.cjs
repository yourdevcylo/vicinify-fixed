'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),Module=require('node:module');
const docs=new Map();let actor={uid:'applicant',email:'owner@example.com',email_verified:true};
const FieldValue={serverTimestamp:()=>new Date('2026-11-24T00:00:00Z')};
function snapshot(k){const x=docs.get(k);return {id:k.split('/').at(-1),exists:x!==undefined,data:()=>x===undefined?undefined:structuredClone(x)};}
function reference(collection,id){const k=collection+'/'+id;return {id,key:k,get:async()=>snapshot(k),set:async(data,opts={})=>docs.set(k,structuredClone(opts.merge?{...docs.get(k),...data}:data)),update:async(data)=>docs.set(k,structuredClone({...docs.get(k),...data}))};}
const db={collection(name){return {doc(id='random') {return reference(name,id);},limit(){return {get:async()=>({docs:[...docs.keys()].filter(k=>k.startsWith(name+'/')).map(snapshot)})};}}},async runTransaction(fn){return await fn({get:ref=>ref.get(),set:(ref,data,opts)=>ref.set(data,opts),update:(ref,data)=>ref.update(data),create:(ref,data)=>ref.set(data)});}};
const fake={services:()=>({db,auth:{getUser:async uid=>({uid,email:'owner@example.com',emailVerified:true,disabled:false})}}),authenticate:async()=>actor,limit:async()=>{},reply:(statusCode,data)=>({statusCode,body:JSON.stringify(data)})};
const original=Module._load;Module._load=function(request,parent,...rest){if(request==='firebase-admin/firestore')return {FieldValue};if(request==='./lib/admin'&&parent?.filename?.includes('/netlify/functions/'))return fake;return original.call(this,request,parent,...rest)};
const service=require('../netlify/functions/businessRegistration');
const email=require('../netlify/functions/lib/business-notifications');
Module._load=original;
const post=(action,extra={})=>({httpMethod:'POST',body:JSON.stringify({action,...extra})});
async function call(action,extra){const response=await service.handler(post(action,extra));return {httpStatus:response.statusCode,...JSON.parse(response.body)};}
const details={legalName:'Lipa Food Services',tradeName:'Lipa Eatery',registrationType:'sole_proprietorship',registrationNumber:'REG-01',permitNumber:'BIZ-05',permitExpiry:'2099-01-01',representativeName:'Owner',contactNumber:'09123456789',representativeRole:'owner',barangay:'Sabang',address:'Sabang, Lipa City'};
const docBuf=Buffer.from('%PDF-1.7 mock file').toString('base64');
const envKeys=['RESEND_API_KEY','VICINIFY_FROM_EMAIL'];const originalEnv=envKeys.map(k=>process.env[k]);
test('application submit creates private timeline even with no email configuration',async()=>{
 delete process.env.RESEND_API_KEY;delete process.env.VICINIFY_FROM_EMAIL;
 assert.equal((await call('save',{details})).httpStatus,200);
 for(const kind of ['mayor_permit','registration_certificate','barangay_clearance']){
  assert.equal((await call('upload',{kind,mimeType:'application/pdf',base64:docBuf,filename:'test.pdf'})).httpStatus,200);
 }
 const result=await call('submit',{details,agreed:true});
 assert.equal(result.httpStatus,200);
 assert.equal(docs.get('business_applications/applicant').status,'pending');
 assert.equal(docs.get('business_applications/applicant').notificationStatus,'not_configured');
 const status=await call('status');
 assert.equal(status.application.notifications.length,1);
 assert.deepEqual(status.application.notifications.map(x=>x.type),['submitted']);
 assert.equal(status.application.notifications[0].deliveryStatus,'not_configured');
 assert.ok(!JSON.stringify(status.application).includes(docBuf));
});
test('other applicant cannot read application updates',async()=>{
 actor={uid:'other',email:'another@example.com'};
 assert.equal((await call('status')).application,null);
 assert.equal((await call('list')).httpStatus,403);
});
test('admin can retry submitted receipt and Resend request has idempotency key',async()=>{
 actor={uid:'admin',email:'admin@example.com'};docs.set('users/admin',{role:'admin'});
 process.env.RESEND_API_KEY='fake-key';process.env.VICINIFY_FROM_EMAIL='Vicinify <noreply@example.com>';
 let sends=0;const prevFetch=global.fetch;
 global.fetch=async(url,options)=>{sends++;assert.equal(url,'https://api.resend.com/emails');assert.match(options.headers['Idempotency-Key'],/^vicinify-business-/);const body=JSON.parse(options.body);assert.equal(body.to[0],'owner@example.com');assert.match(body.subject,/received/);return {ok:true,status:200};};
 try{
  const retry=await call('retryEmail',{uid:'applicant'});
  assert.equal(retry.notificationStatus,'sent');assert.equal(sends,1);
  assert.equal(docs.get('business_applications/applicant').notificationStatus,'sent');
  assert.equal((await call('retryEmail',{uid:'applicant'})).httpStatus,409);assert.equal(sends,1);
 }finally{global.fetch=prevFetch;}
});
test('admin approval commits and sends an independent email, without replaying receipt',async()=>{
 docs.set('users/applicant',{role:'user'});
 const prevFetch=global.fetch;let sends=0;global.fetch=async(_,opts)=>{sends++;assert.match(JSON.parse(opts.body).subject,/approved/);return {ok:true,status:200};};
 try{
  const result=await call('approve',{uid:'applicant'});assert.equal(result.httpStatus,200);
  assert.equal(docs.get('users/applicant').role,'business');
  const record=docs.get('business_applications/applicant');
  assert.equal(record.status,'approved');assert.equal(record.notificationHistory.length,2);
  assert.equal(record.notificationHistory[1].deliveryStatus,'sent');assert.equal(sends,1);
  assert.equal((await call('approve',{uid:'applicant'})).httpStatus,409);
 }finally{global.fetch=prevFetch;}
});
test('delivery failure does not undo an approved status; admin can retry latest event',async()=>{
 docs.set('business_applications/applicant',{...docs.get('business_applications/applicant'),status:'approved'});
 const event=email.newEvent('approved');
 docs.set('business_applications/applicant',{...docs.get('business_applications/applicant'),notificationStatus:'pending',notificationHistory:email.appended(docs.get('business_applications/applicant').notificationHistory,event)});
 // Simulate a failed provider response with the real delivery helper, no admin role changes.
 const prevFetch=global.fetch;let tries=0;global.fetch=async()=>{tries++;return {ok:tries>1,status:tries>1?200:503};};
 try{
  const before=await email.deliverNotification(db,'applicant',event.id);
  assert.equal(before.status,'failed');
  assert.equal(docs.get('business_applications/applicant').notificationStatus,'failed');
  // Retry is admin-controlled and must not modify the applicant's role or approval.
  const retry=await call('retryEmail',{uid:'applicant'});
  assert.equal(retry.notificationStatus,'sent');assert.equal(tries,2);
  assert.equal(docs.get('users/applicant').role,'business');
  assert.equal(docs.get('business_applications/applicant').status,'approved');
  assert.equal(docs.get('business_applications/applicant').notificationHistory.length,3);
 }finally{global.fetch=prevFetch;}
});
test('legacy Phase 8 email retry creates notification history without approving again',async()=>{
 const previous=docs.get('business_applications/applicant');
 docs.set('business_applications/applicant',{...previous,status:'approved',notificationHistory:undefined,notificationStatus:'failed'});
 const prevFetch=global.fetch;let count=0;global.fetch=async()=>{count++;return {ok:true,status:200};};
 try{
  const r=await call('retryEmail',{uid:'applicant'});
  assert.equal(r.httpStatus,200);
  assert.equal(r.notificationStatus,'sent');assert.equal(count,1);
  assert.equal(docs.get('users/applicant').role,'business');
  assert.equal(docs.get('business_applications/applicant').notificationHistory[0].type,'approved');
 }finally{global.fetch=prevFetch;}
});
test('email history remains bounded and frontend does not write directly to Firestore',()=>{
 let events=[];for(let i=0;i<27;i++)events=email.appended(events,email.newEvent('submitted'));
 assert.equal(events.length,20);
 const ui=require('node:fs').readFileSync(require('node:path').join(__dirname,'../js/business-registration.js'),'utf8');
 assert.match(ui,/businessNotificationHistory/);assert.match(ui,/formatNotificationList/);
 assert.match(ui,/escape\(noticeLabel/);
});
test.after(()=>{envKeys.forEach((key,i)=>{if(originalEnv[i]===undefined)delete process.env[key];else process.env[key]=originalEnv[i];});});
