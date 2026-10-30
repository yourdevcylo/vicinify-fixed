window.MapPage = (() => {
    let map;
    let userDot, radiusCircle;
    let acceptedMarkers = [];
    // v53BK #2: marker diffing — Map<placeId, {marker, signature}> to avoid full recreation
    let markerMap = new Map();
    function markerSignature(p, freshness) {
        const config = CAT_CONFIG[p.cat] || CAT_CONFIG["default"];
        return [p.id, p.lat, p.lng, p.cat, config.color,
                freshness?.level || "", freshness?.markerColor || "",
                freshness?.isInactive ? "1" : "0"].join("|");
    }
    let cloudPlaces = [];
    let placeUpdatesUnsub = null;
    let routingControl = null;

    // 🔥 REACT/TAILWIND STYLE CSS INJECTION + NEW ANIMATIONS 🔥
    const btnFixStyles = document.createElement('style');
    btnFixStyles.innerHTML = `
        /* Centering Fixes */
        .circleBackBtn, .btn-fav, #refreshMapBtn, #askBtn, #locateBtn, .icon-btn, .floating-btn { display: flex !important; align-items: center !important; justify-content: center !important; padding: 0 !important; }
        .circleBackBtn, .btn-fav, #refreshMapBtn, #locateBtn { width: 44px !important; height: 44px !important; border-radius: 50% !important; }

        /* Modern AI Search Bar - Z-INDEX FIX APPLIED HERE */
       /* Modern AI Search Bar - Z-INDEX FIX APPLIED HERE */
.askBar {
    position: relative !important;
    z-index: 9999 !important;
    display: flex !important;
    align-items: center !important;
    background: transparent !important;
    padding: 12px 16px 8px 16px !important;
    margin: 0 !important; /* 🔥 ITO YUNG FIX: Tinanggal ang margin para hindi lumagpas sa 100% width 🔥 */
    width: 100% !important;
    box-sizing: border-box !important;
    border: none !important;
    box-shadow: none !important;
}
        #askInput { width: 100% !important; height: 54px !important; padding: 0 64px 0 58px !important; border-radius: 18px !important; border: 1px solid #dbe7f6 !important; background: rgba(255,255,255,0.98) !important; box-shadow: 0 2px 10px rgba(15,23,42,0.05) !important; font-size: 15px !important; line-height: 54px !important; outline: none !important; transition: border-color .2s ease, box-shadow .2s ease, background .2s ease !important; font-family: inherit !important; color: #0f172a !important; box-sizing: border-box !important; }
        #askInput::placeholder { color: #94a3b8 !important; font-weight: 600 !important; }
        #askInput:focus { border-color: #60a5fa !important; background: #ffffff !important; box-shadow: 0 0 0 2px rgba(59,130,246,0.22) !important; }
        .askBar > svg.lucide-sparkles, .askBar > i[data-lucide="sparkles"] { position: absolute !important; left: 30px !important; top: 50% !important; transform: translateY(-38%) !important; width: 30px !important; height: 30px !important; border-radius: 12px !important; display: flex !important; align-items: center !important; justify-content: center !important; padding: 6px !important; box-sizing: border-box !important; background: #eff6ff !important; color: #2563eb !important; z-index: 10 !important; pointer-events: none !important; }
        #askBtn { position: absolute !important; right: 24px !important; top: 50% !important; transform: translateY(-38%) !important; width: 40px !important; height: 40px !important; border-radius: 14px !important; background: linear-gradient(135deg, #3b82f6, #2563eb) !important; color: white !important; border: none !important; box-shadow: 0 10px 20px rgba(37, 99, 235, 0.32) !important; transition: transform .18s ease, box-shadow .18s ease, background .18s ease !important; z-index: 10 !important; cursor: pointer !important; }
        #askBtn:hover { background: linear-gradient(135deg, #2563eb, #1d4ed8) !important; box-shadow: 0 12px 24px rgba(37, 99, 235, 0.38) !important; transform: translateY(-38%) scale(1.03) !important; }
        #askBtn:active { transform: translateY(-38%) scale(0.96) !important; }
        #askBtn:disabled { opacity: 0.6 !important; cursor: not-allowed !important; }

        /* New Text Truncation to prevent horizontal spill-outs */
        .text-truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; flex: 1; }

        /* Toolbar & Controls */
        .toolbar { padding: 4px 16px !important; display: flex !important; justify-content: space-between !important; align-items: center !important; box-sizing: border-box !important; position: relative; z-index: 10; }
        .top-actions { display: flex !important; align-items: center !important; gap: 12px !important; }
        .view-toggle { background: #f3f4f6 !important; border-radius: 9999px !important; padding: 4px !important; display: flex !important; gap: 2px !important; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02) !important; }
        #btnMapView, #btnListView { width: auto !important; height: 32px !important; padding: 0 16px !important; border-radius: 9999px !important; color: #6b7280 !important; font-weight: 600 !important; transition: all 0.2s !important; border: none !important; background: transparent !important; }
        #btnMapView.active, #btnListView.active { background: #ffffff !important; color: #111827 !important; box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06) !important; }
        #refreshMapBtn { width: 40px !important; height: 40px !important; border-radius: 50% !important; background: #ffffff !important; border: 1px solid #e5e7eb !important; color: #4b5563 !important; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05) !important; cursor: pointer !important; transition: all 0.2s !important; }
        #refreshMapBtn:hover { background: #f9fafb !important; color: #1d4ed8 !important; }
        #locateBtn { position: absolute !important; right: 16px !important; bottom: 24px !important; width: 48px !important; height: 48px !important; border-radius: 50% !important; background: #ffffff !important; color: #3b82f6 !important; border: 1px solid #e5e7eb !important; z-index: 1000 !important; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05) !important; cursor: pointer !important; transition: all 0.2s !important; }
        #locateBtn:active { transform: scale(0.95) !important; }
        .circleBackBtn svg, .btn-fav svg, #refreshMapBtn svg, #askBtn svg, #locateBtn svg, #btnMapView svg, #btnListView svg { margin: 0 !important; display: block !important; }

        /* Map Marker Animations */
        @keyframes userRadarPulse {
            0%, 100% { box-shadow: 0 0 0 4px rgba(59,130,246,0.3), 0 2px 8px rgba(0,0,0,0.3); }
            50% { box-shadow: 0 0 0 8px rgba(59,130,246,0.2), 0 2px 8px rgba(0,0,0,0.3); }
        }

        .user-marker-modern {
            width: 20px; height: 20px; background: #3b82f6; border: 3px solid white; border-radius: 50%;
            animation: userRadarPulse 2s ease-in-out infinite; margin-left: 4px; margin-top: 4px;
        }

        /* Modern React Popup Overrides */
        .leaflet-popup-content-wrapper { border-radius: 16px !important; overflow: hidden !important; padding: 0 !important; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1) !important; border: 1px solid #f3f4f6; }
        .leaflet-popup-content { margin: 0 !important; width: 240px !important; }
        .leaflet-popup-tip-container { display: none !important; }
    `;
    document.head.appendChild(btnFixStyles);

    const mapPolishStyles = document.createElement('style');
    mapPolishStyles.textContent = `
        #page-map, #page-map * { scrollbar-width: none !important; }
        #page-map *::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }
        html.vici-map-lock, body.vici-map-lock, html.map-page-lock, body.map-page-lock,
        html:has(#page-map.active), body:has(#page-map.active) {
            overflow: hidden !important;
            scrollbar-width: none !important;
        }
        body.vici-map-lock #page-map .askBar,
        body.map-page-lock #page-map .askBar,
        html body #page-map.active .askBar {
            width: 100% !important;
            max-width: 100vw !important;
            margin: 0 !important;
            padding: 12px 16px 8px !important;
            background: transparent !important;
        }
        #page-map #askInput {
            height: 54px !important;
            padding: 0 64px 0 58px !important;
            border-radius: 18px !important;
            border: 1px solid #dbe7f6 !important;
            background: rgba(255,255,255,0.98) !important;
            box-shadow: 0 2px 10px rgba(15,23,42,0.05) !important;
            color: #0f172a !important;
        }
        #page-map #askBtn {
            width: 40px !important;
            height: 40px !important;
            right: 24px !important;
            top: 50% !important;
            transform: translateY(-38%) !important;
            border-radius: 14px !important;
            background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
            box-shadow: 0 10px 20px rgba(37,99,235,.32) !important;
        }
        body.vici-map-lock #page-map .toolbar-modern,
        body.map-page-lock #page-map .toolbar-modern,
        html body #page-map.active .toolbar-modern {
            padding: 0 12px 8px !important;
            margin: 0 !important;
            gap: 10px !important;
        }
        #page-map .radius-segment-container,
        #page-map .toggle-group,
        #page-map #catChips.modern-chips .chip {
            background: #ffffff !important;
            border: 1px solid #dbe3ef !important;
            box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05) !important;
        }
        #page-map #catChips.modern-chips {
            padding: 0 12px 10px !important;
            gap: 8px !important;
        }
        #page-map #catChips.modern-chips .chip {
            min-height: 36px !important;
            color: #334155 !important;
        }
        #page-map #catChips.modern-chips .chip.active {
            color: #ffffff !important;
            border-color: transparent !important;
        }
        #page-map #catChips.modern-chips .chip.active[data-color="gray"] { background: linear-gradient(to right, #6b7280, #4b5563) !important; }
        #page-map #catChips.modern-chips .chip.active[data-color="orange"] { background: linear-gradient(to right, #fb923c, #f97316) !important; }
        #page-map #catChips.modern-chips .chip.active[data-color="green"] { background: linear-gradient(to right, #4ade80, #22c55e) !important; }
        #page-map #catChips.modern-chips .chip.active[data-color="amber"] { background: linear-gradient(to right, #f59e0b, #d97706) !important; }
        #page-map #catChips.modern-chips .chip.active[data-color="red"] { background: linear-gradient(to right, #f87171, #ef4444) !important; }
        #page-map #catChips.modern-chips .chip.active[data-color="pink"] { background: linear-gradient(to right, #f472b6, #ec4899) !important; }
        #page-map #catChips.modern-chips .chip.active[data-color="blue"] { background: linear-gradient(to right, #60a5fa, #3b82f6) !important; }
        #page-map #catChips.modern-chips .chip.active[data-color="gray-dark"] { background: linear-gradient(to right, #4b5563, #374151) !important; }
        #page-map #catChips.modern-chips .chip.active[data-color="slate"] { background: linear-gradient(to right, #64748b, #475569) !important; }
        #page-map #catChips.modern-chips .chip.active[data-color="cyan"] { background: linear-gradient(to right, #22d3ee, #06b6d4) !important; }
        #page-map #catChips.modern-chips .chip.active[data-color="emerald"] { background: linear-gradient(to right, #34d399, #10b981) !important; }
        #page-map #catChips.modern-chips .chip.active[data-color="purple"] { background: linear-gradient(to right, #c084fc, #a855f7) !important; }
        #page-map .map-smart-filters {
            display: none !important;
            gap: 8px !important;
            padding: 0 12px 10px !important;
            overflow-x: auto !important;
            scrollbar-width: none !important;
        }
        #page-map .map-smart-filters.open {
            display: flex !important;
        }
        #page-map .map-smart-filters::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        #page-map .map-smart-filter {
            flex: 0 0 auto !important;
            min-height: 34px !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 6px !important;
            padding: 0 12px !important;
            border-radius: 999px !important;
            border: 1px solid #dbe3ef !important;
            background: #ffffff !important;
            color: #334155 !important;
            font-size: 12px !important;
            font-weight: 800 !important;
            box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05) !important;
            cursor: pointer !important;
        }
        #page-map .map-smart-filter.active {
            border-color: #93c5fd !important;
            background: linear-gradient(to right, #eff6ff, #dbeafe) !important;
            color: #1d4ed8 !important;
        }
        #page-map .map-smart-filter svg {
            width: 14px !important;
            height: 14px !important;
            display: block !important;
        }
        .review-insights-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
            margin-bottom: 12px;
        }
        @media (max-width: 620px) {
            .review-insights-grid { grid-template-columns: 1fr !important; }
        }
        body.vici-map-lock #page-map .mapWrap,
        body.map-page-lock #page-map .mapWrap,
        html body #page-map.active .mapWrap {
            border-top: 1px solid #e2e8f0 !important;
            background: #e2e8f0 !important;
        }
        @media (max-width: 620px) {
            body.vici-map-lock #page-map .toolbar-modern,
            body.map-page-lock #page-map .toolbar-modern,
            html body #page-map.active .toolbar-modern {
                display: grid !important;
                grid-template-columns: minmax(0, 1fr) auto !important;
                align-items: center !important;
            }
            #page-map .radius-label { display: none !important; }
            #page-map .toggle-group button {
                width: 36px !important;
                padding: 0 !important;
                justify-content: center !important;
            }
        }
    `;
    document.head.appendChild(mapPolishStyles);

    let _placesInFlight = null;
    let _catalogLoadedAt = 0;
    let _catalogGeneration = 0;
    let _placesRetryAt = 0;
    let _lastPlacesErrorAt = 0;
    // Public discovery reads only approved places through Firebase's client SDK.
    // Firestore rules still govern this query; private workflows keep their APIs.
    // Share overlapping loads and reuse even an empty catalog for five minutes.
    async function getAcceptedPlaces(forceRefresh = false) {
        if (_placesInFlight) return _placesInFlight;
        const run = _fetchAcceptedPlaces(forceRefresh);
        _placesInFlight = run;
        try { return await run; }
        finally { if (_placesInFlight === run) _placesInFlight = null; }
    }
    const publicCacheKey='vicinify:approved-catalog:20261028';
    const cachedPublicFields=['id','name','category','cat','description','desc','address','addr','barangay','brgy','lat','lng','phone','contact_phone','photos','coverPhoto','logo','logoURL','logoUrl','brand_logo','brandLogo','profileLogo','avatarUrl','status','hours','operatingHours','operating_hours','is_verified','owner_uid','addedBy','approval_status','avgRating','reviewCount','ratingCount','priceRange','accepts_booking','accepts_orders','refund_percent','suki_stamp_count','suki_icon','suki_template','suki_color_mode','suki_color','suki_gradient','suki_gradient_from','suki_gradient_to','suki_pattern','delivery_grab','delivery_inhouse','delivery_radius','suki_enabled','sukiEnabled','suki_design','sukiDesign','suki_required','suki_reward','suki_stamps','sukiRequired','sukiReward','createdAt','infoConfirmedAt','businessConfirmedAt','lastBusinessUpdateAt','updatedAt','lastConfirmedAt','last_verified_at'];
    function readPublicSessionCache(now) {
        try {
            const cached=JSON.parse(window.sessionStorage?.getItem(publicCacheKey)||'null');
            if(!cached || !Number.isFinite(cached.at) || now<cached.at || now-cached.at>=300000 || !Array.isArray(cached.places) || cached.places.length>2000)return false;
            if(cached.places.some(p=>!p||typeof p.id!=='string'||typeof p.name!=='string'||p.approval_status!=='approved'))return false;
            cloudPlaces=cached.places.map(normalizePlace);_catalogLoadedAt=cached.at;return true;
        } catch {return false;}
    }
    function writePublicSessionCache() {
        try {
            const places=cloudPlaces.filter(p=>p.approval_status==='approved').map(p=>Object.fromEntries(cachedPublicFields.filter(key=>p[key]!==undefined).map(key=>[key,typeof p[key]?.toDate==='function'?p[key].toDate().toISOString():p[key]])));
            window.sessionStorage?.setItem(publicCacheKey,JSON.stringify({at:_catalogLoadedAt,places}));
        } catch { /* Storage can be disabled/full; in-memory caching still works. */ }
    }
    async function _fetchAcceptedPlaces(forceRefresh = false) {
        const now = Date.now();
        if(!forceRefresh && !_catalogLoadedAt)readPublicSessionCache(now);
        if (!forceRefresh && ((_catalogLoadedAt && now - _catalogLoadedAt < 300000) || now < _placesRetryAt)) return cloudPlaces;
        const generation = _catalogGeneration;
        try {
            // An unordered query includes documents without updatedAt and needs
            // no composite index. Keep the existing 2,000-place display ceiling.
            const snapshot = await window.db.collection("places")
                .where("approval_status", "==", "approved").limit(2001).get();
            if (generation !== _catalogGeneration) return cloudPlaces;
            cloudPlaces = snapshot.docs.slice(0, 2000)
                .map(doc => normalizePlace({ ...doc.data(), id: doc.id }));
            _catalogLoadedAt = Date.now();
            writePublicSessionCache();
            _placesRetryAt = 0;
            if (snapshot.size > 2000) window.showToast?.("Showing a limited catalog. Some establishments may not appear.", "info");
            return cloudPlaces;
        } catch (error) {
            if (generation !== _catalogGeneration) return cloudPlaces;
            _placesRetryAt = Date.now() + 30000;
            console.warn("Establishments Firebase read failed:", error.code || "unknown");
            if (!_lastPlacesErrorAt || Date.now() - _lastPlacesErrorAt >= 30000) {
                _lastPlacesErrorAt = Date.now();
                const message = error.code === "permission-denied"
                    ? "Firebase blocked access to approved establishments. Check the places read rules."
                    : "Could not load establishments. Check your connection and try again.";
                window.showToast?.(message, "error");
            }
            return cloudPlaces;
        }
    }
    window.invalidatePlacesCache = () => {
        try {window.sessionStorage?.removeItem(publicCacheKey);} catch {}
        _catalogLoadedAt = 0;
        _placesRetryAt = 0;
        _catalogGeneration++;
    };


    function clearAcceptedMarkers() {
        if (!map) return;
        // v53BK #2: full clear only when explicitly needed (kept for compatibility)
        markerMap.forEach(({marker}) => { try { map.removeLayer(marker); } catch(e){} });
        markerMap.clear();
        acceptedMarkers = [];
    }
    // Marker diffing (perf): instead of destroying and recreating every marker on
    // each filter/search/radius change (which caused visible flicker and GC churn on
    // low-end Android), we keep a Map of place ID -> {marker, signature}. Only
    // markers whose signature (position, category, color, freshness,
    // inactive state) changed are rebuilt. Unchanged markers are untouched.
    // v53BK #2: diff markers — add new, remove gone, update changed
    function diffAcceptedMarkers(filtered, buildMarkerFn) {
        if (!map) return;
        const newIds = new Set(filtered.map(p => p.id));
        // Remove markers for places no longer in filtered set
        for (const [id, {marker}] of markerMap) {
            if (!newIds.has(id)) {
                try { map.removeLayer(marker); } catch(e){}
                markerMap.delete(id);
            }
        }
        // Add new markers or update changed ones
        for (const p of filtered) {
            const freshness = p._freshness || window.getViciFreshnessStatus?.(p) || {};
            const sig = markerSignature(p, freshness);
            const existing = markerMap.get(p.id);
            if (existing) {
                if (existing.signature !== sig) {
                    // Data changed — rebuild this marker's icon
                    try { map.removeLayer(existing.marker); } catch(e){}
                    const m = buildMarkerFn(p, freshness);
                    if (m) markerMap.set(p.id, {marker: m, signature: sig});
                }
                // else: unchanged — keep existing marker
            } else {
                const m = buildMarkerFn(p, freshness);
                if (m) markerMap.set(p.id, {marker: m, signature: sig});
            }
        }
        // Keep acceptedMarkers array in sync for compatibility
        acceptedMarkers = Array.from(markerMap.values()).map(x => x.marker);
    }

    function withinRadius(lat, lng) {
        if (AppState.userLocation.lat == null || AppState.userLocation.lng == null) return true;
        const from = L.latLng(AppState.userLocation.lat, AppState.userLocation.lng);
        const to = L.latLng(lat, lng);
        return from.distanceTo(to) <= AppState.radius;
    }

    function escapeHtml(str) {
        if (!str) return "";
        return String(str).replace(/[&<>"']/g, s => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[s]));
    }

    function safeString(str) { return String(str ?? "").split("").map(c => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")).join(""); }

    function getSafeImageUrl(url) {
        return window.safeImageUrl ? window.safeImageUrl(url) : String(url || "");
    }

    const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    function parseTimeToMinutes(value) {
        const text = String(value || "").trim().toLowerCase();
        if (!text) return null;

        const match = text.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
        if (!match) return null;

        let hour = Number(match[1]);
        const minute = Number(match[2] || 0);
        const suffix = match[3];

        if (minute < 0 || minute > 59 || hour < 0 || hour > 24) return null;
        if (suffix) {
            if (hour < 1 || hour > 12) return null;
            if (suffix === "am" && hour === 12) hour = 0;
            if (suffix === "pm" && hour !== 12) hour += 12;
        }

        if (!suffix && hour === 24 && minute > 0) return null;
        return Math.min((hour * 60) + minute, 1440);
    }

    function parseHoursRange(value) {
        const text = String(value || "").trim();
        if (!text) return null;

        const normalized = text
            .toLowerCase()
            .replace(/\u2013|\u2014/g, "-")
            .replace(/\s+to\s+/g, "-")
            .replace(/\s+/g, " ");

        if (/closed|close|sarado|not open/.test(normalized)) {
            return { closed: true };
        }

        if (/24\s*(hours|hrs|hr)/.test(normalized) || normalized === "24/7") {
            return { start: 0, end: 1440 };
        }

        const parts = normalized.split(/\s*-\s*/).filter(Boolean);
        if (parts.length < 2) return null;

        let start = parseTimeToMinutes(parts[0]);
        let end = parseTimeToMinutes(parts[1]);

        const endSuffix = String(parts[1]).match(/\b(am|pm)\b/)?.[1];
        if (start == null && endSuffix) {
            start = parseTimeToMinutes(`${parts[0]}${endSuffix}`);
        }

        if (start == null || end == null) return null;
        return { start, end };
    }

    function getTodayHoursText(place) {
        const hours = place?.operating_hours || place?.hours || {};
        const key = DAY_KEYS[new Date().getDay()];
        return hours[key] || hours[key?.slice(0, 3)] || "";
    }

    function getBusinessOpenState(place) {
        const todayText = getTodayHoursText(place);
        const parsed = parseHoursRange(todayText);

        if (parsed?.closed) {
            return { isOpen: false, className: "closed", label: "Closed now", hint: todayText };
        }

        if (parsed && parsed.start != null && parsed.end != null) {
            const now = new Date();
            const current = (now.getHours() * 60) + now.getMinutes();
            const isOpen = parsed.end <= parsed.start
                ? current >= parsed.start || current <= parsed.end
                : current >= parsed.start && current <= parsed.end;

            return {
                isOpen,
                className: isOpen ? "open" : "closed",
                label: isOpen ? "Open now" : "Closed now",
                hint: todayText
            };
        }

        const fallback = String(place?.status || "").toLowerCase();
        if (fallback === "open") return { isOpen: true, className: "open", label: "Open", hint: todayText };
        if (fallback === "busy") return { isOpen: true, className: "busy", label: "Busy", hint: todayText };
        if (fallback === "closed") return { isOpen: false, className: "closed", label: "Closed", hint: todayText };

        return { isOpen: false, className: "closed", label: todayText ? "Hours set" : "Hours not set", hint: todayText };
    }

    function placeHasDelivery(place) {
        const radius = String(place?.delivery_radius || "").trim();
        return Boolean(place?.delivery_grab || place?.delivery_inhouse || radius);
    }

    function canManagePlaceData(place, user = window.auth?.currentUser) {
        if (!place || !user) return false;
        return AppState.userProfile?.role === "admin" ||
            (Boolean(place.owner_uid) && place.owner_uid === user.uid);
    }

    async function getPlaceForPermission(placeId) {
        // Cache-first: cloudPlaces already holds the approved places;
        // rules enforce ownership server-side regardless of this check.
        const local = cloudPlaces.find(x => x.id === placeId);
        if (local) return local;
        if (window.db && placeId) {
            try {
                const snap = await window.db.collection("places").doc(placeId).get();
                return snap.exists ? normalizePlace({ ...snap.data(), id: snap.id }) : null;
            } catch (error) {
                console.warn("Permission place lookup failed, using local cache.", error);
            }
        }
        return null;
    }

    async function canManagePlace(placeId) {
        const place = await getPlaceForPermission(placeId);
        return canManagePlaceData(place);
    }

    async function requireVerifiedUser(actionLabel) {
        const user = window.auth?.currentUser;
        if (!user) {
            window.showToast(`Please log in first to ${actionLabel}.`, "error");
            return null;
        }

        if (!user.emailVerified) {
            const ans = await window.vConfirm(
                "Account Not Verified",
                `Please verify your email address before you ${actionLabel}. Would you like us to resend the verification link?`,
                "Resend Link",
                false
            );
            if (ans) window.resendVerificationEmail?.();
            return null;
        }

        return user;
    }


    function normalizeCategoryKey(value) {
        const raw = String(value || "default").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "");
        const aliases = {
            restaurant: "restaurant",
            resto: "restaurant",
            cafe: "cafe",
            coffee: "cafe",
            bakery: "bakery",
            bakeshop: "bakery",
            milktea: "milktea",
            bubbletea: "milktea",
            bobatea: "milktea",
            snackhouse: "snackhouse",
            snack: "snackhouse",
            foodstall: "foodstall",
            stall: "foodstall",
            eatery: "eatery",
            karinderya: "eatery",
            carinderia: "eatery",
            dessert: "dessert",
            dessertshop: "dessert",
            fastfood: "fastfood",
            fastfoodrestaurant: "fastfood"
        };
        return aliases[raw] || raw || "default";
    }

    function normalizePlace(p) {
        const cat = normalizeCategoryKey(p.cat || p.category || "default");
        const addr = p.addr || p.address || "";
        const brgy = p.brgy || p.barangay || "";
        const phone = p.phone || p.contact_phone || "";
        const desc = p.desc || p.description || "";

        return {
            ...p,
            cat,
            category: cat,
            addr,
            address: addr,
            brgy: brgy || addr || "Lipa City",
            barangay: brgy,
            phone,
            contact_phone: phone,
            desc,
            description: desc
        };
    }

    function formatDistance(meters) {
        if (!meters) return "";
        if (meters < 1000) return `${Math.round(meters)}m`;
        return `${(meters/1000).toFixed(1)}km`;
    }

    const CAT_CONFIG = {
        "restaurant": { color: "#ef4444", icon: "utensils" },
        "cafe": { color: "#f59e0b", icon: "coffee" },
        "bakery": { color: "#f97316", icon: "croissant" },
        "milktea": { color: "#ec4899", icon: "cup-soda" },
        "snackhouse": { color: "#06b6d4", icon: "cookie" },
        "foodstall": { color: "#22c55e", icon: "store" },
        "eatery": { color: "#64748b", icon: "chef-hat" },
        "dessert": { color: "#a855f7", icon: "ice-cream" },
        "fastfood": { color: "#3b82f6", icon: "pizza" },
        "default": { color: "#94a3b8", icon: "map-pin" }
    };

    // Suki Card default icon/color per establishment category (read-only accessor).
    window.vicinifyCatConfig = function (key) {
        return CAT_CONFIG[key] || CAT_CONFIG["default"];
    };

    const CATEGORY_INTENTS = {
        "restaurant": ["restaurant", "resto", "kainan", "dinner", "lunch", "date", "formal", "steak", "seafood", "buffet"],
        "cafe": ["kape", "coffee", "latte", "espresso", "frappe", "tambayan", "cafe", "pastries", "study"],
        "bakery": ["tinapay", "bakery", "pandesal", "cake", "bakeshop", "pastry", "bread", "biskwit"],
        "milktea": ["milktea", "boba", "milk tea", "pearl", "matcha", "taro", "milk shake"],
        "snackhouse": ["meryenda", "snack", "burger", "fries", "sandwiches", "nachos", "snackhouse"],
        "foodstall": ["streetfood", "kwek kwek", "fishball", "tusok", "tuhog", "stall", "kiosk", "takoyaki", "siomai"],
        "eatery": ["karinderya", "eatery", "lutong bahay", "ulam", "kanin", "silog", "tapsihan", "pares", "mura", "affordable", "budget"],
        "dessert": ["dessert", "ice cream", "halo-halo", "sweets", "matamis", "gelato", "sorbetes", "crepe"],
        "fastfood": ["fastfood", "fast food", "chicken", "fried chicken", "pizza", "drive thru", "burger", "jollibee", "mcdo"]
    };

    const GENERIC_FOOD_WORDS = ["food", "foods", "pagkain", "kainan", "makakain", "eat", "eats", "place", "places", "business", "businesses", "establishment", "store", "shop"];
    const ASK_STOP_WORDS = ["saan", "may", "maganda", "masarap", "murang", "mura", "malapit", "nearby", "around", "within", "radius", "sa", "akin", "dito", "ako", "ang", "ng", "mga", "naghahanap", "gusto", "ko", "in", "near", "me", "find", "looking", "for", "ngayon", "pwede", "meron", "ba", "bang", "recommend", "recommended", "best", "pinaka", "good", "better", "top", "rating", "ratings", "review", "reviews", "trusted", "legit", "safe", "open", "bukas", "now", "latest", "updated", "active", ...GENERIC_FOOD_WORDS];

    function normalizeAskQuery(rawQuery = "") {
        return String(rawQuery || "")
            .toLowerCase()
            .replace(/[^a-z0-9ñ\s-]/gi, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function getSmartSearchText(place) {
        return [
            place.name,
            place.cat,
            place.category,
            place.brgy,
            place.barangay,
            place.addr,
            place.address,
            place.desc,
            place.description
        ].join(" ").toLowerCase();
    }

    function inferSmartIntent(rawQuery = "") {
        const query = normalizeAskQuery(rawQuery);
        let matchedCat = "all";

        for (const [cat, keywords] of Object.entries(CATEGORY_INTENTS)) {
            if (keywords.some(kw => query.includes(normalizeAskQuery(kw)))) {
                matchedCat = cat;
                break;
            }
        }

        const wants = {
            cheap: /\b(mura|murang|affordable|budget|cheap|tipid)\b/.test(query),
            openNow: /\b(open|bukas|ngayon|now|late|tonight)\b/.test(query),
            delivery: /\b(delivery|deliver|padeliver|grab|foodpanda|panda)\b/.test(query),
            booking: /\b(book|booking|reserve|reservation|table|request)\b/.test(query),
            highRated: /\b(best|maganda|recommended|recommend|mataas|rating|reviews|trusted)\b/.test(query),
            verified: /\b(verified|legit|trusted|safe)\b/.test(query),
            fresh: /\b(updated|active|fresh|latest|bago)\b/.test(query)
        };

        const categoryWords = matchedCat === "all" ? [] : (CATEGORY_INTENTS[matchedCat] || []).flatMap(word => normalizeAskQuery(word).split(/\s+/));
        const searchWords = query
            .split(/\s+/)
            .map(w => w.trim())
            .filter(w => w.length > 1 && !ASK_STOP_WORDS.includes(w) && !categoryWords.includes(w));
        const textFilter = searchWords.join(" ");

        return { query, matchedCat, wants, searchWords, textFilter };
    }

    function getPlaceDistanceMeters(place) {
        if (AppState.userLocation?.lat == null || AppState.userLocation?.lng == null || place.lat == null || place.lng == null) return null;
        return L.latLng(AppState.userLocation.lat, AppState.userLocation.lng).distanceTo([place.lat, place.lng]);
    }

    function scorePlaceForSmartAsk(place, intent) {
        const freshness = window.getViciFreshnessStatus?.(place) || { level: "active", isInactive: false, shortLabel: "Fresh" };
        const distance = getPlaceDistanceMeters(place);
        const rating = Number(place.avgRating || 0);
        const reviews = Number(place.reviewCount || 0);
        const openState = getBusinessOpenState(place);
        const text = [place.name, place.cat, place.category, place.brgy, place.barangay, place.addr, place.address, place.desc, place.description].join(" ").toLowerCase();
        let score = 0;
        const reasons = [];

        if (intent.matchedCat !== "all" && normalizeCategoryKey(place.cat || place.category) === intent.matchedCat) {
            score += 28;
            reasons.push("matches your food type");
        }

        if (intent.searchWords?.length) {
            const matches = intent.searchWords.filter(word => text.includes(word)).length;
            score += matches * 8;
            if (matches) reasons.push("matches your words");
        }

        if (intent.wants.cheap) {
            const budgetFriendlyCats = ["eatery", "foodstall", "snackhouse", "fastfood"];
            const catKey = normalizeCategoryKey(place.cat || place.category);
            const priceText = String(place.price_range || place.priceRange || place.budget || place.desc || place.description || "").toLowerCase();
            if (budgetFriendlyCats.includes(catKey) || /\b(mura|affordable|budget|tipid|cheap)\b/.test(priceText)) {
                score += 12;
                reasons.push("budget-friendly fit");
            }
        }

        if (distance != null) {
            const radius = Number(AppState.radius || 300);
            if (distance <= radius) {
                score += 22;
                reasons.push(`${formatDistance(distance)} away`);
            } else {
                score -= Math.min(28, Math.round((distance - radius) / 120));
            }
        }

        if (rating > 0) {
            score += Math.min(24, rating * 4 + Math.min(6, reviews));
            if (rating >= 4) reasons.push(`${rating} rating`);
        } else if (intent.wants.highRated) {
            score -= 8;
        }

        if (openState.isOpen) {
            score += intent.wants.openNow ? 18 : 8;
            reasons.push("open now");
        } else if (intent.wants.openNow) {
            score -= 18;
        }

        if (place.is_verified) {
            score += intent.wants.verified ? 14 : 6;
            reasons.push("verified");
        }

        if (placeHasDelivery(place)) {
            score += intent.wants.delivery ? 16 : 4;
            if (intent.wants.delivery) reasons.push("has delivery");
        } else if (intent.wants.delivery) {
            score -= 10;
        }

        if (place.accepts_booking) {
            score += intent.wants.booking ? 14 : 3;
        } else if (intent.wants.booking) {
            score -= 8;
        }

        if (freshness.level === "active") {
            score += intent.wants.fresh ? 14 : 6;
            reasons.push(freshness.shortLabel.toLowerCase());
        } else if (freshness.level === "due") {
            score += 1;
        } else if (freshness.level === "needs_update") {
            score -= 8;
            reasons.push("needs update check");
        } else if (freshness.level === "unconfirmed") {
            score -= 15;
            reasons.push("unconfirmed info");
        } else if (freshness.isInactive) {
            score -= 30;
            reasons.push("inactive signal");
        }

        if (intent.wants.highRated && rating > 0 && rating < 4) score -= 16;

        return {
            ...place,
            _smartScore: score,
            _smartReasons: reasons.slice(0, 3),
            _freshness: freshness,
            _distance: distance
        };
    }

    function getSmartRecommendations(intent, places = cloudPlaces) {
        return (window.ViciRelevance?.filter(places,intent.query)||places||[])
            .filter(place => place.approval_status !== "rejected" && place.lat != null && place.lng != null)
            .map(place => scorePlaceForSmartAsk(place, intent))
            .sort((a, b) => (b._smartScore || 0) - (a._smartScore || 0))
            .slice(0, 5);
    }

    function ensureSmartAnswerPanel() {
        if (window.ViciChat) return window.ViciChat.panel();
        const mapWrap = document.querySelector("#page-map .mapWrap");
        const askBar = document.querySelector(".askBar");
        if (!mapWrap && !askBar) return null;
        let panel = document.getElementById("smartAnswerPanel");
        if (!panel) {
            panel = document.createElement("div");
            panel.id = "smartAnswerPanel";
            panel.className = "smart-answer-panel hidden";
            (mapWrap || askBar).appendChild(panel);
        } else if (mapWrap && panel.parentElement !== mapWrap) {
            mapWrap.appendChild(panel);
        }
        return panel;
    }

    function ensureViciAIBubble() {
        const mapWrap = document.querySelector("#page-map .mapWrap");
        if (!mapWrap) return null;
        document.getElementById("viciAiBubbleBtn")?.remove();
        let btn = document.getElementById("locateBtn");
        if (!btn) {
            btn = document.createElement("button");
            btn.id = "locateBtn";
            btn.type = "button";
            mapWrap.appendChild(btn);
        }
        btn.classList.add("vici-ai-bubble-launcher");
        btn.classList.remove("hidden");
        btn.title = "Open Vici AI";
        btn.setAttribute("aria-label", "Open Vici AI");
        btn.innerHTML = `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg><span>AI</span>`;
        if (!btn.dataset.viciAiLauncher) {
            btn.dataset.viciAiLauncher = "true";
            btn.addEventListener("click", (event) => {
                event.preventDefault();
                window.toggleViciAI(true);
            });
        }
        window.FloatingVici?.mount(btn);
        window.debouncedIcons?.();
        return btn;
    }

    function updateViciAIBubbleVisibility(show = true) {
        const btn = ensureViciAIBubble();
        if (!btn) return;
        btn.classList.toggle("hidden", !show);
    }

    function getVisibleSmartPicks(intent, recommendations) {
        const matchedCat = intent?.matchedCat || "all";
        const hasMeaningfulAsk = Boolean(intent?.query) && (
            intent.query.length >= 3 ||
            matchedCat !== "all" ||
            Object.values(intent?.wants || {}).some(Boolean)
        );

        return {
            hasMeaningfulAsk,
            visible: hasMeaningfulAsk
                ? (recommendations || []).filter(p => (p._smartScore || 0) > -20).slice(0, 3)
                : []
        };
    }

    function serializeViciAIPlace(place) {
        const openState = getBusinessOpenState(place);
        return {
            id: place.id,
            name: place.name || "Establishment",
            category: place.cat || place.category || "",
            distance: place._distance != null ? formatDistance(place._distance) : "",
            rating: place.avgRating || 0,
            reviewCount: place.reviewCount || 0,
            status: openState.label,
            address: place.address || place.addr || "",
            barangay: place.barangay || place.brgy || "",
            description: String(place.description || place.desc || "").slice(0, 160),
            priceRange: place.priceRange || "",
            suki: !!(place.suki_enabled || place.sukiEnabled),
            reasons: place._smartReasons || []
        };
    }

    // ============================================================
    // VICI AI CONFIG — deployed AI only (PLUS43, per Marc 2026-10-21).
    // Ang Gemini key ay nasa Netlify env var (GEMINI_API_KEY) lang; ang app ay
    // tumatawag sa netlify/functions/askVici.js. WALANG local keyword finder:
    // pag hindi maabot ang endpoint o sira ang API, error ang ipinapakita.
    window.VICINIFY_AI_ENDPOINT = window.VICINIFY_AI_ENDPOINT || "/.netlify/functions/askVici";
    const VICI_AI_ERROR = "Vici AI is currently unavailable. Please try again later.";


    async function getViciAIReply(intent, recommendations, context = {}) {
        // Deployed AI ONLY (PLUS43): the Netlify Function answers, or an
        // error is shown. No local keyword finder, no client-side key path.
        const endpoint = window.VICINIFY_AI_ENDPOINT || window.ViciAI?.endpoint || "";
        if (endpoint && intent?.query) {
            try {
                const allPlaces = (recommendations || []).map(serializeViciAIPlace);
                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await window.auth.currentUser.getIdToken()}` },
                    signal: context.signal && AbortSignal.any ? AbortSignal.any([context.signal, AbortSignal.timeout(35000)]) : AbortSignal.timeout(35000),
                    body: JSON.stringify({
                        query: intent.query,
                        uiLanguage: window.LangManager?.getLanguage?.() || 'en',
                        history: context.history || [],
                        memory:context.memory || {},
                        requestDraft:context.requestDraft || null,
                        orderDraft:context.orderDraft || null,
                        requestRefs:context.requestRefs || [],
                        location:AppState.userLocation?{lat:Math.round(AppState.userLocation.lat*1000)/1000,lng:Math.round(AppState.userLocation.lng*1000)/1000}:null,
                        radius: AppState.radius,
                        recommendations: allPlaces.map(place => ({ id: place.id })),
                        pureAI: true
                    })
                });
                if (!response.ok) {
                    const data = await response.json().catch(()=>({}));
                    const message = data.error === 'Forbidden origin' ? 'Vici AI cannot accept requests from this site address. Please contact the site administrator.'
                        : response.status === 503 ? 'Vici AI server setup is incomplete. Please contact the site administrator.'
                        : response.status === 429 ? 'Too many AI requests. Please wait before trying again.'
                        : response.status === 401 || response.status === 403 ? 'Please sign in again with a verified email to use Vici AI.'
                        : response.status === 504 ? 'AI timed out. Please try again.' : VICI_AI_ERROR;
                    console.warn('Vici AI request failed.', {status:response.status, reason:data.error === 'Forbidden origin'?'origin_rejected':response.status===503?'server_setup':'request_failed'});
                    return {answer:message,source:'error',error:true};
                }
                if (response.ok) {
                    const data = await response.json();
                    if (data.answer) return { answer: data.answer, source: data.source === "guard" ? "guard" : "ai",...(Object.hasOwn(data,'orderDraft')?{orderDraft:data.orderDraft}:{}),menuPreview:data.menuPreview||null,actions:data.actions||[],placeCards:data.placeCards||[],requestDraft:data.requestDraft?window.ViciRequest?.clean(data.requestDraft):undefined,requestReady:data.requestReady===true,requestUnavailable:data.requestUnavailable===true, placeIds: Array.isArray(data.placeIds) ? data.placeIds : [] };
                }
            } catch (e) { console.warn("Vici AI endpoint unavailable.", e); if(e.name === "TimeoutError" || e.name === "AbortError")return {answer:"AI timed out. Please try again.",source:"error",error:true}; }
        }
        return { answer: VICI_AI_ERROR, source: "error", error: true };
    }

    window.openViciMenu=id=>window.ViciCommerce.openMenu(id);

    window.ViciChat?.configure({
        ask: async (query, context) => {
            if (!window.auth?.currentUser?.emailVerified) return { answer: "Sign in with a verified email to use Vici AI.", error: true, picks: [] };
            await getAcceptedPlaces();
            const memory=context.memory||{searchQuery:'',placeIds:[]};
            const focused=(memory.placeIds||[]).map(id=>cloudPlaces.find(p=>p.id===id)).filter(Boolean);
            const named=cloudPlaces.filter(p=>String(p.name||'').length>=3&&query.toLowerCase().includes(p.name.toLowerCase()));
            const nearby=[...cloudPlaces].sort((a,b)=>(getPlaceDistanceMeters(a)??Infinity)-(getPlaceDistanceMeters(b)??Infinity));
            const recommendations=[...named,...focused,...nearby].filter((p,i,all)=>p.approval_status!=='rejected'&&all.findIndex(x=>x.id===p.id)===i).slice(0,20);
            const reply=await getViciAIReply({query},recommendations,{...context,memory});
            const ids = new Set(reply.placeIds || []);
            const selectedPlaces=recommendations.filter(p=>ids.has(p.id)).slice(0,3);
            return { ...reply, memory:reply.error?context.memory:{searchQuery:query,placeIds:selectedPlaces.map(p=>p.id)}, picks: reply.error ? [] : reply.placeCards?.length?reply.placeCards:selectedPlaces.map(p => ({
                id:p.id,name:p.name,category:p.cat || p.category,rating:p.avgRating || 0,reviewCount:p.reviewCount || 0,
                distance:p._distance != null ? formatDistance(p._distance) : "",photo:getSafeImageUrl(p.coverPhoto || p.photos?.[0]) || ""
            })) };
        },
        reviewRequest: async draft => {
            await getAcceptedPlaces();
            const d=window.ViciRequest.clean(draft),place=cloudPlaces.find(p=>p.id===d.placeId);
            if(!place||place.accepts_booking!==true){window.showToast?.('This establishment is not accepting requests. Please message the business.','info');return false;}
            return await window.openBookingModal(place.id,place.name,d);
        },
        messageBusiness:async id=>{await getAcceptedPlaces();const p=cloudPlaces.find(p=>p.id===id);if(!p)return false;await window.openChatModal?.(p.id,p.name);return true;},
        viewPlace:async id=>{await window.viewPlace(id);return true;},
        viewMenu:async id=>window.openViciMenu(id),
        directions:async id=>{await getAcceptedPlaces();const p=cloudPlaces.find(p=>p.id===id);if(!p||!Number.isFinite(Number(p.lat))||!Number.isFinite(Number(p.lng)))return false;window.routeToPlace(Number(p.lat),Number(p.lng));return true;},
        viewOnMap: async id => {
            await getAcceptedPlaces();
            const place = cloudPlaces.find(p => p.id === id);
            if (!place || place.lat == null || place.lng == null || !Number.isFinite(Number(place.lat)) || !Number.isFinite(Number(place.lng))) {
                window.showToast?.("This place is no longer available on the map.", "info"); return false;
            }
            window.PlacePreview?.close?.();
            window.toggleView?.("map");
            showPage("page-map");
            setTimeout(() => {
                if (!map) return;
                map.invalidateSize(); map.flyTo([place.lat, place.lng], 16, { duration:.7 });
                const marker = markerMap.get(id)?.marker;
                if (marker) marker.openPopup();
                else L.popup({className:"vici-place-popup",maxWidth:300}).setLatLng([place.lat,place.lng]).setContent(buildPlaceCard(place)).openOn(map);
                window.debouncedIcons?.();
            },100);
            return true;
        }
    });

    function renderViciAIHeader(sourceLabel) {
        return `
            <div class="vici-ai-head">
                <span class="vici-ai-avatar"><img src="icons/icon-192.png" alt="Vicinify" /></span>
                <div class="vici-ai-title">
                    <strong>Vici AI</strong>
                    <span>Food finder for Vicinify</span>
                </div>
                <button type="button" class="vici-ai-close" onclick="window.toggleViciAI(false)" aria-label="Hide Vici AI">
                    <i data-lucide="x"></i>
                </button>
            </div>
        `;
    }

    function renderViciAIThread(query, replyText) {
        return `
            <div class="vici-ai-thread">
                <div class="vici-ai-bubble user">${escapeHtml(query)}</div>
                <div class="vici-ai-bubble ai">
                    <span class="vici-ai-bubble-icon"><i data-lucide="sparkles"></i></span>
                    <span>${escapeHtml(replyText)}</span>
                </div>
            </div>
        `;
    }

    function renderViciQuickPrompts() {
        const prompts = ["cheap coffee", "milk tea open now", "best food near me", "delivery nearby", "open now"];
        return `
            <div class="vici-ai-prompts">
                <span>Try asking</span>
                ${prompts.map(prompt => `
                    <button type="button" onclick="window.viciAskQuick('${safeString(prompt)}')">${escapeHtml(prompt)}</button>
                `).join("")}
            </div>
        `;
    }

    function renderViciAIComposer(value = "") {
        return `
            <form class="vici-ai-composer" onsubmit="window.viciSubmitChat(event)">
                <input id="viciAiChatInput" type="text" value="${escapeHtml(value)}" placeholder="Ask Vici AI..." autocomplete="off" />
                <button type="submit" aria-label="Send to Vici AI"><i data-lucide="send"></i></button>
            </form>
        `;
    }

    function renderViciAIWelcome() {
        if (window.ViciChat) { window.ViciChat.open(); return; }
        const panel = ensureSmartAnswerPanel();
        if (!panel) return;
        panel.classList.remove("hidden");
        updateViciAIBubbleVisibility(false);
        panel.innerHTML = `
            <div class="vici-ai-chat vici-ai-empty">
                ${renderViciAIHeader("Vici Assistant")}
                <div class="vici-ai-thread">
                    <div class="vici-ai-bubble ai">
                        <span class="vici-ai-bubble-icon"><i data-lucide="sparkles"></i></span>
                        <span>Hi, I can help you find food places, compare ratings, check distance, and suggest what fits your location.</span>
                    </div>
                </div>
                ${renderViciQuickPrompts()}
                ${renderViciAIComposer()}
            </div>
        `;
        window.debouncedIcons?.();
        setTimeout(() => document.getElementById("viciAiChatInput")?.focus(), 50);
    }

    window.toggleViciAI = function(forceOpen) {
        if (window.ViciChat) { const open = forceOpen == null ? !window.ViciChat.isOpen() : !!forceOpen; open ? window.ViciChat.open() : window.ViciChat.close(); return; }
        const panel = ensureSmartAnswerPanel();
        if (!panel) return;
        const shouldOpen = forceOpen == null ? panel.classList.contains("hidden") : Boolean(forceOpen);
        if (shouldOpen) {
            if (!panel.innerHTML.trim()) {
                renderViciAIWelcome();
            } else {
                panel.classList.remove("hidden");
                updateViciAIBubbleVisibility(false);
            }
        } else {
            panel.classList.add("hidden");
            updateViciAIBubbleVisibility(true);
        }
    };

    function renderSmartAnswer(intent, recommendations, aiReply = null) {
        const panel = ensureSmartAnswerPanel();
        if (!panel) return;

        if (!intent?.query) {
            panel.classList.add("hidden");
            panel.innerHTML = "";
            updateViciAIBubbleVisibility(true);
            return;
        }

        {
            const { hasMeaningfulAsk, visible } = getVisibleSmartPicks(intent, recommendations);
            const replyText = aiReply?.answer || VICI_AI_ERROR;
            const sourceLabel = (aiReply?.source === "api" || aiReply?.source === "ai") ? "Vici AI" : "Vici Assistant";

            if (!hasMeaningfulAsk) {
                panel.classList.remove("hidden");
                updateViciAIBubbleVisibility(false);
                panel.innerHTML = `
                    <div class="vici-ai-chat vici-ai-empty">
                        ${renderViciAIHeader(sourceLabel)}
                        ${renderViciAIThread(intent.query, replyText)}
                        ${renderViciQuickPrompts()}
                        ${renderViciAIComposer()}
                    </div>
                `;
                window.debouncedIcons?.();
                setTimeout(() => document.getElementById("viciAiChatInput")?.focus(), 50);
                return;
            }

            if (visible.length === 0) {
                panel.classList.remove("hidden");
                updateViciAIBubbleVisibility(false);
                panel.innerHTML = `
                    <div class="vici-ai-chat">
                        ${renderViciAIHeader(sourceLabel)}
                        ${renderViciAIThread(intent.query, replyText)}
                        ${renderViciQuickPrompts()}
                        ${renderViciAIComposer()}
                    </div>
                `;
                window.debouncedIcons?.();
                setTimeout(() => document.getElementById("viciAiChatInput")?.focus(), 50);
                return;
            }

            // v53AU: Pure AI — no local keyword-based "Recommended" section when AI answered.
            // The AI response is self-contained; showing local picks mixes two systems.
            const isAISource = aiReply?.source === "ai";
            const picksHtml = isAISource ? "" : `
                    <div class="vici-ai-picks">
                        <div class="vici-ai-picks-title">
                            <span>Recommended</span>
                            <b>${visible.length} result${visible.length === 1 ? "" : "s"}</b>
                        </div>
                        ${visible.map((place, index) => {
                            const distance = place._distance != null ? formatDistance(place._distance) : "";
                            const rating = place.avgRating ? `${place.avgRating} (${place.reviewCount || 0})` : "New";
                            const openState = getBusinessOpenState(place);
                            const catLabel = place.cat || place.category || "Food";
                            const reasons = (place._smartReasons || [])
                                .filter(reason => !/(away|rating|open now)/i.test(reason))
                                .slice(0, 2);
                            const reasonText = reasons.length ? reasons.join(" / ") : "Good nearby match";
                            return `
                                <button type="button" class="vici-ai-pick" onclick="window.viewPlace('${safeString(place.id)}')">
                                    <span class="vici-ai-rank"><b>${index + 1}</b><i data-lucide="map-pin"></i></span>
                                    <span class="vici-ai-pick-main">
                                        <span class="vici-ai-place-top">
                                            <strong data-no-translate>${escapeHtml(place.name || "Establishment")}</strong>
                                            <mark>${escapeHtml(catLabel)}</mark>
                                        </span>
                                        <small>${escapeHtml(reasonText)}</small>
                                        <span class="vici-ai-meta">
                                            ${distance ? `<em><i data-lucide="map-pin"></i>${escapeHtml(distance)}</em>` : ""}
                                            <em><i data-lucide="star"></i>${escapeHtml(rating)}</em>
                                            <em><i data-lucide="${openState.isOpen ? "clock" : "moon"}"></i>${escapeHtml(openState.label)}</em>
                                        </span>
                                    </span>
                                    <i data-lucide="chevron-right"></i>
                                </button>
                            `;
                        }).join("")}
                    </div>`;
            panel.classList.remove("hidden");
            updateViciAIBubbleVisibility(false);
            panel.innerHTML = `
                <div class="vici-ai-chat">
                    ${renderViciAIHeader(sourceLabel)}
                    ${renderViciAIThread(intent.query, replyText)}
                    ${picksHtml}
                    ${renderViciAIComposer()}
                </div>
            `;
            window.debouncedIcons?.();
            setTimeout(() => document.getElementById("viciAiChatInput")?.focus(), 50);
            return;
        }

        const visible = recommendations.filter(p => (p._smartScore || 0) > -20).slice(0, 3);
        if (visible.length === 0) {
            panel.classList.remove("hidden");
            panel.innerHTML = `
                <div class="smart-answer-head">
                    <i data-lucide="sparkles"></i>
                    <div><strong>No strong match yet</strong><span>Try widening the radius or using another food/category word.</span></div>
                </div>
            `;
            window.debouncedIcons?.();
            return;
        }

        const catText = intent.matchedCat === "all" ? "nearby places" : intent.matchedCat.replace(/([a-z])([A-Z])/g, "$1 $2");
        panel.classList.remove("hidden");
        panel.innerHTML = `
            <div class="smart-answer-head">
                <i data-lucide="sparkles"></i>
                <div>
                    <strong>Smart picks for ${escapeHtml(catText)}</strong>
                    <span>Ranked by location, ratings, food match, freshness, and availability.</span>
                </div>
                <button type="button" onclick="document.getElementById('smartAnswerPanel')?.classList.add('hidden')" aria-label="Hide smart picks">&times;</button>
            </div>
            <div class="smart-answer-list">
                ${visible.map(place => `
                    <button type="button" class="smart-answer-card" onclick="window.viewPlace('${place.id}')">
                        <span class="smart-answer-score">${Math.max(0, Math.round(place._smartScore || 0))}</span>
                        <span class="smart-answer-main">
                            <strong data-no-translate>${escapeHtml(place.name || "Establishment")}</strong>
                            <small>${escapeHtml((place._smartReasons || ["nearby match"]).join(" • "))}</small>
                        </span>
                        <i data-lucide="chevron-right"></i>
                    </button>
                `).join("")}
            </div>
        `;
        window.debouncedIcons?.();
    }

   function buildPlaceCard(p) {
        // Kalkulahin ang layo (distance) kung naka-on ang location ng user
        const distanceVal = AppState.userLocation.lat ? L.latLng(AppState.userLocation.lat, AppState.userLocation.lng).distanceTo([p.lat, p.lng]) : null;
        const distText = distanceVal ? formatDistance(distanceVal) : '';

        // Ayusin ang status styling
        const openState = getBusinessOpenState(p);
        const statusClass = openState.className;
        const statusText = openState.label;
        const freshness = window.getViciFreshnessStatus?.(p) || { className: "freshness-active", label: "Fresh", shortLabel: "Fresh", tone: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" };
        const showFreshnessBadge = freshness.level && freshness.level !== "active";
        const deliveryParts = [];
        if (p.delivery_grab) deliveryParts.push("Grab/Panda");
        if (p.delivery_inhouse) deliveryParts.push("In-house");
        if (p.delivery_radius) deliveryParts.push(`${escapeHtml(p.delivery_radius)}km radius`);
        const deliverySummaryHtml = deliveryParts.length
            ? `<div class="mec-delivery-summary">${deliveryParts.map(part => `<span class="mec-delivery-chip"><i data-lucide="bike"></i>${part}</span>`).join("")}</div>`
            : "";
        // Place line: never show a raw ID/hash as the address (screenshot: aadcafa56756756)
        const rawPlace = String(p.brgy || p.barangay || p.address || p.addr || "").trim();
        const looksLikeId = /^[a-zA-Z0-9_-]{20,}$/.test(rawPlace) && /[0-9_-]/.test(rawPlace);
        const catCfg = (typeof CAT_CONFIG !== "undefined" && CAT_CONFIG[normalizeCategoryKey(p.cat || p.category || "")]) || (typeof CAT_CONFIG !== "undefined" ? CAT_CONFIG["default"] : null);
        const catLabel = catCfg?.label || String(p.cat || p.category || "Local business").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        const placeLine = (!rawPlace || looksLikeId) ? "Lipa City" : rawPlace;
        const avatarHtml = catCfg ? `<div class="mec-avatar"><i data-lucide="${catCfg.icon}"></i></div>` : "";

        // Ayusin ang rating text
        const ratingHtml = p.avgRating
            ? `<i data-lucide="star" style="width:14px; height:14px; fill:currentColor;"></i> <span>${p.avgRating}</span> <span style="color:#94a3b8; font-weight:normal; font-size:12px;">(${p.reviewCount})</span>`
            : `<i data-lucide="star" style="width:14px; height:14px;"></i> <span style="color:#94a3b8; font-weight:normal; font-size:12px;">No ratings</span>`;

        return `
        <div class="modern-est-card ${freshness.className}">
            <div class="mec-header">
                ${avatarHtml}
                <div class="mec-head-text">
                    <h3 class="mec-title">
                        ${escapeHtml(p.name || "ESTABLISHMENT")}
                        ${p.is_verified ? `<i data-lucide="badge-check" style="width:16px; height:16px; color:var(--ui-accent, #237e72);"></i>` : ''}
                    </h3>
                    <div class="mec-sub"><span class="mec-cat">${escapeHtml(catLabel)}</span><span class="mec-dot-sep">•</span><span>${escapeHtml(placeLine)}</span></div>
                </div>
            </div>

            ${p.suki_enabled ? `<div class="mec-suki-row"><span class="mec-suki-badge"><i data-lucide="stamp"></i> Suki Card Available</span></div>` : ``}
            <div class="mec-status-row">
                <div class="mec-status ${statusClass}">
                    <span class="dot"></span> ${statusText}
                </div>
                ${showFreshnessBadge ? `<div class="vici-freshness-badge ${freshness.className}" title="${escapeHtml(freshness.label)}">
                    <i data-lucide="${freshness.isInactive ? 'pause-circle' : freshness.level === 'active' ? 'check-circle-2' : 'alert-triangle'}"></i>
                    ${escapeHtml(freshness.shortLabel)}
                </div>` : ''}
            </div>
            ${openState.hint ? `<div class="mec-hours-hint"><i data-lucide="clock" style="width:12px; height:12px; vertical-align:-2px;"></i> ${escapeHtml(openState.hint)}</div>` : ''}

            <div class="mec-info-line">
                <span class="mec-rating">${ratingHtml}</span>
                ${distText ? `<span class="mec-info-dist"><i data-lucide="navigation" style="width:12px;height:12px;"></i>${distText} away</span>` : ''}
            </div>

            <!-- 🔥 IDINAGDAG ANG DELIVERY BADGES DITO 🔥 -->
            ${deliverySummaryHtml}

            <div class="mec-actions">
                <button class="mec-btn-view" onclick="window.viewPlace('${p.id}')"><span data-i18n="View">View</span></button>
                <button class="mec-btn-nav" onclick="window.routeToPlace(${p.lat}, ${p.lng})">
                    <i data-lucide="navigation" style="width:14px; height:14px;"></i> <span data-i18n="Navigate">Navigate</span>
                </button>
            </div>
        </div>`;
    }

    async function refreshPlaces() {
        if (!map) return;
        // v53BK #2: no longer clearing all markers — diffAcceptedMarkers handles add/remove/update
        const places = await getAcceptedPlaces();
        const filtered = places.filter(p => {
            const filters = AppState.mapFilters || {};
            const catOk = (AppState.activeCat === "all") || (normalizeCategoryKey(p.cat || p.category) === AppState.activeCat);
            const radOk = withinRadius(p.lat, p.lng);
            let searchOk = true;
            if (AppState.searchQuery) {
                const q = normalizeAskQuery(AppState.searchQuery);
                const words = q.split(" ").filter(w => w.length > 1 && !["in", "sa", "near", "at", "the", "a"].includes(w));
                const searchable = getSmartSearchText(p);
                searchOk = words.every(word => searchable.includes(word));
            }
            const openOk = !filters.openNow || getBusinessOpenState(p).isOpen;
            const verifiedOk = !filters.verified || p.is_verified === true;
            const bookingOk = !filters.booking || p.accepts_booking === true;
            const deliveryOk = !filters.delivery || placeHasDelivery(p);
            const ratingOk = !filters.highRated || Number(p.avgRating || 0) >= 4;
            const freshOk = !filters.freshOnly || ["active", "due"].includes(window.getViciFreshnessStatus?.(p)?.level || "active");
            return catOk && radOk && searchOk && openOk && verifiedOk && bookingOk && deliveryOk && ratingOk && freshOk;
        });

        filtered.forEach(p => {
            if (AppState.userLocation.lat != null && AppState.userLocation.lng != null) {
                p._distance = L.latLng(AppState.userLocation.lat, AppState.userLocation.lng).distanceTo([p.lat, p.lng]);
            } else {
                p._distance = null;
            }
            if (AppState.smartIntent?.query) {
                const scored = scorePlaceForSmartAsk(p, AppState.smartIntent);
                p._smartScore = scored._smartScore;
                p._smartReasons = scored._smartReasons;
                p._freshness = scored._freshness;
            } else {
                p._freshness = window.getViciFreshnessStatus?.(p);
            }
        });

        if (AppState.smartIntent?.query) {
            filtered.sort((a, b) => (b._smartScore || 0) - (a._smartScore || 0));
        } else {
            filtered.sort((a, b) => {
                const aInactive = window.getViciFreshnessStatus?.(a)?.isInactive ? 1 : 0;
                const bInactive = window.getViciFreshnessStatus?.(b)?.isInactive ? 1 : 0;
                if (aInactive !== bInactive) return aInactive - bInactive;
                return (a._distance ?? Infinity) - (b._distance ?? Infinity);
            });
        }

        // v53BK #2: build single marker (used by diffAcceptedMarkers)
        function buildMarker(p, freshness) {
            const config = CAT_CONFIG[p.cat] || CAT_CONFIG["default"];
            const markerColor = "#e1f1e9";

            const staleBadgeHtml = freshness.level && freshness.level !== "active" ? `<div class="vici-stale-badge" title="${escapeHtml(freshness.label || '')}"><i data-lucide="${freshness.isInactive ? 'pause' : 'alert-triangle'}" style="width:10px; height:10px;"></i></div>` : '';

            const customHtml = `
                <div class="vici-marker-wrap ${freshness.className || ''}" style="position:relative;">
                    ${staleBadgeHtml}
                    <div class="vici-marker" style="background-color: ${markerColor}; ${freshness.isInactive ? 'filter:grayscale(1); opacity:.78;' : ''}">
                        <i data-lucide="${config.icon}" style="color: #17633f; width: 18px; height: 18px;"></i>
                        <div class="vici-marker-tail" style="border-top-color: ${markerColor};"></div>
                    </div>
                </div>
            `;

            const customIcon = L.divIcon({ className: 'custom-pin-wrap', html: customHtml, iconSize: [36, 44], iconAnchor: [18, 44], popupAnchor: [0, -46] });
            const m = L.marker([p.lat, p.lng], { icon: customIcon }).addTo(map);
            // v53BK #7: lazy popup — build card HTML only when opened, not for all markers upfront
            m.bindPopup(() => buildPlaceCard(p), { className: "vici-place-popup", maxWidth: 300, minWidth: 240 });
            m.on('popupopen', (e) => {
                try {
                    const popupEl = e.popup?.getElement();
                    if (popupEl && window.lucide) window.lucide.createIcons({ root: popupEl });
                    else window.debouncedIcons?.();
                } catch(err) { window.debouncedIcons?.(); }
            });
            return m;
        }

        // v53BK #2: diff — only add/remove/update changed markers
        diffAcceptedMarkers(filtered, buildMarker);

        window.debouncedIcons?.();

        if (typeof window.renderListView === 'function') {
            window.renderListView(filtered);
        }
    }

    function setUser(lat, lng) {
        AppState.userLocation.lat = lat; AppState.userLocation.lng = lng;
        const pos = [lat, lng];
        if (!userDot) {
            const icon = L.divIcon({ className: "", html: `<div class="user-marker-modern"></div>`, iconSize: [28, 28], iconAnchor: [14, 14] });
            userDot = L.marker(pos, { icon }).addTo(map);
            userDot.bindTooltip("You are here", { permanent: false, direction: "top", offset: [0, -12], className: "vici-here" });
            userDot.on("click", () => { userDot.openTooltip(); setTimeout(() => userDot.closeTooltip(), 1800); });
        } else { userDot.setLatLng(pos); }
        if (!radiusCircle) { radiusCircle = L.circle(pos, { radius: AppState.radius, color: "#3b82f6", weight: 2, fillColor: "#3b82f6", fillOpacity: 0.08, dashArray: "8 8" }).addTo(map); }
        else { radiusCircle.setLatLng(pos); radiusCircle.setRadius(AppState.radius); }
        map.setView(pos, 15);
        refreshPlaces();
    }

    let locationRequest = null;
    function locationNotice(message, state) {
        document.getElementById('locationPermissionNotice')?.remove();
        if(['denied','unsupported','error'].includes(state))window.showToast?.(message,'info');
    }
    function locate() {
        if(locationRequest)return locationRequest;
        if(!navigator.geolocation){locationNotice('Location is not supported in this browser. Use Safari, Chrome or Edge.','unsupported');return Promise.resolve(false);}
        if(!window.isSecureContext){locationNotice('Location requires a secure HTTPS connection.','unsupported');return Promise.resolve(false);}
        locationNotice('Finding your location. Allow access when your browser asks.','loading');
        locationRequest=new Promise(resolve=>navigator.geolocation.getCurrentPosition(pos=>{
            const {latitude,longitude,accuracy}=pos.coords;
            if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180){locationNotice('Could not get a valid location. Please try again.','error');resolve(false);return;}
            AppState.locationFix={timestamp:pos.timestamp || Date.now(),accuracy};
            setUser(latitude,longitude);
            locationNotice(accuracy>200?'Location is approximate. Enable precise location for better nearby results.':'Location ready',accuracy>200?'approximate':'ready');
            setTimeout(()=>map?.invalidateSize(),300);resolve(true);
        },err=>{
            const messages={1:'Location blocked. Open browser site settings and allow Location. On iPhone, also enable Location Services and Precise Location.',2:'Location unavailable. Turn on device Location Services and try again.',3:'Location timed out. Check GPS or move near a window, then retry.'};
            locationNotice(messages[err.code] || 'Could not find your location. Please retry.','error');resolve(false);
        },{enableHighAccuracy:true,timeout:15000,maximumAge:30000})).finally(()=>{locationRequest=null;});
        return locationRequest;
    }

   function initRadius() {
        const segContainer = document.getElementById("radiusSegment");
        if (!segContainer) return;

        const indicator = document.getElementById("radiusIndicator");
        const btns = segContainer.querySelectorAll(".seg");

        function updateIndicator(btn) {
            if (!indicator || !btn) return;
            // Kung nakatago pa ang page, wag muna i-activate ang slider para yung CSS fallback ang gumana
            if (btn.offsetWidth === 0) return;

            // I-activate ang slider at ipwesto
            segContainer.classList.add("slider-active");
            indicator.style.transform = "none";
            indicator.style.width = btn.offsetWidth + "px";
            indicator.style.left = btn.offsetLeft + "px";
        }

        // Set initial state
        setTimeout(() => {
            btns.forEach(b => {
                if (Number(b.dataset.radius) === AppState.radius) {
                    b.classList.add("active");
                    updateIndicator(b);
                } else {
                    b.classList.remove("active");
                }
            });
        }, 100);

        const customForm = document.getElementById('customRadiusForm');
        const customChoice = document.getElementById('customRadiusChoice');
        const customStatus = document.getElementById('customRadiusStatus');
        const slider = document.getElementById('radiusSlider');
        const sliderValue = document.getElementById('radiusSliderValue');
        function showRadius(meters) {
            const km = meters / 1000;
            if(slider) { slider.value = String(km); slider.style.setProperty('--radius-fill', `${(km - 0.1) / 29.9 * 100}%`); }
            if(sliderValue) sliderValue.textContent = `${km} km`;
        }
        showRadius(AppState.radius);
        slider?.addEventListener('input', () => {
            sliderValue.textContent = `${slider.value} km`;
            slider.style.setProperty('--radius-fill', `${(Number(slider.value) - 0.1) / 29.9 * 100}%`);
        });
        slider?.addEventListener('change', () => {
            customChoice.dataset.radius = String(Math.round(Number(slider.value) * 1000));
            customChoice.click();
        });
        // Click Event
        segContainer.addEventListener("click", (e) => {
            const btn = e.target.closest(".seg");
            if (!btn) return;
            const meters = Number(btn.dataset.radius);
            if (!Number.isFinite(meters) || meters < 100 || meters > 30000) return;
            showRadius(meters);
            if(customStatus) customStatus.textContent = `Searching within ${meters / 1000} km`;
            if(customForm) customForm.classList.toggle('is-active', btn === customChoice);
            btns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            updateIndicator(btn); // I-slide ang background

            AppState.radius = Number(btn.dataset.radius);
            if (typeof radiusCircle !== 'undefined' && radiusCircle) {
                radiusCircle.setRadius(AppState.radius);
            }
            if (typeof refreshPlaces === 'function') refreshPlaces();
        });
    }
    function initCats() {
        const chips = document.getElementById("catChips");
        if (!chips) return;
        chips.addEventListener("click", (e) => {
            const btn = e.target.closest(".chip");
            if (!btn) return;
            document.querySelectorAll(".chip").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            AppState.activeCat = btn.dataset.cat || "all";
            refreshPlaces();
        });
    }

    function initSmartFilters() {
        const chips = document.getElementById("catChips");
        if (!chips || document.getElementById("mapSmartFilters")) return;

        if (!AppState.mapFilters) {
            AppState.mapFilters = {
                openNow: false,
                verified: false,
                booking: false,
                delivery: false,
                highRated: false,
                freshOnly: false
            };
        }

        const filters = [
            { key: "openNow", label: "Open now", icon: "clock" },
            { key: "verified", label: "Verified", icon: "badge-check" },
            { key: "booking", label: "Bookable", icon: "calendar-check" },
            { key: "delivery", label: "Delivery", icon: "bike" },
            { key: "highRated", label: "4+ Rating", icon: "star" },
            { key: "freshOnly", label: "Fresh info", icon: "check-circle-2" }
        ];

        const toggleBtn = document.createElement("button");
        toggleBtn.id = "mapFilterToggle";
        toggleBtn.className = "map-filter-toggle";
        toggleBtn.type = "button";
        toggleBtn.setAttribute("aria-expanded", "false");
        toggleBtn.setAttribute("aria-controls", "mapSmartFilters");
        toggleBtn.innerHTML = `<i data-lucide="sliders-horizontal"></i><span>More filters</span><b id="mapFilterCount" class="hidden">0</b>`;
        chips.insertAdjacentElement("afterend", toggleBtn);

        const row = document.createElement("div");
        row.id = "mapSmartFilters";
        row.className = "map-smart-filters";
        row.innerHTML = filters.map(filter => `
            <button type="button" class="map-smart-filter" data-filter="${filter.key}" aria-pressed="false">
                <i data-lucide="${filter.icon}"></i><span>${filter.label}</span>
            </button>
        `).join("");

        toggleBtn.insertAdjacentElement("afterend", row);
        row.querySelectorAll(".map-smart-filter").forEach(btn => {
            const isActive = !!AppState.mapFilters?.[btn.dataset.filter];
            btn.classList.toggle("active", isActive);
            btn.setAttribute("aria-pressed", String(isActive));
        });

        function syncFilterToggle() {
            const expanded = row.classList.contains("open");
            toggleBtn.querySelector("span").textContent = expanded ? "Show less" : "More filters";
            toggleBtn.setAttribute("aria-label", expanded ? "Hide additional filters" : "Show additional filters");
            const count = Object.values(AppState.mapFilters || {}).filter(Boolean).length;
            const badge = document.getElementById("mapFilterCount");
            if (badge) {
                badge.textContent = String(count);
                badge.classList.toggle("hidden", count === 0);
            }
            toggleBtn.classList.toggle("active", count > 0 || row.classList.contains("open"));
        }

        toggleBtn.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            row.classList.toggle("open");
            toggleBtn.setAttribute("aria-expanded", String(row.classList.contains("open")));
            syncFilterToggle();
            window.debouncedIcons?.();
        });

        row.addEventListener("click", (event) => {
            const btn = event.target.closest(".map-smart-filter");
            if (!btn) return;

            const key = btn.dataset.filter;
            AppState.mapFilters[key] = !AppState.mapFilters[key];
            btn.classList.toggle("active", AppState.mapFilters[key]);
            btn.setAttribute("aria-pressed", String(AppState.mapFilters[key]));
            syncFilterToggle();
            refreshPlaces();
        });

        syncFilterToggle();
        window.debouncedIcons?.();
    }

    // ---- Base map: ORIGINAL OSM look (kanina), with auto-fallback if OSM blocks the app ----
    // OSM volunteer tiles sometimes serve "403 Access blocked" to apps/domains.
    // If that happens here, we switch once to the OSM Germany mirror (same OSM style/data, no key, no watermark), then Esri.
    let baseLayer = null, baseStage = 0, baseTileErrors = 0;
    // Primary is the OSM Germany mirror: SAME OpenStreetMap look as kanina, but its
    // servers don't serve the 403 "Access blocked" tile that std OSM gives this domain
    // (screenshot 2026-10-03). Std OSM stays as 2nd fallback, Esri last.
    const BASE_PROVIDERS = [
        { url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png', subdomains: ['tile.openstreetmap.de'], maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' },
        { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', subdomains: 'abc', maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' },
        { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', subdomains: [], maxZoom: 19, attribution: 'Tiles &copy; Esri, OpenStreetMap contributors' }
    ];
    function createBaseLayer() {
        const prov = BASE_PROVIDERS[Math.min(baseStage, BASE_PROVIDERS.length - 1)];
        const layer = L.tileLayer(prov.url, { maxZoom: prov.maxZoom, subdomains: prov.subdomains, attribution: prov.attribution });
        layer.on('tileerror', () => {
            baseTileErrors++;
            if (baseTileErrors >= 6 && baseStage < BASE_PROVIDERS.length - 1 && map) {
                baseStage++; baseTileErrors = 0;
                try { map.removeLayer(layer); } catch(e) {}
                baseLayer = createBaseLayer().addTo(map);
                console.warn('Base tiles blocked/failed, switched to fallback provider', baseStage);
            }
        });
        layer.on('tileload', () => { baseTileErrors = Math.max(0, baseTileErrors - 1); });
        return layer;
    }
    function applyBaseTheme() { /* OSM has no dark tiles: dark is handled by a CSS filter on the tile pane (see style.css v7). Nothing to swap here. */ }

    function initMap() {
        if (typeof L === 'undefined') { setTimeout(initMap, 400); return; }
        if (map) { applyBaseTheme(); setTimeout(() => map.invalidateSize(), 200); return; }
        map = L.map("map", { zoomControl: true }).setView([13.9417, 121.1678], 14);
        baseLayer = createBaseLayer().addTo(map);
        setTimeout(() => map.invalidateSize(), 300);
        setTimeout(() => map.invalidateSize(), 900);
        if (AppState.userLocation.lat != null && AppState.userLocation.lng != null) setUser(AppState.userLocation.lat, AppState.userLocation.lng);
        else locate();
    }

    function refresh() { if (map) { applyBaseTheme(); setTimeout(() => map.invalidateSize(), 200); setTimeout(() => map.invalidateSize(), 600); refreshPlaces(); } else { initMap(); } }

    // ---- Navigation v12: smooth fly, live follow, custom UI ----
    let navWatchId = null, navOverlay = null, navRoute = null, navDest = null, navZoomed = false;
    let navVoiceEnabled = true, navAnnouncedIdx = -1, navArrivalAnnounced = false;
    let navSpeechRouteKey=null,navSessionStarted=false;
    const navSpokenManeuvers=new Set();
    let navGeneration=0, navStartTimer=null, navPending=false, navLastFollow=null;
    const navRouteCache=new Map();
    function navigationRouter(){
        if(typeof L.Routing.osrmv1!=='function')return undefined;
        const router=L.Routing.osrmv1({timeout:10000}), route=router.route.bind(router);
        router.route=function(waypoints,callback,context,options){
            const key=waypoints.map(w=>Number(w.latLng.lat).toFixed(4)+','+Number(w.latLng.lng).toFixed(4)).join('|');
            const hit=navRouteCache.get(key);
            if(hit&&Date.now()-hit.at<120000){queueMicrotask(()=>callback.call(context,null,hit.routes));return;}
            return route(waypoints,function(error,routes){
                if(!error&&routes?.length){navRouteCache.set(key,{at:Date.now(),routes});while(navRouteCache.size>8)navRouteCache.delete(navRouteCache.keys().next().value);}
                callback.call(context,error,routes);
            },context,options);
        };
        return router;
    }

    // v53BC/BF: Voice navigation guidance (Web Speech API) — picks best voice
    let navBestVoice = null;
    function pickNavVoice() {
        try {
            if (!("speechSynthesis" in window)) return null;
            const voices = window.speechSynthesis.getVoices();
            if (!voices || !voices.length) return null;
            // Prefer high-quality natural voices (Google, Microsoft, Apple)
            const prefer = ["Google US English", "Google UK English Female", "Microsoft Zira", "Microsoft Aria",
                            "Samantha", "Google", "Zira", "Aria", "Jenny", "Natural"];
            for (const p of prefer) {
                const v = voices.find(v => v.name.includes(p) && v.lang.startsWith("en"));
                if (v) return v;
            }
            // Fallback: any English female-sounding voice, then any English
            const enFemale = voices.find(v => v.lang.startsWith("en") && /female|zira|aria|samantha|jenny|google uk/i.test(v.name));
            if (enFemale) return enFemale;
            return voices.find(v => v.lang.startsWith("en")) || voices[0];
        } catch (e) { return null; }
    }
    // Voices load async — refresh when available
    try {
        if ("speechSynthesis" in window) {
            window.speechSynthesis.onvoiceschanged = () => { navBestVoice = pickNavVoice(); };
            navBestVoice = pickNavVoice();
        }
    } catch (e) {}
    function navSpeak(text) {
        if (!navVoiceEnabled) return;
        try {
            if (!("speechSynthesis" in window)) return;
            window.speechSynthesis.cancel();
            const translated=window.LangManager?.translateKey?.(text)||text;
            const tagalog=window.LangManager?.getLanguage?.()==='ph';
            const u = new SpeechSynthesisUtterance(translated);
            if (!navBestVoice) navBestVoice = pickNavVoice();
            if (tagalog){const voice=window.speechSynthesis.getVoices().find(v=>/^(tl|fil)/i.test(v.lang));if(voice)u.voice=voice;}else if(navBestVoice)u.voice=navBestVoice;
            u.lang = tagalog?'fil-PH':'en-US';
            u.rate = 0.95;   // slightly slower = clearer
            u.pitch = 1.05;  // slightly warmer
            u.volume = 1.0;
            window.speechSynthesis.speak(u);
        } catch (e) {}
    }
    function navDistM(lat1, lng1, lat2, lng2) {
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
        return 2 * R * Math.asin(Math.sqrt(a));
    }
    function navManeuverKey(ins,index) {
        const coord=navRoute?.coordinates?.[ins.index];
        return String(ins.text||'').trim().toLowerCase()+'@'+(coord?Number(coord.lat).toFixed(5)+','+Number(coord.lng).toFixed(5):index);
    }
    // Check upcoming maneuver and announce if close
    function checkNavVoice(lat, lng) {
        if (!navVoiceEnabled || !navRoute?.coordinates?.length || navArrivalAnnounced) return;
        if(navDest&&navDistM(lat,lng,navDest.lat,navDest.lng)<30){
            navArrivalAnnounced=true;
            navSpeak('You have arrived at your destination.');
            try { window.NavSound?.success(); } catch(e) {}
            return;
        }
        if(!navRoute.instructions?.length)return;
        const instrs = navRoute.instructions;
        const coords = navRoute.coordinates;
        // Find next unannounced instruction
        for (let i = navAnnouncedIdx + 1; i < instrs.length; i++) {
            const ins = instrs[i];
            const key=navManeuverKey(ins,i);
            if(navSpokenManeuvers.has(key)){navAnnouncedIdx=i;continue;}
            // Estimate maneuver position: use index if available, else distribute
            let mLat, mLng;
            if (ins.index != null && coords[ins.index]) {
                mLat = coords[ins.index].lat; mLng = coords[ins.index].lng;
            } else {
                // Fallback: cumulative distance proportion
                const totalDist = navRoute.summary?.totalDistance || 1;
                let cumDist = 0;
                for (let j = 0; j <= i && j < instrs.length; j++) cumDist += instrs[j].distance || 0;
                const frac = Math.min(0.99, cumDist / totalDist);
                const cIdx = Math.floor(frac * (coords.length - 1));
                mLat = coords[cIdx].lat; mLng = coords[cIdx].lng;
            }
            const d = navDistM(lat, lng, mLat, mLng);
            if (d < 150) {
                navAnnouncedIdx = i;
                navSpokenManeuvers.add(key);
                // v53BG: natural phrasing — "In 100 meters, turn left"
                let action = (ins.text || "continue straight").trim();
                action = action.charAt(0).toLowerCase() + action.slice(1);
                const phrase = d < 50 ? `${action} now` : `In ${fmtDistSpoken(d)}, ${action}`;
                navSpeak(phrase.charAt(0).toUpperCase() + phrase.slice(1));
                try { window.NavSound?.action(); } catch (e) {}
                break;
            }
            // Only check the next one
            break;
        }
    }
    function ensureNavUI() {
        document.body.classList.add("nav-active");
        setTimeout(() => { if (map) map.invalidateSize(); }, 250);
        const mapEl = document.getElementById("map");
        if (!mapEl || document.getElementById("navCard")) return;
        const ui = document.createElement("div");
        ui.id = "navUI";
        ui.innerHTML = `
          <div id="navCard" class="nav-card">
            <div class="nav-card-icon"><i data-lucide="navigation"></i></div>
            <div class="nav-card-main">
              <div class="nav-card-title">Navigating to destination</div>
              <div id="navSummary" class="nav-card-sub">Finding best route…</div>
            </div>
            <button type="button" id="navOverviewBtn" class="nav-chip-btn" aria-label="Show whole route"><i data-lucide="route"></i></button>
          </div>
          <div id="navSteps" class="nav-steps hidden"></div>
          <div class="nav-bottom">
            <button type="button" id="navStepsBtn" class="nav-action"><i data-lucide="list"></i> Steps</button>
            <button type="button" id="navRecenterBtn" class="nav-action"><i data-lucide="locate-fixed"></i> Recenter</button>
            <button type="button" id="navVoiceBtn" class="nav-action"><i data-lucide="volume-2"></i> Voice</button>
            <button type="button" id="cancelNavBtn" class="nav-action danger"><i data-lucide="square"></i> Stop</button>
          </div>`;
        mapEl.appendChild(ui);
        document.getElementById("cancelNavBtn").onclick = window.cancelNavigation;
        document.getElementById("navRecenterBtn").onclick = () => {
            if (AppState.userLocation?.lat != null) map.flyTo([AppState.userLocation.lat, AppState.userLocation.lng], 17, { duration: 1.1 });
        };
        document.getElementById("navOverviewBtn").onclick = () => {
            if (navRoute?.coordinates?.length) map.flyToBounds(L.latLngBounds(navRoute.coordinates), { padding: [50, 50], duration: 1.1 });
        };
        document.getElementById("navStepsBtn").onclick = () => document.getElementById("navSteps")?.classList.toggle("hidden");
        const voiceBtn = document.getElementById("navVoiceBtn");
        if (voiceBtn) {
            const updateVoiceBtn = () => {
                voiceBtn.innerHTML = `<i data-lucide="${navVoiceEnabled ? "volume-2" : "volume-x"}"></i> Voice`;
                voiceBtn.style.opacity = navVoiceEnabled ? "1" : "0.5";
                window.debouncedIcons?.();
            };
            voiceBtn.onclick = () => {
                navVoiceEnabled = !navVoiceEnabled;
                if (!navVoiceEnabled) { try { window.speechSynthesis?.cancel(); } catch (e) {} }
                else { navSpeak("Voice guidance on."); }
                updateVoiceBtn();
            };
            updateVoiceBtn();
        }
        window.debouncedIcons?.();
    }
    function removeNavUI() {
        document.getElementById("navUI")?.remove();
        document.body.classList.remove("nav-active");
        setTimeout(() => { if (map) map.invalidateSize(); }, 250);
    }
    function fmtDist(m) { return m >= 1000 ? (m / 1000).toFixed(1) + " km" : Math.round(m) + " m"; }
    // v53BE: full words for voice ("150 meters", "1.5 kilometers")
    function fmtDistSpoken(m) {
        if (m >= 1000) {
            const km = (m / 1000).toFixed(1);
            return km === "1.0" ? "1 kilometer" : km + " kilometers";
        }
        const meters = Math.round(m);
        return meters === 1 ? "1 meter" : meters + " meters";
    }
    function fmtTime(s) { const m = Math.round(s / 60); return m >= 60 ? Math.floor(m / 60) + " hr " + (m % 60) + " min" : m + " min"; }

    window.cancelNavigation = function() {
        navGeneration++; navPending=false; clearTimeout(navStartTimer); navStartTimer=null; navLastFollow=null;
        if (routingControl) { try { map.removeControl(routingControl); } catch (e) {} routingControl = null; }
        if (navOverlay) { try { map.removeLayer(navOverlay); } catch (e) {} navOverlay = null; }
        if (navWatchId != null && navigator.geolocation) { navigator.geolocation.clearWatch(navWatchId); navWatchId = null; }
        navRoute = null; navDest = null; navZoomed = false;
        navAnnouncedIdx = -1; navArrivalAnnounced = false;
        navSpeechRouteKey=null;navSessionStarted=false;navSpokenManeuvers.clear();
        try { window.speechSynthesis?.cancel(); } catch (e) {}
        removeNavUI();
        const oldBtn = document.getElementById("cancelNavBtn"); if (oldBtn) oldBtn.style.display = "none";
        if (map && AppState.userLocation?.lat != null) map.flyTo([AppState.userLocation.lat, AppState.userLocation.lng], 15, { duration: 1.0 });
        if (window.showToast) window.showToast("Navigation stopped.", "info");
    };

    window.routeToPlace = function (destLat, destLng, destName) {
        destLat=Number(destLat);destLng=Number(destLng);
        if(!Number.isFinite(destLat)||!Number.isFinite(destLng)||Math.abs(destLat)>90||Math.abs(destLng)>180)return;
        if(navDest?.lat===destLat&&navDest?.lng===destLng&&(navPending||navRoute))return;
        if (!AppState.userLocation || AppState.userLocation.lat == null || AppState.userLocation.lng == null) {
            window.showToast("We need your location to start navigation.", "error");
            locate().then(ok=>{if(ok)window.routeToPlace(destLat,destLng,destName);});
            return;
        }
        if (typeof L.Routing === "undefined") {
            window.showToast("Navigation is still loading. Check your connection.", "info");
            return;
        }
        if (routingControl) { try { map.removeControl(routingControl); } catch (e) {} routingControl = null; }
        if (navOverlay) { try { map.removeLayer(navOverlay); } catch (e) {} navOverlay = null; }
        const ticket=++navGeneration;clearTimeout(navStartTimer);navPending=true;navRoute=null;navLastFollow=null;
        navDest = {lat:destLat,lng:destLng}; navZoomed = false;
        navSpeechRouteKey=null;navSessionStarted=false;navSpokenManeuvers.clear();navAnnouncedIdx=-1;navArrivalAnnounced=false;
        map?.stop?.();

        if (typeof showPage === "function") showPage("page-map");

        ensureNavUI();
        navStartTimer=setTimeout(() => {
            navStartTimer=null;
            if(ticket!==navGeneration)return;
            if(!map){navPending=false;return;}
            map.invalidateSize();
            ensureNavUI();
            const title = document.querySelector("#navCard .nav-card-title");
            if (title && destName) title.textContent = "Navigating to " + destName;

            const router=navigationRouter();
            routingControl = L.Routing.control({
                ...(router?{router}:{}),
                waypoints: [
                    L.latLng(AppState.userLocation.lat, AppState.userLocation.lng),
                    L.latLng(destLat, destLng)
                ],
                routeWhileDragging: false,
                showAlternatives: false,
                show: false, // default itinerary panel hidden - we render our own nav card/steps
                fitSelectedRoutes: false, // we do the smooth flyTo ourselves
                lineOptions: {
                    styles: [
                        { color: "#ffffff", opacity: 0.95, weight: 10 },
                        { color: "#2563eb", opacity: 1, weight: 6 }
                    ]
                },
                createMarker: function () { return null; },
                addWaypoints: false,
                draggableWaypoints: false
            }).addTo(map);

            routingControl.on("routesfound", function (e) {
                if(ticket!==navGeneration)return;
                navPending=false;
                navRoute = e.routes && e.routes[0];
                if (!navRoute) return;
                const s = navRoute.summary || {};
                const sum = document.getElementById("navSummary");
                if (sum) sum.textContent = fmtDist(s.totalDistance || 0) + "  ·  about " + fmtTime(s.totalTime || 0);

                // Steps list
                const stepsEl = document.getElementById("navSteps");
                if (stepsEl && navRoute.instructions) {
                    // v53BD: tap a step to hear it spoken
                    window.navSpeakStep = function(idx) {
                        const ins = navRoute?.instructions?.[idx];
                        if (!ins) return;
                        try { window.NavSound?.action(); } catch (e) {}
                        let ta = (ins.text || "continue straight").trim();
                        ta = ta.charAt(0).toLowerCase() + ta.slice(1);
                        const tp = `In ${fmtDistSpoken(ins.distance || 0)}, ${ta}`;
                        navSpeak(tp.charAt(0).toUpperCase() + tp.slice(1) + ".");
                    };
                    stepsEl.innerHTML = navRoute.instructions.map((ins, idx) =>
                        `<div class="nav-step" onclick="window.navSpeakStep(${idx})" style="cursor:pointer;" title="Tap to hear">
                            <span>${escapeHtml(ins.text || "")}</span><b>${fmtDist(ins.distance || 0)}</b>
                            <i data-lucide="volume-2" style="width:14px; height:14px; opacity:0.5; flex-shrink:0;"></i>
                        </div>`
                    ).join("");
                    window.debouncedIcons?.();
                }
                const speechKey=JSON.stringify((navRoute.instructions||[]).map((ins,index)=>navManeuverKey(ins,index)));
                if(speechKey!==navSpeechRouteKey){navAnnouncedIdx=-1;navSpeechRouteKey=speechKey;}
                if(!navSessionStarted && navRoute.instructions?.length){
                    navSessionStarted=true;
                    const first=navRoute.instructions[0];
                    navSpokenManeuvers.add(navManeuverKey(first,0));navAnnouncedIdx=0;
                    const action=(first.text||'follow the route').trim();
                    navSpeak('Starting navigation. First, '+action.charAt(0).toLowerCase()+action.slice(1)+'.');
                    try { window.NavSound?.action(); } catch(e) {}
                }
                // One short route overview avoids competing zoom animations on phones.
                if (!navZoomed && navRoute.coordinates?.length) {
                    navZoomed = true;
                    map.stop?.();
                    map.fitBounds(L.latLngBounds(navRoute.coordinates), { padding: [45, 65], animate:false });
                }
            });
            routingControl.on("routingerror", function () {
                if(ticket!==navGeneration)return;
                navPending=false;navRoute=null;
                const sum = document.getElementById("navSummary");
                if (sum) sum.textContent = "Could not find a route. Check connection.";
            });

            // Live follow while navigating
            if (navigator.geolocation && navWatchId == null) {
                navWatchId = navigator.geolocation.watchPosition(pos => {
                    const lat = pos.coords.latitude, lng = pos.coords.longitude;
                    if(!Number.isFinite(lat)||!Number.isFinite(lng)||!navDest)return;
                    AppState.userLocation.lat = lat; AppState.userLocation.lng = lng;
                    AppState.locationFix={timestamp:pos.timestamp||Date.now(),accuracy:pos.coords.accuracy};
                    const now=Date.now();
                    if(navLastFollow&&(now-navLastFollow.at<1000||navDistM(lat,lng,navLastFollow.lat,navLastFollow.lng)<5))return;
                    navLastFollow={lat,lng,at:now};
                    if (userDot) userDot.setLatLng([lat, lng]);
                    if (radiusCircle) radiusCircle.setLatLng([lat, lng]);
                    if (navDest&&navRoute) map.panTo([lat, lng], { animate: false });
                    // v53BC: voice guidance for upcoming turns
                    if (navDest) checkNavVoice(lat, lng);
                }, () => {}, { enableHighAccuracy: true, maximumAge: 3000 });
            }
        }, 0);
    };

    // v53BA: show user message + typing indicator immediately (no more "disappearing" feeling)
    function showViciAITyping(query) {
        const panel = document.getElementById("smartAnswerPanel");
        if (!panel) return;
        panel.classList.remove("hidden");
        updateViciAIBubbleVisibility(false);
        const safeQuery = escapeHtml(query || "");
        const typingHtml = `
                <div class="vici-ai-chat">
                    ${renderViciAIHeader("Vici AI")}
                    <div class="vici-ai-thread">
                        ${safeQuery ? `<div class="vici-ai-bubble user">${safeQuery}</div>` : ""}
                        <div class="vici-ai-bubble ai vici-ai-typing" id="viciAiTyping">
                            <span class="vici-ai-bubble-icon"><i data-lucide="sparkles"></i></span>
                            <span class="typing-dots"><i></i><i></i><i></i></span>
                        </div>
                    </div>
                    ${renderViciAIComposer()}
                </div>`;
        panel.innerHTML = typingHtml;
        window.debouncedIcons?.();
        const thread = panel.querySelector(".vici-ai-thread");
        if (thread) thread.scrollTop = thread.scrollHeight;
    }

    function searchPlaces() {
        const input=document.getElementById('askInput');if(!input)return;
        AppState.searchQuery=input.value.trim();AppState.smartIntent=null;
        document.querySelector('.ai-suggestions')?.classList.remove('show');
        refreshPlaces();
    }

    async function processAISearch(options = {}) {
        if (options?.preventDefault) options = {};
        const inputEl = document.getElementById("askInput");
        const btnEl = document.getElementById("askBtn");
        if (!inputEl || !btnEl) return;

        const query = inputEl.value.trim();
        if (window.ViciChat && query) {
            const submitted = await window.ViciChat.send(query);
            if (submitted !== false && inputEl.value.trim() === query) inputEl.value = "";
            return;
        }

        const suggDropdown = document.querySelector('.ai-suggestions');
        if (suggDropdown) suggDropdown.classList.remove('show');

        if (!query) {
            AppState.searchQuery = "";
            AppState.activeCat = "all";
            AppState.smartIntent = null;
            renderSmartAnswer(null, []);
            document.querySelectorAll("#catChips .chip").forEach(b => b.classList.remove("active"));
            document.querySelector("#catChips .chip[data-cat='all']")?.classList.add("active");
            refreshPlaces();
            return;
        }

        const originalIcon = btnEl.innerHTML;
        btnEl.innerHTML = `<i data-lucide="loader-2" class="animate-spin" style="width:20px; height:20px;"></i>`;
        btnEl.disabled = true;
        window.debouncedIcons?.();

        // v53BA: show user message + typing indicator immediately
        if (options.showAI) showViciAITyping(query);

        const intent = inferSmartIntent(query);
        const matchedCat = intent.matchedCat;
        const recommendations = getSmartRecommendations(intent);

        AppState.activeCat = matchedCat;
        AppState.searchQuery = intent.textFilter || "";
        AppState.smartIntent = intent;

        document.querySelectorAll("#catChips .chip").forEach(b => {
            b.classList.remove("active");
            if ((b.dataset.cat || "all") === matchedCat) {
                b.classList.add("active");
                b.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        });

        const panel = document.getElementById("smartAnswerPanel");
        const aiPanelIsOpen = panel && !panel.classList.contains("hidden");
        const shouldRenderAI = Boolean(options.showAI || options.openAI || aiPanelIsOpen);

        if (shouldRenderAI) {
            const aiReply = await getViciAIReply(intent, recommendations);
            renderSmartAnswer(intent, recommendations, aiReply);
            // Clear the map search box after the AI answer renders —
            // the query lives in the chat panel now (avoids "hello" pollution).
            try { if (options.showAI) inputEl.value = ""; } catch (e) {}
        } else {
            updateViciAIBubbleVisibility(true);
        }
        refreshPlaces();
        inputEl.blur();

        btnEl.innerHTML = originalIcon;
        btnEl.disabled = false;
        window.debouncedIcons?.();
    }

    window.viciAskQuick = function(query) {
        if (window.ViciChat) { window.ViciChat.send(query); return; }
        const inputEl = document.getElementById("askInput");
        if (!inputEl) return;
        inputEl.value = query || "";
        processAISearch({ showAI: true });
    };

    window.viciSubmitChat = function(event) {
        event?.preventDefault?.();
        if (window.ViciChat) { window.ViciChat.send(document.getElementById("viciAiChatInput")?.value); return; }
        const chatInput = document.getElementById("viciAiChatInput");
        const askInput = document.getElementById("askInput");
        const query = (chatInput?.value || "").trim();
        if (!query || !askInput) return;
        try { window.NavSound?.action(); } catch (e) {}
        askInput.value = query;
        processAISearch({ showAI: true });
    };

    function initAISuggestions() {
        const askBar = document.querySelector('.askBar');
        const askInput = document.getElementById("askInput");
        if (!askBar || !askInput) return;
        const removeAISuggestions = () => document.querySelectorAll(".ai-suggestions").forEach(el => el.remove());
        const hideEmptySearchPanels = () => {
            removeAISuggestions();
            if (!askInput.value.trim()) {
                document.getElementById("smartAnswerPanel")?.classList.add("hidden");
            }
        };
        removeAISuggestions();
        askInput.addEventListener("focus", () => {
            hideEmptySearchPanels();
            setTimeout(hideEmptySearchPanels, 30);
        });
        askInput.addEventListener("input", hideEmptySearchPanels);
        askInput.addEventListener("click", () => setTimeout(hideEmptySearchPanels, 30));
        return;

        const sampleQueries = [
            "Where is cheap food nearby?",
            "Recommend open cafe near me",
            "Best milk tea with good reviews",
            "Verified delivery food nearby",
            "Updated active businesses this week"
        ];

        const suggDiv = document.createElement('div');
        suggDiv.className = 'ai-suggestions';

        // Added .text-truncate structure to prevent horizontal spill out
        suggDiv.innerHTML = `
            <div class="ai-sugg-header">Try asking</div>
            ${sampleQueries.map(q => `<div class="ai-sugg-item"><span class="arrow">→</span> <span class="text-truncate">${q}</span></div>`).join('')}
        `;
        askBar.appendChild(suggDiv);

        askInput.addEventListener('focus', () => {
            if (!askInput.value.trim()) suggDiv.classList.add('show');
        });

        askInput.addEventListener('input', () => {
            if (askInput.value.trim()) suggDiv.classList.remove('show');
            else suggDiv.classList.add('show');
        });

        document.addEventListener('click', (e) => {
            if (!askBar.contains(e.target)) suggDiv.classList.remove('show');
        });

        suggDiv.querySelectorAll('.ai-sugg-item').forEach(item => {
            item.addEventListener('click', () => {
                const text = item.textContent.replace('→', '').trim();
                askInput.value = text;
                suggDiv.classList.remove('show');
                processAISearch();
            });
        });
    }

    window.closePlaceReviews = function() {
        const section = document.getElementById("placeReviewsSection");
        if (!section) return;
        section.classList.add("hidden");
        section.classList.remove("review-panel-open", "review-jump-focus");
        section.setAttribute("aria-hidden", "true");
    };

    window.scrollPlaceReviews = function(placeId) {
        const section = document.getElementById("placeReviewsSection");
        const list = document.getElementById("publicReviewsList");
        const targetPlaceId = placeId || section?.dataset.placeId || window.currentPlaceReviewId;
        if (!section) return;

        section.classList.remove("hidden");
        section.classList.add("review-panel-open", "review-jump-focus");
        section.setAttribute("aria-hidden", "false");

        if (list && targetPlaceId && list.dataset.loadedFor !== targetPlaceId && list.dataset.loading !== "true") {
            loadPlacePublicReviews(targetPlaceId);
        }

        setTimeout(() => section.classList.remove("review-jump-focus"), 900);
    };

    window.viewPlace = async function (id, options = {}) {
        let p = cloudPlaces.find(x => x.id === id);
        if (!p && window.db) {
            try {
                const placeDoc = await window.db.collection("places").doc(id).get();
                if (placeDoc.exists) {
                    p = normalizePlace({ ...placeDoc.data(), id: placeDoc.id });
                    cloudPlaces = [p, ...cloudPlaces.filter(place => place.id !== p.id)];
                }
            } catch (e) {
                console.error("Error loading place details:", e);
            }
        }

        if (!p) return window.showToast?.("Unable to load this establishment.", "error");

        let userRating = 0;
        let isFavorited = false;

        // v53BH: parallel reads (was sequential — 2x round trips)
        if (window.auth?.currentUser) {
            const uid = window.auth.currentUser.uid;
            try {
                const [revDoc, favDoc] = await Promise.all([
                    window.db.collection("reviews").doc(`${uid}_${id}`).get().catch(()=>null),
                    window.db.collection("favorites").doc(`${uid}_${id}`).get()
                ]);
                if (revDoc?.exists) userRating = revDoc.data().rating;
                else {const legacy=await window.db.collection('reviews').where('userId','==',uid).where('placeId','==',id).limit(1).get().catch(()=>null);if(legacy&&!legacy.empty)userRating=legacy.docs[0].data().rating;}
                if (favDoc.exists) isFavorited = true;
            } catch (e) { console.error("Error fetching data:", e); }
        }

        const wrap = document.getElementById("placeViewContent");
        const safeName = safeString(p.name);
        const user = window.auth?.currentUser;
        const isOwnerOrAdmin = canManagePlaceData(p, user);
        const isOwnPlaceView = !!user && !!p.owner_uid && p.owner_uid === user.uid;
        window.currentPlaceReviewId = p.id;
        const openState = getBusinessOpenState(p);
        const freshness = window.getViciFreshnessStatus?.(p) || { className: "freshness-active", label: "Fresh", shortLabel: "Fresh", tone: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" };
        const statusBadgeStyle = openState.className === "open"
            ? "background:#dcfce7; color:#166534;"
            : openState.className === "busy"
                ? "background:#fef3c7; color:#92400e;"
                : "background:#f1f5f9; color:#475569;";

        let finalCoverImg = p.coverPhoto ? p.coverPhoto : (p.photos && p.photos.length > 0 ? p.photos[0] : null);
        finalCoverImg = getSafeImageUrl(finalCoverImg);

        const coverStyle = finalCoverImg
            ? `background: linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0) 100%), url("${finalCoverImg}") center/cover no-repeat;`
            : `background: linear-gradient(120deg, #dceee5 0%, #edf5f0 55%, #c9e3d7 100%);`;
        const logoUrl = getSafeImageUrl(p.logoUrl || p.logoURL || p.logo || p.brandLogo || p.brand_logo || p.profileLogo || p.avatarUrl);
        const placeInitial = escapeHtml((p.name || "V").charAt(0).toUpperCase());
        const brandLogoHtml = logoUrl
            ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(p.name || "Business")} logo" loading="lazy" onerror="this.remove()" /><span>${placeInitial}</span>`
            : `<span>${placeInitial}</span>`;

        let adminPostBtnHtml = "";

        const trustActionsHtml = !isOwnerOrAdmin ? `
            <div class="place-trust-actions">
                <button onclick="window.openClaimBusiness('${p.id}', '${safeName}')" style="flex:1; min-width:150px; border:1px solid #bfdbfe; background:#eff6ff; color:#1d4ed8; border-radius:12px; padding:11px 12px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                    <i data-lucide="store" style="width:16px;"></i> ${p.owner_uid ? "Request Access" : "Claim Business"}
                </button>
                <button onclick="window.openPlaceReportModal('${p.id}', '${safeName}')" style="flex:1; min-width:150px; border:1px solid #fed7aa; background:#fff7ed; color:#9a3412; border-radius:12px; padding:11px 12px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                    <i data-lucide="flag" style="width:16px;"></i> Report Info
                </button>
            </div>
        ` : "";

        const rawPlaceAddr = String(p.address || p.brgy || p.addr || "").trim();
        const placeAddrText = (!rawPlaceAddr || (/^[a-zA-Z0-9_-]{20,}$/.test(rawPlaceAddr) && /[0-9_-]/.test(rawPlaceAddr)) || rawPlaceAddr.toLowerCase() === "address") ? "Lipa City" : rawPlaceAddr;
        wrap.classList.add("place-detail-shell");
        wrap.innerHTML = `
            <div class="placeCover ${finalCoverImg ? 'has-cover' : 'no-cover'}" style="${coverStyle}">
                <div class="placeTopBar">
                    <button class="circleBackBtn" aria-label="Back to map" onclick="showPage('page-map')"><i data-lucide="arrow-left"></i></button>

                    <div style="display: flex; gap: 10px; align-items: center;">


                        ${!isOwnPlaceView ? `<button id="favBtn_${p.id}" class="btn-fav ${isFavorited ? 'active' : ''}" aria-pressed="${isFavorited}" aria-label="${isFavorited ? 'Remove from favorites' : 'Save establishment'}" onclick="window.toggleFavorite('${p.id}', this)">
                            <i data-lucide="heart" style="${isFavorited ? 'fill: currentColor;' : ''}"></i>
                        </button>` : ''}
                    </div>
                </div>
                <div class="placeCoverBrand">
                    <div class="placeBrandLogo">${brandLogoHtml}</div>
                    <div class="placeBrandText">
                        <h1 data-no-translate>${escapeHtml(p.name)}</h1>
                        <span>${escapeHtml(p.cat || p.category || "Establishment")}</span>
                    </div>
                </div>
            </div>
            <div class="placeDetailsCard place-polished-details">
                <section class="placeProfilePanel">
                <div class="placeHeaderRow place-profile-head">
                    <div class="placeHeaderTitle">
                        

                        ${p.avgRating ? `
                            <button type="button" class="place-rating-jump" onclick="window.scrollPlaceReviews('${p.id}')" style="border:none; display:inline-flex; align-items:center; gap:6px; background:#fef9c3; color:#854d0e; padding:6px 10px; border-radius:8px; font-weight:700; font-size:13px;">
                                <i data-lucide="star" style="width:16px; height:16px; fill:#854d0e;"></i>
                                ${p.avgRating} <span style="font-weight:normal; opacity:0.8;">(${p.ratingCount ?? p.reviewCount} Ratings)</span>
                            </button>
                        ` : `
                            <button type="button" class="place-rating-jump" onclick="window.scrollPlaceReviews('${p.id}')" style="border:none; display:inline-flex; align-items:center; gap:6px; background:#f1f5f9; color:#64748b; padding:6px 10px; border-radius:8px; font-size:12px;">
                                <i data-lucide="star" style="width:16px; height:16px;"></i> New &middot; No ratings yet
                            </button>
                        `}
                    </div>
                </div>

                <!-- 🔥 DITO ANG DELIVERY BADGES 🔥 -->
                <div class="delivery-info-container place-status-pills" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;">
                    <span class="place-open-status ${openState.className}" style="${statusBadgeStyle} padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="clock" style="width:14px;"></i> ${escapeHtml(openState.label)}${openState.hint ? ` - ${escapeHtml(openState.hint)}` : ''}
                    </span>
                    ${p.is_verified ? `
                    <span class="place-verified-status" style="background:#dbeafe; color:#1d4ed8; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="badge-check" style="width:14px;"></i> Verified
                    </span>` : ''}
                    ${p.delivery_grab ? `
                    <span style="background:#f1f5f9; color:#475569; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="bike" style="width:14px;"></i> Grab/Foodpanda
                    </span>` : ''}

                    ${p.delivery_inhouse ? `
                    <span style="background:#f1f5f9; color:#475569; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="home" style="width:14px;"></i> In-house Delivery
                    </span>` : ''}

                    ${p.delivery_radius ? `
                    <span style="background:#fef3c7; color:#854d0e; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="map" style="width:14px;"></i> Radius: ${escapeHtml(p.delivery_radius)}km
                    </span>` : ''}
                    <span class="vici-freshness-badge ${freshness.className}" style="background:${freshness.bg}; color:${freshness.tone}; border-color:${freshness.border}; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 800; display: flex; align-items: center; gap: 6px;" title="${escapeHtml(freshness.label)}">
                        <i data-lucide="${freshness.isInactive ? 'pause-circle' : freshness.level === 'active' ? 'check-circle-2' : 'alert-triangle'}" style="width:14px;"></i> ${escapeHtml(freshness.shortLabel)}
                    </span>
                </div>

                <div class="place-contact-grid">
                    <div class="placeContactRow"><i data-lucide="map-pin"></i> <span data-no-translate>${escapeHtml(placeAddrText)}</span></div>
                    <div class="placeContactRow link"><i data-lucide="phone"></i> <span>${escapeHtml(p.phone || p.contact_phone || "No contact number")}</span></div>
                </div>

                <div class="placeActionBtns">
                    <button class="btnNav" onclick="window.routeToPlace(${p.lat}, ${p.lng})" style="display:flex; align-items:center; justify-content:center; gap:8px;"><i data-lucide="send"></i> <span data-i18n="Navigate">Navigate</span></button>
                    <button class="btnBook" onclick="window.openBookingModal('${p.id}', '${safeName}')" style="display:flex; align-items:center; justify-content:center; gap:8px;"><i data-lucide="calendar"></i> <span data-i18n="Send Request">Send Request</span></button>
                    <button class="btnBook" style="background:#eef2ff; color:#3b82f6; border:none; display:flex; align-items:center; justify-content:center; gap:8px;" onclick="window.openChatModal('${p.id}', '${safeName}')"><i data-lucide="message-square"></i> <span data-i18n="Message">Message</span></button>
                </div>
                ${trustActionsHtml}
                <div id="placeSukiSection"></div>
                </section>

                <div class="place-secondary-column">
                <section class="placeContent place-about-panel">
                    <div class="place-section-title compact">
                        <div>
                            <span>Overview</span>
                            <h3><i data-lucide="info"></i> <span data-i18n="About this place">About this place</span></h3>
                        </div>
                    </div>
                    <p data-no-translate class="place-description-text">${escapeHtml(p.desc || p.description || "No details provided.")}</p>

                    ${adminPostBtnHtml}

                    <div class="rating-section place-rating-panel ${isOwnPlaceView ? 'is-own-place' : ''}" style="margin-top: 24px; padding: 20px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0;">
                        ${isOwnPlaceView ? `
                        <h4 style="margin:0 0 4px; font-size:14px; color:#1e293b;">You own this establishment</h4>
                        <p style="font-size:12px; color:#64748b; margin:0;">You can't rate your own place.</p>` : `
                        <h4 style="margin:0; font-size:14px; color:#1e293b;">${userRating > 0 ? 'Your Rating' : 'Rate this establishment'}</h4>
                        <div class="stars-input" id="starInputContainer" style="display: flex; gap: 8px; margin: 12px 0;">
                            ${[1, 2, 3, 4, 5].map(num => `
                                <button class="star-btn ${num <= userRating ? 'active' : ''}"
                                        aria-label="Rate ${num} ${num === 1 ? 'star' : 'stars'}"
                                        onclick="window.submitRating('${p.id}', ${num})"
                                        style="background:none; border:none; cursor:pointer; padding:0; display:flex; align-items:center; justify-content:center;">
                                    <i data-lucide="star" style="width:30px; height:30px; display:block;"></i>
                                </button>
                            `).join('')}
                        </div>
                        <p style="font-size:11px; color:#64748b; margin:0;">
                            ${userRating > 0 ? `You rated this ${userRating} stars. You can change it anytime.` : 'Click a star to submit your rating.'}
                        </p><p class="place-rating-policy">Star ratings do not require a transaction. Written reviews require a completed transaction.</p>`}
                    </div>
                </section>

                <div class="place-review-modal hidden" id="placeReviewsSection" data-place-id="${p.id}" aria-hidden="true" onclick="if(event.target===this) window.closePlaceReviews()">
                    <div class="place-review-card" role="dialog" aria-modal="true" aria-label="Verified reviews">
                        <div class="place-review-card-head">
                            <div>
                                <div class="place-review-eyebrow">Public feedback</div>
                                <h3><i data-lucide="star"></i> Verified Reviews</h3>
                            </div>
                            <button type="button" class="place-review-close" onclick="window.closePlaceReviews()" aria-label="Close reviews"><i data-lucide="x"></i></button>
                        </div>
                        <div id="publicReviewsList" class="place-review-list" data-loaded="false">
                            <div class="muted" style="text-align:center; padding:20px; font-size:13px;">Loading verified reviews...</div>
                        </div>
                    </div>
                </div>

                <div class="placeContent place-menu-feed">
                    <nav class="commerce-tabs" role="tablist" aria-label="Establishment content"><button type="button" id="placeMenuTab" role="tab" aria-controls="placeStructuredMenu" data-place-tab="menu" aria-selected="true">Menu</button><button type="button" id="placePostsTab" role="tab" aria-controls="placeStorePosts" data-place-tab="posts" aria-selected="false">Establishment posts</button></nav>
                    <section id="placeStructuredMenu" role="tabpanel" aria-labelledby="placeMenuTab"><p>Loading listed menu…</p></section><section id="placeStorePosts" role="tabpanel" aria-labelledby="placePostsTab" hidden>
                    <div class="place-section-title">
                        <div>
                            <span>From the business</span>
                            <h3><i data-lucide="utensils"></i> <span>Establishment posts</span></h3>
                        </div>
                        ${isOwnerOrAdmin ? `<button type="button" onclick="window.openPlacePostModal('${p.id}', '${safeName}')"><i data-lucide="image-plus"></i> Add post / photo</button>` : ""}
                    </div>
                    <div id="placeUpdatesList">
                        <div class="muted" style="text-align:center; padding: 20px; font-size: 13px;">Loading establishment posts...</div>
                    </div></section>
                </div>
                </div>
            </div>
            `;
        if(typeof placeUpdatesUnsub==='function'){placeUpdatesUnsub();placeUpdatesUnsub=null;}
        showPage('page-place');

        setTimeout(() => {
            window.debouncedIcons?.();
            window.LangManager?.translateDOM?.();
        }, 50);

        document.querySelectorAll('[data-place-tab]').forEach(button=>button.onclick=()=>{const menu=button.dataset.placeTab==='menu';document.getElementById('placeStructuredMenu').hidden=!menu;document.getElementById('placeStorePosts').hidden=menu;document.querySelectorAll('[data-place-tab]').forEach(b=>b.setAttribute('aria-selected',String(b===button)));if(!menu)listenToPlaceUpdates(p.id,isOwnerOrAdmin);else if(typeof placeUpdatesUnsub==='function'){placeUpdatesUnsub();placeUpdatesUnsub=null;}});
        document.querySelector('.commerce-tabs').onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=[...document.querySelectorAll('[data-place-tab]')],index=tabs.indexOf(document.activeElement),next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(index+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next].click();tabs[next].focus();};
        window.ViciCommerce?.mountMenu(document.getElementById('placeStructuredMenu'),p.id,isOwnerOrAdmin);
        // Suki Card section (customer card + Vicinify Scan / owner QR)
        if (window.Suki) window.Suki.mountPlaceSection(p, isOwnerOrAdmin);
        if (options?.focusReviews) {
            setTimeout(() => window.scrollPlaceReviews(p.id), 700);
        }
    };

    async function loadPlacePublicReviews(placeId) {
        const wrap = document.getElementById("publicReviewsList");
        if (!wrap) return;
        wrap.dataset.loading = "true";

        try {
            const snap = await window.db.collection("reviews")
                .where("placeId", "==", placeId)
                .where("isPublic", "==", true)
                .orderBy("createdAt", "desc")
                .limit(100)
                .get();

            let reviews = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }))
                .filter(r => r.isPublic !== false && (r.feedback || r.comment || r.satisfaction || r.rating));

            reviews.sort((a, b) => (b.createdAt?.toMillis?.() || b.updatedAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || a.updatedAt?.toMillis?.() || 0));
            const allPublicReviews = reviews;
            reviews = allPublicReviews.slice(0, 8);

            if (reviews.length === 0) {
                wrap.innerHTML = `<div class="muted" style="text-align:center; padding:20px; font-size:13px;">No public reviews yet. Completed transactions will appear here as verified reviews when customers choose public posting.</div>`;
                wrap.dataset.loadedFor = placeId;
                wrap.dataset.loading = "false";
                return;
            }

            const ratings = allPublicReviews.map(r => Number(r.rating || 0)).filter(score => score > 0);
            const avgRating = ratings.length ? Number((ratings.reduce((sum, score) => sum + score, 0) / ratings.length).toFixed(1)) : 0;
            const positiveCount = ratings.filter(score => score >= 4).length;
            const positiveRate = ratings.length ? Math.round((positiveCount / ratings.length) * 100) : 0;
            const verifiedCount = allPublicReviews.filter(r => r.verifiedTransaction === true).length;
            const typeCounts = {};

            allPublicReviews.forEach(review => {
                const meta = getRequestMetaForSubmit(review.requestType || "table_reservation");
                typeCounts[meta.shortLabel] = (typeCounts[meta.shortLabel] || 0) + 1;
            });

            const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Transactions";
            const insight = avgRating >= 4.5
                ? "Strong customer trust signal. Keep highlighting this feedback publicly."
                : avgRating >= 4
                    ? "Good feedback trend. Watch the written comments for repeat strengths."
                    : "Feedback needs attention. Use the comments to spot service gaps.";

            const summaryHtml = `
                <div class="place-review-summary" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:16px; padding:14px; margin-bottom:12px;">
                    <div class="place-review-summary-head" style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:12px;">
                        <div>
                            <div style="font-size:12px; color:#64748b; font-weight:800;">Public feedback signal</div>
                            <div style="font-size:18px; color:#0f172a; font-weight:900; margin-top:3px;">${avgRating || "New"} / 5</div>
                        </div>
                        <span class="place-review-verified" style="display:inline-flex; align-items:center; gap:5px; background:#dcfce7; color:#166534; padding:6px 10px; border-radius:999px; font-size:11px; font-weight:900;">
                            <i data-lucide="badge-check" style="width:14px;"></i> Verified feedback
                        </span>
                    </div>
                    <div class="review-insights-grid place-review-stats">
                        <div class="place-review-stat" style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:10px;">
                            <div style="font-size:11px; color:#64748b; font-weight:800;">Public Reviews</div>
                            <div style="font-size:17px; color:#0f172a; font-weight:900; margin-top:2px;">${allPublicReviews.length}</div>
                        </div>
                        <div class="place-review-stat" style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:10px;">
                            <div style="font-size:11px; color:#64748b; font-weight:800;">Positive Rate</div>
                            <div style="font-size:17px; color:#0f172a; font-weight:900; margin-top:2px;">${positiveRate}%</div>
                        </div>
                        <div class="place-review-stat" style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:10px;">
                            <div style="font-size:11px; color:#64748b; font-weight:800;">Top Feedback</div>
                            <div style="font-size:13px; color:#0f172a; font-weight:900; margin-top:4px;">${escapeHtml(topType)}</div>
                        </div>
                    </div>
                    <div style="font-size:12px; color:#475569; line-height:1.45;">
                        ${verifiedCount} verified transaction review${verifiedCount === 1 ? "" : "s"}. ${escapeHtml(insight)}
                    </div>
                </div>
            `;

            const moreHtml = allPublicReviews.length > 8
                ? `<div style="text-align:center; color:#64748b; font-size:12px; font-weight:800; padding:8px;">Showing latest 8 of ${allPublicReviews.length} public verified reviews.</div>`
                : "";

            wrap.innerHTML = summaryHtml + reviews.map(r => {
                const rating = Number(r.rating || 0);
                const stars = "&#9733;".repeat(Math.max(0, Math.min(5, rating))) + "&#9734;".repeat(Math.max(0, 5 - Math.min(5, rating)));
                const meta = getRequestMetaForSubmit(r.requestType || "table_reservation");
                const name = r.userName || r.customerName || "Customer";
                const comment = r.feedback || r.comment || r.satisfaction || "No written comment.";
                const date = r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString() : "Verified review";

                return `
                    <div class="place-review-item" style="background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:14px; margin-bottom:10px; box-shadow:0 4px 12px rgba(15,23,42,0.04);">
                        <div class="place-review-item-head" style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
                            <div class="place-review-person">
                                <div data-no-translate style="font-weight:900; color:#0f172a; font-size:14px;">${escapeHtml(name)}</div>
                                <div class="place-review-stars" style="color:#f59e0b; font-weight:900; letter-spacing:1px; margin-top:3px;">${stars}</div>
                            </div>
                            <div class="place-review-meta" style="text-align:right; font-size:10px; color:#64748b;">
                                <span class="place-review-verified" style="display:inline-flex; align-items:center; gap:4px; background:#dcfce7; color:#166534; padding:4px 8px; border-radius:999px; font-weight:900;">&#10003; Verified Transaction</span>
                                <div style="margin-top:5px;">${escapeHtml(meta.shortLabel)} &middot; ${escapeHtml(date)}</div>
                            </div>
                        </div>
                        <div data-no-translate class="place-review-comment" style="margin-top:10px; color:#334155; font-size:13px; line-height:1.5; white-space:pre-wrap;">${escapeHtml(comment)}</div>
                    </div>
                `;
            }).join("") + moreHtml;
            wrap.dataset.loadedFor = placeId;
            wrap.dataset.loading = "false";
            window.debouncedIcons?.();
        } catch (error) {
            console.error("Error loading public reviews:", error);
            wrap.innerHTML = `<div style="color:#ef4444; font-size:13px; padding:12px;">Unable to load reviews.</div>`;
            wrap.dataset.loading = "false";
        }
    }

    window.openClaimBusiness = async function(placeId, placeName) {
        const user = await requireVerifiedUser("claim this business");
        if (!user) return;

        const ans = await window.vConfirm(
            "Claim Business",
            `Submit a claim request for ${placeName || "this establishment"}? Admin will review before ownership is granted.`,
            "Submit Claim",
            false
        );
        if (!ans) return;

        try {
            const claimId = `${user.uid}_${placeId}`;
            const claimRef = window.db.collection("business_claims").doc(claimId);
            const existing = await claimRef.get();

            if (existing.exists && existing.data().status === "pending") {
                return window.showToast("You already have a pending claim for this establishment.", "info");
            }

            await window.ContentPolicy.create(window.db,'business_claims',{
                placeId,
                placeName: placeName || "Establishment",
                userId: user.uid,
                userEmail: user.email || "",
                userName: AppState.userProfile?.fullName || user.displayName || "Business owner",
                status: "pending",
                source: "place_page",
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            window.showToast("Claim request submitted for admin review.", "success");
        } catch (error) {
            console.error("Business claim error:", error);
            window.showToast("Unable to submit claim: " + error.message, "error");
        }
    };

    window.openPlaceReportModal = async function(placeId, placeName) {
        const user = await requireVerifiedUser("report this establishment");
        if (!user) return;

        const modalId = "placeReportModal_" + Date.now();
        const html = `
            <div id="${modalId}" style="position:fixed; inset:0; z-index:999999; display:flex; align-items:center; justify-content:center;">
                <div class="modalBackdrop" style="position:absolute; inset:0; background:rgba(15,23,42,0.55);"></div>
                <div style="position:relative; background:white; width:92%; max-width:430px; border-radius:22px; padding:22px; box-shadow:0 24px 60px rgba(15,23,42,0.25);">
                    <h3 style="margin:0 0 6px; font-size:20px; color:#0f172a;">Report Info</h3>
                    <p style="margin:0 0 14px; color:#64748b; font-size:13px; line-height:1.5;">Tell admin what needs checking for ${escapeHtml(placeName || "this establishment")}.</p>

                    <label style="font-size:13px; font-weight:800; color:#334155;">Issue type</label>
                    <select id="reportType_${modalId}" style="width:100%; box-sizing:border-box; padding:11px; border:1px solid #cbd5e1; border-radius:12px; margin:8px 0 12px;">
                        <option value="wrong_hours">Wrong hours</option>
                        <option value="wrong_location">Wrong location</option>
                        <option value="wrong_contact">Wrong contact</option>
                        <option value="closed_business">Business closed</option>
                        <option value="other">Other</option>
                    </select>

                    <label style="font-size:13px; font-weight:800; color:#334155;">Details</label>
                    <textarea id="reportDetails_${modalId}" placeholder="Add details so admin can verify quickly"
                        style="width:100%; box-sizing:border-box; min-height:95px; padding:11px; border:1px solid #cbd5e1; border-radius:12px; resize:none; margin-top:8px;"></textarea>

                    <div style="display:flex; gap:10px; margin-top:16px;">
                        <button id="cancel_${modalId}" style="flex:1; padding:12px; border:none; border-radius:12px; background:#f1f5f9; color:#475569; font-weight:800; cursor:pointer;">Cancel</button>
                        <button id="submit_${modalId}" style="flex:1; padding:12px; border:none; border-radius:12px; background:#f97316; color:white; font-weight:900; cursor:pointer;">Submit</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML("beforeend", html);
        const modal = document.getElementById(modalId);
        const close = () => modal.remove();

        document.getElementById(`cancel_${modalId}`).onclick = close;
        modal.querySelector(".modalBackdrop").onclick = close;

        document.getElementById(`submit_${modalId}`).onclick = async () => {
            const issueType = document.getElementById(`reportType_${modalId}`).value;
            const details = document.getElementById(`reportDetails_${modalId}`).value.trim();

            if (!details) {
                return window.showToast("Please add a short detail for admin.", "error");
            }

            try {
                await window.ContentPolicy.create(window.db,'place_reports',{
                    placeId,
                    placeName: placeName || "Establishment",
                    issueType,
                    details,
                    userId: user.uid,
                    userEmail: user.email || "",
                    userName: AppState.userProfile?.fullName || user.displayName || "Customer",
                    status: "open",
                    source: "place_page",
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                close();
                window.showToast("Report submitted. Admin can review it.", "success");
            } catch (error) {
                console.error("Place report error:", error);
                window.showToast("Unable to submit report: " + error.message, "error");
            }
        };
    };

    window.openPlacePostModal = async function (placeId, placeName) {
        const user = await requireVerifiedUser("post store updates");
        if (!user) return;

        const allowed = await canManagePlace(placeId);
        if (!allowed) {
            return window.showToast("Only the owner or an admin can post updates for this establishment.", "error");
        }

        document.getElementById('placePostModal').dataset.editPostId = '';
        document.getElementById('placePostPlaceId').value = placeId;
        const postBodyEl = document.getElementById('placePostBody');
        postBodyEl.value = "";
        // Undo any drag-resize the user did last time: the browser keeps a
        // manually resized textarea's inline size for the page's lifetime,
        // so it must be cleared explicitly or the box reopens still resized.
        postBodyEl.style.width = "";
        postBodyEl.style.height = "";
        document.getElementById('placePostMedia').value = "";
        const submitBtn = document.getElementById('submitPlacePostBtn');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Post Update"; }
        const modal = document.getElementById('placePostModal');
        modal.classList.remove('hidden');
        if (!window.__postScrollLocked) { window.__postScrollLocked = true; window.lockBodyScroll?.(true); }
        // Fresh state on every open: the box always starts scrolled to the
        // top with the form visible (a persisted scroll offset previously
        // made the modal look like a big blank panel on reopen).
        const box = modal.querySelector('.modalBox');
        if (box) box.scrollTop = 0;
        const bodyEl = modal.querySelector('.modalBody');
        if (bodyEl) bodyEl.scrollTop = 0;
    };

    window.closePlacePostModal = function () {
        const modal = document.getElementById('placePostModal');
        modal.classList.add('hidden');
        if (window.__postScrollLocked) { window.__postScrollLocked = false; window.lockBodyScroll?.(false); }
        // Reset on close too, so nothing stale can appear on the next open.
        const body = document.getElementById('placePostBody');
        if (body) { body.value = ""; body.style.width = ""; body.style.height = ""; }
        const media = document.getElementById('placePostMedia');
        if (media) media.value = "";
        const box = modal.querySelector('.modalBox');
        if (box) box.scrollTop = 0;
    };

    window.editPlacePost = async function(postId) {
        try {
            const snap=await window.db.collection('place_posts').doc(postId).get();
            if(!snap.exists) return window.showToast('Post no longer exists.','info');
            const post=snap.data();
            if(!await canManagePlace(post.placeId)) return window.showToast('Only the owner or an admin can edit this post.','error');
            await window.openPlacePostModal(post.placeId, 'Establishment');
            document.getElementById('placePostModal').dataset.editPostId=postId;
            document.getElementById('placePostBody').value=post.body || '';
            document.getElementById('submitPlacePostBtn').textContent='Save changes';
        } catch(e) { window.showToast('Could not open post. Please try again.','error'); }
    };

    window.submitPlacePost = async function () {
        const editPostId = document.getElementById('placePostModal').dataset.editPostId || '';
        const placeId = document.getElementById('placePostPlaceId').value;
        const body = document.getElementById('placePostBody').value.trim();
        const fileInput = document.getElementById('placePostMedia');
        const btn = document.getElementById('submitPlacePostBtn');

        const user = await requireVerifiedUser("post store updates");
        if (!user) return;

        const allowed = await canManagePlace(placeId);
        if (!allowed) {
            return window.showToast("Only the owner or an admin can post updates for this establishment.", "error");
        }

        if (!editPostId && !body && (!fileInput.files || fileInput.files.length === 0)) {
            return window.showToast("Please add a caption or upload a photo!", "error");
        }

        const contentProblem=body && window.ContentPolicy?.error('post',body);
        if(contentProblem) return window.showToast(contentProblem,'error');
        btn.disabled = true;
        btn.textContent = "Posting...";

        try {
            let mediaUrl = null;
            if (fileInput.files && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                mediaUrl = await window.uploadImageFileToStorage(file, `place_posts/${placeId}`, { maxWidth: 700, quality: 0.76 });
            }

            if(editPostId) {
                const ref=window.db.collection('place_posts').doc(editPostId);
                const original=await ref.get();
                if(!original.exists || original.data().placeId!==placeId) throw new Error('Post does not belong to this establishment.');
                if(!body && !mediaUrl && !original.data().mediaUrl) throw new Error('Add a caption or photo.');
                const changes={body};
                if(mediaUrl) changes.mediaUrl=mediaUrl;
                await ref.update(changes);
            } else await window.ContentPolicy.create(window.db, 'place_posts', {
                placeId: placeId,
                body: body,
                mediaUrl: mediaUrl,
                authorUid: user.uid,
                authorName: AppState.userProfile?.fullName || "Store Admin",
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            window.showToast("Menu/store post published.", "success");
            window.closePlacePostModal();
        } catch (e) {
            window.showToast("Error: " + e.message, "error");
        } finally {
            btn.disabled = false;
            btn.textContent = "Post Update";
        }
    };

    window.closePlacePostMenus = function() {
        document.querySelectorAll(".place-menu-dropdown.show").forEach(menu => menu.classList.remove("show"));
    };

    window.togglePlacePostActions = function(postId, event) {
        event?.stopPropagation?.();
        const menu = document.getElementById("placePostMenu-" + postId);
        if (!menu) return;
        const willOpen = !menu.classList.contains("show");
        window.closePlacePostMenus();
        menu.classList.toggle("show", willOpen);
    };

    if (!window.__viciPlacePostMenuCloseBound) {
        window.__viciPlacePostMenuCloseBound = true;
        document.addEventListener("click", (event) => {
            if (!event.target.closest?.(".place-menu-actions")) window.closePlacePostMenus?.();
        });
    }

    window.sharePlacePostToBuzz = async function(postId, buzzType = "general") {
        const user = await requireVerifiedUser("share this post to Buzz");
        if (!user) return;

        const type = ["general", "announcement", "promo"].includes(String(buzzType)) ? String(buzzType) : "general";
        const typeLabel = type === "announcement" ? "Announcement" : type === "promo" ? "Promo" : "Buzz";
        window.closePlacePostMenus?.();

        try {
            const postRef = window.db.collection("place_posts").doc(postId);
            const postDoc = await postRef.get();
            if (!postDoc.exists) return window.showToast("This establishment post no longer exists.", "error");

            const post = { ...postDoc.data(), id: postDoc.id };
            const allowed = await canManagePlace(post.placeId);
            if (!allowed) return window.showToast("Only the approved owner or an admin can share this post.", "error");

            const place = await getPlaceForPermission(post.placeId);
            if (!place) return window.showToast("Unable to verify the establishment for this post.", "error");

            const buzzPayload = {
                type,
                barangay: place.brgy || place.barangay || "Lipa City",
                body: post.body || `New update from ${place.name || "this establishment"}.`,
                mediaUrl: post.mediaUrl || null,
                authorUid: user.uid,
                authorName: AppState.userProfile?.fullName || user.displayName || "Store Admin",
                isBusinessPost: true,
                establishmentId: post.placeId,
                establishmentName: place.name || "Establishment",
                source: "place_post",
                sourcePlaceId: post.placeId,
                sourcePostId: post.id,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            let buzzRef = null;
            if (post.buzzPostId) {
                const existingRef = window.db.collection("buzz_posts").doc(post.buzzPostId);
                const existingDoc = await existingRef.get();
                if (existingDoc.exists && existingDoc.data().authorUid === user.uid) {
                    await window.ContentPolicy.updatePost(window.db,'buzz_posts',existingRef,buzzPayload);
                    buzzRef = existingRef;
                }
            }

            if (!buzzRef) {
                buzzRef = await window.ContentPolicy.create(window.db, 'buzz_posts', {
                    ...buzzPayload,
                    likes: 0,
                    likedBy: [],
                    comments: [],
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            await postRef.update({
                sharedToBuzz: true,
                sharedBuzzType: type,
                buzzPostId: buzzRef.id,
                sharedToBuzzAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            window.showToast(`Shared as ${typeLabel}.`, "success");
        } catch (error) {
            console.error("Share to Buzz failed:", error);
            window.showToast("Unable to share to Buzz: " + error.message, "error");
        }
    };

    function forcePlaceUpdatesFeedLayout(wrap) {
        if (!wrap) return;
        wrap.style.setProperty("display", "flex", "important");
        wrap.style.setProperty("flex-direction", "column", "important");
        wrap.style.setProperty("grid-template-columns", "none", "important");
        wrap.style.setProperty("gap", "14px", "important");
        wrap.style.setProperty("width", "100%", "important");
        wrap.style.setProperty("max-width", "100%", "important");
        wrap.style.setProperty("align-items", "stretch", "important");
    }

    function listenToPlaceUpdates(placeId, canManageCurrentPlace = false) {
        if (placeUpdatesUnsub) placeUpdatesUnsub();

        const wrap = document.getElementById("placeUpdatesList");
        if (!wrap) return;
        forcePlaceUpdatesFeedLayout(wrap);

        placeUpdatesUnsub = window.db.collection("place_posts")
            .where("placeId", "==", placeId)
            .orderBy("createdAt", "desc")
            .limit(30)
            .onSnapshot(snap => {
                forcePlaceUpdatesFeedLayout(wrap);
                if (snap.empty) {
                    wrap.innerHTML = `<div class="place-menu-empty"><i data-lucide="utensils"></i><strong>No establishment posts yet</strong><span>Businesses can post announcements, promos, and store updates here. Priced items are in the Menu tab.</span></div>`;
                    forcePlaceUpdatesFeedLayout(wrap);
                    window.debouncedIcons?.();
                    return;
                }

                let docs = snap.docs.map(d => ({ ...d.data(), id: d.id }));
                docs.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

                let html = "";
                docs.forEach(data => {
                    const dateStr = data.createdAt && data.createdAt.toDate ? data.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now';
                    const authorName = data.authorName || "Store Admin";
                    let imgHtml = "";
                    const safeMediaUrl = getSafeImageUrl(data.mediaUrl);
                    if (safeMediaUrl) {
                        imgHtml = `<div class="place-menu-media"><a class="place-menu-image-link" href="${escapeHtml(safeMediaUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Open post photo in full size"><img src="${escapeHtml(safeMediaUrl)}" alt="${escapeHtml(String(data.body || 'Establishment post photo').slice(0,100))}" loading="lazy" onerror="this.closest('.place-menu-media')?.remove()" /><span>View full image <i data-lucide="arrow-up-right"></i></span></a></div>`;
                    }
                    const sharedBadgeHtml = data.sharedToBuzz ? `
                        <span class="place-menu-shared"><i data-lucide="share-2"></i> Shared to Buzz</span>
                    ` : "";
                    const actionsHtml = canManageCurrentPlace ? `
                        <div class="place-menu-actions" onclick="event.stopPropagation()">
                            <button class="place-menu-more" onclick="window.togglePlacePostActions('${data.id}', event)" title="Post actions">
                                <i data-lucide="more-horizontal"></i>
                            </button>
                            <div class="place-menu-dropdown" id="placePostMenu-${data.id}">
                                <button onclick="window.editPlacePost('${data.id}')"><i data-lucide="pencil"></i> Edit caption / photo</button>
                                <button onclick="window.sharePlacePostToBuzz('${data.id}', 'general')"><i data-lucide="share-2"></i> Share to Buzz</button>
                                <button onclick="window.sharePlacePostToBuzz('${data.id}', 'announcement')"><i data-lucide="megaphone"></i> Share as Announcement</button>
                                <button onclick="window.sharePlacePostToBuzz('${data.id}', 'promo')"><i data-lucide="tag"></i> Share as Promo</button>
                                <button class="danger" onclick="window.deletePlacePost('${data.id}')"><i data-lucide="trash-2"></i> Delete</button>
                            </div>
                        </div>
                    ` : "";

                    html += `
                    <article class="place-menu-card">
                        <div class="place-menu-card-head">
                            <div class="place-menu-author">
                                <div data-no-translate>${escapeHtml(authorName.charAt(0).toUpperCase())}</div>
                                <span><strong data-no-translate>${escapeHtml(authorName)}</strong><small>${dateStr}</small></span>
                            </div>
                            <div class="place-menu-card-tools">
                                ${sharedBadgeHtml}
                                <span class="place-menu-chip"><i data-lucide="sparkles"></i> Store post</span>
                                ${actionsHtml}
                            </div>
                        </div>
                        <div data-no-translate class="place-menu-body">${escapeHtml(data.body)}</div>
                        ${imgHtml}
                    </article>
                    `;
                });
                wrap.innerHTML = html;
                forcePlaceUpdatesFeedLayout(wrap);
                window.debouncedIcons?.();
            }, err => window.handleFirestoreError(err));
    }

    function getRequestMetaForSubmit(type) {
        const key = String(type || "table_reservation").toLowerCase();

        const map = {
            booking: {
                key: "booking",
                icon: "📅",
                title: "General Booking Request",
                shortLabel: "Booking",
                needsItems: false,
                needsGuests: false,
                needsAddress: false,
                needsPayment: false
            },
            table_reservation: {
                key: "table_reservation",
                icon: "🍽️",
                title: "Table Reservation Request",
                shortLabel: "Table Reservation",
                needsItems: false,
                needsGuests: true,
                needsAddress: false,
                needsPayment: false
            },
            food_reservation: {
                key: "food_reservation",
                icon: "🍱",
                title: "Food Reservation Request",
                shortLabel: "Food Reservation",
                needsItems: true,
                needsGuests: false,
                needsAddress: false,
                needsPayment: false
            },
            pickup_order: {
                key: "pickup_order",
                icon: "🛍️",
                title: "Pickup Pre-order Request",
                shortLabel: "Pickup Pre-order",
                needsItems: true,
                needsGuests: false,
                needsAddress: false,
                needsPayment: true
            },
            advance_order: {
                key: "advance_order",
                icon: "🗓️",
                title: "Advance Order Request",
                shortLabel: "Advance Order",
                needsItems: true,
                needsGuests: false,
                needsAddress: false,
                needsPayment: true
            },
            delivery_order: {
                key: "delivery_order",
                icon: "🛵",
                title: "Delivery Order Request",
                shortLabel: "Delivery Order",
                needsItems: true,
                needsGuests: false,
                needsAddress: false,
                needsPayment: true
            }
        };

        return map[key] || map.table_reservation;
    }

    function getValue(id) {
        return (document.getElementById(id)?.value || "").trim();
    }

    const bookingChoiceContent = {
        reqGroupReservation: { icon: "calendar-check", title: "Booking", copy: "Reserve a table or food" },
        reqGroupOrder: { icon: "shopping-bag", title: "Order", copy: "Pickup, delivery, or advance" },
        table_reservation: { icon: "utensils", title: "Table Reservation", copy: "Reserve seats or table" },
        food_reservation: { icon: "package-check", title: "Food Reservation", copy: "Reserve food/item" },
        pickup_order: { icon: "shopping-basket", title: "Pickup Pre-order", copy: "Order now, pick up at the store" },
        delivery_order: { icon: "bike", title: "Delivery Order", copy: "Order for delivery; add your address after acceptance" },
        advance_order: { icon: "calendar-days", title: "Advance Order", copy: "Future, bulk, cake, bilao, or event orders" }
    };

    function renderBookingChoiceContent() {
        Object.entries(bookingChoiceContent).forEach(([key, item]) => {
            const btn = key.startsWith("reqGroup")
                ? document.getElementById(key)
                : document.querySelector(`[data-request-type="${key}"]`);
            if (!btn || btn.dataset.cleanLabel === "true") return;
            btn.innerHTML = `
                <span class="request-choice-icon"><i data-lucide="${item.icon}"></i></span>
                <span class="request-choice-text">
                    <span class="request-choice-title">${escapeHtml(item.title)}</span>
                    <span class="request-choice-copy">${escapeHtml(item.copy)}</span>
                </span>
            `;
            btn.dataset.cleanLabel = "true";
        });
    }

    function styleRequestButton(btn, active, meta) {
        if (!btn) return;
        const color = "#237e72";
        const light = "#e6f4ed";
        const dark = "#17633f";
        btn.classList.toggle("active", !!active);
        btn.setAttribute("aria-pressed", String(!!active));
        btn.style.borderColor = active ? color : "#e2e8f0";
        btn.style.background = active ? light : "#ffffff";
        btn.style.color = active ? dark : "#334155";
        btn.style.boxShadow = active ? "0 8px 18px rgba(15,23,42,0.08)" : "none";
    }

    function updateRequestPickerUI(type) {
        const selected = type || document.getElementById("bookType")?.value || "table_reservation";
        const group = ["table_reservation", "food_reservation"].includes(selected) ? "reservation" : "order";
        const resBox = document.getElementById("reservationRequestOptions");
        const orderBox = document.getElementById("orderRequestOptions");
        const resBtn = document.getElementById("reqGroupReservation");
        const orderBtn = document.getElementById("reqGroupOrder");
        const selectedMeta = getRequestMetaForSubmit(selected);

        renderBookingChoiceContent();

        if (resBox) resBox.style.display = group === "reservation" ? "block" : "none";
        if (orderBox) orderBox.style.display = group === "order" ? "block" : "none";

        styleRequestButton(resBtn, group === "reservation", { color: "#2563eb", light: "#eff6ff", dark: "#1d4ed8" });
        styleRequestButton(orderBtn, group === "order", { color: "#7c3aed", light: "#f5f3ff", dark: "#5b21b6" });

        document.querySelectorAll("[data-request-type]").forEach(btn => {
            const meta = getRequestMetaForSubmit(btn.dataset.requestType);
            styleRequestButton(btn, btn.dataset.requestType === selected, meta);
        });

        const confirmBtn = document.getElementById("confirmBookingBtn");
        if (confirmBtn && !confirmBtn.disabled) confirmBtn.textContent = "Review request";
        window.debouncedIcons?.();
    }

    window.setRequestGroup = function(group) {
        const nextType = group === "order" ? "pickup_order" : "table_reservation";
        window.setRequestTypeChoice(nextType);
    };

    window.setRequestTypeChoice = function(type) {
        const input = document.getElementById("bookType");
        if (input) input.value = type;
        window.updateRequestTypeFields();
    };

    window.updateRequestTypeFields = function () {
        const wrap = document.getElementById("requestDynamicFields");
        const type = document.getElementById("bookType")?.value || "table_reservation";
        if (!wrap) return;

        const meta = getRequestMetaForSubmit(type);
        updateRequestPickerUI(meta.key);

        const titles = {
            table_reservation: ["Table Reservation", "Reserve your seats"],
            food_reservation: ["Food Reservation", "Reserve food or items"],
            pickup_order: ["Pickup Pre-order", "Order now, pick up later"],
            delivery_order: ["Delivery Order", "Delivered to your door"],
            advance_order: ["Advance Order", "Bulk, cakes, events"]
        };
        const [tTitle, tSub] = titles[meta.key] || ["Request", "Fill in the details"];

        const chipRow = (id, options, def) => `
            <div class="req-chips" data-chip-for="${id}">
                ${options.map(o => `<button type="button" class="req-chip${o === def ? " active" : ""}" aria-pressed="${o === def}" data-val="${o}">${o}</button>`).join("")}
            </div>`;

        let fields = "";
        if (meta.key === "table_reservation") {
            fields = `
                <div class="field"><label>Number of Guests *</label>
                    ${chipRow("bookGuests", ["1", "2", "3", "4", "6+"], "2")}
                    <input type="number" id="bookGuests" min="1" max="99" placeholder="Or type a number" value="2" />
                </div>
                <div class="field"><label>Seating Preference</label>
                    ${chipRow("bookSeating", ["No preference", "Window", "Quiet", "Outdoor", "Family"], "No preference")}
                    <input type="hidden" id="bookSeating" value="No preference" />
                </div>
                <div class="field"><label>Occasion</label>
                    ${chipRow("bookOccasion", ["None", "Birthday", "Anniversary", "Meeting", "Date"], "None")}
                    <input type="hidden" id="bookOccasion" value="None" />
                </div><div class="field"><label>Payment Method</label>${chipRow("bookPayment", ["GCash", "Maya", "Bank Transfer"], "GCash")}<input type="hidden" id="bookPayment" value="GCash" /></div>`;
        } else if (meta.key === "food_reservation") {
            fields = `
                <div class="field"><label>Food Items to Reserve *</label>
                    <textarea id="bookItems" rows="3" placeholder="Example:\n2x Carbonara\n1x Milk Tea"></textarea>
                </div>
                <div class="field"><label>Fulfillment</label>
                    ${chipRow("bookFulfillment", ["Dine-in", "Pickup"], "Dine-in")}
                    <input type="hidden" id="bookFulfillment" value="Dine-in" />
                </div>
                <div class="field"><label>Payment Method</label>
                    ${chipRow("bookPayment", ["GCash", "Maya", "Bank Transfer"], "GCash")}
                    <input type="hidden" id="bookPayment" value="GCash" />
                </div>`;
        } else if (meta.key === "pickup_order") {
            fields = `
                <div class="field"><label>Order Details *</label>
                    <textarea id="bookItems" rows="3" placeholder="Example:\n1x Chicken Meal\n2x Fries"></textarea>
                </div>
                <div class="field"><label>Payment Method *</label>
                    ${chipRow("bookPayment", ["GCash", "Maya", "Bank Transfer"], "GCash")}
                    <input type="hidden" id="bookPayment" value="GCash" />
                </div>`;
        } else if (meta.key === "advance_order") {
            fields = `
                <div class="req-note warn">Advance orders are for future, bulk, cakes, bilao, or events. The business may require downpayment first.</div>
                <div class="field"><label>Order Details *</label>
                    <textarea id="bookItems" rows="3" placeholder="Example:\n1 bilao pancit (Saturday)\n20 packed meals"></textarea>
                </div>
                <div class="field"><label>Payment Type *</label>
                    ${chipRow("bookPaymentType", ["Downpayment", "Full Payment"], "Downpayment")}
                    <input type="hidden" id="bookPaymentType" value="Downpayment" />
                </div>
                <div class="field"><label>Payment Method *</label>
                    ${chipRow("bookPayment", ["GCash", "Maya", "Bank Transfer"], "GCash")}
                    <input type="hidden" id="bookPayment" value="GCash" />
                </div>`;
        } else if (meta.key === "delivery_order") {
            fields = `
                <div class="req-note info">Order first — after the business accepts, Vicinify will ask for your address, landmark, and payment reference.</div>
                <div class="field"><label>Order Details *</label>
                    <textarea id="bookItems" rows="3" placeholder="Example:\n2x Burger\n1x Large Fries"></textarea>
                </div>
                <div class="field"><label>Payment Method *</label>
                    ${chipRow("bookPayment", ["GCash", "Maya", "Bank Transfer"], "GCash")}
                    <input type="hidden" id="bookPayment" value="GCash" />
                </div>`;
        } else {
            fields = `
                <div class="field"><label>Booking Purpose</label>
                    <input type="text" id="bookPurpose" placeholder="Consultation, inquiry, appointment..." />
                </div>`;
        }

        wrap.innerHTML = `
            <div class="req-card">
                <div class="req-card-head">
                    <span class="req-card-icon"><i data-lucide="clipboard-list"></i></span>
                    <div><b>${tTitle}</b><span>${tSub}</span></div>
                </div>
                <div class="req-card-body">${fields}</div>
            </div>`;
        window.debouncedIcons?.();

        // Chip interactions: tap to fill, keeps hidden inputs / number in sync
        wrap.querySelectorAll(".req-chips").forEach(row => {
            const targetId = row.getAttribute("data-chip-for");
            row.querySelectorAll(".req-chip").forEach(chip => {
                chip.addEventListener("click", () => {
                    row.querySelectorAll(".req-chip").forEach(c => { c.classList.remove("active"); c.setAttribute("aria-pressed", "false"); });
                    chip.classList.add("active");
                    chip.setAttribute("aria-pressed", "true");
                    const val = chip.getAttribute("data-val");
                    const target = document.getElementById(targetId);
                    if (target) {
                        if (targetId === "bookGuests" && val === "6+") { target.value = "6"; }
                        else target.value = (val === "None" ? "" : val);
                    }
                });
            });
        });
        // typing in guests number clears chip selection
        const g = document.getElementById("bookGuests");
        if (g) g.addEventListener("input", () => {
            document.querySelector('[data-chip-for="bookGuests"]')?.querySelectorAll(".req-chip").forEach(c => { c.classList.remove("active"); c.setAttribute("aria-pressed", "false"); });
        });
    };

    let bookingReviewSnapshot = null;
    let bookingSending = false;
    let bookingSubmissionKey=null;
    const bookingText = text => window.LangManager?.translateKey?.(text) || text;

    function setBookingStep(review) {
        const details = document.getElementById("bookingDetailsStep");
        const summary = document.getElementById("bookingReviewStep");
        details?.classList.toggle("hidden", review);
        summary?.classList.toggle("hidden", !review);
        const title = document.getElementById("bookingModalTitle");
        title.textContent = bookingText(review ? "Review your request" : "Send a request");
        document.getElementById("bookingStepLabel").textContent = bookingText(review ? "2 of 2 · Review and send" : "1 of 2 · Request details");
        document.getElementById("bookingSecondaryBtn").textContent = bookingText(review ? "Back to edit" : "Cancel");
        document.getElementById("confirmBookingBtn").textContent = bookingText(review ? "Send Request" : "Review request");
        (review ? summary : details)?.scrollTo?.(0, 0);
        title.focus({preventScroll:true});
    }

    window.bookingBackOrCancel = function () {
        if (bookingSending) return;
        if (bookingReviewSnapshot) {
            bookingReviewSnapshot = null;
            setBookingStep(false);
        } else window.closeBookingModal();
    };

    function renderBookingReview(data) {
        const meta = getRequestMetaForSubmit(data.requestType);
        const lang = window.LangManager?.getLanguage?.() === 'ph' ? 'fil-PH' : 'en-PH';
        const scheduled = new Date(`${data.date}T${data.time}:00+08:00`);
        const date = new Intl.DateTimeFormat(lang,{month:'short',day:'numeric',year:'numeric',timeZone:'Asia/Manila'}).format(scheduled);
        const time = new Intl.DateTimeFormat(lang,{hour:'numeric',minute:'2-digit',timeZone:'Asia/Manila'}).format(scheduled);
        const row = (label,value,personal=false) => value ? `<div class="booking-review-row"><dt>${escapeHtml(bookingText(label))}</dt><dd${personal?' data-no-translate':''}>${escapeHtml(personal ? value : bookingText(value))}</dd></div>` : '';
        const icon = {table_reservation:'utensils',food_reservation:'package-check',pickup_order:'shopping-basket',delivery_order:'bike',advance_order:'calendar-days'}[meta.key] || 'calendar';
        const cachedRefund = cloudPlaces.find(x => x.id === data.placeId)?.refund_percent;
        document.getElementById('bookingReviewStep').innerHTML = `
            <div class="booking-review-place"><span class="booking-store-icon"><i data-lucide="${icon}"></i></span><div><p>${escapeHtml(bookingText(meta.shortLabel))}</p><h4 data-no-translate>${escapeHtml(data.placeName)}</h4></div><span class="booking-review-unsent">${escapeHtml(bookingText('Not sent yet'))}</span></div>
            <dl class="booking-review-summary">
                ${row('Date',date,true)}${row('Time',time,true)}${row('Guests',data.guests,true)}
                ${row('Seating',data.seating==='No preference'?'':data.seating)}${row('Occasion',data.occasion==='None'?'':data.occasion)}
                ${row('Items / Order',data.items,true)}${row('Fulfillment',data.fulfillment)}${row('Delivery Address',data.deliveryAddress,true)}
                ${row('Payment Type',data.paymentType)}${row('Payment Method',data.paymentMethod)}${row('Purpose',data.purpose,true)}${row('Notes',data.notes,true)}
            </dl>
            <div class="booking-review-next"><i data-lucide="circle-check"></i><div><b>${escapeHtml(bookingText('What happens next'))}</b><p>${escapeHtml(bookingText('The business will accept or decline your request. Follow updates in your transaction chat.'))}</p>${meta.needsPayment?`<p>${escapeHtml(bookingText('Send payment details only after the business accepts.'))}</p>`:''}</div></div>
            <details class="booking-review-policy"><summary>${escapeHtml(bookingText('Cancellation policy'))}</summary><p>${escapeHtml(bookingText("Free cancellation before preparation if no payment is recorded. Paid cancellations use the saved refund rate. Refund transfers are manual and must be confirmed separately."))}</p>${cachedRefund != null?`<p>${escapeHtml(bookingText('Refund rate on paid cancellations'))}: <strong>${escapeHtml(String(cachedRefund))}%</strong></p>`:''}</details>`;
        window.debouncedIcons?.();
    }

    function syncBookingSchedule() {
        const date = document.getElementById("bookDate");
        const time = document.getElementById("bookTime");
        if (!date || !time) return;
        const now = new Date();
        const phNow = new Date(now.getTime() + 8 * 3600000);
        const today = phNow.toISOString().slice(0, 10);
        const nextMinute = new Date(phNow.getTime() + 60000);
        const minTime = String(nextMinute.getUTCHours()).padStart(2, "0") + ":" + String(nextMinute.getUTCMinutes()).padStart(2, "0");
        date.min = today;
        date.setCustomValidity(date.value && date.value < today ? "Please choose today or a future date." : "");
        time.min = date.value === today ? minTime : "";
        const chosen = date.value && time.value ? new Date(date.value + "T" + time.value + ":00+08:00") : null;
        time.setCustomValidity(chosen && (!Number.isFinite(chosen.getTime()) || chosen.getTime() <= now.getTime())
            ? "Please choose a future time. Past bookings are not allowed." : "");
    }

    window.openBookingModal = async function (placeId, placeName, assistedDraft = null) {
        const user = await requireVerifiedUser("send a request");
        if (!user) return;

        try {
            // Cache-first: the map already holds this place's data.
            const cachedPlace = cloudPlaces.find(x => x.id === placeId);
            if (cachedPlace) {
                if(cachedPlace.accepts_booking===false){window.showToast('This establishment is not accepting requests. Please message the business.','info');return false;}
                if (cachedPlace.owner_uid === user.uid) {
                    return window.showToast("This is your own establishment. You cannot send a request to yourself.", "error");
                }
            } else {
                const placeDoc = await window.db.collection("places").doc(placeId).get();
                if(placeDoc.exists&&placeDoc.data().accepts_booking===false){window.showToast('This establishment is not accepting requests. Please message the business.','info');return false;}
                if (placeDoc.exists && placeDoc.data().owner_uid === user.uid) {
                    return window.showToast("This is your own establishment. You cannot send a request to yourself.", "error");
                }
            }
        } catch (e) {
            console.warn("Own establishment check failed:", e);
        }

        const modal = document.getElementById("bookingModal");
        if (bookingSending) return;
        bookingReviewSnapshot = null;bookingSubmissionKey=null;
        setBookingStep(false);
        window.lockBodyScroll(true);
        document.getElementById("bookPlaceId").value = placeId;
        document.getElementById("bookPlaceName").value = placeName;
        document.getElementById("bookingModalTitle").textContent = bookingText("Send a request");
        const storeChip = document.getElementById("bookingStoreChip");
        if (storeChip) {
            const chipText = storeChip.querySelector("span");
            if (chipText) { chipText.removeAttribute("data-i18n"); chipText.setAttribute("data-no-translate", ""); chipText.textContent = placeName || "Establishment"; }
        }
        document.getElementById("bookDate").value = "";
        document.getElementById("bookTime").value = "";
        document.getElementById("bookDetails").value = "";
        const today = new Date();
        document.getElementById("bookDate").value = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
        syncBookingSchedule();

        const typeSelect = document.getElementById("bookType");
        if (typeSelect) typeSelect.value = "table_reservation";

        updateRequestPickerUI("table_reservation");
        window.updateRequestTypeFields();
        if(assistedDraft){
            const d=window.ViciRequest.clean(assistedDraft);
            if(d.placeId!==placeId)return false;
            window.setRequestTypeChoice(d.requestType);
            document.getElementById('bookDate').value=d.date||'';
            document.getElementById('bookTime').value=d.time||'';
            const guests=document.getElementById('bookGuests');if(guests)guests.value=d.guests||'';
            const items=document.getElementById('bookItems');if(items)items.value=d.items||'';
            document.querySelectorAll('[data-chip-for="bookGuests"] .req-chip').forEach(b=>{const selected=b.dataset.val===String(d.guests);b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
            syncBookingSchedule();
        }
        modal.classList.remove("hidden");
        modal.setAttribute("aria-hidden", "false");
        // Recompute limits on edits and focus, including when the form stays
        // open across midnight. Submission checks again before any write.
        const dateEl = document.getElementById("bookDate");
        if (dateEl && !dateEl.dataset.timeGuardAttached) {
            dateEl.dataset.timeGuardAttached = "1";
            [dateEl, document.getElementById("bookTime")].forEach(input => {
                ["input", "change", "focus"].forEach(event => input.addEventListener(event, syncBookingSchedule));
            });
        }
        window.debouncedIcons?.();
        window.LangManager?.translateDOM?.(undefined, modal);
        document.getElementById("bookingModalTitle").focus({preventScroll:true});
        return true;
    };

    window.closeBookingModal = (force = false) => { if (bookingSending && force !== true) return; bookingReviewSnapshot = null; window.lockBodyScroll(false); const modal = document.getElementById("bookingModal"); modal?.classList.add("hidden"); modal?.setAttribute("aria-hidden", "true"); };

    window.confirmBookingSubmit = async function () {
        if (bookingSending) return;
        const user = await requireVerifiedUser("send a request");
        if (!user || bookingSending) return;

        const placeId = getValue("bookPlaceId");
        const placeName = getValue("bookPlaceName");
        const requestType = getValue("bookType") || "table_reservation";
        const date = getValue("bookDate");
        const time = getValue("bookTime");
        const notes = getValue("bookDetails");
        const meta = getRequestMetaForSubmit(requestType);

        const guests = getValue("bookGuests");
        const seating = getValue("bookSeating");
        const occasion = getValue("bookOccasion");
        const items = getValue("bookItems");
        const fulfillment = getValue("bookFulfillment");
        const paymentMethod = getValue("bookPayment");
        const paymentType = getValue("bookPaymentType");
        const deliveryAddress = getValue("bookAddress");
        const purpose = getValue("bookPurpose");

        if (!placeId || !placeName) return window.showToast("Missing establishment details.", "error");
        if (!date || !time) return window.showToast("Please select a Date and Time.", "error");
        syncBookingSchedule();
        for (const id of ["bookDate", "bookTime"]) {
            const input = document.getElementById(id);
            if (input && !input.checkValidity()) {
                if (bookingReviewSnapshot) { bookingReviewSnapshot = null; setBookingStep(false); }
                input.reportValidity();
                input.focus();
                return;
            }
        }
        // Past bookings are not allowed: today or a future date/time only.
        {
            const chosen = new Date(date + "T" + time + ":00+08:00");
            if (isNaN(chosen.getTime()) || chosen.getTime() <= Date.now()) {
                return window.showToast("Please choose today or a future date and time.", "error");
            }
        }
        if (meta.needsGuests && (!Number.isInteger(Number(guests)) || Number(guests) < 1 || Number(guests) > 99)) {
            if (bookingReviewSnapshot) { bookingReviewSnapshot = null; setBookingStep(false); }
            document.getElementById("bookGuests")?.focus();
            return window.showToast("Please enter the number of guests.", "error");
        }
        if (meta.needsItems && !items) return window.showToast("Please enter the order/items details.", "error");
        if (meta.needsAddress && !deliveryAddress) return window.showToast("Please enter the delivery address.", "error");
        if (meta.needsPayment && !paymentMethod) return window.showToast("Please select a payment method.", "error");

        const lines = [
            `${meta.icon} ${meta.title}`,
            `Date: ${date}`,
            `Time: ${time}`
        ];

        if (guests) lines.push(`Guests: ${guests}`);
        if (seating) lines.push(`Seating: ${seating}`);
        if (occasion) lines.push(`Occasion: ${occasion}`);
        if (items) lines.push(`Items / Order:\n${items}`);
        if (fulfillment) lines.push(`Fulfillment: ${fulfillment}`);
        if (deliveryAddress) lines.push(`Delivery Address:\n${deliveryAddress}`);
        if (paymentType) lines.push(`Payment Type: ${paymentType}`);
        if (paymentMethod) lines.push(`Payment Method: ${paymentMethod}`);
        if (purpose) lines.push(`Purpose: ${purpose}`);
        if (notes) lines.push(`Notes:\n${notes}`);

        const details = lines.join("\n");

        // Review inside the same sheet. No writes occur until the second action.
        const reviewData = {uid:user.uid,placeId,placeName,requestType,date,time,guests,seating,occasion,items,fulfillment,paymentMethod,paymentType,deliveryAddress,purpose,notes};
        const snapshot = JSON.stringify(reviewData);
        if (bookingReviewSnapshot !== snapshot) {
            renderBookingReview(reviewData);
            bookingReviewSnapshot = snapshot;
            setBookingStep(true);
            return;
        }

        const btn = document.getElementById("confirmBookingBtn");
        bookingSending = true;
        btn.textContent = bookingText("Sending...");
        btn.disabled = true;
        document.getElementById("bookingSecondaryBtn").disabled = true;

        try {
            const userName = AppState.userProfile?.fullName || user.displayName || "Customer";

            // Snapshot the establishment's cancellation refund policy at
            // order time. Cache-first (the map already loaded the place);
            // the read remains only for places outside the map cache.
            let refundPercent = 50;
            try {
                const cachedPlace = cloudPlaces.find(x => x.id === placeId);
                if (cachedPlace) {
                    refundPercent = cachedPlace.refund_percent ?? 50;
                } else {
                    const placeSnap = await window.db.collection("places").doc(placeId).get();
                    if (placeSnap.exists) refundPercent = placeSnap.data().refund_percent ?? 50;
                }
            } catch (e) { /* default 50 */ }

            const requestData = {
                placeId,
                placeName,
                userId: user.uid,
                userName,
                requestType: meta.key,
                requestLabel: meta.shortLabel,
                requestIcon: meta.icon,
                requestGroup: ["table_reservation", "food_reservation"].includes(meta.key) ? "reservation" : "order",
                bookingDate: date,
                bookingTime: time,
                bookingDetails: notes || purpose || items || "None",
                guestCount: guests || null,
                seatingPreference: seating || null,
                occasion: occasion || null,
                orderItems: items || null,
                fulfillmentType: fulfillment || null,
                deliveryAddress: deliveryAddress || null,
                paymentMethod: paymentMethod || null,
                paymentType: paymentType || null,
                purpose: purpose || null,
                details,
                status: "pending",
                refundPercent,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // The server validates identity, Philippine schedule, place and initial payment state.
            const attemptSnapshot=JSON.stringify(reviewData),attemptStorage='vicinify:request-attempt:'+user.uid;
            try{const prior=JSON.parse(sessionStorage.getItem(attemptStorage)||'null');if(prior?.snapshot===attemptSnapshot)bookingSubmissionKey=prior.key;}catch{}
            bookingSubmissionKey=bookingSubmissionKey||window.crypto.randomUUID();
            try{sessionStorage.setItem(attemptStorage,JSON.stringify({snapshot:attemptSnapshot,key:bookingSubmissionKey}));}catch{}
            const createdBooking=await window.ViciData.command('booking', {action:'create',confirmed:true,idempotencyKey:bookingSubmissionKey,request:requestData});
            try{sessionStorage.removeItem(attemptStorage);}catch{}
            window.ViciChat?.recordRequest?.({...createdBooking,placeId,placeName,requestType:meta.key});

            window.showToast(bookingText("Request sent. Opening your transaction chat..."), "success");
            window.closeBookingModal(true);

            setTimeout(() => {
                if (window.openChatModal) window.openChatModal(placeId, placeName, null, "transaction", createdBooking.bookingId);
            }, 350);
        } catch (e) {
            window.showToast("Error sending request: " + e.message, "error");
        } finally {
            bookingSending = false;
            btn.textContent = bookingText(bookingReviewSnapshot ? "Send Request" : "Review request");
            btn.disabled = false;
            document.getElementById("bookingSecondaryBtn").disabled = false;
        }
    };

    window.deletePlacePost = async function(postId) {
        if (!postId || postId === "undefined") {
            return window.showToast("This update cannot be deleted because its record ID is missing.", "error");
        }

        const ans = await window.vConfirm("Delete Post", "Are you sure you want to delete this post? It will be removed from the map for all customers.", "Delete", true);
        if (!ans) return;

        try {
            const postDoc = await window.db.collection("place_posts").doc(postId).get();
            if (!postDoc.exists) return window.showToast("This update was already deleted.", "info");

            const allowed = await canManagePlace(postDoc.data().placeId);
            if (!allowed) {
                return window.showToast("Only the owner or an admin can delete this update.", "error");
            }

            await window.db.collection("place_posts").doc(postId).delete();
            window.showToast("Post deleted successfully.", "success");
        } catch (e) {
            window.showToast("Error deleting post: " + e.message, "error");
        }
    };

    document.addEventListener("DOMContentLoaded", () => {
        const s = readJSON(STORAGE.SETTINGS, { defaultRadius: 300 });
        AppState.radius = Number(s.defaultRadius || 300);
        if (!AppState.userLocation) AppState.userLocation = { lat: null, lng: null };
        if (!AppState.activeCat) AppState.activeCat = "all";
        if (!AppState.mapFilters) AppState.mapFilters = { openNow: false, verified: false, booking: false, delivery: false, highRated: false, freshOnly: false };
        if (AppState.mapFilters.freshOnly == null) AppState.mapFilters.freshOnly = false;

        initMap(); initRadius(); initCats(); initSmartFilters(); ensureViciAIBubble();

        const locateBtn = document.getElementById("locateBtn");
        if (locateBtn && !locateBtn.classList.contains("vici-ai-bubble-launcher")) {
            locateBtn.addEventListener("click", locate);
        }
        document.getElementById("refreshMapBtn")?.addEventListener("click", refreshPlaces);

        document.getElementById("askBtn")?.addEventListener("click", searchPlaces);
        document.getElementById("askInput")?.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                searchPlaces();
            }
        });

        // Map/List state is owned by window.toggleView, used by the buttons and router.

    });

    // Full map reset without a page reload: filters, search, radius and
    // view return to defaults (the in-app equivalent of F5 for the map).
    function resetMap() {
        if (!map) { initMap(); return; }
        try { map.closePopup(); } catch (e) {}
        try { applyBaseTheme(); setTimeout(() => map.invalidateSize(), 200); } catch (e) {}
        AppState.searchQuery = "";
        AppState.activeCat = "all";
        AppState.smartIntent = null;
        const askInput = document.getElementById("askInput");
        if (askInput) askInput.value = "";
        try { renderSmartAnswer(null, []); } catch (e) {}
        document.querySelectorAll("#catChips .chip").forEach(b => b.classList.remove("active"));
        document.querySelector("#catChips .chip[data-cat='all']")?.classList.add("active");
        const defSeg = document.querySelector('#radiusSegment .seg[data-radius="300"]');
        if (defSeg && !defSeg.classList.contains("active")) defSeg.click();
        if (AppState.userLocation && AppState.userLocation.lat != null && AppState.userLocation.lng != null) {
            setUser(AppState.userLocation.lat, AppState.userLocation.lng);
        } else {
            map.setView([13.9417, 121.1678], 14);
            refreshPlaces();
        }
        window.showToast?.("Map reset to defaults.", "success");
    }

    return { getCachedPlace: id => cloudPlaces.find(place=>place.id===id), refresh, locate, processAISearch, searchPlaces, resetMap,
        stopPlaceListeners: () => { try { if (typeof placeUpdatesUnsub === "function") placeUpdatesUnsub(); } catch (e) {} placeUpdatesUnsub = null; try { window.Suki?.unmountPlaceSection?.(); } catch (e) {} },
        resetViciAI: () => { try {
            // Clear + HIDE the panel (privacy wipe for the next account).
            // The old version rendered the welcome here, which UNHID the
            // panel — and since the signed-out cleanup also runs at every
            // cold boot, the AI panel was already open before any tap.
            // toggleViciAI re-renders the welcome on open when empty.
            const panel = document.getElementById("smartAnswerPanel");
            if (panel) { panel.innerHTML = ""; panel.classList.add("hidden"); }
            updateViciAIBubbleVisibility(true);
        } catch (e) {} }
    };
})();

document.addEventListener("click", function(e) {
    const btnMap = e.target.closest("#btnMapView");
    const btnList = e.target.closest("#btnListView");

    if (btnList) {
        const mapCont = document.getElementById("map");
        const listCont = document.getElementById("listViewContainer");
        const btnM = document.getElementById("btnMapView");

        btnList.classList.add("active");
        if (btnM) btnM.classList.remove("active");

        btnList.style.background = "white";
        btnList.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
        if (btnM) {
            btnM.style.background = "transparent";
            btnM.style.boxShadow = "none";
        }

        if (mapCont) mapCont.style.display = "none";
        if (listCont) listCont.style.display = "block";
    }

    if (btnMap) {
        const mapCont = document.getElementById("map");
        const listCont = document.getElementById("listViewContainer");
        const btnL = document.getElementById("btnListView");

        btnMap.classList.add("active");
        if (btnL) btnL.classList.remove("active");

        btnMap.style.background = "white";
        btnMap.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
        if (btnL) {
            btnL.style.background = "transparent";
            btnL.style.boxShadow = "none";
        }

        if (listCont) listCont.style.display = "none";
        if (mapCont) mapCont.style.display = "block";

        if (window.MapPage && typeof window.MapPage.refresh === 'function') {
            setTimeout(() => window.MapPage.refresh(), 200);
        }
    }
});

window.addEventListener('load', function() {
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 500);
});
