const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Module=require('node:module');
const policy=require('../js/content-policy');

test('Tagalog and English requests recognize menu while unrelated chat stays manual',()=>{
  for(const text of ['Hi! Can I see your menu, please?','May menu po ba?', 'Menu po', 'Can I see your menu?', 'Pwede pong makita ang menu ninyo?', 'Patingin po ng menu', 'Send your menu please']) assert.equal(policy.topicFor(text),'menu',text);
  for(const text of ['Are you open?', 'May reservation po ba?', 'Your menu is too expensive', 'Don\'t show me your menu']) assert.equal(policy.topicFor(text),null,text);
  assert.equal(policy.topicFor(policy.quickQuestions.hours.text),'hours');
});

test('auto-reply endpoint verifies typed menu request and creates only one trusted response',async()=>{
  const original=Module._load;
  const records=new Map();
  let user='customer';
  const message={type:'text',senderRole:'customer',senderUid:'customer',userId:'customer',placeId:'shop',quickQuestion:'menu',text:'May menu po ba?',createdAt:{toMillis:()=>Date.now()}};
  const db={collection:kind=>({doc:id=>({kind,id})}),runTransaction:async handler=>handler({
    get:async ref=>ref.kind==='messages'&&ref.id==='question'?{exists:true,data:()=>message}:ref.kind==='places'?{exists:true,data:()=>({owner_uid:'owner',name:'Timpla ni Juan',approval_status:'approved',auto_reply_enabled:true})}:{exists:records.has(ref.id),data:()=>records.get(ref.id)},
    create:(ref,record)=>records.set(ref.id,record)
  })};
  const admin={authenticate:async()=>({uid:user}),limit:async()=>{},identifier:v=>{if(!/^[A-Za-z0-9_-]{1,180}$/.test(v))throw Error('Invalid');return v;},services:()=>({db,FieldValue:{serverTimestamp:()=>123}}),reply:(statusCode,body)=>({statusCode,body:JSON.stringify(body)})};
  Module._load=function(request,parent,isMain){if(request==='./lib/admin' && parent.filename.endsWith('autoReply.js'))return admin;return original.apply(this,arguments);};
  let handler;
  try{delete require.cache[require.resolve('../netlify/functions/autoReply')];handler=require('../netlify/functions/autoReply').handler;}
  finally{Module._load=original;}
  const call=()=>handler({httpMethod:'POST',body:JSON.stringify({messageId:'question',topic:'menu'})});
  const first=await call();assert.equal(first.statusCode,200,first.body);assert.equal(JSON.parse(first.body).saved,true);
  assert.equal(records.get('auto_question').autoReplyTopic,'menu');assert.match(records.get('auto_question').text,/View Menu/);
  const duplicate=await call();assert.equal(JSON.parse(duplicate.body).saved,false);
  message.text='Are you open?';records.clear();assert.equal((await call()).statusCode,403);
  user='stranger';message.text='May menu po ba?';assert.equal((await call()).statusCode,403);
});

test('chat View Menu opens the existing real menu dialog without closing the chat',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../js/common.js'),'utf8');
  const start=source.indexOf("listWrap.querySelectorAll('[data-auto-menu]').forEach(");
  assert.notEqual(start,-1);
  const end=source.indexOf('\n\n        if (wasAtBottom',start);
  const handler=source.slice(start,end);
  assert.match(handler,/window\.ViciCommerce\.openMenu\(id\)/);
  assert.doesNotMatch(handler,/window\.closeChatModal\(/);
  assert.doesNotMatch(handler,/window\.PlacePreview\.open\(/);
  assert.match(source,/data-auto-menu/);
  const commerce=fs.readFileSync(path.join(__dirname,'../js/vici-commerce.js'),'utf8');
  assert.match(commerce,/async function openMenu\(id\)/);
  assert.match(commerce,/d\.showModal\(\)/);
});
