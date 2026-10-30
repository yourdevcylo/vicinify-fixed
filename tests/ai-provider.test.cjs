const test=require('node:test'),assert=require('node:assert/strict');
const {generate,FREE_MODEL}=require('../netlify/functions/lib/ai-provider');
test('OpenRouter-only configuration uses pinned free model and returns final content only',async()=>{
 let request;
 const result=await generate('Public establishment details',{env:{OPENROUTER_API_KEY:'test-secret',OPENROUTER_MODEL:'paid/model'},fetcher:async(url,opts)=>{request={url,...opts};return{ok:true,json:async()=>({choices:[{message:{content:'Saved café hours.',reasoning_details:[{text:'hidden'}]}}]})}}});
 assert.equal(request.url,'https://openrouter.ai/api/v1/chat/completions');assert.equal(request.headers.Authorization,'Bearer test-secret');assert.equal(JSON.parse(request.body).model,FREE_MODEL);assert.deepEqual(result,{text:'Saved café hours.',source:'openrouter'});assert(!JSON.stringify(result).includes('hidden'));
});
test('Gemini success avoids backup, and quota error falls back to OpenRouter',async()=>{
 for(const ok of [true,false]){const calls=[];const result=await generate('Menu question',{env:{GEMINI_API_KEY:'gemini',OPENROUTER_API_KEY:'router'},fetcher:async url=>{calls.push(url);return url.includes('googleapis')?{ok,json:async()=>({candidates:[{content:{parts:[{text:'Café answer'}]}}]})}:{ok:true,json:async()=>({choices:[{message:{content:'Backup answer'}}]})}}});assert.equal(calls.length,ok?1:2);assert.equal(result.source,ok?'gemini':'openrouter');}
});
test('provider failure, malformed response, no credentials and timeout permit basic fallback',async()=>{
 assert.equal(await generate('test',{env:{},fetcher:()=>{throw Error('must not fetch')}}),null);
 for(const fetcher of [async()=>({ok:false}),async()=>({ok:true,json:async()=>({})}),async()=>{throw Error('offline')},(_url,{signal})=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('timeout'))))])assert.equal(await generate('test',{env:{OPENROUTER_API_KEY:'test'},fetcher,timeoutMs:5}),null);
});
test('actual Vici endpoint works with only OpenRouter and excludes private catalog fields',async()=>{
 const admin=require('../netlify/functions/lib/admin'),cat=require('../netlify/functions/lib/catalog');
 const saved={auth:admin.authenticate,limit:admin.limit,catalog:cat.catalog,services:admin.services,fetch:global.fetch,env:{...process.env}};let prompt='',calls=0;
 admin.services=()=>require('./helpers/memory-admin.cjs').memory();admin.authenticate=async()=>({uid:'user'});admin.limit=async()=>{};cat.catalog=async()=>({places:[{id:'shop',name:'Everyday Cafe',operating_hours:'8AM–5PM',accepts_booking:true,owner_uid:'PRIVATE_OWNER',paymentInstructions:'PRIVATE_PAYMENT'},{id:'unrelated',name:'Unrelated Resto',category:'restaurant',avgRating:5}]});
 delete process.env.GEMINI_API_KEY;process.env.OPENROUTER_API_KEY='test-only';process.env.ALLOWED_ORIGIN='https://example.test';
 global.fetch=async(_url,opts)=>{calls++;prompt=JSON.parse(opts.body).messages[0].content;return{ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({mode:'details',answer:'Everyday Cafe has saved hours of 8AM–5PM.',placeIds:['shop']})}}]})}};
 try{
 delete require.cache[require.resolve('../netlify/functions/askVici')];const handler=require('../netlify/functions/askVici').handler;
 const ask=(query,memory={},requestDraft)=>handler({httpMethod:'POST',headers:{origin:'https://example.test'},body:JSON.stringify({query,memory,requestDraft,recommendations:[{id:'shop'},{id:'unrelated'}]})});
 const hello=await ask('Hello!');assert.match(JSON.parse(hello.body).answer,/Hi!/);assert.equal(calls,0);
 const thanks=await ask('Salamat po');assert.match(JSON.parse(thanks.body).answer,/welcome/);assert.equal(calls,0);
 const res=await ask('What are the hours of Everyday Cafe?');assert.equal(JSON.parse(res.body).source,'openrouter');assert(prompt.includes('8AM–5PM'));assert(!prompt.includes('PRIVATE_OWNER'));assert(!prompt.includes('PRIVATE_PAYMENT'));
 const privateReply=await ask('What is my booking at Everyday Cafe?');assert.equal(JSON.parse(privateReply.body).source,'openrouter');assert.equal(calls,2);
 const follow=await ask('the first one?',{searchQuery:'coffee under 150',placeIds:['shop','forged-private']});assert.equal(JSON.parse(follow.body).source,'openrouter');assert(prompt.includes('coffee under 150'));assert(!prompt.includes('forged-private'));
 const coffee=await ask('kape');assert.equal(JSON.parse(coffee.body).source,'openrouter');assert(prompt.includes('Unrelated Resto')); // model sees approved candidates and selects semantically
 const beforeDraft=calls;
 global.fetch=async(_url,opts)=>{calls++;prompt=JSON.parse(opts.body).messages[0].content;return{ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({answer:'Review the form.',mode:'draft',placeIds:['shop'],requestDraft:{placeId:'shop',requestType:'table_reservation',date:'2099-01-01',time:'18:00',guests:4}})}}]})}};
 const prepared=JSON.parse((await ask('Arrange a table for four at Everyday Cafe')).body);assert.equal(prepared.requestReady,true);assert.equal(prepared.requestDraft.guests,4);assert.match(prepared.answer,/Nothing has been submitted/);assert.equal(calls,beforeDraft+1);
 global.fetch=async()=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({answer:'Would you like coffee or milk tea? Prices are not listed.',mode:'recommend',kind:'drinks',budget:500,placeIds:['shop']})}}]})});
 const craving=JSON.parse((await ask('im thirsty i only have 500 pesos',{},prepared.requestDraft)).body);assert.equal(craving.source,'openrouter');assert.equal(craving.requestReady,false);assert.equal(craving.requestDraft.active,false);assert.deepEqual(craving.placeIds,['shop']);
 global.fetch=async()=>({ok:false});assert.equal(JSON.parse((await ask('Everyday Cafe hours?')).body).source,'unavailable');
 }finally{admin.authenticate=saved.auth;admin.limit=saved.limit;cat.catalog=saved.catalog;admin.services=saved.services;global.fetch=saved.fetch;for(const k of ['GEMINI_API_KEY','OPENROUTER_API_KEY','ALLOWED_ORIGIN']){if(saved.env[k]===undefined)delete process.env[k];else process.env[k]=saved.env[k];}delete require.cache[require.resolve('../netlify/functions/askVici')];}
});
