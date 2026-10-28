(function () {
    const listeners = new Map();
    const proofRequests = new Map();
    const proofUrls = new Map();
    let generation = 0;
    function releaseProofs() {
        generation++;
        proofRequests.forEach(controller => controller.abort());
        proofRequests.clear();
        proofUrls.forEach(url => URL.revokeObjectURL(url));
        proofUrls.clear();
    }
    async function hydrateProof(img) {
        const user = window.auth?.currentUser;
        const bookingId = img.dataset.proofBooking;
        if (!user || !bookingId || img.dataset.proofLoading) return;
        img.dataset.proofLoading = 'true';
        const key = user.uid + ':' + bookingId + ':' + (img.dataset.proofVersion || '');
        const myGeneration = generation;
        try {
            if (proofUrls.has(key)) { img.src = proofUrls.get(key); return; }
            if (proofRequests.has(key)) { delete img.dataset.proofLoading; return; }
            const controller = new AbortController();
            proofRequests.set(key, controller);
            const timer = setTimeout(() => controller.abort(), 20000);
            let response;
            try {
                response = await fetch('/.netlify/functions/proof', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await user.getIdToken() },
                    body: JSON.stringify({ action: 'read', bookingId }), signal: controller.signal
                });
            } finally { clearTimeout(timer); proofRequests.delete(key); }
            if (!response.ok) throw new Error('Proof unavailable');
            const blob = await response.blob();
            if (generation !== myGeneration || window.auth?.currentUser?.uid !== user.uid) return;
            const url = URL.createObjectURL(blob);
            proofUrls.set(key, url);
            document.querySelectorAll('img[data-proof-booking]').forEach(other => {
                if (other.dataset.proofBooking === bookingId) other.src = url;
            });
        } catch (error) {
            if (error.name !== 'AbortError') img.alt = 'Payment proof unavailable. Reopen the chat to retry.';
        }
    }
    function scanProofs() {
        document.querySelectorAll('img[data-proof-booking]').forEach(img => hydrateProof(img));
    }
    function observeProofs() {
        new MutationObserver(scanProofs).observe(document.body, { childList: true, subtree: true });
        scanProofs();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observeProofs, { once: true });
    else observeProofs();
    window.ViciData = {
        customerFeed(collection, uid, next, error) {
            return this.listen('customer:' + uid + ':' + collection,
                window.db.collection(collection).where('userId', '==', uid).orderBy('createdAt', 'desc').limit(50), next, error);
        },
        sukiFeed(uid,next,error) {
            return this.listen('customer:'+uid+':suki',window.db.collection('loyalty_cards').where('customerUid','==',uid).limit(20),next,error);
        },
        listen(key, query, next, error) {
            let entry = listeners.get(key);
            if (!entry) {
                entry = { consumers: new Set(), snapshot: null, stop: null };
                listeners.set(key, entry);
                entry.stop = query.onSnapshot(snapshot => {
                    entry.snapshot = snapshot;
                    entry.consumers.forEach(consumer => consumer.next(snapshot));
                }, failure => entry.consumers.forEach(consumer => consumer.error?.(failure)));
            }
            const consumer = { next, error };
            entry.consumers.add(consumer);
            if (entry.snapshot) queueMicrotask(() => { if (entry.consumers.has(consumer)) next(entry.snapshot); });
            return () => {
                entry.consumers.delete(consumer);
                if (!entry.consumers.size) { entry.stop?.(); if (listeners.get(key) === entry) listeners.delete(key); }
            };
        },
        async command(name, body) {
            const user = window.auth?.currentUser;
            if (!user) throw new Error('Please sign in first.');
            const token = await user.getIdToken();
            const response = await fetch(`/.netlify/functions/${name}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(body), signal: AbortSignal.timeout(25000)
            });
            const result = await response.json().catch(() => ({ error: 'The server is unavailable. Please try again.' }));
            if (!response.ok) throw new Error(result.error || 'Request failed.');
            return result;
        },
        stop() { releaseProofs(); listeners.forEach(entry => entry.stop?.()); listeners.clear(); },
        diagnostics() { return Array.from(listeners, ([key, entry]) => ({ key, consumers: entry.consumers.size })); }
    };
})();

