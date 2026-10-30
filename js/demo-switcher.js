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
  const previousKey = 'vicinify.capstone.previousRole.v1';
  const params = new URLSearchParams(location.search);
  const requestedRole = Object.hasOwn(accounts, params.get('demoRole')) ? params.get('demoRole') : '';
  const roleFromEmail = email => Object.keys(accounts).find(k => accounts[k].email === String(email || '').trim().toLowerCase()) || '';
  const readBootstrap = () => { try { const role = localStorage.getItem(key); return Object.hasOwn(accounts, role) ? role : ''; } catch { return ''; } };
  const writeBootstrap = role => { try { if (!readBootstrap() && Object.hasOwn(accounts, role)) localStorage.setItem(key, role); } catch {} };
  const previousRole = () => { try { const role=localStorage.getItem(previousKey); return Object.hasOwn(accounts,role) ? role : readBootstrap(); } catch { return readBootstrap(); } };
  let auth = null;
  let current = null;
  let menuBound = false;
  const show = (el, value) => { if (el) el.hidden = !value; };
  const targetRole = () => requestedRole || readBootstrap();
  const selectedAccount = () => accounts[targetRole()];
  const activeRole = () => requestedRole || roleFromEmail(current?.email) || readBootstrap();
  const canNavigate = user => {
    const actualRole = roleFromEmail(user?.email);
    // Once a demo account has authenticated in this browser, allow its other
    // slots to be selected before their first sign-in. This is navigation only.
    // A non-demo signed-in account must never get the demo controls.
    return !!actualRole || (!user && !!readBootstrap());
  };

  function initializeFirebaseApp(config) {
    // Default app retains the original session of the first demo account.
    // The two other demo accounts use independent app names and Auth persistence.
    const bootstrap = readBootstrap();
    const name = requestedRole && requestedRole !== bootstrap ? 'vicinify-capstone-' + requestedRole : undefined;
    return name ? firebase.initializeApp(config, name) : firebase.initializeApp(config);
  }
  function loginHint(user) {
    const note = document.getElementById('demoSignInHint');
    const chooser = document.getElementById('demoLoginOptions');
    const target = selectedAccount();
    const isCorrect = !!target && roleFromEmail(user?.email) === targetRole();
    const hasDemoSetup = !!readBootstrap();
    // Keep normal registration and non-demo login unchanged.
    const needsSelection = !!target && !isCorrect;
    show(note, needsSelection);
    show(chooser, needsSelection && hasDemoSetup);
    if (needsSelection && note) {
      if (user) {
        note.textContent = `CAPSTONE DEMO · ${target.label} is selected, but this browser slot is signed in to a different account. Use the correct account for this slot.`;
      } else {
        note.textContent = `CAPSTONE DEMO · ${target.label} selected. Sign in once with ${target.email}. After that, use the DEMO dropdown to switch quickly.`;
      }
      const input = document.getElementById('loginEmail');
      if (!user && input && (!input.value || roleFromEmail(input.value) && roleFromEmail(input.value) !== requestedRole)) input.value = target.email;
    }
    chooser?.querySelectorAll('[data-demo-login-role]').forEach(button => {
      const role=button.getAttribute('data-demo-login-role');
      button.setAttribute('aria-current',role===targetRole()?'true':'false');
      button.disabled=role===targetRole();
    });
    const back = document.getElementById('demoLoginBack');
    if (back) {
      const previous = previousRole();
      show(back, !!previous && previous!==targetRole() && hasDemoSetup);
      if (previous && previous!==targetRole()) back.textContent='← Back to '+accounts[previous].label;
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
    const enabled = canNavigate(user);
    // Keep the header controls visible on first-time sign-in screens. The
    // standard login header is otherwise hidden with body.on-login.
    document.body?.classList?.toggle('demo-switch-visible',enabled);
    const container = document.getElementById('demoQuickSwitch');
    show(container, enabled);
    loginHint(user);
    if (!enabled) { closeMenu(); return; }
    const chosen = accounts[requestedRole || role || readBootstrap()];
    const currentEl = document.getElementById('demoSwitchCurrent');
    if (currentEl) currentEl.textContent = chosen.label + (!user ? ' · Sign in' : '');
    document.querySelectorAll('[data-demo-switch-role]').forEach(button => {
      const chosenRole=button.getAttribute('data-demo-switch-role');
      const isCurrent=(requestedRole || role || readBootstrap())===chosenRole;
      button.setAttribute('aria-current',isCurrent?'true':'false');
      const check=button.querySelector('.demo-role-check');
      if (check) check.textContent=isCurrent?'✓':'';
    });
  }
  function switchTo(role) {
    if (!Object.hasOwn(accounts, role) || !canNavigate(auth?.currentUser)) return;
    closeMenu();
    if (role === activeRole()) return;
    try { localStorage.setItem(previousKey, activeRole()); } catch {}
    navigateTo(role);
  }
  function navigateTo(role) {
    if (!Object.hasOwn(accounts,role) || !readBootstrap()) return;
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
      document.getElementById('demoLoginOptions')?.querySelectorAll('[data-demo-login-role]').forEach(button => button.addEventListener('click',()=>navigateTo(button.dataset.demoLoginRole)));
      document.getElementById('demoLoginBack')?.addEventListener('click',()=>navigateTo(previousRole()));
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
