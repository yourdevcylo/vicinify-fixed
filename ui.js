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
        document.getElementById('workspaceTitle').textContent = page === 'page-dashboard' ? (role === 'user' ? 'My Activity' : role === 'admin' ? 'Admin workspace' : 'Business Hub') : titles[page] || 'Vicinify';
        document.getElementById('accountName').textContent = name;
        document.getElementById('accountRole').textContent = role === 'admin' ? 'Administrator' : role === 'business' ? 'Business owner' : 'Local explorer';
        document.getElementById('accountInitials').textContent = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
        document.querySelectorAll('.bottom-nav .nav-item').forEach(button => {
            const current = button.dataset.goto === page;
            if (button.classList.contains('active') !== current) button.classList.toggle('active', current);
            if (current) button.setAttribute('aria-current', 'page');
            else button.removeAttribute('aria-current');
        });
        document.title = page === 'page-login' ? 'Welcome · Vicinify' : `${titles[page] || 'Your neighborhood'} · Vicinify`;
    }
    function connection() { document.getElementById('connectionNotice').hidden = navigator.onLine; }
    window.addEventListener('vicinify:pagechange', sync);
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
