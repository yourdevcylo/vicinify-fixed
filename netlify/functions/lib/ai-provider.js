// Server-only providers. OpenRouter is pinned to the selected free model.
const FREE_MODEL='google/gemma-4-31b-it:free';
async function generate(prompt,{env=process.env,fetcher=globalThis.fetch,timeoutMs}={}){
 const attempts=[];
 if(env.GEMINI_API_KEY)attempts.push({source:'gemini',timeout:5000,url:`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_MODEL||'gemini-2.5-flash')}:generateContent`,headers:{'x-goog-api-key':env.GEMINI_API_KEY},body:{contents:[{parts:[{text:prompt}]}],generationConfig:{maxOutputTokens:350,temperature:0.3}}});
 if(env.OPENROUTER_API_KEY)attempts.push({source:'openrouter',timeout:7000,url:'https://openrouter.ai/api/v1/chat/completions',headers:{Authorization:`Bearer ${env.OPENROUTER_API_KEY}`},body:{model:FREE_MODEL,stream:false,max_tokens:500,temperature:0.3,reasoning:{enabled:false},messages:[{role:'system',content:prompt}]}});
 for(const attempt of attempts){
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),timeoutMs??attempt.timeout);
  try{
   const response=await fetcher(attempt.url,{method:'POST',headers:{'Content-Type':'application/json',...attempt.headers},body:JSON.stringify(attempt.body),signal:ctrl.signal});
   if(!response.ok)continue;
   const data=await response.json();
   const text=attempt.source==='gemini'?(data.candidates?.[0]?.content?.parts||[]).filter(p=>!p.thought).map(p=>p.text||'').join('').trim():data.choices?.[0]?.message?.content?.trim();
   if(typeof text==='string'&&text&&text.length<=8000)return{text,source:attempt.source};
  }catch{ /* Do not log upstream bodies or authorization details. */ }
  finally{clearTimeout(timer);}
 }
 return null;
}
module.exports={generate,FREE_MODEL};
