
// Lipa City barangays (Vicinify is Lipa-only)
const LIPA_BARANGAYS = ["Adya","Anilao","Anilao-Labac","Antipolo del Norte","Antipolo del Sur","Bagong Pook","Balintawak","Banaybanay","Barangay 1 (Poblacion)","Barangay 2 (Poblacion)","Barangay 3 (Poblacion)","Barangay 4 (Poblacion)","Barangay 5 (Poblacion)","Barangay 6 (Poblacion)","Barangay 7 (Poblacion)","Barangay 8 (Poblacion)","Barangay 9 (Poblacion)","Barangay 10 (Poblacion)","Barangay 11 (Poblacion)","Barangay 12 (Poblacion)","Barangay 13 (Poblacion)","Barangay 14 (Poblacion)","Barangay 15 (Poblacion)","Barangay 16 (Poblacion)","Barangay 17 (Poblacion)","Barangay 18 (Poblacion)","Barangay 19 (Poblacion)","Barangay 20 (Poblacion)","Barangay 21 (Poblacion)","Barangay 22 (Poblacion)","Barangay 23 (Poblacion)","Barangay 24 (Poblacion)","Barangay 25 (Poblacion)","Barangay 26 (Poblacion)","Barangay 27 (Poblacion)","Barangay 28 (Poblacion)","Barangay 29 (Poblacion)","Barangay 30 (Poblacion)","Barangay 31 (Poblacion)","Barangay 32 (Poblacion)","Barangay 33 (Poblacion)","Barangay 34 (Poblacion)","Barangay 35 (Poblacion)","Bolbok","Bugtong na Pulo","Bulacnin","Calamias","Cumba","Dagatan","Duhatan","Halang","Inosloban","Kayumanggi","Latag","Lodlod","Mabini","Malagonlong","Malitlit","Marauoy","Mataas na Lupa","Munting Pulo","Pagolingin East","Pagolingin West","Pinagtongulan","Plaridel","Quezon","Sabang","San Benito","San Carlos","San Celestino","San Francisco","San Guillermo","San Isidro","San Jose","San Juan","San Salvador","San Sebastian","Sapac","Sico","Talisay","Tambo","Tangob","Tanguay","Tipacan"];

function populateBarangayDropdown() {
    const sel = document.getElementById("bizBrgy");
    if (!sel || sel.options.length > 1) return;
    LIPA_BARANGAYS.forEach(b => {
        const o = document.createElement("option");
        o.value = b; o.textContent = b;
        sel.appendChild(o);
    });
}
// Populate on load and when Add page shows
document.addEventListener("DOMContentLoaded", populateBarangayDropdown);

window.AddPage = (() => {
    let miniMap, pinMarker;
    let selectedFilesArray = []; // 🔥 State para sa Photo Grid 🔥

    // 🔥 INJECT MODERN CSS (React/Tailwind Style) 🔥
    const style = document.createElement('style');
    style.innerHTML = `
        /* Modern Inputs */
        #page-add .field input, #page-add .field select, #page-add .field textarea {
            border-radius: 12px !important;
            border: 1px solid #e5e7eb !important;
            padding: 12px 16px !important;
            background: #f9fafb !important;
            transition: all 0.2s !important;
            font-size: 14px !important;
            outline: none !important;
        }
        #page-add .field input:focus, #page-add .field select:focus, #page-add .field textarea:focus {
            border-color: #93c5fd !important;
            background: #ffffff !important;
            box-shadow: 0 0 0 4px rgba(191, 219, 254, 0.4) !important;
        }
        #page-add .card { border-radius: 20px !important; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05) !important; border: 1px solid #f3f4f6 !important; }
        
        /* 🔥 Photo Grid System 🔥 */
        .photo-grid-wrap {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-top: 12px;
        }
        .photo-preview-item {
            aspect-ratio: 1;
            position: relative;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .photo-preview-item img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .remove-photo-btn {
            position: absolute;
            top: 6px;
            right: 6px;
            width: 24px;
            height: 24px;
            background: rgba(0,0,0,0.6);
            color: white;
            border: none;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            backdrop-filter: blur(4px);
            transition: 0.2s;
        }
        .remove-photo-btn:hover { background: rgba(239, 68, 68, 0.9); transform: scale(1.1); }
        .add-photo-btn {
            aspect-ratio: 1;
            border: 2px dashed #cbd5e1;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            background: #f8fafc;
            transition: 0.2s;
            color: #64748b;
        }
        .add-photo-btn:hover { border-color: #93c5fd; background: #eff6ff; color: #3b82f6; }
        
        /* Modern Submit Button */
        #submitPendingBtn {
            border-radius: 16px !important;
            height: 54px !important;
            font-size: 16px !important;
            font-weight: 600 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 8px !important;
        }
        #submitPendingBtn:disabled { opacity: 0.7; cursor: not-allowed; }
        .vici-add-pin-wrap {
            background: transparent !important;
            border: 0 !important;
            width: 40px !important;
            height: 52px !important;
        }
        .vici-add-pin {
            width: 40px;
            height: 52px;
            display: block;
            cursor: grab;
            filter: drop-shadow(0 12px 16px rgba(15, 23, 42, 0.24));
        }
        .vici-add-pin:active { cursor: grabbing; }
        .vici-add-pin svg {
            width: 40px;
            height: 52px;
            display: block;
        }
        .vici-add-pin-img {
            background: transparent !important;
            border: 0 !important;
            filter: drop-shadow(0 12px 16px rgba(15, 23, 42, 0.24));
        }
    `;
    document.head.appendChild(style);

    function setLatLngOut(lat, lng) {
        document.getElementById("latOut").textContent = lat?.toFixed?.(6) ?? "—";
        document.getElementById("lngOut").textContent = lng?.toFixed?.(6) ?? "—";
    }

    // Debounce pin detection and apply only the newest result. Manual edits are preserved.
    let pinGeocodeTimer = null, pinGeocodeVersion = 0, lastPinBarangay = "";
    function autofillFromPin(lat, lng) {
        const version=++pinGeocodeVersion;
        clearTimeout(pinGeocodeTimer);
        const fields=[document.getElementById('bizAddr'),document.getElementById('bizBrgy')];
        fields.forEach(field=>{
            if(!field||field.dataset.geoBound)return;
            field.dataset.geoBound='1';
            field.addEventListener(field.tagName==='SELECT'?'change':'input',()=>{field.dataset.geoManual=field.value.trim()?'1':'';delete field.dataset.geoValue;});
        });
        pinGeocodeTimer = setTimeout(async () => {
            if (!window.reverseGeocode) return;
            const geo = await window.reverseGeocode(lat, lng);
            if (version!==pinGeocodeVersion || !geo) return;
            const canFill=field=>field&&field.dataset.geoManual!=='1'&&(!field.value.trim()||field.value===field.dataset.geoValue);
            const assign=(field,value)=>{field.value=value;field.dataset.geoValue=value;};
            const sel = document.getElementById("bizBrgy");
            if (canFill(sel)) {
                const norm = value => String(value || "").toLowerCase().replace(/^(?:barangay|brgy\.?)\s+/i, "").trim();
                const want=norm(geo.barangay);
                let opt=Array.from(sel.options).find(option=>want&&norm(option.value)===want);
                if(!opt){const hits=Array.from(sel.options).filter(option=>want&&norm(option.value).includes(want));if(hits.length===1)opt=hits[0];}
                assign(sel,opt?.value||'');
            }
            const addr=document.getElementById('bizAddr');
            const address=[geo.road,geo.barangay?`Brgy. ${geo.barangay}`:'',geo.city,geo.province].filter(Boolean).join(', ');
            if(canFill(addr))assign(addr,address);
            if (geo.barangay && geo.barangay !== lastPinBarangay) {
                lastPinBarangay = geo.barangay;
                window.showToast?.(`Address detected: ${geo.label}`, "success");
            }
        }, 700);
    }

    function ensureMiniMap() {
        if (miniMap) return;

        const startLat = AppState.userLocation?.lat ?? 13.9417;
        const startLng = AppState.userLocation?.lng ?? 121.1678;

        miniMap = L.map("miniMap", { zoomControl: true, dragging: true }).setView([startLat, startLng], 16);

       L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '&copy; OpenStreetMap contributors',
            keepBuffer: 4, updateWhenIdle: true
        }).addTo(miniMap);

        // 🔥 MODERN REACT MAP PIN 🔥
        const addPinSvg = `
            <svg viewBox="0 0 40 52" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 50C20 50 5 31.5 5 19.5C5 10.94 11.72 4 20 4C28.28 4 35 10.94 35 19.5C35 31.5 20 50 20 50Z" fill="#237e72" stroke="#ffffff" stroke-width="4"/>
                <circle cx="20" cy="19.5" r="7" fill="#ffffff"/>
                <circle cx="20" cy="19.5" r="3.2" fill="#237e72"/>
            </svg>
        `;

        const addIcon = L.icon({
            iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(addPinSvg)}`,
            className: 'vici-add-pin-img',
            iconSize: [40, 52],
            iconAnchor: [20, 50]
        });

        pinMarker = L.marker([startLat, startLng], {
            draggable: true,
            icon: addIcon
        }).addTo(miniMap);

        window.debouncedIcons?.();

        setLatLngOut(startLat, startLng);

        pinMarker.on("dragend", () => {
            const ll = pinMarker.getLatLng();
            setLatLngOut(ll.lat, ll.lng);
            autofillFromPin(ll.lat, ll.lng);
        });

        miniMap.on("click", (e) => {
            pinMarker.setLatLng(e.latlng);
            setLatLngOut(e.latlng.lat, e.latlng.lng);
            autofillFromPin(e.latlng.lat, e.latlng.lng);
        });
    }

    // Reset the pin to the user's own location (for when the pin has
    // been dragged far away and is effectively lost on the mini map).
    window.AddPageResetPin = function () {
        const done = (lat, lng) => {
            ensureMiniMap();
            if (!pinMarker || !miniMap) return;
            pinMarker.setLatLng([lat, lng]);
            miniMap.setView([lat, lng], 16);
            setLatLngOut(lat, lng);
            autofillFromPin(lat, lng);
            window.showToast?.("Pin moved to your location.", "success");
        };
        if (AppState.userLocation?.lat != null && AppState.userLocation?.lng != null) {
            done(AppState.userLocation.lat, AppState.userLocation.lng);
        } else if (navigator.geolocation) {
            window.showToast?.("Getting your location...", "info");
            navigator.geolocation.getCurrentPosition(
                pos => done(pos.coords.latitude, pos.coords.longitude),
                () => window.showToast?.("Unable to get your location. Please allow location permission.", "error"),
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            window.showToast?.("Location is not supported on this device.", "error");
        }
    };

   function refreshMiniMap() {
        ensureMiniMap();
        setTimeout(() => miniMap.invalidateSize(), 300); // Tumaas mula 100 naging 300

        if (pinMarker && AppState.userLocation?.lat != null && AppState.userLocation?.lng != null) {
            pinMarker.setLatLng([AppState.userLocation.lat, AppState.userLocation.lng]);
            miniMap.setView([AppState.userLocation.lat, AppState.userLocation.lng], 16);
            setLatLngOut(AppState.userLocation.lat, AppState.userLocation.lng);
            autofillFromPin(AppState.userLocation.lat, AppState.userLocation.lng);
        }
    }

    // 🔥 INITIALIZE MODERN PHOTO GRID 🔥
    function initPhotoGrid() {
        const input = document.getElementById("bizPhotos");
        const uploadBox = document.querySelector(".uploadBox");
        if (!input || !uploadBox) return;

        // Itago ang original na input box at text
        input.style.display = "none";
        const hint = uploadBox.querySelector(".uploadHint");
        if(hint) hint.style.display = "none";

        // Gawa ng container para sa grid
        let gridWrap = document.getElementById("viciPhotoGrid");
        if (!gridWrap) {
            gridWrap = document.createElement("div");
            gridWrap.id = "viciPhotoGrid";
            gridWrap.className = "photo-grid-wrap";
            uploadBox.appendChild(gridWrap);
        }

        // Logic para i-draw yung pictures at Add button
        function renderGrid() {
            gridWrap.innerHTML = ""; // Clear muna

            // Render existing photos
            selectedFilesArray.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const div = document.createElement("div");
                    div.className = "photo-preview-item";
                    div.innerHTML = `
                        <img src="${e.target.result}" />
                        <button type="button" class="remove-photo-btn" data-index="${index}" title="Remove">
                            <i data-lucide="x" style="width:14px; height:14px;"></i>
                        </button>
                    `;
                    gridWrap.insertBefore(div, gridWrap.lastChild); // Ilagay bago ang add button (kung meron)
                    window.debouncedIcons?.();

                    // Remove logic
                    div.querySelector(".remove-photo-btn").onclick = (e) => {
                        e.stopPropagation();
                        selectedFilesArray.splice(index, 1);
                        renderGrid(); // Re-render kapag may binura
                    };
                };
                reader.readAsDataURL(file);
            });

            // Render Add Button (kung hindi pa 5)
            if (selectedFilesArray.length < 5) {
                const addBtn = document.createElement("label");
                addBtn.className = "add-photo-btn";
                addBtn.innerHTML = `
                    <i data-lucide="upload-cloud" style="width:24px; height:24px; margin-bottom:4px;"></i>
                    <span style="font-size:10px; font-weight:600;">Upload</span>
                `;
                addBtn.onclick = (e) => {
                    e.preventDefault();
                    input.click(); // I-trigger yung nakatagong input
                };
                gridWrap.appendChild(addBtn);
                window.debouncedIcons?.();
            }
        }

        // Kapag pumili ng picture sa hidden input
        input.addEventListener("change", (e) => {
            const files = Array.from(e.target.files);
            if (selectedFilesArray.length + files.length > 5) {
                if (window.showToast) window.showToast("Maximum 5 photos only", "error");
                else alert("Maximum 5 photos only");
                return;
            }
            // Idagdag sa array
            selectedFilesArray = selectedFilesArray.concat(files);
            input.value = ""; // I-reset ang input para pwede pumili ulit ng parehong file
            renderGrid();
        });

        // Initial render (blanko dapat, may Add button lang)
        renderGrid();
    }

    // 🔥 LOGO INPUT (PLUS49) — optional single logo, preview only; upload happens on submit 🔥
    function initLogoInput() {
        const input = document.getElementById("bizLogo");
        const preview = document.getElementById("bizLogoPreview");
        if (!input || !preview || input.dataset.wired) return;
        input.dataset.wired = "1";
        input.addEventListener("change", (e) => {
            if (e.target.files && e.target.files.length > 0) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    preview.src = ev.target.result;
                    preview.style.display = "block";
                };
                reader.readAsDataURL(e.target.files[0]);
            } else {
                preview.style.display = "none";
                preview.removeAttribute("src");
            }
        });
    }

    function clearLogoInput() {
        const input = document.getElementById("bizLogo");
        const preview = document.getElementById("bizLogoPreview");
        if (input) input.value = "";
        if (preview) { preview.style.display = "none"; preview.removeAttribute("src"); }
    }

    // 🔥 STABLE COMPRESSOR (Uses selectedFilesArray) 🔥
    async function readPhotos(filesArray) {
        const arr = Array.from(filesArray || []).slice(0, 5); 
        const compressedResults = [];
        
        for (const file of arr) {
            try {
                const userId = window.auth?.currentUser?.uid || "anonymous";
                const photoUrl = await window.uploadImageFileToStorage(file, `places/${userId}`, { maxWidth: 900, quality: 0.78 });
                compressedResults.push(photoUrl);
            } catch (err) {
                console.error("Skipping a photo due to error:", err);
            }
        }
        return compressedResults;
    }

    async function submitPending() {
        if (!window.auth?.currentUser) {
            if (window.showToast) showToast("You must be logged in to add an establishment.", "error");
            else alert("You must be logged in to add an establishment.");
            return;
        }

        if (!pinMarker) {
            if (window.showToast) showToast("Mini map not ready. Paki-refresh ang page.", "error");
            else alert("Mini map not ready.");
            return;
        }

        const ll = pinMarker.getLatLng();

const name = (document.getElementById("bizName").value || "").trim();
const nameProblem = window.ContentPolicy?.error('place',name);
if(nameProblem) return window.showToast(nameProblem,'error');
const cat = document.getElementById("bizCat").value;
const priceRange = document.getElementById("bizPriceRange") ? document.getElementById("bizPriceRange").value : "";
const addr = (document.getElementById("bizAddr").value || "").trim();
const brgy = (document.getElementById("bizBrgy").value || "").trim();
    const city = "Lipa City"; // Locked — Vicinify is Lipa-only
const phone = (document.getElementById("bizPhone").value || "").trim();
const desc = (document.getElementById("bizDesc").value || "").trim();

if (!name || !cat || !addr || !brgy || !desc) {
    if (window.showToast) showToast("Please fill Business Name, Category, Address, Barangay, and Description.", "error");
    else alert("Please fill Business Name, Category, Address, Barangay, and Description.");
    return;
}

if (name.length < 3) {
    if (window.showToast) showToast("Business name must be at least 3 characters.", "error");
    else alert("Business name must be at least 3 characters.");
    return;
}

if (name.length > 120) {
    if (window.showToast) showToast("Business name must be at most 120 characters.", "error");
    else alert("Business name must be at most 120 characters.");
    return;
}

if (desc.length > 1000) {
    if (window.showToast) showToast("Description must be at most 1000 characters.", "error");
    else alert("Description must be at most 1000 characters.");
    return;
}

if (desc.length < 10) {
    if (window.showToast) showToast("Description must be at least 10 characters.", "error");
    else alert("Description must be at least 10 characters.");
    return;
}

        const submitBtn = document.getElementById("submitPendingBtn");
        if (submitBtn) {
            submitBtn.disabled = true;
            // 🔥 React Style Loading Button 🔥
            submitBtn.innerHTML = `<i data-lucide="loader-2" class="animate-spin" style="width:20px;"></i> Nagsu-submit...`;
            window.debouncedIcons?.();
        }

        try {
            // Branding and photo uploads belong to the verified owner edit flow.
            const photos = [];
            const logoUrl = "";
            // Admins (incl. the permanent admin UID) skip the approval
            // queue — the status AND the success message both use this.
            const isAdminSubmitter = AppState.userProfile?.role === "admin" || window.auth.currentUser.uid === "Z45NZhQTgsTUX79WJ5ksCH8N3c02";

           await window.ContentPolicy.create(window.db,'places',{
    name,

    // old field names
    cat,
    addr,
    brgy,
    city,
    phone,
    desc,

    ...(window.PlaceFeatures && document.getElementById("bizFeatures") ? { place_features: window.PlaceFeatures.readForm(document.getElementById("bizFeatures")) } : {}),
    // new/standard field names
    category: cat,
    address: addr,
    barangay: brgy,
    contact_phone: phone,
    description: desc,

    lat: ll.lat,
    lng: ll.lng,
    photos,
    logoUrl,
    priceRange,

    status: "closed",
    approval_status: isAdminSubmitter ? "approved" : "pending",   addedBy: window.auth.currentUser.uid,
owner_uid: null,

    createdAt: firebase.firestore.FieldValue.serverTimestamp()
});

            // Reset Form
            window.PlaceFeatures?.renderForm(document.getElementById("bizFeatures"));
            document.getElementById("bizName").value = "";
            document.getElementById("bizCat").value = "";
            if (document.getElementById("bizPriceRange")) document.getElementById("bizPriceRange").value = "";
            document.getElementById("bizAddr").value = "";
            document.getElementById("bizBrgy").value = "";
            document.getElementById("bizPhone").value = "";
            document.getElementById("bizDesc").value = "";
            
            // Reset Photo Grid
            selectedFilesArray = [];
            initPhotoGrid(); // Re-render to show empty state
            clearLogoInput(); // PLUS49: reset logo field too

            if (isAdminSubmitter) {
                if (window.showToast) showToast("Success! Establishment approved and published.", "success");
                else alert("Establishment approved and published!");
            } else {
                if (window.showToast) showToast("Success! Establishment Submitted for Admin Approval.", "success");
                else alert("Establishment Submitted to Cloud! (Pending Admin Approval)");
            }

            showPage("page-dashboard");
            // v53BK #5: removed duplicate DashboardPage.render() — showPage already triggers render()
        } catch (error) {
            console.error(error);
            if (window.showToast) showToast("Error adding establishment: " + error.message, "error");
            else alert("Error adding establishment: " + error.message);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<i data-lucide="send" style="width:20px;"></i> Submit for Approval`;
                window.debouncedIcons?.();
            }
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        const addrLabel = document.getElementById("bizAddr")?.closest(".field")?.querySelector("label");
        const brgyLabel = document.getElementById("bizBrgy")?.closest(".field")?.querySelector("label");
        const descLabel = document.getElementById("bizDesc")?.closest(".field")?.querySelector("label");
        if (addrLabel) addrLabel.textContent = "Address *";
        if (brgyLabel) brgyLabel.textContent = "Barangay *";
        if (descLabel) descLabel.textContent = "Description *";
        document.getElementById("submitPendingBtn")?.addEventListener("click", submitPending);
        initPhotoGrid(); // Tawagin agad pag-load para mabuo yung grid UI
        initLogoInput(); // PLUS49 logo preview wiring
        populateBarangayDropdown(); // Barangay dropdown + locked Lipa City
    });

    return { refreshMiniMap };
})();
