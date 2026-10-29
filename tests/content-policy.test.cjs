const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const policy=require('../js/content-policy');
test('content limits reject blank, padded, long and excessive-word values',()=>{
 for(const [kind,min,max,words] of [['name',2,80,12],['place',3,120,20],['post',3,500,100],['chat',1,2000,300],['comment',1,500,100]]){
  assert.equal(policy.error(kind,'a'.repeat(min)),null,kind);
  assert(policy.error(kind,'  '),kind);assert(policy.error(kind,'a'.repeat(max+1)),kind);
  assert(policy.error(kind,Array(words+1).fill('a').join(' ')),kind);
 }
 for(const name of ['<Admin>','New\nName','Name\u0000'])assert(policy.error('name',name));
 assert.equal(policy.error('name','José Dela Cruz'),null);
 assert(policy.error('post',Array(101).fill('ab').join('\u00a0')));
 assert.equal(policy.error('post','  a  '),'Post: 3–500 characters.');
});
function runtime(old){
 const writes=[];let next=0;const stamp={server:true};
 const db={collection:name=>({doc:(...args)=>{assert(!args.length||typeof args[0]==='string','Automatic IDs require doc() without undefined');return{kind:name,id:args[0]||'id'+(++next)};}}),batch:()=>({set:(...v)=>writes.push(['set',...v]),update:(...v)=>writes.push(['update',...v]),commit:async()=>{}}),runTransaction:async fn=>fn({get:async()=>({exists:!!old,data:()=>old}),set:(...v)=>writes.push(['set',...v]),update:(...v)=>writes.push(['update',...v])})};
 const w={auth:{currentUser:{uid:'customer'}},firebase:{firestore:{FieldValue:{serverTimestamp:()=>stamp,arrayUnion:v=>({union:v})}}}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../js/content-policy'),'utf8'),{window:w,Date});return{api:w.ContentPolicy,db,writes};
}
test('message write atomically carries a matching account bucket and target id',async()=>{
 const r=runtime();await r.api.create(r.db,'messages',{type:'text',text:'Hello'});
 assert.equal(r.writes.length,2);assert.equal(r.writes[0][1].kind,'message_limits');assert.equal(r.writes[0][1].id,'customer');assert.equal(r.writes[0][2].count,1);assert.equal(r.writes[0][2].targetId,r.writes[1][1].id);
});
test('client bucket protects drafts by rejecting rate-limited sends before a write',async()=>{
 for(const old of [{count:90,windowStartedAt:{toMillis:()=>Date.now()},at:{toMillis:()=>Date.now()-5000}}]){
  const r=runtime(old);await assert.rejects(r.api.create(r.db,'messages',{type:'text',text:'Hello'}));assert.equal(r.writes.length,0);
 }
});
test('post and comment helpers attach cooldowns to the exact target record',async()=>{
 const r=runtime();await r.api.create(r.db,'buzz_posts',{body:'Hello neighborhood'});assert.equal(r.writes[0][1].id,'customer_buzz');assert.equal(r.writes[0][2].targetId,r.writes[1][1].id);
 r.writes.length=0;await r.api.comment(r.db,{id:'post'}, {text:'Hello'});assert.equal(r.writes[0][1].id,'customer_comment');assert.equal(r.writes[0][2].targetId,'post');assert.equal(r.writes[1][0],'update');
});

test('listing and report writes use their own cooldowns and validate content',async()=>{
 const r=runtime();await r.api.create(r.db,'places',{name:'Neighborhood Cafe',description:'A local cafe'});assert.equal(r.writes[0][1].id,'customer_place');
 r.writes.length=0;await r.api.create(r.db,'place_reports',{details:'The address has changed'});assert.equal(r.writes[0][1].id,'customer_report');
 r.writes.length=0;await r.api.create(r.db,'business_claims',{placeId:'shop',userId:'customer'});assert.equal(r.writes[1][1].id,'customer_shop');assert.equal(r.writes[0][1].id,'customer_claim');
 await assert.rejects(r.api.create(r.db,'places',{name:'a'}));
});

test('rules word expressions preserve escaping and count Unicode whitespace',()=>{
 const source=fs.readFileSync(require.resolve('../firestore.rules'),'utf8');
 for(const [fn,kind] of [['validName','name'],['validPlaceName','place'],['validPost','post'],['validChat','chat'],['validComment','comment']]){
  const block=source.slice(source.indexOf('function '+fn+'('),source.indexOf('\n    }',source.indexOf('function '+fn+'(')));
  const patterns=[...block.matchAll(/value\.matches\(("(?:\\.|[^"\\])*")\)/g)].map(m=>JSON.parse(m[1]));
  assert(patterns.length>0,fn);
  const regex=new RegExp(patterns.at(-1).replace('(?s)',''),'su');
  assert(regex.test('Hello neighborhood'),fn);assert(regex.test('José Dela Cruz'),fn);
  const max=policy.limits[kind].words;
  for(const space of [' ','\n','\u00a0','\u2003'])assert(!regex.test(Array(max+1).fill('word').join(space)),fn+' '+space);
 }
});

test('legacy reply edits use the same message counter and matching document target',async()=>{
 const r=runtime();await r.api.updateMessage(r.db,{kind:'messages',id:'existing'},{reply:'Thanks for asking'});
 assert.equal(r.writes[0][2].targetId,'existing');assert.equal(r.writes[1][0],'update');
 await assert.rejects(r.api.updateMessage(r.db,{id:'existing'},{reply:'a'.repeat(2001)}));
});

test('normal chat bursts are allowed below the 90 per minute ceiling',async()=>{
 for(const count of [1,30,89]){const r=runtime({count,windowStartedAt:{toMillis:()=>Date.now()},at:{toMillis:()=>Date.now()}});await r.api.create(r.db,'messages',{type:'text',text:'Thanks!'});assert.equal(r.writes[0][2].count,count+1);}
 const rules=fs.readFileSync(require.resolve('../firestore.rules'),'utf8');assert(rules.includes('request.resource.data.count <= 90'));assert(!rules.includes("duration.value(2,'s')"));
});
