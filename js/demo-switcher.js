/* Capstone account switcher — console-only UI (Ctrl + Alt + D).
   This only selects an independently authenticated Firebase Auth session.
   It never changes claims, passwords, roles, Firestore security, or user data. */
(() => {
  'use strict';
  const accounts = Object.freeze({
    standard: {label:'Standard User',email:'projectfreedom12110@gmail.com'},
    business: {label:'Business User',email:'detorresmarc08@gmail.com'},
    admin: {label:'Admin User',email:'yourdevcylo@gmail.com'}
  });
  const bootstrapKey = 'vicinify.capstone.defaultRole.v1';
  const previousKey = 'vicinify.capstone.previousRole.v1';
  const params = new URLSearchParams(location.search);
  const validRole = role => Object.prototype.hasOwnProperty.call(accounts,role);
  const requestedRole = validRole(params.get('demoRole')) ? params.get('demoRole') : '';
  const roleFromEmail = email => Object.keys(accounts).find(role =>
    accounts[role].email === String(email || '').trim().toLowerCase()) || '';
  const readBootstrap = () => {
    try { const role=localStorage.getItem(bootstrapKey);return validRole(role)?role:''; }
    catch { return ''; }
  };
  const writeBootstrap = role => {
    try { if (!readBootstrap() && validRole(role)) localStorage.setItem(bootstrapKey,role); }
    catch {}
  };
  let auth = null;
  let current = null;
  let ready = false;
  let previousFocus = null;
  const selectedRole = () => requestedRole || roleFromEmail(current?.email) || readBootstrap();
  // A bookmark can open ?demoRole=standard before ANY role was signed in.
  // Whichever verified demo account signs in first owns the default Firebase app,
  // and must be bootstrapped even when a role was explicitly selected in the URL.
  // Otherwise navigateTo() silently refuses every switch.
  const expectedLoginRole = () => requestedRole || '';
  function validateLoginEmail(email) {
    const expected=expectedLoginRole();
    if (!expected) return '';
    const actual=roleFromEmail(email);
    if (actual===expected) return '';
    return 'This demo slot is for '+accounts[expected].label+' ('+accounts[expected].email+'). Please use that account to keep the sessions separate.';
  }
  function restoreLoginEmail() {
    if (auth?.currentUser) return;
    const role=selectedRole();
    if (!validRole(role)) return;
    const input=document.getElementById('loginEmail');
    // Never overwrite the user's own non-demo email on the ordinary login page.
    if (input && (!input.value || !!roleFromEmail(input.value))) input.value=accounts[role].email;
  }
  // The keyboard shortcut by itself is NOT authorization.
  // Signed-in users must be one of the three demo identities.
  // When a selected slot is signed out, a previously bootstrapped browser can
  // access the login navigation only, not another account's protected data.
  const canShow = user => !!roleFromEmail(user?.email) || (!user && !!readBootstrap());

  function initializeFirebaseApp(config) {
    const bootstrap = readBootstrap();
    const name = bootstrap && requestedRole && requestedRole !== bootstrap
      ? 'vicinify-capstone-' + requestedRole : undefined;
    return name ? firebase.initializeApp(config,name) : firebase.initializeApp(config);
  }
  const panel = () => document.getElementById('demoDevOverlay');
  const dialog = () => panel()?.querySelector('.demo-dev-dialog');
  function close() {
    const el=panel();
    if(!el || el.hidden)return;
    el.hidden=true;
    el.setAttribute('aria-hidden','true');
    try { if(previousFocus?.isConnected) previousFocus.focus(); } catch {}
    previousFocus=null;
  }
  function updatePanel() {
    const el=panel();
    if(!el)return;
    const chosen=selectedRole();
    el.querySelectorAll('[data-demo-switch-role]').forEach(button=>{
      const role=button.dataset.demoSwitchRole;
      const active=chosen===role;
      button.setAttribute('aria-current',active?'true':'false');
      const indicator=button.querySelector('.demo-dev-role-indicator');
      if(indicator)indicator.textContent=active?'CURRENT':'SWITCH';
    });
    const status=document.getElementById('demoDevStatus');
    if(!status)return;
    const actual=roleFromEmail(current?.email);
    if (current && actual && chosen!==actual) {
      status.textContent='This session is signed in as '+accounts[actual].label+'. Choose a role to switch to its own login session.';
    } else if (!current && validRole(chosen)) {
      status.textContent=accounts[chosen].label+' is selected. Sign in with its own email and password if this slot is not yet authenticated.';
    } else {
      status.textContent='Each role uses a separate Firebase login. No account permissions are shared.';
    }
  }
  function open() {
    if(!ready || !canShow(auth?.currentUser))return;
    const el=panel();
    if(!el)return;
    previousFocus=document.activeElement;
    updatePanel();
    el.hidden=false;
    el.setAttribute('aria-hidden','false');
    (dialog() || el).focus();
  }
  const toggle = () => panel()?.hidden ? open() : close();
  function navigateTo(role) {
    if(!validRole(role) || !canShow(auth?.currentUser) || !readBootstrap())return;
    if(role === selectedRole()) { close();return; }
    try { localStorage.setItem(previousKey,selectedRole()); } catch {}
    close();
    const url = new URL(location.href);
    url.searchParams.set('demoRole',role);
    // Full page navigation disposes listeners and reloads the correct Firebase app.
    location.assign(url.pathname+url.search+url.hash);
  }
  function render(user) {
    current=user;
    const actual=roleFromEmail(user?.email);
    if(actual && (!requestedRole || requestedRole===actual))writeBootstrap(actual);
    if (!canShow(user))close();
    // No demo controls are inserted in the normal header or login page.
    // On an unauthenticated selected role, prefill only the known email.
    if (!user) restoreLoginEmail();
    updatePanel();
  }
  function onKey(event) {
    const hotkey=event.ctrlKey && event.altKey && !event.metaKey && !event.shiftKey &&
      (event.code==='KeyD' || String(event.key||'').toLowerCase()==='d');
    if(hotkey && canShow(auth?.currentUser)) {
      event.preventDefault();
      event.stopPropagation?.();
      toggle();
      return;
    }
    if(panel()?.hidden)return;
    if(event.key==='Escape') { event.preventDefault();close();return; }
    if(event.key==='Tab') {
      const items=[...dialog().querySelectorAll('button:not([disabled])')];
      if(!items.length)return;
      const first=items[0],last=items[items.length-1];
      if(event.shiftKey && (document.activeElement===first || document.activeElement===dialog())) {
        event.preventDefault();last.focus();
      } else if(!event.shiftKey && document.activeElement===last) {
        event.preventDefault();first.focus();
      }
    }
  }
  function init(authInstance) {
    auth=authInstance;
    const setup=()=>{
      const el=panel();
      if(!el || ready)return;
      ready=true;
      el.querySelectorAll('[data-demo-switch-role]').forEach(button=>
        button.addEventListener('click',()=>navigateTo(button.dataset.demoSwitchRole)));
      el.querySelectorAll('[data-demo-close]').forEach(node=>node.addEventListener('click',close));
      document.getElementById('demoDevClose')?.addEventListener('click',close);
      document.addEventListener('keydown',onKey,true);
      render(auth?.currentUser);
      restoreLoginEmail();
    };
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
    else setup();
    auth.onAuthStateChanged(render);
  }
  window.VicinifyDemoSwitch=Object.freeze({initializeFirebaseApp,init,roleFromEmail,validateLoginEmail,restoreLoginEmail,accounts});
})();
