/* UI hints mirror the deployed rules; the rules remain the enforcement boundary. */
(function(root){
 const limits={name:{min:2,max:80,words:12,label:'Name'},place:{min:3,max:120,words:20,label:'Business name'},post:{min:3,max:500,words:100,label:'Post'},report:{min:3,max:500,words:100,label:'Report'},chat:{min:1,max:2000,words:300,label:'Message'},comment:{min:1,max:500,words:100,label:'Comment'},review:{min:3,max:2000,words:300,label:'Feedback'},description:{min:0,max:1000,words:200,label:'Description'}};
 const quickQuestions={menu:{label:'View menu',text:'Hi! Can I see your menu, please?'},hours:{label:'Opening hours',text:'Hi! What are your opening hours?'},delivery:{label:'Delivery options',text:'Hi! Do you offer delivery, and which areas do you cover?'},booking:{label:'Book a table',text:'Hi! Can I reserve a table? What details do you need?'}};
 const topicFor=text=>Object.keys(quickQuestions).find(key=>quickQuestions[key].text===String(text||'').trim())||null;
 function error(kind,value){
  const rule=limits[kind],text=typeof value==='string'?value.trim():'';
  if(!rule)return 'Invalid content type.';
  if(text.length<rule.min||text.length>rule.max)return `${rule.label}: ${rule.min}–${rule.max} characters.`;
  if(text.split(/\s+/u).length>rule.words)return `${rule.label}: maximum ${rule.words} words.`;
  if(['name','place'].includes(kind)&&(/[<>\r\n\x00-\x1f\x7f]/.test(text)))return `${rule.label}: use plain text on one line.`;
  return null;
 }
 async function create(db,collection,payload,existingRef=null){
  payload={...payload};
  for(const [key,max] of Object.entries({authorName:80,userName:120,senderName:120,placeName:120,establishmentName:120}))
   if(typeof payload[key]==='string')payload[key]=payload[key].slice(0,max);
  const scope=({messages:'chat',buzz_posts:'buzz',place_posts:'menu',places:'place',place_reports:'report',business_claims:'claim'})[collection];
  if(!scope)throw new Error('Unsupported collection.');
  const kind=scope==='chat'?'chat':scope==='place'?'place':scope==='report'?'report':'post';
  if(scope==='place'){const problem=error('description',payload.description||payload.desc||'');if(problem)throw new Error(problem);}
  const value=scope==='chat'?(payload.text||payload.reply||payload.feedback):scope==='place'?payload.name:scope==='report'?payload.details:payload.body;
  const captionOptional=scope==='claim'||(scope==='chat'&&payload.type!=='text'&&!value)||(scope==='menu'&&!String(value||'').trim()&&payload.mediaUrl);
  const problem=captionOptional?null:error(kind,value);
  if(problem)throw new Error(problem);
  const uid=root.auth?.currentUser?.uid;if(!uid)throw new Error('Sign in to continue.');
  const ref=existingRef||(scope==='claim'?db.collection(collection).doc(`${uid}_${payload.placeId}`):db.collection(collection).doc());
  const stamp=()=>root.firebase.firestore.FieldValue.serverTimestamp();
  if(collection==='messages'){
   const gate=db.collection('message_limits').doc(uid);
   await db.runTransaction(async tx=>{
    const snapshot=await tx.get(gate),old=snapshot.exists?snapshot.data():null;
    const reset=!old || Date.now()-old.windowStartedAt.toMillis()>=60000;
    if(!reset&&old.count>=90)throw new Error('Message limit reached. Wait for the next minute.');
    tx.set(gate,{uid,targetId:ref.id,at:stamp(),windowStartedAt:reset?stamp():old.windowStartedAt,count:reset?1:old.count+1});
    if(existingRef)tx.update(ref,payload);else tx.set(ref,payload);
   });
  }else{
   const batch=db.batch();
   batch.set(db.collection('write_cooldowns').doc(`${uid}_${scope}`),{uid,scope,targetId:ref.id,at:stamp()});
   batch.set(ref,payload);await batch.commit();
  }
  return ref;
 }
 async function comment(db,ref,payload){
  payload={...payload};if(typeof payload.authorName==='string')payload.authorName=payload.authorName.slice(0,80);
  const problem=error('comment',payload.text);if(problem)throw new Error(problem);
  const uid=root.auth?.currentUser?.uid;if(!uid)throw new Error('Sign in to continue.');
  const batch=db.batch();
  batch.set(db.collection('write_cooldowns').doc(`${uid}_comment`),{uid,scope:'comment',targetId:ref.id,at:root.firebase.firestore.FieldValue.serverTimestamp()});
  batch.update(ref,{comments:root.firebase.firestore.FieldValue.arrayUnion(payload)});await batch.commit();
 }
 async function updatePost(db,collection,ref,payload){
  const problem=error('post',payload.body);if(problem)throw new Error(problem);
  const uid=root.auth?.currentUser?.uid;if(!uid)throw new Error('Sign in to continue.');
  const scope=collection==='buzz_posts'?'buzz':'menu',batch=db.batch();
  batch.set(db.collection('write_cooldowns').doc(`${uid}_${scope}`),{uid,scope,targetId:ref.id,at:root.firebase.firestore.FieldValue.serverTimestamp()});
  batch.update(ref,payload);await batch.commit();
 }
 const api={quickQuestions,topicFor,limits,error,create,comment,updatePost,updateMessage:(db,ref,patch)=>create(db,'messages',patch,ref)};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.ContentPolicy=api;
})(typeof window!=='undefined'?window:globalThis);
