// The sole Vici AI model provider is OpenAI. No provider/model fallback is attempted.
// API secrets are read only inside Netlify Functions, never sent to the browser.
const OPENAI_MODEL = 'gpt-6-luna';
const MODERATION_MODEL = 'omni-moderation-latest';

function failureCategory(status) {
  if (status === 429) return 'quota_or_rate_limit';
  if (status === 503 || status === 502 || status === 500) return 'upstream_capacity';
  if (status === 401 || status === 403) return 'authentication_or_api_access';
  if (status === 400 || status === 422) return 'invalid_request_or_configuration';
  if (status === 404) return 'model_unavailable';
  return 'provider_error';
}
async function callOpenAI(path, payload, {env = process.env, fetcher = globalThis.fetch, timeoutMs = 25000, onFailure = () => {}} = {}) {
  if (!env.OPENAI_API_KEY) {
    onFailure({provider:'openai',reason:'not_configured'});
    return null;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher('https://api.openai.com/v1/' + path, {
      method:'POST',
      headers:{'Content-Type':'application/json',Authorization:'Bearer ' + env.OPENAI_API_KEY},
      body:JSON.stringify(payload),
      signal:controller.signal
    });
    if (!response.ok) {
      // Do not log provider bodies: they might contain private messages or secrets.
      onFailure({provider:'openai',reason:'http_error',status:response.status,category:failureCategory(response.status)});
      return null;
    }
    return await response.json();
  } catch (_error) {
    onFailure({provider:'openai',reason:controller.signal.aborted?'timeout':'connection_or_response_error'});
    return null;
  } finally { clearTimeout(timer); }
}
async function moderate(text, options = {}) {
  if (typeof text !== 'string' || !text.trim()) return null;
  const data = await callOpenAI('moderations', {model:MODERATION_MODEL,input:text.slice(0,3000)}, {timeoutMs:6000,...options});
  if (typeof data?.results?.[0]?.flagged !== 'boolean') {
    if (data) options.onFailure?.({provider:'openai',reason:'invalid_moderation_response'});
    return null; // fail closed, not an implicit pass
  }
  return {flagged:data.results[0].flagged};
}
async function generate(prompt, options = {}) {
  if (typeof prompt !== 'string' || !prompt.trim()) return null;
  const data = await callOpenAI('responses', {
    model:OPENAI_MODEL,
    input:[{role:'user',content:prompt}],
    text:{format:{type:'json_object'}},
    max_output_tokens:1600,
    reasoning:{effort:'none'},
    store:false
  }, {timeoutMs:21000,...options});
  if (!data) return null;
  // Never expose reasoning items, tool instructions, or non-final content.
  const text = (Array.isArray(data.output)?data.output:[])
    .filter(item=>item?.type==='message'&&item.role==='assistant')
    .flatMap(item=>Array.isArray(item.content)?item.content:[])
    .filter(part=>part?.type==='output_text'&&typeof part.text==='string')
    .map(part=>part.text).join('').trim();
  if (data.status!=='incomplete' && text && text.length<=12000) return {text,source:'openai'};
  options.onFailure?.({provider:'openai',reason:'empty_or_incomplete_reply'});
  return null;
}
module.exports={generate,moderate,OPENAI_MODEL};
