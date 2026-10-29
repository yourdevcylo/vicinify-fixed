export const errors = {
  400: ['Check your request', 'Some request details could not be understood. Check what you entered and try again.', 'Suriin ang iyong kahilingan', 'May detalyeng hindi maunawaan. Suriin ang inilagay at subukang muli.'],
  401: ['Sign in to continue', 'Your session may have expired. Return to Vicinify and sign in again.', 'Pumasok muli sa account', 'Maaaring natapos na ang iyong sesyon. Bumalik sa Vicinify at pumasok muli.'],
  403: ['Access is restricted', 'Your account does not have permission to open this page or perform this action.', 'Walang pahintulot', 'Walang pahintulot ang iyong account na buksan ang pahinang ito o gawin ang hakbang na ito.'],
  404: ['Page not found', 'This page may have moved, or the address may be incorrect. You can return to Vicinify.', 'Hindi makita ang pahina', 'Maaaring nailipat ang pahina o mali ang adres. Maaari kang bumalik sa Vicinify.'],
  408: ['The request took too long', 'Check your connection and try again when you are ready.', 'Naubos ang oras ng kahilingan', 'Suriin ang koneksiyon at subukang muli kapag handa ka na.'],
  413: ['The upload is too large', 'Choose a smaller file or fewer photos and try again.', 'Masyadong malaki ang ipinapasa', 'Pumili ng mas maliit na file o mas kaunting larawan at subukang muli.'],
  429: ['Too many requests', 'Please wait a minute before trying again. This helps keep Vicinify responsive for everyone.', 'Masyadong maraming kahilingan', 'Maghintay ng isang minuto bago subukang muli. Nakakatulong ito upang manatiling mabilis ang Vicinify para sa lahat.'],
  500: ['Something went wrong', 'Vicinify could not complete this request. Please try again later.', 'May nagkaproblema', 'Hindi nakumpleto ng Vicinify ang kahilingan. Pakisubukan muli mamaya.'],
  502: ['We could not reach the service', 'A service used by Vicinify did not respond correctly. Please try again later.', 'Hindi maabot ang serbisyo', 'Hindi wastong tumugon ang serbisyong ginagamit ng Vicinify. Pakisubukan muli mamaya.'],
  503: ['Temporarily unavailable', 'Vicinify is temporarily unavailable. Please wait a moment and try again.', 'Pansamantalang hindi magamit', 'Pansamantalang hindi magamit ang Vicinify. Maghintay sandali at subukang muli.'],
  504: ['The service took too long', 'The server did not respond in time. Please try again later.', 'Naubos ang oras ng serbisyo', 'Hindi tumugon ang server sa itinakdang oras. Pakisubukan muli mamaya.']
};
export function isDocumentRequest(request) {
  return ['GET', 'HEAD'].includes(request.method) && (request.headers.get('sec-fetch-dest') === 'document' || (request.headers.get('accept') || '').includes('text/html'));
}
export function renderErrorHtml(status) {
  const definition = errors[status] || errors[500];
  const retry = ![401,403,404].includes(status);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${status} · Vicinify</title><style>:root{color-scheme:light;--bg:#f2f7f4;--surface:#fff;--ink:#193c34;--muted:#617a72;--line:#dce8e2;--soft:#e9f4ee;--accent:#237e72}*{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;padding:20px;background:var(--bg);font:14px/1.6 system-ui,sans-serif;color:var(--ink)}main{width:min(100%,420px);padding:28px;border:1px solid var(--line);border-radius:20px;background:var(--surface)}.brand{font-size:24px;font-weight:800;letter-spacing:-1px}.brand span{color:var(--accent)}.code{display:inline-block;margin-top:24px;padding:5px 11px;border:1px solid var(--line);border-radius:8px;background:var(--soft);color:var(--accent);font-size:12px;font-weight:700}h1{font-size:24px;line-height:1.3;margin:16px 0 10px}p{color:var(--muted);margin:0 0 22px}button,.primary{display:inline-block;border:0;border-radius:10px;padding:11px 18px;text-decoration:none;background:var(--accent);color:white;font:inherit;font-weight:600;cursor:pointer}.back{display:inline-block;color:var(--accent);margin-left:12px;font-size:12px}small{display:block;margin-top:16px;color:var(--muted)}@media(prefers-color-scheme:dark){:root{color-scheme:dark;--bg:#10211b;--surface:#192f28;--ink:#e4f0eb;--muted:#a1b8ae;--line:#365249;--soft:#203d33}}</style></head><body><main><div class="brand">vicinify<span>.</span></div><div class="code">${status}</div><h1 id="title">${definition[0]}</h1><p id="message">${definition[1]}</p>${retry?'<button id="retry" type="button" onclick="location.reload()">Try again</button><a href="/" class="back" id="home">Back to Vicinify</a>':'<a href="/" class="primary" id="home">Back to Vicinify</a>'}${status===429?'<small id="hint">If you share a Wi-Fi connection, others may share this limit.</small>':''}</main><script>try{if(['ph','tl'].includes(localStorage.getItem('vicinify_lang'))){document.documentElement.lang='tl';document.getElementById('title').textContent=${JSON.stringify(definition[2])};document.getElementById('message').textContent=${JSON.stringify(definition[3])};document.getElementById('home').textContent='Bumalik sa Vicinify';const retry=document.getElementById('retry');if(retry)retry.textContent='Subukan muli';const hint=document.getElementById('hint');if(hint)hint.textContent='Kung magkakasama sa isang koneksiyon, maaaring iisa ang inyong limitasyon.';}}catch{}</script></body></html>`;
}
export function renderHttpError(request, status, options={}) {
  const headers = new Headers(options.headers);
  for (const name of ['content-length','content-encoding','etag'])headers.delete(name);
  headers.set('Cache-Control','no-store');headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','no-referrer');headers.set('Vary','Accept, Sec-Fetch-Dest');
  const retryAfter = options.retryAfter || (status===429?60:status===503?30:null);
  if(retryAfter)headers.set('Retry-After',String(retryAfter));
  const document = isDocumentRequest(request);
  headers.set('Content-Type',document?'text/html; charset=utf-8':'application/json; charset=utf-8');
  const body=document?renderErrorHtml(status):JSON.stringify({error:(errors[status]||errors[500])[1],code:status===429?'RATE_LIMITED':'HTTP_'+status,status,...(retryAfter?{retryAfterSeconds:Number(retryAfter)}:{})});
  return new Response(request.method==='HEAD'?null:body,{status,headers});
}
