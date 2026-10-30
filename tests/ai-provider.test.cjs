const test = require('node:test');
const assert = require('node:assert/strict');
const {generate,moderate,OPENAI_MODEL}=require('../netlify/functions/lib/ai-provider');

test('Only OpenAI Responses is called using the server key and Luna model, with no storage',async()=>{
 let sent;
 const data=await generate('Return JSON about a menu',{env:{OPENAI_API_KEY:'test-key'},fetcher:async(u,o)=>{
  sent={url:u,...o};return{ok:true,json:async()=>({output:[{type:'reasoning',summary:[{text:'PRIVATE'}]},{type:'message',role:'assistant',content:[{type:'output_text',text:'{"mode":"details","answer":"Menu"}'}]}]})};
 }});
 assert.equal(sent.url,'https://api.openai.com/v1/responses');
 assert.equal(sent.headers.Authorization,'Bearer test-key');
 const body=JSON.parse(sent.body);assert.equal(body.model,OPENAI_MODEL);assert.equal(body.model,'gpt-6-luna');assert.equal(body.text.format.type,'json_object');assert.equal(body.store,false);
 assert.deepEqual(data,{text:'{"mode":"details","answer":"Menu"}',source:'openai'});
 assert(!JSON.stringify(data).includes('PRIVATE'));
});
test('Other providers cannot be called without OPENAI_API_KEY; no automatic fallback',async()=>{
 let calls=0;const failures=[];
 const r=await generate('hi',{env:{GEMINI_API_KEY:'other',OPENROUTER_API_KEY:'other'},fetcher:()=>{calls++;},onFailure:e=>failures.push(e)});
 assert.equal(r,null);assert.equal(calls,0);assert.equal(failures[0].reason,'not_configured');
});
test('Moderation request is OpenAI-only; invalid response fails closed',async()=>{
 let seen;
 const safe=await moderate('milk tea near me',{env:{OPENAI_API_KEY:'test'},fetcher:async(u,o)=>{seen={u,payload:JSON.parse(o.body)};return{ok:true,json:async()=>({results:[{flagged:false}]})}}});
 assert.deepEqual(safe,{flagged:false});assert.equal(seen.u,'https://api.openai.com/v1/moderations');assert.equal(seen.payload.model,'omni-moderation-latest');
 assert.equal(await moderate('text',{env:{OPENAI_API_KEY:'test'},fetcher:async()=>({ok:true,json:async()=>({results:[]})})}),null);
 const flagged=await moderate('text',{env:{OPENAI_API_KEY:'test'},fetcher:async()=>({ok:true,json:async()=>({results:[{flagged:true}]})})});assert.equal(flagged.flagged,true);
});
test('Upstream failure reports safe status only and does not retry',async()=>{
 const failures=[];let calls=0;
 const result=await generate('Return JSON',{env:{OPENAI_API_KEY:'test-secret'},onFailure:e=>failures.push(e),fetcher:async()=>{calls++;return{ok:false,status:429,json:async()=>({error:{message:'test-secret personal user content'}})}}});
 assert.equal(result,null);assert.equal(calls,1);assert.equal(failures[0].category,'quota_or_rate_limit');assert(!JSON.stringify(failures).includes('test-secret'));
});
test('Timeout, missing text and incomplete responses fail with no backup model call',async()=>{
 for(const fetcher of [async()=>({ok:true,json:async()=>({})}),async()=>({ok:true,json:async()=>({status:'incomplete',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'{}'}]}]})}),async()=>{throw Error('offline')},(_u,{signal})=>new Promise((_r,reject)=>signal.addEventListener('abort',()=>reject(Error('timeout'))))]){
  let failures=0;assert.equal(await generate('test',{env:{OPENAI_API_KEY:'test'},fetcher,timeoutMs:5,onFailure:()=>failures++}),null);assert.equal(failures,1);
 }
});
