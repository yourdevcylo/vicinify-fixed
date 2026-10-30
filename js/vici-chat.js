/* Vici workspace: account-scoped local history; answers come from the configured API. */
(function(root) {
    let config = {}, panel, backdrop, owner = null, chats = [], activeId = null, job = null, serial = 0, previousFocus;
    const drafts = new Map();
    let statusStops=[];const stopStatuses=()=>{statusStops.forEach(stop=>stop());statusStops=[];};
    const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const userKey = () => root.auth?.currentUser?.uid || 'signed-out';
    const storageKey = () => 'vicinify:vici-history:' + owner;
    const current = () => chats.find(chat => chat.id === activeId);
    const id = () => root.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
    const imageUrl = value => { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } };
    function cleanMemory(value={}) { return {searchQuery:typeof value?.searchQuery==='string'?value.searchQuery.slice(0,500):'',placeIds:Array.isArray(value?.placeIds)?value.placeIds.filter(id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,180}$/.test(id)).slice(0,3):[]}; }
    function save() { if (owner === 'signed-out') return; try { localStorage.setItem(storageKey(), JSON.stringify({version:1,chats:chats.slice(0,20)})); } catch { /* History remains in memory when device storage is unavailable. */ } }
    function cancelJob() { if (job) job.controller.abort(); job = null; serial++; }
    function syncOwner() {
        const next = userKey();
        if (owner === next) return;
        cancelJob();stopStatuses(); owner = next; chats = []; activeId = null; drafts.clear();
        if (owner === 'signed-out') return;
        try {
            const saved = JSON.parse(localStorage.getItem(storageKey()) || '{}');
            if (saved.version !== 1 || !Array.isArray(saved.chats)) return;
            chats = saved.chats.filter(c => c && /^[A-Za-z0-9_-]{1,80}$/.test(c.id) && Array.isArray(c.messages)).slice(0,20).map(c => ({
                id:c.id,title:String(c.title || 'Conversation').slice(0,60),updatedAt:Number(c.updatedAt)||Date.now(),memory:cleanMemory(c.memory),requestDraft:root.ViciRequest?.clean(c.requestDraft),orderDraft:root.ViciRequest?.cleanOrder(c.orderDraft),
                messages:c.messages.filter(m=>m && ['user','assistant'].includes(m.role) && typeof m.text==='string').slice(-20).map(m=>({role:m.role,text:m.text.slice(0,4000),error:!!m.error,time:Number(m.time)||Date.now(),requestDraft:root.ViciRequest?.clean(m.requestDraft),requestReady:m.requestReady===true,requestUnavailable:m.requestUnavailable===true,requestMeta:m.requestMeta,menuPreview:m.menuPreview,actions:m.actions,picks:Array.isArray(m.picks)?m.picks.filter(p=>p && typeof p==='object' && typeof p.id==='string').slice(0,3):[]}))
            }));
        } catch { chats = []; }
    }
    function ensure() {
        if (panel) return panel;
        panel = document.createElement('section'); panel.id = 'smartAnswerPanel'; panel.className = 'vici-workspace hidden'; panel.hidden = true;
        panel.setAttribute('role','dialog'); panel.setAttribute('aria-modal','true'); panel.setAttribute('aria-label','Vici AI food finder');
        backdrop = document.createElement('div'); backdrop.className = 'vici-workspace-backdrop'; backdrop.hidden = true; backdrop.onclick = close;
        document.body.append(backdrop,panel);
        const handleClick = async event => {
            const button = event.target.closest('button'); if (!button) return;
            const action = button.dataset.action;
            if (action === 'close') { close(); }
            if (action === 'history') { panel.classList.toggle('history-open'); panel.querySelectorAll('[data-action="history"]').forEach(item=>item.setAttribute('aria-expanded',String(panel.classList.contains('history-open')))); }
            if (action === 'new') { cancelJob(); activeId = null; drafts.set('new',''); render(true); }
            if (action === 'select') { cancelJob(); activeId = button.dataset.chat; render(true); }
            if (action === 'prompt') send(root.LangManager?.translateKey?.(button.dataset.prompt)||button.dataset.prompt);
            if (action === 'delete-chat') {
                const chatId=button.dataset.chat;
                if(activeId===chatId){cancelJob();activeId=null;}
                chats=chats.filter(c=>c.id!==chatId);drafts.delete(chatId);save();render(true);
            }
            if (action === 'clear') {
                const confirmed = root.vConfirm ? await root.vConfirm('Clear recent AI chats?','This removes Vici chat history saved on this device for your account.','Clear chats',true) : root.confirm('Clear recent AI chats on this device?');
                if (!confirmed) return;
                cancelJob(); chats=[]; activeId=null; drafts.clear(); save(); render(true);
            }
            if(action==='request') {const message=current()?.messages[Number(button.dataset.message)];if(!message?.requestReady||!current()?.requestDraft?.active)return;button.disabled=true;try{if(await config.reviewRequest?.(current().requestDraft)===true)close();}finally{button.disabled=false;} }
            if(action==='view-order')root.ViciCommerce?.openCart(current()?.orderDraft);
            if(action==='book'){if(await config.reviewRequest?.({active:true,placeId:button.dataset.place,requestType:'table_reservation'})===true)close();}
            if(action==='directions'){if(await config.directions?.(button.dataset.place)===true)close();}
            if(action==='order')await config.viewMenu?.(button.dataset.place);
            if(action==='add-menu'){const preview=current()?.messages.findLast(m=>m.menuPreview?.placeId===button.dataset.place)?.menuPreview;const item=preview?.items.find(i=>i.id===button.dataset.item);if(item)root.ViciCommerce?.addItem({id:preview.placeId,name:preview.placeName},item);}
            if(action==='request-status'){const r=current()?.messages[Number(button.dataset.message)]?.requestMeta;if(r){close();root.openChatModal?.(r.placeId,r.placeName,null,'transaction',r.bookingId);}}
            if(action==='model-action'){const a=current()?.messages[Number(button.dataset.message)]?.actions?.[Number(button.dataset.actionIndex)];if(a)await runAction(a);}
            if(action==='menu')await config.viewMenu?.(button.dataset.place);
            if(action==='details'||action==='inquire'){const fn=action==='details'?config.viewPlace:config.messageBusiness;if(await fn?.(button.dataset.place)===true)close();}
            if (action === 'map') { const ok = await config.viewOnMap?.(button.dataset.place); if (ok !== false) { const chat=current();if(chat){chat.memory={...cleanMemory(chat.memory),placeIds:[button.dataset.place]};save();}close(); } }
        };
        panel.addEventListener('click',event=>handleClick(event).catch(error=>root.showToast?.(error.message||'Action could not be completed.','error')));
        panel.addEventListener('input', event => { if(event.target.id==='viciAiChatInput') drafts.set(activeId || 'new',event.target.value); });
        panel.addEventListener('submit', event => { if (event.target.classList.contains('vici-compose')) { event.preventDefault(); send(panel.querySelector('#viciAiChatInput').value); } });
        panel.addEventListener('error', event => { if(event.target.tagName==='IMG') event.target.remove(); }, true);
        document.addEventListener('keydown', event => {
            if (panel.hidden || document.querySelector('dialog[open]') || document.querySelector('[id^="vConfirm_"]')) return;
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
            return `<article class="vici-result-card" role="listitem"><div class="vici-result-photo"><i data-lucide="store"></i>${photo?`<img src="${esc(photo)}" alt="${esc(p.name)}" loading="lazy">`:''}</div><div class="vici-result-info"><strong><button type="button" class="vici-place-name" data-action="details" data-place="${esc(p.id)}">${esc(p.name || 'Establishment')}</button></strong><span class="vici-result-rating">${rating>0 ? `<i data-lucide="star"></i>${esc(rating.toFixed(1))} <small>(${esc(Number(p.reviewCount)||0)})</small>`:'No ratings yet'}${p.distance?`<small> · Approx. ${esc(p.distance)}</small>`:''}</span><span class="vici-result-category">${esc(p.category || 'Local place')}</span>${p.priceRange?`<small>${esc(p.priceRange)}</small>`:''}${p.address?`<small class="vici-card-address">${esc(p.address)}</small>`:''}<div class="vici-card-actions"><button type="button" data-action="menu" data-place="${esc(p.id)}"><i data-lucide="utensils"></i> View menu</button>${p.canMap!==false?`<button type="button" data-action="map" data-place="${esc(p.id)}"><i data-lucide="map-pin"></i> View on map</button>`:''}${p.canMap?`<button type="button" data-action="directions" data-place="${esc(p.id)}">Get directions</button>`:''}${p.canOrder?`<button type="button" data-action="order" data-place="${esc(p.id)}">Request order</button>`:''}${p.canBook?`<button type="button" data-action="book" data-place="${esc(p.id)}">Request reservation</button>`:''}</div></div></article>`;
        }).join('')}</div>`;
    }
    function render(focus = false) {
        ensure(); syncOwner();stopStatuses();
        const chat=current(), busy=!!job, messages=chat?.messages || [], prompts=['Cheap coffee nearby','Milk tea open now','Best food near me','Delivery nearby'];
        const latestDraftIndex=messages.findLastIndex(m=>m.role==='assistant'&&m.requestReady&&m.requestDraft?.active);
        panel.classList.remove('history-open');
        panel.innerHTML=`<aside class="vici-history" aria-label="Recent AI chats"><div class="vici-history-brand"><span class="vici-symbol"><i data-lucide="sparkles"></i></span><div><strong>Vici AI</strong><small>Your local food guide</small></div><button type="button" class="vici-history-close" data-action="history" aria-label="Close recent chats"><i data-lucide="x"></i></button></div><button type="button" class="vici-new-chat" data-action="new"><i data-lucide="plus"></i> New chat</button><div class="vici-history-label">Recent chats <small>On this device</small></div><div class="vici-history-list">${chats.length?chats.map(c=>`<div class="vici-history-row"><button type="button" class="vici-history-item${c.id===activeId?' active':''}" data-action="select" data-chat="${esc(c.id)}" ${c.id===activeId?'aria-current="true"':''}><i data-lucide="message-square"></i><span><strong>${esc(c.title)}</strong><small>${esc(c.messages.filter(m=>m.role==='assistant').at(-1)?.text.slice(0,50)||'No answer yet')}</small></span><time>${esc(recentDate(c.updatedAt))}</time></button><button type="button" class="vici-delete-chat" data-action="delete-chat" data-chat="${esc(c.id)}" aria-label="Delete chat"><i data-lucide="trash-2"></i></button></div>`).join(''):'<p class="vici-history-empty">Your conversations will appear here.</p>'}</div><button type="button" class="vici-clear-history" data-action="clear" ${!chats.length?'disabled':''}><i data-lucide="trash-2"></i> Clear recent chats</button></aside>
        <div class="vici-conversation"><header class="vici-workspace-header"><button type="button" class="vici-mobile-history" data-action="history" aria-label="Show recent chats" aria-expanded="false"><i data-lucide="panel-left"></i></button><span class="vici-symbol"><i data-lucide="sparkles"></i></span><div class="vici-workspace-title"><strong>Vici AI</strong><span>Find somewhere good, close to home.</span></div><button type="button" class="vici-header-new-chat" data-action="new" aria-label="Create new conversation" title="New conversation"><i data-lucide="plus"></i><span>New chat</span></button><button type="button" class="vici-dismiss" data-action="close" aria-label="Close Vici AI"><i data-lucide="x"></i></button></header>
        <div class="vici-messages" role="log" aria-label="AI conversation">${!messages.length?`<div class="vici-welcome"><span class="vici-welcome-mark"><i data-lucide="sparkles"></i></span><span class="vici-eyebrow">YOUR NEIGHBORHOOD, DISCOVERED</span><h2>What are you craving?</h2><p>Find local food spots, compare saved ratings, and discover places around Lipa.</p><div class="vici-starter-grid">${prompts.map((q,i)=>`<button type="button" data-action="prompt" data-prompt="${esc(q)}"><i data-lucide="${['coffee','cup-soda','utensils','bike'][i]}"></i><span>${esc(q)}</span><i data-lucide="arrow-up-right"></i></button>`).join('')}</div></div>`:messages.map((m,messageIndex)=>`<div class="vici-message ${m.role==='user'?'from-user':'from-ai'}">${m.role==='assistant'?'<span class="vici-message-avatar"><i data-lucide="sparkles"></i></span>':''}<div class="vici-message-content"><div ${m.error?'':'data-no-translate'} class="vici-message-text${m.error?' is-error':''}">${esc(m.text)}</div>${m.role==='assistant'&&messageIndex===latestDraftIndex&&chat?.requestDraft?.active&&m.requestReady&&m.requestDraft?.active?`<div class="vici-request-action"><button type="button" data-action="request" data-message="${messageIndex}"><i data-lucide="calendar-check"></i> ${m.requestDraft.requestType?.includes('reservation')?'Review reservation':'Review request'}</button><small>Review and send in the form. Not yet submitted.</small></div>`:''}${m.role==='assistant'?picksHtml(m.picks):''}${m.role==='assistant'?interactiveHtml(m,messageIndex):''}${m.role==='assistant'&&m.requestUnavailable&&m.requestDraft?.placeId?`<button type="button" class="vici-inquiry-action" data-action="inquire" data-place="${esc(m.requestDraft.placeId)}">Message business</button>`:''}<time>${esc(clock(m.time))}${m.error?' · Could not get an answer':''}</time></div></div>`).join('')}${chat?.orderDraft?.lines?.length?'<div class="vici-order-toolbar"><button type="button" data-action="view-order">Review order draft</button><small>Unsent · customer confirmation required</small></div>':''}${busy?'<div class="vici-message from-ai vici-loading" role="status"><span class="vici-message-avatar"><i data-lucide="sparkles"></i></span><span>Looking through local places<span class="vici-loading-dots">…</span></span></div>':''}</div>
        <div class="vici-compose-wrap"><form class="vici-compose"><i data-lucide="sparkles"></i><input id="viciAiChatInput" aria-label="Ask Vici AI" maxlength="500" value="${esc(drafts.get(activeId||'new')||'')}" placeholder="Ask about food, places, or your next coffee…" autocomplete="off" ${busy?'disabled':''}><button type="submit" aria-label="Send to Vici AI" ${busy?'disabled':''}><i data-lucide="${busy?'loader-2':'arrow-up'}"></i></button></form><span class="vici-compose-note">Check details with the business before visiting.</span></div></div>`;
        watchStatuses();
        root.debouncedIcons?.();
        const thread=panel.querySelector('.vici-messages'); thread.scrollTop=thread.scrollHeight;
        if(focus && !panel.hidden) panel.querySelector('#viciAiChatInput')?.focus();
    }
    root.addEventListener('vicinify:pagechange', () => { if(!document.querySelector('#page-map.active')) close(); });
    function open() { document.getElementById('viciAiResume')?.remove(); ensure(); syncOwner(); if(panel.hidden) previousFocus=document.activeElement; root.PlacePreview?.close?.(); panel.hidden=false; backdrop.hidden=false; panel.classList.remove('hidden'); render(true); }
    function close() {
        stopStatuses();
        document.getElementById('viciAiResume')?.remove();
        if (!panel || panel.hidden) return;
        panel.hidden = true;
        panel.classList.add('hidden');
        if (backdrop) backdrop.hidden = true;
        previousFocus?.focus?.();
    }
    async function send(raw) {
        ensure(); syncOwner();
        const text=String(raw||'').trim().slice(0,500); if(!text || job)return false;
        if(panel.hidden)open();
        let chat=current(); if(!chat) { chat={id:id(),title:text.slice(0,45),updatedAt:Date.now(),messages:[]};chats.unshift(chat);activeId=chat.id;chats=chats.slice(0,20); }
        const memory=cleanMemory(chat.memory);
        const history=chat.messages.filter(m=>!m.error).slice(-6).map(m=>({role:m.role,text:m.text.slice(0,500)}));
        chat.messages.push({role:'user',text,time:Date.now(),picks:[]});chat.messages=chat.messages.slice(-20);chat.updatedAt=Date.now();drafts.set(activeId,'');
        chats=[chat,...chats.filter(c=>c.id!==chat.id)];
        const pending={number:++serial,chat:chat.id,owner,controller:new AbortController()};job=pending;save();render();
        try {
            const reply=await config.ask?.(text,{history,memory,requestRefs:chat.messages.filter(m=>m.requestMeta).slice(-3).map(m=>m.requestMeta.bookingId),orderDraft:root.ViciRequest?.cleanOrder(chat.orderDraft),requestDraft:root.ViciRequest?.clean(chat.requestDraft),signal:pending.controller.signal});
            syncOwner();if(job!==pending||owner!==pending.owner)return;
            if(reply&&!reply.error&&Object.hasOwn(reply,'orderDraft')){const incoming=root.ViciRequest?.cleanOrder(reply.orderDraft);if(!chat.orderDraft?.pendingSubmission)chat.orderDraft=incoming?{...incoming,key:crypto.randomUUID()}:null;}
            if(reply&&!reply.error&&reply.requestDraft)chat.requestDraft=root.ViciRequest?.clean(reply.requestDraft);
            if(reply&&!reply.error&&reply.memory)chat.memory=cleanMemory(reply.memory);
            chat.messages.push({role:'assistant',text:String(reply?.answer||'Vici AI is unavailable. Please try again.').slice(0,4000),error:!reply||!!reply.error,time:Date.now(),requestDraft:root.ViciRequest?.clean(reply?.requestDraft),requestReady:reply?.requestReady===true,requestUnavailable:reply?.requestUnavailable===true,menuPreview:reply?.menuPreview,actions:reply?.actions||[],picks:reply?.error?[]:(reply?.picks||[]).slice(0,3)});
        } catch(error) { if(job===pending && !pending.controller.signal.aborted) chat.messages.push({role:'assistant',text:'Vici AI could not connect. Please try again.',error:true,time:Date.now(),picks:[]}); }
        finally { if(job===pending) { job=null;chat.messages=chat.messages.slice(-20);chat.updatedAt=Date.now();save();render(true); } }
        return true;
    }
    function ensureChat(title='Order draft'){syncOwner();let chat=current();if(!chat){chat={id:id(),title,updatedAt:Date.now(),messages:[]};chats.unshift(chat);chats=chats.slice(0,20);activeId=chat.id;}return chat;}
    async function runAction(a){const allowed=['VIEW_RESTAURANT','VIEW_MENU','SHOW_ON_MAP','GET_DIRECTIONS','ADD_TO_ORDER','VIEW_ORDER','EDIT_ORDER','REQUEST_ORDER','REQUEST_RESERVATION','CANCEL_DRAFT','VIEW_REQUEST_STATUS'];if(!allowed.includes(a.type))return;
      if(a.type==='VIEW_REQUEST_STATUS'){close();return root.openChatModal?.(a.placeId,a.placeName,null,'transaction',a.requestId);}
      if(a.type==='VIEW_MENU'||a.type==='REQUEST_ORDER')return config.viewMenu?.(a.placeId);
      if(a.type==='VIEW_ORDER'||a.type==='EDIT_ORDER')return root.ViciCommerce?.openCart(current()?.orderDraft);
      if(a.type==='CANCEL_DRAFT'){if(!current()?.orderDraft?.pendingSubmission){current().orderDraft=null;current().requestDraft=root.ViciRequest?.clean();save();render();}return;}
      if(a.type==='ADD_TO_ORDER'){const items=await root.ViciCommerce.getMenu(a.placeId);const item=items.find(i=>i.id===a.itemId);if(item?.available)root.ViciCommerce.addItem({id:a.placeId,name:current()?.messages.flatMap(m=>m.picks||[]).find(p=>p.id===a.placeId)?.name||'Establishment'},item);return;}
      const result=a.type==='VIEW_RESTAURANT'?await config.viewPlace?.(a.placeId):a.type==='SHOW_ON_MAP'?await config.viewOnMap?.(a.placeId):a.type==='GET_DIRECTIONS'?await config.directions?.(a.placeId):await config.reviewRequest?.({active:true,placeId:a.placeId,requestType:'table_reservation'});if(result===true)close();
    }
    function interactiveHtml(m,index){let html='';if(m.menuPreview){const p=m.menuPreview;html+=`<section class="vici-menu-preview"><b>${esc(p.placeName)} · Listed menu</b>${p.items?.length?p.items.map(i=>`<article>${imageUrl(i.photoUrl)?`<img src="${esc(imageUrl(i.photoUrl))}" alt="${esc(i.name)}" loading="lazy">`:''}<strong>${esc(i.name)}</strong><small>${root.ViciCommerce?.money(i.priceCents)||''} · ${i.available?'Available':'Unavailable'}</small>${i.available&&p.canOrder?`<button type="button" data-action="add-menu" data-place="${esc(p.placeId)}" data-item="${esc(i.id)}">Add to order</button>`:''}</article>`).join(''):'<p>No structured menu items are listed.</p>'}<button type="button" data-action="menu" data-place="${esc(p.placeId)}">View full menu</button></section>`;}
      const labels={VIEW_RESTAURANT:'View restaurant',VIEW_MENU:'View menu',SHOW_ON_MAP:'View on map',GET_DIRECTIONS:'Get directions',ADD_TO_ORDER:'Add to order',VIEW_ORDER:'Review order',EDIT_ORDER:'Edit order',REQUEST_ORDER:'Request order',REQUEST_RESERVATION:'Request reservation',CANCEL_DRAFT:'Cancel draft',VIEW_REQUEST_STATUS:'View request status'};
      if(m.actions?.length)html+=`<div class="vici-model-actions">${m.actions.filter(a=>labels[a.type]).map((a,i)=>`<button type="button" data-action="model-action" data-message="${index}" data-action-index="${i}">${labels[a.type]}</button>`).join('')}</div>`;
      if(m.requestMeta)html+=`<section class="vici-status-card" data-request-status="${esc(m.requestMeta.bookingId)}"><b>Request ${esc(m.requestMeta.reference||'')}</b><p data-live-status>Loading current request status…</p><button type="button" data-action="request-status" data-message="${index}">View request status</button></section>`;return html;
    }
    function watchStatuses(){if(panel.hidden)return;const account=userKey();for(const m of (current()?.messages||[]).filter(m=>m.requestMeta).slice(-5)){const r=m.requestMeta,ref=root.db?.collection('bookings').doc(r.bookingId);if(typeof ref?.onSnapshot!=='function')continue;let previous=r.status;const stop=ref.onSnapshot(doc=>{if(account!==userKey()||panel.hidden)return;const row=[...panel.querySelectorAll('[data-request-status]')].find(e=>e.dataset.requestStatus===r.bookingId),order=doc.data();if(!row)return;if(!doc.exists||order.userId!==account){row.querySelector('[data-live-status]').textContent='Request is unavailable.';return;}const labels={pending:'Pending Establishment Confirmation',accepted:order.requestType==='table_reservation'?'Reservation accepted by establishment · follow requirements/payment':'Accepted · payment required before preparation',payment_submitted:'Payment under review',payment_confirmed:'Payment verified',preparing:'Preparing',ready:'Ready',out_for_delivery:'Out for delivery',delivered:'Delivered · waiting for your confirmation',fulfilled:'Fulfilled · waiting for your confirmation',received:'Completed',rejected:'Declined',cancelled:'Cancelled'};row.querySelector('[data-live-status]').textContent=labels[order.status]||order.status;if(previous&&previous!==order.status)root.showToast?.(labels[order.status]||'Request status updated.','info');previous=order.status;r.status=order.status;save();},()=>{const row=[...panel.querySelectorAll('[data-request-status]')].find(e=>e.dataset.requestStatus===r.bookingId);if(row)row.querySelector('[data-live-status]').textContent='Could not load status. Open your transactions to retry.';});statusStops.push(stop);}}
    function setOrderDraft(draft){const chat=ensureChat(),hadOrder=!!chat.orderDraft?.lines?.length;chat.orderDraft=root.ViciRequest?.cleanOrder(draft);chat.updatedAt=Date.now();save();if(panel&&!panel.hidden&&hadOrder!==!!chat.orderDraft?.lines?.length)render();}
    function recordRequest(record){if(!record?.bookingId||!root.auth?.currentUser)return;const chat=ensureChat('Customer request');if(chat.messages.some(m=>m.requestMeta?.bookingId===record.bookingId))return;chat.messages.push({role:'assistant',text:'Your request has been submitted. Pending Establishment Confirmation.',time:Date.now(),picks:[],requestMeta:record});save();if(panel&&!panel.hidden)render();}
    root.auth?.onAuthStateChanged?.(() => {
        const previousOwner = owner; syncOwner();
        if (previousOwner !== null && previousOwner !== owner) { close(); if(panel) panel.innerHTML=''; }
    });
    root.ViciChat={setOrderDraft,getOrderDraft:()=>{syncOwner();return current()?.orderDraft||null;},getChatId:()=>{syncOwner();return activeId;},recordRequest,configure:options=>{config=options;},panel:ensure,open,close,send,isOpen:()=>!!panel&&!panel.hidden};
})(window);
