/* Vici workspace: account-scoped local history; answers come from the configured API. */
(function(root) {
    let config = {}, panel, backdrop, owner = null, chats = [], activeId = null, job = null, serial = 0, previousFocus;
    const drafts = new Map();
    const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const userKey = () => root.auth?.currentUser?.uid || 'signed-out';
    const storageKey = () => 'vicinify:vici-history:' + owner;
    const current = () => chats.find(chat => chat.id === activeId);
    const id = () => root.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
    const imageUrl = value => { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } };
    function save() { if (owner === 'signed-out') return; try { localStorage.setItem(storageKey(), JSON.stringify({version:1,chats:chats.slice(0,20)})); } catch { /* History remains in memory when device storage is unavailable. */ } }
    function cancelJob() { if (job) job.controller.abort(); job = null; serial++; }
    function syncOwner() {
        const next = userKey();
        if (owner === next) return;
        cancelJob(); owner = next; chats = []; activeId = null; drafts.clear();
        if (owner === 'signed-out') return;
        try {
            const saved = JSON.parse(localStorage.getItem(storageKey()) || '{}');
            if (saved.version !== 1 || !Array.isArray(saved.chats)) return;
            chats = saved.chats.filter(c => c && /^[A-Za-z0-9_-]{1,80}$/.test(c.id) && Array.isArray(c.messages)).slice(0,20).map(c => ({
                id:c.id,title:String(c.title || 'Conversation').slice(0,60),updatedAt:Number(c.updatedAt)||Date.now(),
                messages:c.messages.filter(m=>m && ['user','assistant'].includes(m.role) && typeof m.text==='string').slice(-20).map(m=>({role:m.role,text:m.text.slice(0,4000),error:!!m.error,time:Number(m.time)||Date.now(),picks:Array.isArray(m.picks)?m.picks.filter(p=>p && typeof p==='object' && typeof p.id==='string').slice(0,3):[]}))
            }));
        } catch { chats = []; }
    }
    function ensure() {
        if (panel) return panel;
        panel = document.createElement('section'); panel.id = 'smartAnswerPanel'; panel.className = 'vici-workspace hidden'; panel.hidden = true;
        panel.setAttribute('role','dialog'); panel.setAttribute('aria-modal','true'); panel.setAttribute('aria-label','Vici AI food finder');
        backdrop = document.createElement('div'); backdrop.className = 'vici-workspace-backdrop'; backdrop.hidden = true; backdrop.onclick = close;
        document.body.append(backdrop,panel);
        panel.addEventListener('click', async event => {
            const button = event.target.closest('button'); if (!button) return;
            const action = button.dataset.action;
            if (action === 'close') close();
            if (action === 'history') { panel.classList.toggle('history-open'); panel.querySelectorAll('[data-action="history"]').forEach(item=>item.setAttribute('aria-expanded',String(panel.classList.contains('history-open')))); }
            if (action === 'new') { cancelJob(); activeId = null; drafts.set('new',''); render(true); }
            if (action === 'select') { cancelJob(); activeId = button.dataset.chat; render(true); }
            if (action === 'prompt') send(button.dataset.prompt);
            if (action === 'clear') {
                const confirmed = root.vConfirm ? await root.vConfirm('Clear recent AI chats?','This removes Vici chat history saved on this device for your account.','Clear chats',true) : root.confirm('Clear recent AI chats on this device?');
                if (!confirmed) return;
                cancelJob(); chats=[]; activeId=null; drafts.clear(); save(); render(true);
            }
            if (action === 'map') { const ok = await config.viewOnMap?.(button.dataset.place); if (ok !== false) close(); }
        });
        panel.addEventListener('input', event => { if(event.target.id==='viciAiChatInput') drafts.set(activeId || 'new',event.target.value); });
        panel.addEventListener('submit', event => { if (event.target.classList.contains('vici-compose')) { event.preventDefault(); send(panel.querySelector('#viciAiChatInput').value); } });
        panel.addEventListener('error', event => { if(event.target.tagName==='IMG') event.target.remove(); }, true);
        document.addEventListener('keydown', event => {
            if (panel.hidden || document.querySelector('[id^="vConfirm_"]')) return;
            if (event.key==='Escape') { event.preventDefault(); close(); }
            if (event.key==='Tab' && panel.getAttribute('aria-modal')==='true') {
                const items=[...panel.querySelectorAll('button,input')].filter(el=>!el.disabled && el.getClientRects().length);
                if(event.shiftKey && document.activeElement===items[0]) { event.preventDefault(); items.at(-1)?.focus(); }
                else if(!event.shiftKey && document.activeElement===items.at(-1)) { event.preventDefault(); items[0]?.focus(); }
            }
        });
        return panel;
    }
    const clock = time => new Date(time).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
    const recentDate = time => new Date(time).toLocaleDateString([], {month:'short',day:'numeric'});
    function picksHtml(picks) {
        if (!picks?.length) return '';
        return `<div class="vici-results" role="list" aria-label="Places from this search">${picks.filter(p=>p && typeof p==='object' && typeof p.id==='string').slice(0,3).map(p=>{
            const photo=imageUrl(p.photo), rating=Number(p.rating);
            return `<article class="vici-result-card" role="listitem"><div class="vici-result-photo"><i data-lucide="store"></i>${photo?`<img src="${esc(photo)}" alt="${esc(p.name)}" loading="lazy">`:''}</div><div class="vici-result-info"><strong>${esc(p.name || 'Establishment')}</strong><span class="vici-result-rating">${rating>0 ? `<i data-lucide="star"></i>${esc(rating.toFixed(1))} <small>(${esc(Number(p.reviewCount)||0)})</small>`:'No ratings yet'}${p.distance?`<small> · Approx. ${esc(p.distance)}</small>`:''}</span><span class="vici-result-category">${esc(p.category || 'Local place')}</span><button type="button" data-action="map" data-place="${esc(p.id)}"><i data-lucide="map-pin"></i> View on map</button></div></article>`;
        }).join('')}</div>`;
    }
    function render(focus = false) {
        ensure(); syncOwner();
        const chat=current(), busy=!!job, messages=chat?.messages || [], prompts=['Cheap coffee nearby','Milk tea open now','Best food near me','Delivery nearby'];
        panel.classList.remove('history-open');
        panel.innerHTML=`<aside class="vici-history" aria-label="Recent AI chats"><div class="vici-history-brand"><span class="vici-symbol"><i data-lucide="sparkles"></i></span><div><strong>Vici AI</strong><small>Your local food guide</small></div><button type="button" class="vici-history-close" data-action="history" aria-label="Close recent chats"><i data-lucide="x"></i></button></div><button type="button" class="vici-new-chat" data-action="new"><i data-lucide="plus"></i> New chat</button><div class="vici-history-label">Recent chats <small>On this device</small></div><div class="vici-history-list">${chats.length?chats.map(c=>`<button type="button" class="vici-history-item${c.id===activeId?' active':''}" data-action="select" data-chat="${esc(c.id)}" ${c.id===activeId?'aria-current="true"':''}><i data-lucide="message-square"></i><span><strong>${esc(c.title)}</strong><small>${esc(c.messages.filter(m=>m.role==='assistant').at(-1)?.text.slice(0,50)||'No answer yet')}</small></span><time>${esc(recentDate(c.updatedAt))}</time></button>`).join(''):'<p class="vici-history-empty">Your conversations will appear here.</p>'}</div><button type="button" class="vici-clear-history" data-action="clear" ${!chats.length?'disabled':''}><i data-lucide="trash-2"></i> Clear recent chats</button></aside>
        <div class="vici-conversation"><header class="vici-workspace-header"><button type="button" class="vici-mobile-history" data-action="history" aria-label="Show recent chats" aria-expanded="false"><i data-lucide="panel-left"></i></button><span class="vici-symbol"><i data-lucide="sparkles"></i></span><div class="vici-workspace-title"><strong>Vici AI</strong><span>Find somewhere good, close to home.</span></div><button type="button" class="vici-minimize" data-action="close" aria-label="Minimize Vici AI"><i data-lucide="minus"></i></button><button type="button" class="vici-dismiss" data-action="close" aria-label="Close Vici AI"><i data-lucide="x"></i></button></header>
        <div class="vici-messages" role="log" aria-label="AI conversation">${!messages.length?`<div class="vici-welcome"><span class="vici-welcome-mark"><i data-lucide="sparkles"></i></span><span class="vici-eyebrow">YOUR NEIGHBORHOOD, DISCOVERED</span><h2>What are you craving?</h2><p>Find local food spots, compare saved ratings, and discover places around Lipa.</p><div class="vici-starter-grid">${prompts.map((q,i)=>`<button type="button" data-action="prompt" data-prompt="${esc(q)}"><i data-lucide="${['coffee','cup-soda','utensils','bike'][i]}"></i><span>${esc(q)}</span><i data-lucide="arrow-up-right"></i></button>`).join('')}</div></div>`:messages.map(m=>`<div class="vici-message ${m.role==='user'?'from-user':'from-ai'}">${m.role==='assistant'?'<span class="vici-message-avatar"><i data-lucide="sparkles"></i></span>':''}<div class="vici-message-content"><div class="vici-message-text${m.error?' is-error':''}">${esc(m.text)}</div>${m.role==='assistant'?picksHtml(m.picks):''}<time>${esc(clock(m.time))}${m.error?' · Could not get an answer':''}</time></div></div>`).join('')}${busy?'<div class="vici-message from-ai vici-loading" role="status"><span class="vici-message-avatar"><i data-lucide="sparkles"></i></span><span>Looking through local places<span class="vici-loading-dots">…</span></span></div>':''}</div>
        <div class="vici-compose-wrap"><form class="vici-compose"><i data-lucide="sparkles"></i><input id="viciAiChatInput" aria-label="Ask Vici AI" maxlength="500" value="${esc(drafts.get(activeId||'new')||'')}" placeholder="Ask about food, places, or your next coffee…" autocomplete="off" ${busy?'disabled':''}><button type="submit" aria-label="Send to Vici AI" ${busy?'disabled':''}><i data-lucide="${busy?'loader-2':'arrow-up'}"></i></button></form><span class="vici-compose-note">Check details with the business before visiting.</span></div></div>`;
        root.debouncedIcons?.();
        const thread=panel.querySelector('.vici-messages'); thread.scrollTop=thread.scrollHeight;
        if(focus && !panel.hidden) panel.querySelector('#viciAiChatInput')?.focus();
    }
    root.addEventListener('vicinify:pagechange', () => { if(!document.querySelector('#page-map.active')) close(); });
    function open() { ensure(); syncOwner(); if(panel.hidden) previousFocus=document.activeElement; root.PlacePreview?.close?.(); panel.hidden=false; backdrop.hidden=false; panel.classList.remove('hidden'); render(true); }
    function close() { if(!panel || panel.hidden)return; panel.hidden=true; panel.classList.add('hidden'); backdrop.hidden=true; previousFocus?.focus?.(); }
    async function send(raw) {
        ensure(); syncOwner();
        const text=String(raw||'').trim().slice(0,500); if(!text || job)return false;
        if(panel.hidden)open();
        let chat=current(); if(!chat) { chat={id:id(),title:text.slice(0,45),updatedAt:Date.now(),messages:[]};chats.unshift(chat);activeId=chat.id;chats=chats.slice(0,20); }
        const history=chat.messages.filter(m=>!m.error).slice(-6).map(m=>({role:m.role,text:m.text.slice(0,500)}));
        chat.messages.push({role:'user',text,time:Date.now(),picks:[]});chat.messages=chat.messages.slice(-20);chat.updatedAt=Date.now();drafts.set(activeId,'');
        chats=[chat,...chats.filter(c=>c.id!==chat.id)];
        const pending={number:++serial,chat:chat.id,owner,controller:new AbortController()};job=pending;save();render();
        try {
            const reply=await config.ask?.(text,{history,signal:pending.controller.signal});
            syncOwner();if(job!==pending||owner!==pending.owner)return;
            chat.messages.push({role:'assistant',text:String(reply?.answer||'Vici AI is unavailable. Please try again.').slice(0,4000),error:!reply||!!reply.error,time:Date.now(),picks:reply?.error?[]:(reply?.picks||[]).slice(0,3)});
        } catch(error) { if(job===pending && !pending.controller.signal.aborted) chat.messages.push({role:'assistant',text:'Vici AI could not connect. Please try again.',error:true,time:Date.now(),picks:[]}); }
        finally { if(job===pending) { job=null;chat.messages=chat.messages.slice(-20);chat.updatedAt=Date.now();save();render(true); } }
        return true;
    }
    root.auth?.onAuthStateChanged?.(() => {
        const previousOwner = owner; syncOwner();
        if (previousOwner !== null && previousOwner !== owner) { close(); if(panel) panel.innerHTML=''; }
    });
    root.ViciChat={configure:options=>{config=options;},panel:ensure,open,close,send,isOpen:()=>!!panel&&!panel.hidden};
})(window);
