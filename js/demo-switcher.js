/* Vicinify Capstone Demo — independent Firebase Auth sessions.
   This is a session selector, NEVER a permission/role override.
   Every operation continues to rely on real Firebase Auth and Firestore rules. */
(() => {
  'use strict';
  const accounts = Object.freeze({
    standard: { label: 'Standard User', email: 'projectfreedom12110@gmail.com', icon: 'user-round' },
    business: { label: 'Business User', email: 'detorresmarc08@gmail.com', icon: 'store' },
    admin: { label: 'Admin User', email: 'yourdevcylo@gmail.com', icon: 'shield-check' }
  });
  const key = 'vicinify.capstone.defaultRole.v1';
  const params = new URLSearchParams(location.search);
  const requestedRole = Object.hasOwn(accounts, params.get('demoRole')) ? params.get('demoRole') : '';
  const roleFromEmail = email => Object.keys(accounts).find(k => accounts[k].email === String(email || '').trim().toLowerCase()) || '';
  const readBootstrap = () => { try { const role = localStorage.getItem(key); return Object.hasOwn(accounts, role) ? role : ''; } catch { return ''; } };
  const writeBootstrap = role => { try { if (!readBootstrap() && Object.hasOwn(accounts, role)) localStorage.setItem(key, role); } catch {} };
  let auth = null;
  let current = null;
  let menuBound = false;
  const show = (el, value) => { if (el) el.hidden = !value; };
  const selectedAccount = () => accounts[requestedRole];
  const activeRole = () => requestedRole || roleFromEmail(current?.email);

  function initializeFirebaseApp(config) {
    // Default app retains the original session of the first demo account.
    // The two other demo accounts use independent app names and Auth persistence.
    const bootstrap = readBootstrap();
    const name = requestedRole && requestedRole !== bootstrap ? 'vicinify-capstone-' + requestedRole : undefined;
    return name ? firebase.initializeApp(config, name) : firebase.initializeApp(config);
  }
  function loginHint(user) {
    const note = document.getElementById('demoSignInHint');
    if (!note) return;
    const target = selectedAccount();
    show(note, !!target && !user);
    if (target && !user) {
      const input = document.getElementById('loginEmail');
      // Prefill only when blank; never touch a typed password or email.
      if (input && !input.value) input.value = target.email;
      note.textContent = 'CAPSTONE DEMO · Sign in to ' + target.label + ' once to keep this account ready for quick switching.';
    }
  }
  function closeMenu() {
    const popup=document.getElementById('demoSwitchOptions');
    const trigger=document.getElementById('demoSwitchTrigger');
    show(popup,false);
    trigger?.setAttribute('aria-expanded','false');
  }
  function render(user) {
    current = user;
    const role = roleFromEmail(user?.email);
    if (role && !requestedRole) writeBootstrap(role);
    const enabled = !!role && (!requestedRole || role === requestedRole);
    const container = document.getElementById('demoQuickSwitch');
    show(container, enabled);
    loginHint(user);
    if (!enabled) { closeMenu(); return; }
    const chosen = accounts[role];
    const currentEl = document.getElementById('demoSwitchCurrent');
    if (currentEl) currentEl.textContent = chosen.label;
    document.querySelectorAll('[data-demo-switch-role]').forEach(button => {
      const chosenRole=button.getAttribute('data-demo-switch-role');
      const isCurrent=role===chosenRole;
      button.setAttribute('aria-current',isCurrent?'true':'false');
      const check=button.querySelector('.demo-role-check');
      if (check) check.textContent=isCurrent?'✓':'';
    });
  }
  function switchTo(role) {
    if (!Object.hasOwn(accounts, role) || !roleFromEmail(auth?.currentUser?.email)) return;
    closeMenu();
    if (role === activeRole()) return;
    const url = new URL(location.href);
    url.searchParams.set('demoRole', role);
    // Full navigation cleans up all Firestore listeners, maps, modals, and drafts.
    location.assign(url.pathname+url.search);
  }
  function init(authInstance) {
    auth = authInstance;
    function setup() {
      if (menuBound) return;
      menuBound=true;
      const trigger=document.getElementById('demoSwitchTrigger');
      const menu=document.getElementById('demoSwitchOptions');
      trigger?.addEventListener('click',e=>{
        e.stopPropagation();
        const opening=menu?.hidden;
        show(menu,opening);
        trigger.setAttribute('aria-expanded',opening?'true':'false');
      });
      menu?.querySelectorAll('[data-demo-switch-role]').forEach(button => button.addEventListener('click',()=>switchTo(button.dataset.demoSwitchRole)));
      document.addEventListener('click',e=>{if(!document.getElementById('demoQuickSwitch')?.contains(e.target))closeMenu();});
      document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
      render(auth?.currentUser);
    }
    if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',setup,{once:true});
    else setup();
    auth.onAuthStateChanged(render);
  }
  window.VicinifyDemoSwitch = Object.freeze({ initializeFirebaseApp, init, roleFromEmail, accounts });
})();
