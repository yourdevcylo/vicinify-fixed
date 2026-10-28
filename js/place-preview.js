/* Read-only menu preview: reuse public store posts/reviews, loaded only on demand. */
(function(root) {
    let overlay, place = null, tab = 'menu', generation = 0, previousFocus, selectedPost = null;
    let content = {menu:null,reviews:null}, loading = {}, errors = {};
    const cache = new Map(), pending = new Map(), failedImages = new Set();
    let ownsScrollLock = false;
    const isDocked = () => root.innerWidth >= 1500;
    function syncSelection(){document.querySelectorAll('#listViewContainer [data-place-card]').forEach(card=>{const active=!!place&&!overlay?.hidden&&card.dataset.placeCard===place.id;card.classList.toggle('is-previewed',active);if(active)card.setAttribute('aria-current','true');else card.removeAttribute('aria-current');});}
    function syncMode(){
        const open=!!place&&overlay&&!overlay.hidden, docked=!!open&&isDocked();
        document.body.classList.toggle('place-preview-docked',docked);
        if(overlay){overlay.dataset.docked=String(docked);overlay.querySelector('.list-preview-sheet')?.setAttribute('aria-modal',String(!docked));}
        if(open&&!docked&&!ownsScrollLock){root.lockBodyScroll?.(true);ownsScrollLock=true;}
        else if((!open||docked)&&ownsScrollLock){root.lockBodyScroll?.(false);ownsScrollLock=false;}
        syncSelection();
    }
    root.addEventListener('resize',syncMode);
    const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    function safeImage(value) {
        if(failedImages.has(String(value||'')))return '';
        if(root.safeImageUrl) return root.safeImageUrl(value);
        const text=String(value || '').trim();
        if(!text)return '';
        if(/^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(text))return text.replace(/\s/g,'');
        try { const url=new URL(text,root.location.href);return ['http:','https:'].includes(url.protocol)?url.href:''; }catch{return '';}
    }
    const millis = doc => doc.createdAt?.toMillis?.() || doc.updatedAt?.toMillis?.() || 0;
    const dateLabel = doc => { const date=doc.createdAt?.toDate?.();return date && Number.isFinite(date.getTime())?date.toLocaleDateString([], {month:'short',day:'numeric',year:'numeric'}):'Store post'; };
    function ensure() {
        if(overlay)return;
        overlay=document.createElement('div');overlay.id='placeListPreview';overlay.className='place-list-preview';overlay.hidden=true;
        document.body.appendChild(overlay);
        overlay.addEventListener('click',event=>{
            const button=event.target.closest('[data-preview-action]');if(!button)return;
            const action=button.dataset.previewAction;
            if(action==='close')close();
            if(action==='tab')selectTab(button.dataset.tab,true);
            if(action==='retry')load(tab,true);
            if(action==='image'){selectedPost=content.menu?.find(post=>post.id===button.dataset.post);render();overlay.querySelector('.list-menu-back')?.focus();}
            if(action==='gallery')openGallery();
            if(action==='details'){const id=place.id;close();root.viewPlace?.(id);}
            if(action==='booking'){const p=place;close();root.openBookingModal?.(p.id,p.name||'Establishment');}
            if(action==='chat'){const p=place;close();root.openChatModal?.(p.id,p.name||'Establishment');}
        });
        overlay.addEventListener('error',event=>{if(event.target.tagName==='IMG'){failedImages.add(event.target.getAttribute('src'));event.target.remove();if(!overlay.hidden)render();}},true);
        document.addEventListener('keydown',event=>{
            if(overlay.hidden||root.ViciChat?.isOpen?.())return;
            if(event.key==='Escape'){event.preventDefault();if(selectedPost)openGallery();else close();}
            if(event.target.getAttribute?.('role')==='tab' && ['ArrowRight','ArrowLeft','Home','End'].includes(event.key)){
                event.preventDefault();const tabs=['menu','reviews','about'];const at=tabs.indexOf(tab);selectTab(event.key==='Home'?tabs[0]:event.key==='End'?tabs.at(-1):tabs[(at+(event.key==='ArrowRight'?1:tabs.length-1))%tabs.length],true);
            }
            if(event.key==='Tab'&&!isDocked()){
                const items=[...overlay.querySelectorAll('button,a')].filter(el=>!el.disabled&&el.tabIndex>=0&&el.getClientRects().length);
                if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();items.at(-1)?.focus();}
                else if(!event.shiftKey&&document.activeElement===items.at(-1)){event.preventDefault();items[0]?.focus();}
            }
        });
    }
    async function query(type, id, force) {
        const key=type+':'+id, saved=cache.get(key);
        if(!force&&saved&&Date.now()-saved.time<300000)return saved.docs;
        if(pending.has(key))return pending.get(key);
        const request=(async()=>{
            let base=root.db.collection(type==='menu'?'place_posts':'reviews').where('placeId','==',id);
            if(type==='reviews')base=base.where('isPublic','==',true);
            let snapshot;
            try{snapshot=await base.orderBy('createdAt','desc').limit(30).get();}
            catch(error){if(!String(error.code).includes('failed-precondition'))throw error;snapshot=await base.limit(30).get();}
            const docs=snapshot.docs.map(doc=>({...doc.data(),id:doc.id})).filter(doc=>type!=='reviews'||doc.isPublic===true).sort((a,b)=>millis(b)-millis(a));
            cache.set(key,{time:Date.now(),docs});return docs;
        })();pending.set(key,request);
        try{return await request;}finally{if(pending.get(key)===request)pending.delete(key);}
    }
    async function load(type,force=false) {
        if(!place||type==='about')return;
        if(content[type]!==null&&!force)return;
        const ticket=generation, id=place.id;loading[type]=true;errors[type]='';render();
        try{const docs=await query(type,id,force);if(ticket!==generation)return;content[type]=docs;}
        catch(error){if(ticket!==generation)return;errors[type]='Could not load '+(type==='menu'?'menu posts':'public reviews')+'. Please try again.';}
        finally{if(ticket===generation){loading[type]=false;if(tab===type)render();}}
    }
    function selectTab(value,focus=false){if(!['menu','reviews','about'].includes(value))return;tab=value;selectedPost=null;render();if(focus)overlay.querySelector('[data-tab="'+tab+'"]').focus();load(tab);}
    function openGallery(){const previous=selectedPost?.id;selectedPost=null;render();[...overlay.querySelectorAll('.list-menu-thumbnail')].find(button=>button.dataset.post===previous)?.focus();}
    function menuHtml(){
        if(selectedPost){const photo=safeImage(selectedPost.mediaUrl);return `<div class="list-menu-detail"><button type="button" class="list-menu-back" data-preview-action="gallery"><i data-lucide="arrow-left"></i> All menu posts</button>${photo?`<div class="list-menu-full-image"><img src="${esc(photo)}" alt="Menu or store post from ${esc(place.name)}"></div><a class="list-menu-image-link" href="${esc(photo)}" target="_blank" rel="noopener noreferrer">Open full-size image <i data-lucide="external-link"></i></a>`:''}${selectedPost.mediaUrl&&!photo?'<p class="list-preview-image-error">This image could not be loaded. You can still read the post below. Close and reopen the preview to retry.</p>':''}<p>${esc(selectedPost.body || '')}</p><small>${esc(dateLabel(selectedPost))}</small></div>`;}
        const posts=content.menu||[];
        if(!posts.length)return `<div class="list-preview-empty"><i data-lucide="book-open"></i><h3>No menu uploaded yet</h3><p>This business has not shared menu or store posts here. Ask them in chat for their current menu.</p><button type="button" data-preview-action="chat">Ask about the menu</button></div>`;
        return `<div class="list-preview-section-heading"><h3>Menu & store posts</h3><span>${posts.length} post${posts.length===1?'':'s'}</span></div><p class="list-preview-hint">Shared by the business. Confirm current prices and availability before ordering.</p><div class="list-menu-grid">${posts.map(post=>{const photo=safeImage(post.mediaUrl);return `<article class="list-menu-post"><button type="button" class="list-menu-thumbnail${photo?'':' no-photo'}" data-preview-action="image" data-post="${esc(post.id)}" aria-label="View menu or store post"><i data-lucide="${photo?'maximize-2':'file-text'}"></i>${photo?`<img src="${esc(photo)}" alt="Menu or store post from ${esc(place.name)}" loading="lazy">`:''}<span>${photo?'View image':'Read post'}</span></button><div class="list-menu-post-caption"><p>${esc(String(post.body||'Menu / store update').slice(0,180))}</p><small>${esc(dateLabel(post))}</small></div></article>`;}).join('')}</div><p class="list-preview-hint">Showing up to 30 available posts.</p>`;
    }
    function headerInfoHtml(){
        const address=place.address||place.addr||place.barangay||place.brgy||'Lipa City';
        const phone=place.phone||place.contact_phone, description=place.description||place.desc;
        return `<div class="list-preview-summary">${description?`<p class="list-preview-description">${esc(description)}</p>`:''}<dl><div><dt><i data-lucide="map-pin"></i><span>Address</span></dt><dd>${esc(address)}</dd></div>${phone?`<div><dt><i data-lucide="phone"></i><span>Contact</span></dt><dd>${esc(phone)}</dd></div>`:''}${place.priceRange?`<div><dt><i data-lucide="wallet"></i><span>Budget</span></dt><dd>${esc(place.priceRange)}</dd></div>`:''}</dl><button type="button" class="list-preview-detail-button" data-preview-action="details">View full establishment <i data-lucide="arrow-up-right"></i></button></div>`;
    }
    function aboutHtml(){
        const groups=root.PlaceFeatures?.groups||[], selected=root.PlaceFeatures?.normalize(place.place_features)||{};
        const sections=groups.map(group=>{
            const labels=group.items.filter(([key])=>selected[group.key]?.includes(key)).map(item=>item[1]);
            if(group.key==='services'){
                if(place.delivery_grab===true)labels.push('Grab / Foodpanda delivery');
                if(place.delivery_inhouse===true)labels.push('In-house delivery');
                if(place.accepts_booking===true)labels.push('Booking requests');
            }
            return labels.length?`<section class="list-preview-feature-section"><h3><i data-lucide="${group.icon}"></i>${group.title}</h3><ul>${labels.map(label=>`<li><i data-lucide="check"></i><span>${esc(label)}</span></li>`).join('')}</ul></section>`:'';
        }).join('');
        return `<div class="list-preview-section-heading"><h3>About this establishment</h3></div><p class="list-preview-hint">Confirm accessibility and service availability with the business before visiting.</p>${sections||'<div class="list-preview-empty"><i data-lucide="clipboard-list"></i><h3>Details not provided yet</h3><p>The establishment has not added accessibility, amenities or service details.</p><button type="button" data-preview-action="chat">Ask the business</button></div>'}`;
    }
    function reviewsHtml(){
        const reviews=content.reviews||[];if(!reviews.length)return `<div class="list-preview-empty"><i data-lucide="message-square"></i><h3>No public reviews yet</h3><p>Public customer feedback will appear here when shared.</p></div>`;
        const ratings=reviews.map(r=>Number(r.rating)).filter(r=>Number.isFinite(r)&&r>=1&&r<=5),avg=ratings.length?(ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1):null;
        return `${avg?`<section class="list-preview-review-summary"><div><strong>${avg}</strong><span>From ${ratings.length} shown public rating${ratings.length===1?'':'s'}</span></div><div class="list-preview-rating-bars">${[5,4,3,2,1].map(n=>{const count=ratings.filter(r=>Math.round(r)===n).length;return `<div><span>${n}</span><i><b style="width:${count/ratings.length*100}%"></b></i><small>${count}</small></div>`;}).join('')}</div></section>`:''}<div class="list-preview-reviews">${reviews.map(r=>{const rating=Number(r.rating);return `<article class="list-preview-review"><div class="list-preview-review-person"><span>${esc(String(r.userName||r.customerName||'Customer').charAt(0).toUpperCase())}</span><div><strong>${esc(r.userName||r.customerName||'Customer')}</strong><small>${esc(r.createdAt?.toDate?.()?.toLocaleDateString?.()||'Public review')}</small></div>${r.verifiedTransaction===true?'<em><i data-lucide="badge-check"></i> Verified transaction</em>':''}</div>${rating>=1&&rating<=5?`<div class="list-preview-review-stars" aria-label="${rating} out of 5 stars">${'★'.repeat(Math.round(rating))}${'☆'.repeat(5-Math.round(rating))}</div>`:''}<p>${esc(r.feedback||r.comment||r.satisfaction||'No written feedback.')}</p></article>`;}).join('')}</div>`;
    }
    function render(){
        if(!place||!overlay)return;
        const focusedAction=overlay.contains(document.activeElement)?document.activeElement.dataset.previewAction:null;
        const focusedTab=document.activeElement.dataset?.tab;
        const photo=safeImage(place.coverPhoto||place.photos?.[0]), rating=Number(place.avgRating);
        overlay.innerHTML=`<button type="button" class="list-preview-backdrop" tabindex="-1" data-preview-action="close" aria-label="Close menu preview"></button><section class="list-preview-sheet" role="dialog" aria-modal="true" aria-labelledby="listPreviewTitle"><header class="list-preview-header"><span class="list-preview-eyebrow">EXPLORE THIS PLACE</span><button type="button" class="list-preview-close" data-preview-action="close" aria-label="Close establishment preview"><i data-lucide="x"></i></button><div class="list-preview-business"><div class="list-preview-business-photo"><i data-lucide="store"></i>${photo?`<img src="${esc(photo)}" alt="${esc(place.name)}" loading="lazy">`:''}</div><div><h2 id="listPreviewTitle">${esc(place.name||'Establishment')}</h2><p>${esc(place.category||place.cat||'Local business')}${rating>0?` · <span class="list-preview-overall-rating">★ ${esc(rating)} (${esc(place.reviewCount||0)})</span>`:''}</p></div></div>${headerInfoHtml()}</header><nav class="list-preview-tabs" role="tablist" aria-label="Establishment information">${['menu','reviews','about'].map(key=>`<button type="button" role="tab" id="listPreviewTab-${key}" aria-selected="${tab===key}" aria-controls="listPreviewContent" tabindex="${tab===key?'0':'-1'}" data-preview-action="tab" data-tab="${key}">${key==='menu'?'Menu':key==='reviews'?'Reviews':'About'}</button>`).join('')}</nav><div class="list-preview-body" id="listPreviewContent" role="tabpanel" aria-labelledby="listPreviewTab-${tab}">${loading[tab]?'<div class="list-preview-loading" role="status">Loading '+(tab==='menu'?'menu posts':'public reviews')+'…</div>':errors[tab]?`<div class="list-preview-empty"><i data-lucide="wifi-off"></i><h3>Could not load this section</h3><p>${esc(errors[tab])}</p><button type="button" data-preview-action="retry">Try again</button></div>`:tab==='menu'?menuHtml():tab==='reviews'?reviewsHtml():aboutHtml()}</div><footer class="list-preview-footer"><button type="button" data-preview-action="chat"><i data-lucide="message-square"></i> Chat</button><button type="button" data-preview-action="booking"><i data-lucide="calendar"></i> Send request</button></footer></section>`;
        root.debouncedIcons?.();
        if(focusedAction==='tab')overlay.querySelector('[data-tab="'+focusedTab+'"]')?.focus();
        if(focusedAction==='close')overlay.querySelector('.list-preview-close')?.focus();
        if(focusedAction==='gallery')overlay.querySelector('.list-menu-back')?.focus();
        syncMode();
    }
    function open(value){if(!value?.id)return;ensure();generation++;previousFocus=document.activeElement;failedImages.clear();place={...value,id:String(value.id)};tab='menu';selectedPost=null;content={menu:null,reviews:null};loading={};errors={};overlay.hidden=false;render();overlay.querySelector('.list-preview-close').focus();load('menu');}
    function close(){if(!overlay||overlay.hidden)return;generation++;overlay.hidden=true;place=null;selectedPost=null;syncMode();previousFocus?.focus?.();}
    root.PlacePreview={open,close,syncSelection};
})(window);
