// Gemini-only, server-side. One configured model and one attempt; no paid-provider fallback.
async function generate(prompt,{env=process.env,fetcher=globalThis.fetch,timeoutMs=25000,onFailure=()=>{}}={}){
 if(!env.GEMINI_API_KEY){onFailure({provider:'gemini',reason:'not_configured'});return null;}
 const model=env.GEMINI_MODEL||'gemini-2.5-flash',ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),timeoutMs);
 try{
  const response=await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':env.GEMINI_API_KEY},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{maxOutputTokens:1200,responseMimeType:'application/json',temperature:0.3,...(/^gemini-2\.5-(flash|flash-lite)(?:-|$)/.test(model)?{thinkingConfig:{thinkingBudget:0}}:{})}}),signal:ctrl.signal});
  if(!response.ok){let error;try{error=(await response.json())?.error;}catch{}
   const message=typeof error?.message==='string'?error.message:'';
   const category=response.status===429?'quota_or_rate_limit':response.status===503?'upstream_capacity':response.status===401||response.status===403?'authentication_or_api_access':response.status===400?'invalid_request_or_configuration':response.status===404?'model_unavailable':'provider_error';
   // Expose a bounded reason, never upstream payloads, keys, prompts or user records.
   let safe=message.split(env.GEMINI_API_KEY).join('[redacted]').replace(/AIza[A-Za-z0-9_-]{12,}/g,'[redacted]').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[redacted email]').slice(0,400);
   if(!/quota|limit|permission|api key|model|overload|capacity|temporar|billing|invalid|not found|unavailable|unsupported/i.test(safe))safe='Gemini rejected the request.';
   onFailure({provider:'gemini',status:response.status,reason:'http_error',category,message:safe});return null;
  }
  const data=await response.json(),text=(data.candidates?.[0]?.content?.parts||[]).filter(p=>!p.thought).map(p=>p.text||'').join('').trim();
  if(text&&text.length<=12000)return{text,source:'gemini'};
  onFailure({provider:'gemini',reason:'empty_or_invalid_reply'});return null;
 }catch{onFailure({provider:'gemini',reason:ctrl.signal.aborted?'timeout':'connection_or_response_error'});return null;}finally{clearTimeout(timer);}
}
module.exports={generate};
