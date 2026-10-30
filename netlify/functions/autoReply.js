const {services,authenticate,identifier,limit,reply}=require('./lib/admin');
const {quickQuestions,topicFor,error:contentError}=require('../../js/content-policy');
function replyFor(place,topic){
 const custom=place.auto_reply_answers?.[topic];
 if(typeof custom==='string' && custom.trim() && !contentError('post',custom))return custom.trim();
 if(topic==='menu')return 'You can browse our listed menu using the View Menu button below. Please confirm current prices and availability with our team.';
 if(topic==='hours'){
  const hours=place.operating_hours||place.operatingHours||place.hours;
  if(typeof hours==='string'&&hours.trim())return 'Our listed hours: '+hours.trim().slice(0,500);
  if(hours&&typeof hours==='object'){
   const lines=['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].filter(day=>typeof hours[day]==='string'&&hours[day].trim()).map(day=>day[0].toUpperCase()+day.slice(1)+': '+hours[day].trim().slice(0,60));
   if(lines.length)return 'Our listed hours:\n'+lines.join('\n');
  }
  return 'Our opening hours are not listed yet. Please wait for a reply from our team.';
 }
 if(topic==='delivery'){
  const options=[];
  if(place.delivery_inhouse===true){const km=Number(place.delivery_radius);options.push('in-house delivery'+(Number.isFinite(km)&&km>0&&km<=30?` (listed radius: ${km} km)` : ''));}
  if(place.delivery_grab===true)options.push('Grab/Panda');
  return options.length?'Listed delivery options: '+options.join(' and ')+'. Our team will confirm availability, fees and coverage.':'Delivery details are not listed yet. Our team will confirm available options.';
 }
 return place.accepts_booking===true?'You can send a booking request from our establishment page. Please include your date, time and request details. Our team must confirm availability before it is accepted.':'Booking availability is not listed yet. Please wait for our team to confirm.';
}
exports.replyFor=replyFor;
exports.handler=async event=>{
 if(event.httpMethod!=='POST')return reply(405,{error:'POST only'});
 try{
  const user=await authenticate(event);
  if((event.body||'').length>2000)return reply(413,{error:'Request too large.'});
  const body=JSON.parse(event.body||'{}');
  if(!body||typeof body!=='object'||Array.isArray(body))return reply(400,{error:'Invalid request.'});
  const id=identifier(body.messageId),topic=body.topic;
  if(typeof topic!=='string'||!Object.hasOwn(quickQuestions,topic))return reply(400,{error:'Unknown quick question.'});
  await limit(user.uid,'auto_reply',6);
  const {db,FieldValue}=services(),source=db.collection('messages').doc(id),answer=db.collection('messages').doc('auto_'+id);
  let saved=false;
  await db.runTransaction(async tx=>{
   const original=await tx.get(source);if(!original.exists)throw Object.assign(new Error('Question not found.'),{status:404});
   const msg=original.data();
   if(msg.type!=='text'||msg.senderRole!=='customer'||msg.senderUid!==user.uid||msg.userId!==user.uid||msg.quickQuestion!==topic||topicFor(msg.text)!==topic)
    throw Object.assign(new Error('This question is not eligible for an automatic reply.'),{status:403});
   const stamp=msg.createdAt?.toMillis?.();
   if(!Number.isFinite(stamp)||Date.now()-stamp>120000||stamp>Date.now()+5000)throw Object.assign(new Error('Send a new question to request an automatic reply.'),{status:409});
   const placeDoc=await tx.get(db.collection('places').doc(identifier(msg.placeId))),place=placeDoc.data();
   if(!placeDoc.exists||place.approval_status!=='approved'||!place.owner_uid||place.owner_uid===user.uid)
    throw Object.assign(new Error('Automatic reply is unavailable for this conversation.'),{status:403});
   if(place.auto_reply_enabled!==true)return;
   const existing=await tx.get(answer);if(existing.exists)return;
   tx.create(answer,{placeId:msg.placeId,placeName:String(place.name||'Establishment').slice(0,120),userId:user.uid,userName:String(msg.userName||'Customer').slice(0,120),
    type:'text',text:replyFor(place,topic),status:'sent',senderUid:place.owner_uid,senderRole:'owner',senderName:String(place.name||'Establishment').slice(0,120),
    createdBy:place.owner_uid,createdAt:FieldValue.serverTimestamp(),reply:null,deliveredAt:null,seenAt:null,isAutoReply:true,autoReplyTopic:topic,replyTo:id});
   saved=true;
  });
  return reply(200,{saved});
 }catch(error){return reply(error.status||(error instanceof SyntaxError?400:500),{error:error.status?error.message:'Automatic reply is unavailable.'});}
};
