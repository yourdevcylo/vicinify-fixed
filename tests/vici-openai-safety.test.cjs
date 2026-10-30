const test=require('node:test'),assert=require('node:assert/strict');
const admin=require('../netlify/functions/lib/admin');
const catalog=require('../netlify/functions/lib/catalog');
const {memory}=require('./helpers/memory-admin.cjs');

async function withFixture(mock,fn){
 const old={authenticate:admin.authenticate,limit:admin.limit,limitDaily:admin.limitDaily,services:admin.services,catalog:catalog.catalog,key:process.env.OPENAI_API_KEY,fetch:global.fetch};
 const state=memory();
 admin.authenticate=async()=>({uid:'test-customer'});
 admin.limit=async()=>{};admin.limitDaily=async()=>{};
 admin.services=()=>state;catalog.catalog=async()=>({places:[]});
 process.env.OPENAI_API_KEY='test-only-key';global.fetch=mock;
 delete require.cache[require.resolve('../netlify/functions/askVici')];
 try{return await fn(require('../netlify/functions/askVici').handler);}finally{
  admin.authenticate=old.authenticate;admin.limit=old.limit;admin.limitDaily=old.limitDaily;admin.services=old.services;catalog.catalog=old.catalog;global.fetch=old.fetch;
  if(old.key===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=old.key;
  delete require.cache[require.resolve('../netlify/functions/askVici')];
 }
}
const event={httpMethod:'POST',headers:{},body:JSON.stringify({query:'Is there a nearby cafe?',uiLanguage:'en'})};

test('Flagged input is blocked without calling the AI model',async()=>{
 let models=0;await withFixture(async url=>{if(url.endsWith('/responses'))models++;return{ok:true,json:async()=>({results:[{flagged:true}]})};},async handler=>{
  const r=await handler(event);assert.equal(r.statusCode,200);assert.equal(JSON.parse(r.body).source,'guard');
 });assert.equal(models,0);
});
test('Unavailable moderation fails closed rather than sending a model request',async()=>{
 let models=0;await withFixture(async url=>{if(url.endsWith('/responses'))models++;return{ok:false,status:503,json:async()=>({})};},async handler=>{
  const r=await handler(event);assert.equal(r.statusCode,503);assert.match(JSON.parse(r.body).error,/safety check/i);
 });assert.equal(models,0);
});
test('Flagged AI output is withheld, without issuing recommendation/actions',async()=>{
 let calls=0;await withFixture(async url=>{
  calls++;
  if(url.endsWith('/moderations'))return{ok:true,json:async()=>({results:[{flagged:calls===3}]})};
  return{ok:true,json:async()=>({output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify({mode:'details',answer:'Sample answer',placeIds:[]})}]}]})};
 },async handler=>{const r=await handler(event);assert.equal(r.statusCode,200);const data=JSON.parse(r.body);assert.equal(data.source,'guard');assert.deepEqual(data.actions,[]);});
 assert.equal(calls,3);
});
