'use strict';
// Phase 9: bounded, private, server-owned application notification history.
// The application decision is committed before any external email request.
const crypto=require('node:crypto');
const MAX_HISTORY=20;
const TYPES=['submitted','approved','rejected','changes_required'];
const SUBJECTS={
  submitted:'Vicinify received your business application',
  approved:'Your Vicinify business application was approved',
  rejected:'Update on your Vicinify business application',
  changes_required:'Changes requested for your Vicinify business application'
};
function newEvent(type){
  if(!TYPES.includes(type))throw Error('Unknown application notification event');
  return {id:crypto.randomUUID(),type,createdAt:new Date().toISOString(),deliveryStatus:'pending',attempts:0};
}
function appended(history,item){return [...(Array.isArray(history)?history:[]),item].slice(-MAX_HISTORY);}
function publicHistory(history){return (Array.isArray(history)?history:[]).map(x=>({
  type:x.type,createdAt:x.createdAt,deliveryStatus:x.deliveryStatus||'pending',attempts:Number(x.attempts||0),sentAt:x.sentAt||null
})).reverse();}
const statusFor=(type)=>({submitted:'pending',approved:'approved',rejected:'rejected',changes_required:'changes_required'})[type];
function emailText(app,type){
 const name=String(app.details?.tradeName||'your establishment');
 const base={
   submitted:`We received your business registration application for ${name}. It is pending administrator review. You can check the status in Vicinify under Register Your Business.`,
   approved:`Your business registration for ${name} was approved. Sign in to Vicinify to access Business Hub and publish your establishment.`,
   rejected:`Your application for ${name} was reviewed and rejected. Sign in to Vicinify to read the administrator's remarks and next steps.`,
   changes_required:`Your application for ${name} needs changes. Sign in to Vicinify to read the administrator's remarks, update your details and resubmit.`
 };
 let link='';
 try{
  const url=new URL(process.env.VICINIFY_PUBLIC_URL||process.env.URL||'');
  if(url.protocol==='https:'&&!url.username&&!url.password){
   url.search='';url.hash='';
   if(type!=='approved')url.searchParams.set('business','1');
   link=`\n\n${type==='approved'?'Sign in to Vicinify':'View your application'}: ${url.href}`;
  }
 }catch{}
 return `Hello,\n\n${base[type]}${link}\n\nDiscover Good Food in Your Neighborhood.\nVicinify Team`;
}
async function updateEvent(db,uid,eventId,callback){
 const ref=db.collection('business_applications').doc(uid);
 let result;
 await db.runTransaction(async tx=>{
  const snap=await tx.get(ref),data=snap.data();
  if(!data)return;
  const history=Array.isArray(data.notificationHistory)?data.notificationHistory:[];
  const i=history.findIndex(x=>x.id===eventId);
  if(i<0)return;
  const proposed=callback(history[i],data);
  if(!proposed)return;
  const updated=history.map((x,j)=>j===i?proposed:x);
  const fields={notificationHistory:updated};
  if(i===history.length-1)fields.notificationStatus=proposed.deliveryStatus;
  tx.update(ref,fields);result=proposed;
 });
 return result;
}
async function deliverNotification(db,uid,eventId){
 const apiKey=process.env.RESEND_API_KEY,from=process.env.VICINIFY_FROM_EMAIL;
 if(!apiKey||!from){
  await updateEvent(db,uid,eventId,e=>['sent','sending'].includes(e.deliveryStatus)?null:{...e,deliveryStatus:'not_configured'});
  return {status:'not_configured'};
 }
 const token=crypto.randomUUID(),now=Date.now();
 // Claim the attempt atomically. Prevent two admins sending the same event together.
 const claimed=await updateEvent(db,uid,eventId,(e,app)=>{
  // Do not dispatch a stale message after the application has advanced to a new status.
  if(statusFor(e.type)!==undefined&&statusFor(e.type)!==app.status)return null;
  if(e.deliveryStatus==='sent'||Number(e.attempts||0)>=5)return null;
  if(e.deliveryStatus==='sending'&&now-Number(e.attemptStartedMs||now)<120000)return null;
  return {...e,deliveryStatus:'sending',attempts:Number(e.attempts||0)+1,attemptStartedMs:now,attemptToken:token};
 });
 if(!claimed)return {status:'already_claimed_or_sent'};
 const app=(await db.collection('business_applications').doc(uid).get()).data();
 let status='sent';
 try{
  if(!app?.ownerEmail||!SUBJECTS[claimed.type])throw Error('Missing recipient or notification type');
  const response=await fetch('https://api.resend.com/emails',{
   method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','Idempotency-Key':`vicinify-business-${claimed.id}`},
   body:JSON.stringify({from,to:[app.ownerEmail],subject:SUBJECTS[claimed.type],text:emailText(app,claimed.type)}),
   signal:AbortSignal.timeout(9000)
  });
  if(!response.ok)throw Error(`Provider status ${response.status}`);
 }catch(error){status='failed';console.error('Business application email failed:',String(error.message||error).slice(0,80));}
 await updateEvent(db,uid,eventId,e=>e.attemptToken!==token?null:(({attemptToken,attemptStartedMs,...rest})=>({...rest,deliveryStatus:status,...(status==='sent'?{sentAt:new Date().toISOString()}:{})}))(e));
 return {status};
}
module.exports={newEvent,appended,publicHistory,deliverNotification,SUBJECTS,emailText};
