/* App shell: presentation, accessible navigation, and connection feedback.
   Database/auth workflows remain in their existing feature modules. */
window.AppShell = (() => {
    const titles = { 'page-map': 'Explore Lipa', 'page-buzz': 'Community Buzz', 'page-add': 'Add a place', 'page-dashboard': 'Your workspace', 'page-settings': 'Your preferences', 'page-place': 'Place details', 'page-biz-edit': 'Edit establishment', 'page-suki-studio': 'Suki Card Studio', 'page-biz-posts': 'Business posts' };
    function sync() {
        const page = document.querySelector('.page.active')?.id || 'page-login';
        if(page !== 'page-map') window.PlacePreview?.close?.();
        const profile = AppState.userProfile;
        const name = profile?.fullName || AppState.user?.displayName || 'Local explorer';
        const role = profile?.role || 'user';
        document.getElementById('workspaceTitle').textContent = page === 'page-dashboard' ? (role === 'user' ? 'My Activity' : role === 'admin' ? 'Admin Hub' : 'Business Hub') : titles[page] || 'Vicinify';
        document.getElementById('accountName').textContent = name;
        document.getElementById('accountRole').textContent = role === 'admin' ? 'Admin' : role === 'business' ? 'Business' : 'Standard';
        document.getElementById('accountInitials').textContent = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
        document.querySelectorAll('.bottom-nav .nav-item').forEach(button => {
            const current = button.dataset.goto === page;
            if (button.classList.contains('active') !== current) button.classList.toggle('active', current);
            if (current) button.setAttribute('aria-current', 'page');
            else button.removeAttribute('aria-current');
        });
        document.title = `${window.LangManager?.translateKey(page==='page-login'?'Welcome':page==='page-dashboard'?(role==='admin'?'Admin Hub':role==='business'?'Business Hub':'My Activity'):titles[page]||'Your neighborhood') || titles[page] || 'Vicinify'} · Vicinify`;
    }
    function connection() { document.getElementById('connectionNotice').hidden = navigator.onLine; }
    window.addEventListener('vicinify:pagechange', sync);
    window.addEventListener('vicinify:languagechange', sync);
    window.addEventListener('online', connection);
    window.addEventListener('offline', connection);
    document.addEventListener('DOMContentLoaded', () => {
        sync(); connection();
        new MutationObserver(sync).observe(document.getElementById('main-content'), { subtree: true, attributes: true, attributeFilter: ['class'] });
        document.querySelectorAll('a[data-goto]').forEach(link => link.addEventListener('click', event => event.preventDefault()));
        // Associate existing static form labels without changing field IDs or handlers.
        document.querySelectorAll('.field').forEach(field => {
            const label = field.querySelector('label');
            const control = field.querySelector('input:not([type="checkbox"]), select, textarea');
            if (label && control?.id && !label.htmlFor) label.htmlFor = control.id;
        });
        const authTabs = [...document.querySelectorAll('.auth-tabs [role="tab"]')];
        function syncAuthTabs() {
            const selected = authTabs.find(tab => tab.classList.contains('active')) || authTabs[0];
            authTabs.forEach(tab => {
                tab.setAttribute('aria-selected', String(tab === selected));
                tab.tabIndex = tab === selected ? 0 : -1;
                tab.setAttribute('aria-controls', 'authForm');
            });
            if (selected) document.getElementById('authForm')?.setAttribute('aria-labelledby', selected.id);
        }
        document.querySelector('.auth-tabs')?.addEventListener('keydown', event => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const current = authTabs.indexOf(document.activeElement);
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? authTabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + authTabs.length) % authTabs.length;
            authTabs[next]?.click(); authTabs[next]?.focus();
        });
        authTabs.forEach(tab => tab.addEventListener('click', syncAuthTabs));
        document.getElementById('toggleAuthBtn')?.addEventListener('click', syncAuthTabs);
        syncAuthTabs();
        const authTabList = document.querySelector('.auth-tabs');
        if (authTabList) new MutationObserver(syncAuthTabs).observe(authTabList, {
            subtree: true, attributes: true, attributeFilter: ['class']
        });
        window.debouncedIcons?.();
    });
    return { sync };
})();

// PWA installation is browser-mediated; iOS uses Share > Add to Home Screen.
(() => {
 let deferredInstall=null;
 function installed(){return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone===true;}
 function syncInstall(){
  const button=document.getElementById('installVicinifyBtn'), help=document.getElementById('installVicinifyHelp');
  if(!button||!help)return;
  button.disabled=installed();
  button.dataset.i18n=installed()?'App installed':deferredInstall?'Install app':'How to install';
  button.textContent=window.LangManager?.translateKey?.(button.dataset.i18n)||button.dataset.i18n;
  help.textContent=installed()?'Vicinify is running as an installed app.':'Add Vicinify to your home screen for quick access.';
 }
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstall=event;syncInstall();});
 window.addEventListener('appinstalled',()=>{deferredInstall=null;syncInstall();});
 function setup(){
  document.getElementById('installVicinifyBtn')?.addEventListener('click',async()=>{
   if(installed())return;
   if(deferredInstall){const prompt=deferredInstall;deferredInstall=null;await prompt.prompt();await prompt.userChoice;syncInstall();return;}
   const ios=/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
   const message=ios?'In Safari, tap Share, then Add to Home Screen.':'Open your browser menu and choose Install app or Add to Home screen. If unavailable, use Chrome or Edge on the production site.';
   document.getElementById('installVicinifyHelp').textContent=message;
  });syncInstall();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();

// Visual viewport follows the iOS keyboard without resizing the entire document.
(() => {
 const viewport=window.visualViewport;
 if(!viewport)return;
 let queued=false;
 const sync=()=>{queued=false;const root=document.documentElement;
  root.style.setProperty('--vici-visual-height',viewport.height+'px');
  root.style.setProperty('--vici-visual-top',viewport.offsetTop+'px');
  const input=document.activeElement?.matches('input:not([type=checkbox]):not([type=radio]),textarea,[contenteditable=true]');
  document.body.classList.toggle('keyboard-open',!!input && window.innerHeight-viewport.height>120);
 };
 const queue=()=>{if(!queued){queued=true;requestAnimationFrame(sync);}};
 viewport.addEventListener('resize',queue);viewport.addEventListener('scroll',queue);
 document.addEventListener('focusin',queue);document.addEventListener('focusout',queue);sync();
})();

// Localized photo picker: keep the native selection event and image restrictions.
window.ViciPhotoPicker=(()=>{
 function enhance(root=document){
  const inputs=[];if(root.matches?.('input[type=file]'))inputs.push(root);
  root.querySelectorAll?.('input[type=file]').forEach(input=>inputs.push(input));
  for(const input of inputs){
   if(!input.accept.includes('image')||input.closest('.vici-photo-picker')||input.closest('.commerce-photo-dropzone'))continue;
   const wrap=document.createElement('div');wrap.className='vici-photo-picker';
   input.before(wrap);
   // A real label wrapping the native input allows direct touch selection on iOS
   // Safari, Android Chrome, and installed PWAs without a synthetic input.click().
   const button=document.createElement('label');button.className='vici-photo-trigger';
   button.dataset.i18n=input.multiple?'Choose photos':'Choose photo';button.textContent=button.dataset.i18n;
   const status=document.createElement('span');status.className='vici-photo-selection';
   button.append(input);input.removeAttribute('tabindex');
   wrap.append(button,status);
   function sync(){const files=[...input.files];if(files.length){status.removeAttribute('data-i18n');status.setAttribute('data-no-translate','');status.textContent=files.map(file=>file.name).join(', ');}else{status.removeAttribute('data-no-translate');status.dataset.i18n='No photo selected';status.textContent='No photo selected';}window.LangManager?.translateDOM?.(undefined,wrap);}
   input.addEventListener('change',sync);input.form?.addEventListener('reset',()=>setTimeout(sync,0));sync();
  }
 }
 function init(){enhance();new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1)enhance(node);}).observe(document.body,{childList:true,subtree:true});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 return {enhance};
})();

// Fit translated single-line labels after resize and language changes, without reads from the network.
window.ViciLabelFit = (()=>{
 const selector='#catChips .chip > span, #page-settings .settings-segment button > span';
 let frame=0;
 function fit(){frame=0;document.querySelectorAll(selector).forEach(label=>{
  const button=label.parentElement;if(!button.clientWidth)return;
  label.style.removeProperty('--fit-label-size');
  const cs=getComputedStyle(button),text=getComputedStyle(label),icon=button.querySelector('svg,i');
  const width=button.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)-(icon?icon.getBoundingClientRect().width+(parseFloat(cs.columnGap)||0):0);
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)return;
  ctx.font=`${text.fontWeight} ${text.fontSize} ${text.fontFamily}`;
  const measured=ctx.measureText(label.textContent).width;
  if(measured>width&&width>0)label.style.setProperty('--fit-label-size',Math.max(8,parseFloat(text.fontSize)*width/measured-.2)+'px');
 });}
 function schedule(){if(!frame)frame=(window.requestAnimationFrame||window.setTimeout)(fit);}
 function init(){const observer=new MutationObserver(schedule);for(const container of document.querySelectorAll('#catChips,.settings-segment')){observer.observe(container,{childList:true,subtree:true,characterData:true});if(window.ResizeObserver)new ResizeObserver(schedule).observe(container);}window.addEventListener('resize',schedule);window.addEventListener('vicinify:languagechange',schedule);document.fonts?.ready.then(schedule);schedule();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();return{fit};
})();
