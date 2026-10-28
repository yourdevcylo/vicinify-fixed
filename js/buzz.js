window.BuzzPage = (() => {
    let activeType = "all";
    let currentPosts = [];
    let userEstablishments = [];
    let estCacheAt = 0;
    let unsubscribe = null;
    let selectedMediaFile = null;
    let isBusinessPost = false;

    // 🔥 INJECT MODERN REACT-STYLE CSS 🔥
    const style = document.createElement('style');
    style.innerHTML = `
        /* Modern Card Styling */
        .mod-card { background: #fff; border-radius: 1rem; padding: 1rem; border: 1px solid #f3f4f6; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); margin-bottom: 1rem; animation: slideUp 0.4s ease forwards; opacity: 0; transform: translateY(16px); }
        @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
        
        .mod-avatar { width: 2.25rem; height: 2.25rem; border-radius: 9999px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: #f3f4f6; color: #6b7280; font-weight: 700; font-size: 0.875rem; }
        .mod-avatar.biz { background: #dbeafe; color: #2563eb; }
        
        .mod-badge { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.5rem; border-radius: 9999px; white-space: nowrap; }
        
        .mod-btn { display: inline-flex; align-items: center; gap: 0.375rem; font-size: 0.75rem; font-weight: 500; padding: 0.375rem 0.75rem; border-radius: 9999px; transition: all 0.2s; cursor: pointer; border: none; outline: none; }
        .mod-btn-like { background: #f9fafb; color: #6b7280; }
        .mod-btn-like:hover { background: #fef2f2; color: #f87171; }
        .mod-btn-like.liked { background: #fef2f2; color: #ef4444; }
        .mod-btn-comment { background: #f9fafb; color: #6b7280; }
        .mod-btn-comment:hover { background: #eff6ff; color: #3b82f6; }

        /* Modern Comment Section */
        .mod-comment-wrap { margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #f3f4f6; display: flex; flex-direction: column; gap: 0.75rem; }
        .mod-comment { display: flex; gap: 0.5rem; }
        .mod-comment-bubble { background: #f9fafb; border-radius: 0.75rem; padding: 0.5rem 0.75rem; flex: 1; }
        
        .mod-input-row { display: flex; gap: 0.5rem; }
        .mod-input { flex: 1; font-size: 0.75rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 9999px; padding: 0.5rem 0.75rem; outline: none; }
        .mod-input:focus { border-color: #93c5fd; }
        .mod-send-btn { width: 2rem; height: 2rem; border-radius: 9999px; background: #3b82f6; color: white; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; }
        .mod-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* 🔥 MAKUKULAY NA PILLS / CHIPS 🔥 */
        .type-chip { display: flex; align-items: center; gap: 6px; font-size: 13px; padding: 8px 16px; border-radius: 9999px; border: 1px solid #e5e7eb; background: #ffffff; color: #6b7280; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .type-chip:hover { background: #f9fafb; border-color: #d1d5db; }
        
        .type-chip.active { border-color: transparent; color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .type-chip.active.all { background: linear-gradient(to right, #6b7280, #4b5563); }
        .type-chip.active.promo { background: linear-gradient(to right, #4ade80, #16a34a); }
        .type-chip.active.event { background: linear-gradient(to right, #c084fc, #9333ea); }
        .type-chip.active.tip { background: linear-gradient(to right, #facc15, #ca8a04); }
        .type-chip.active.announcement { background: linear-gradient(to right, #f87171, #dc2626); }
        .type-chip.active.general { background: linear-gradient(to right, #60a5fa, #2563eb); }

        /* Business Post UI */
        .mod-btn-biz { background: #f9fafb; color: #6b7280; border: 1px solid #e5e7eb; padding: 6px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s; }
        .mod-btn-biz.active { background: #dbeafe; color: #1d4ed8; border-color: #bfdbfe; }
        .mod-select-biz { border: 1px solid #e5e7eb; border-radius: 8px; padding: 6px 10px; font-size: 12px; background: white; color: #374151; outline: none; flex: 1; display: none; }
        .mod-select-biz.show { display: inline-block; }
    `;
    document.head.appendChild(style);

    const TYPE_CONFIG = {
        promo: { label: 'Promo', icon: 'tag', color: 'background:#dcfce7; color:#15803d;' },
        event: { label: 'Event', icon: 'calendar-days', color: 'background:#f3e8ff; color:#7e22ce;' },
        tip: { label: 'Tip', icon: 'lightbulb', color: 'background:#fef9c3; color:#a16207;' },
        announcement: { label: 'Announcement', icon: 'megaphone', color: 'background:#fee2e2; color:#b91c1c;' },
        general: { label: 'Update', icon: 'message-square', color: 'background:#dbeafe; color:#1d4ed8;' }
    };

    const BARANGAYS = [
        "All Barangays", "Barangay 1 (Poblacion)", "Barangay 2 (Poblacion)", "Barangay 3 (Poblacion)", "Barangay 4 (Poblacion)", "Barangay 5 (Poblacion)", "Barangay 6 (Poblacion)", "Barangay 7 (Poblacion)", "Barangay 8 (Poblacion)", "Barangay 9 (Poblacion)", "Barangay 10 (Poblacion)", "Barangay 11 (Poblacion)", "Barangay 12 (Poblacion)", "Barangay 13 (Poblacion)", "Barangay 14 (Poblacion)", "Barangay 15 (Poblacion)", "Barangay 16 (Poblacion)", "Barangay 17 (Poblacion)", "Barangay 18 (Poblacion)", "Barangay 19 (Poblacion)", "Barangay 20 (Poblacion)", "Barangay 21 (Poblacion)", "Barangay 22 (Poblacion)", "Barangay 23 (Poblacion)", "Barangay 24 (Poblacion)", "Barangay 25 (Poblacion)", "Barangay 26 (Poblacion)", "Barangay 27 (Poblacion)", "Barangay 28 (Poblacion)", "Barangay 29 (Poblacion)", "Barangay 30 (Poblacion)", "Barangay 31 (Poblacion)", "Barangay 32 (Poblacion)", "Barangay 33 (Poblacion)", "Barangay 34 (Poblacion)", "Barangay 35 (Poblacion)", "Adya", "Anilao", "Anilao-Labac", "Antipolo del Norte", "Antipolo del Sur", "Bagong Pook", "Balintawak", "Banaybanay", "Bolbok", "Bugtong na Pulo", "Bulacnin", "Calamias", "Cumba", "Dagatan", "Duhatan", "Halang", "Inosloban", "Kayumanggi", "Latag", "Lodlod", "Mabini", "Malagonlong", "Malitlit", "Marauoy", "Mataas na Lupa", "Munting Pulo", "Pagolingin East", "Pagolingin West", "Pinagtongulan", "Plaridel", "Quezon", "Sabang", "San Benito", "San Carlos", "San Celestino", "San Francisco", "San Guillermo", "San Isidro", "San Jose", "San Juan", "San Salvador", "San Sebastian", "Sapac", "Sico", "Talisay", "Tambo", "Tangob", "Tanguay", "Tipacan"
    ];

    function getCurrentUser() { return window.auth?.currentUser; }
    function getUserName() { return AppState.userProfile?.fullName || window.auth?.currentUser?.displayName || "Anonymous"; }
    function safeJsString(str) { return String(str ?? "").split("").map(c => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")).join(""); }

    function timeAgo(dateParam) {
        if (!dateParam) return '';
        const date = typeof dateParam === 'object' && dateParam.toDate ? dateParam.toDate() : new Date(dateParam);
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " mins ago";
        return "Just now";
    }

    async function fetchUserEstablishments() {
        const user = getCurrentUser();
        if (!user) return;
        try {
            if (!(userEstablishments.length && (Date.now() - estCacheAt) < 60000)) {
                const ownedSnap = await window.db.collection("places").where("owner_uid", "==", user.uid).limit(20).get();
                let placesMap = new Map();
                ownedSnap.forEach(doc => placesMap.set(doc.id, { ...doc.data(), id: doc.id }));
                userEstablishments = Array.from(placesMap.values());
                estCacheAt = Date.now();
            }
            
            const selectEl = document.getElementById("bizPostSelect");
            const toggleWrapper = document.getElementById("bizToggleWrapper");
            
            if (userEstablishments.length > 0 && selectEl && toggleWrapper) {
                toggleWrapper.style.display = "flex";
                selectEl.innerHTML = `<option value="">Select establishment...</option>`;
                userEstablishments.forEach(e => {
                    const option = document.createElement("option");
                    option.value = e.id;
                    option.textContent = e.name || "Unnamed establishment";
                    selectEl.appendChild(option);
                });
            } else if (selectEl && toggleWrapper) {
                toggleWrapper.style.display = "none";
                selectEl.innerHTML = "";
            }
        } catch (e) {
            console.error("Error fetching establishments:", e);
        }
    }

    function openModal() {
        if (!getCurrentUser()) {
            if(window.showToast) window.showToast("You need to log in to post!", "error");
            else alert("You need to log in to post!");
            showPage("page-login");
            return;
        }
        
        const _pb=document.getElementById("postBody"); if(_pb) _pb.value="";
        const _cc=document.getElementById("charCount"); if(_cc) _cc.textContent="0/500";
        document.getElementById("postMedia").value = "";
        document.getElementById("mediaPreviewWrap").style.display = "none";
        
        isBusinessPost = false;
        document.getElementById("toggleBizPostBtn").classList.remove("active");
        document.getElementById("toggleBizPostBtn").setAttribute("aria-pressed", "false");
        document.getElementById("bizPostSelect").classList.remove("show");
        document.getElementById("bizPostSelect").value = "";
        
        selectedMediaFile = null;
        window.__viciSyncPublish?.();
        fetchUserEstablishments();
        
        const m = document.getElementById("postModal");
        if (m) { m.classList.remove("hidden"); m.setAttribute("aria-hidden", "false"); }
    }

    function closeModal() {
        const m = document.getElementById("postModal");
        if (m) { m.classList.add("hidden"); m.setAttribute("aria-hidden", "true"); }
    }

    async function publish() {
        const user = getCurrentUser();
        if (!user) return;

        let selectedType = "general";
        document.querySelectorAll("#postModal .type-chip").forEach(c => {
            if(c.classList.contains("active")) selectedType = c.dataset.val;
        });

        const body = (document.getElementById("postBody").value || "").trim();
        const brgy = document.getElementById("postBarangay").value;
        const selectedBizId = document.getElementById("bizPostSelect").value;

        const bodyProblem=window.ContentPolicy?.error('post',body);
        if(bodyProblem) return window.showToast ? window.showToast(bodyProblem,'error') : alert(bodyProblem);
        if (!body) {
            window.showToast ? window.showToast("Post content is empty!", "error") : alert("Post content is empty!");
            return;
        }

        if (isBusinessPost && !selectedBizId) {
            window.showToast ? window.showToast("Please select an establishment!", "error") : alert("Please select an establishment!");
            return;
        }

        const selectedBiz = userEstablishments.find(e => e.id === selectedBizId);
        if (isBusinessPost && (!selectedBiz || selectedBiz.owner_uid !== user.uid)) {
            window.showToast ? window.showToast("Only the approved business owner can post as this establishment.", "error") : alert("Only the approved business owner can post as this establishment.");
            return;
        }

        const publishBtn = document.getElementById("publishPostBtn");
        publishBtn.disabled = true;
        publishBtn.innerHTML = `<i data-lucide="loader-2" class="animate-spin"></i> Posting...`;
        window.debouncedIcons?.();

        try {
           let mediaUrl = null;

            if (selectedMediaFile) {
                if (selectedMediaFile.type.startsWith("video/")) throw new Error("Only images are supported for now.");

                mediaUrl = await window.uploadImageFileToStorage(selectedMediaFile, `buzz_posts/${user.uid}`, { maxWidth: 900, quality: 0.8 });
            }

            await window.ContentPolicy.create(window.db, 'buzz_posts', {
                type: selectedType,
                barangay: brgy,
                body: body,
                mediaUrl: mediaUrl,
                likes: 0,
                likedBy: [],
                comments: [],
                authorUid: user.uid,
                authorName: getUserName(),
                
                isBusinessPost: isBusinessPost,
                establishmentId: isBusinessPost ? selectedBizId : null,
                establishmentName: isBusinessPost && selectedBiz ? selectedBiz.name : null,
                
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            closeModal();
            if(window.showToast) window.showToast("Post published.", "success");
        } catch (error) {
            if(window.showToast) window.showToast("Error: " + error.message, "error");
        } finally {
            publishBtn.disabled = false;
            publishBtn.textContent = "Publish";
        }
    }

    function listenToPosts() {
        if (unsubscribe) unsubscribe();

        const wrap = document.getElementById("buzzList");
        if (wrap) wrap.innerHTML = `<div class="muted" style="text-align:center; padding:40px; display:flex; flex-direction:column; align-items:center; gap:8px;"><i data-lucide="loader-2" class="animate-spin" style="color:#94a3b8;"></i> Fetching live posts...</div>`;
        window.debouncedIcons?.();

        let feed = window.db.collection("buzz_posts");
        const area = document.getElementById("barangayFilter")?.value || "All Barangays";
        if (area !== "All Barangays") feed = feed.where("barangay", "==", area);
        if (activeType !== "all") feed = feed.where("type", "==", activeType);
        unsubscribe = feed
            .orderBy("createdAt", "desc")
            .limit(15)
            .onSnapshot((snapshot) => {
currentPosts = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));                renderUI();
            }, (error) => {
                console.error("Error fetching live posts:", error);
                window.handleFirestoreError(error);
            });
    }

    function renderUI() {
        const wrap = document.getElementById("buzzList");
        if (!wrap) return;

        const bFilter = document.getElementById("barangayFilter")?.value || "All Barangays";
        const currentUserUid = getCurrentUser()?.uid;

        const filtered = currentPosts.filter(p => {
            const catMatch = (activeType === "all" || p.type === activeType);
            const postBrgy = p.barangay || "Lipa City";
            const brgyMatch = (bFilter === "All Barangays" || postBrgy === bFilter);
            return catMatch && brgyMatch;
        });

        if (filtered.length === 0) {
            wrap.innerHTML = `
                <div class="buzz-empty-state">
                    <div class="buzz-empty-card">
                        <div style="background:#f1f5f9; width:64px; height:64px; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                            <i data-lucide="zap" style="width:32px; height:32px; color:#94a3b8;"></i>
                        </div>
                        <div style="font-weight:800; font-size:17px; color:#0f172a;">No posts yet</div>
                        <div style="font-size:13px;">Be the first to share something in ${escapeHtml(bFilter)}.</div>
                        <button class="primaryBtn buzzEmptyBtn" id="emptyPostBtn" style="padding: 10px 24px; border-radius:99px;"><i data-lucide="plus"></i> Post Now</button>
                    </div>
                </div>
            `;
            document.getElementById("emptyPostBtn")?.addEventListener("click", openModal);
            window.debouncedIcons?.();
            return;
        }

        wrap.innerHTML = filtered.map((p, index) => {
            const isLiked = p.likedBy && currentUserUid && p.likedBy.includes(currentUserUid);
            const isAuthor = currentUserUid && currentUserUid === p.authorUid;
            
            const isBiz = p.isBusinessPost;
            const displayName = isBiz && p.establishmentName ? p.establishmentName : (p.authorName || "Anonymous");
            const initial = displayName.charAt(0).toUpperCase();
            const avatarClass = isBiz ? "mod-avatar biz" : "mod-avatar";
            const avatarIcon = isBiz ? `<i data-lucide="store" style="width:16px; height:16px;"></i>` : initial;
            const verifiedBadge = isBiz ? `<i data-lucide="badge-check" style="width:14px; height:14px; color:#3b82f6;"></i>` : '';
            
            const config = TYPE_CONFIG[p.type] || TYPE_CONFIG.general;
            
            let mediaHtml = "";
            const safeMediaUrl = window.safeImageUrl ? window.safeImageUrl(p.mediaUrl) : p.mediaUrl;
            if (safeMediaUrl) {
                mediaHtml = `<div class="buzz-feed-media"><img src="${escapeHtml(safeMediaUrl)}" loading="lazy" /></div>`;
            }

            const deleteBtnHtml = isAuthor 
                ? `<button class="deletePostBtn buzz-feed-icon-btn" data-id="${p.id}" title="Delete"><i data-lucide="trash-2"></i></button>` 
                : '';
            const comments = Array.isArray(p.comments) ? p.comments : [];
            const likeCount = Number(p.likes) || 0;
            const commentCount = comments.length;
            const metaBarangay = p.barangay ? `${escapeHtml(p.barangay)} &middot; ` : "";
            const sourcePlaceId = p.sourcePlaceId || p.establishmentId || "";
            const sourceHtml = sourcePlaceId ? `
                <button type="button" class="buzz-source-place" onclick="window.viewPlace && window.viewPlace('${safeJsString(sourcePlaceId)}')">
                    <i data-lucide="store"></i>
                    <span>View ${escapeHtml(p.establishmentName || "establishment")}</span>
                </button>
            ` : "";

            return `
            <article class="mod-card buzz-feed-card" style="animation-delay: ${index * 0.04}s;">
                <div class="buzz-feed-head">
                    <div class="buzz-feed-author">
                        <div class="${avatarClass} buzz-feed-avatar">${avatarIcon}</div>
                        <div class="buzz-feed-author-main">
                            <div class="buzz-feed-name">
                                ${escapeHtml(displayName)} ${verifiedBadge}
                            </div>
                            <div class="buzz-feed-meta">
                                ${p.barangay ? escapeHtml(p.barangay) + ' · ' : ''}${timeAgo(p.createdAt)}
                            </div>
                        </div>
                    </div>
                    <div class="buzz-feed-tools">
                        <span class="mod-badge buzz-feed-type" style="${config.color}">
                            <i data-lucide="${config.icon}"></i> ${config.label}
                        </span>
                        ${deleteBtnHtml}
                    </div>
                </div>

                <div class="buzz-feed-body">${escapeHtml(p.body)}</div>
                
                ${mediaHtml}
                ${sourceHtml}

                <div class="buzz-feed-actions">
                    <button class="mod-btn mod-btn-like likeBtn ${isLiked ? "liked" : ""}" data-id="${p.id}">
                        <i data-lucide="heart" ${isLiked ? 'style="fill:currentColor;"' : ""}></i>
                        <span class="likeCount">${likeCount > 0 ? likeCount : 'Like'}</span>
                    </button>
                    <button class="mod-btn mod-btn-comment commentBtn" data-id="${p.id}">
                        <i data-lucide="message-circle"></i>
                        <span data-i18n="Comment">Comment</span>
                        ${commentCount ? `<span class="buzz-c-count">${commentCount}</span>` : ""}
                    </button>
                </div>

                <div class="mod-comment-wrap buzz-feed-comments hidden" id="comments-${p.id}">
                    <div class="commentList">
                        ${comments.length === 0 ? `<div class="buzz-no-comments" data-i18n="No comments yet. Start the conversation.">No comments yet. Start the conversation.</div>` : ''}
                        ${comments.map(c => `
                            <div class="mod-comment">
                                <div class="mod-avatar buzz-comment-avatar">${escapeHtml(c.authorName ? c.authorName.charAt(0).toUpperCase() : 'U')}</div>
                                <div class="mod-comment-bubble buzz-comment-bubble">
                                    <div class="buzz-comment-name">${escapeHtml(c.authorName || "User")}</div>
                                    <div class="buzz-comment-text">${escapeHtml(c.text)}</div>
                                    <div class="buzz-comment-time">${timeAgo(c.createdAt)}</div>
                                </div>
                            </div>
                        `).join("")}
                    </div>
                    <div class="mod-input-row">
                        <input type="text" class="mod-input" maxlength="500" aria-label="Write a comment" id="input-${p.id}" placeholder="Write a comment..." data-i18n-placeholder="Write a comment..." />
                        <button class="mod-send-btn sendCommentBtn" aria-label="Send comment" data-id="${p.id}"><i data-lucide="send"></i></button>
                    </div>
                </div>
            </article>
            `;
        }).join("");
        wrap.querySelectorAll(".buzz-feed-meta").forEach(meta => {
            meta.textContent = meta.textContent.replace(/\u00c2\u00b7/g, "\u00b7");
        });

        attachActionListeners();
        window.debouncedIcons?.();
        window.LangManager?.translateDOM?.();
    }

    function attachActionListeners() {
        document.querySelectorAll(".deletePostBtn").forEach(btn => {
            btn.onclick = async () => {
                const postId = btn.dataset.id;
                const ans = window.vConfirm ? await window.vConfirm("Delete Post", "Are you sure you want to permanently delete your post?", "Delete", true) : confirm("Delete this post?");
                if (!ans) return;

                try {
                    await window.db.collection("buzz_posts").doc(postId).delete();
                    if(window.showToast) window.showToast("Post deleted successfully.", "success");
                } catch (e) {
                    if(window.showToast) window.showToast("Error: " + e.message, "error");
                }
            };
        });

        document.querySelectorAll(".likeBtn").forEach(btn => {
            btn.onclick = async () => {
                const user = getCurrentUser();
                if (!user) {
                    window.showToast ? window.showToast("Please log in to like!", "error") : alert("Please log in to like!");
                    return;
                }

                const postId = btn.dataset.id;
                const postRef = window.db.collection("buzz_posts").doc(postId);
                const post = currentPosts.find(p => p.id === postId);
                if (!post) return;

                const isCurrentlyLiked = btn.classList.contains("liked");
                
                btn.classList.toggle("liked");
                const countSpan = btn.querySelector(".likeCount");
                const icon = btn.querySelector("svg");
                let currentCount = parseInt(countSpan.textContent) || 0;
                if(isNaN(currentCount)) currentCount = 0;

                try {
                    if (isCurrentlyLiked) {
                        currentCount--;
                        countSpan.textContent = currentCount > 0 ? currentCount : 'Like';
                        icon.style.fill = "none";
                        await postRef.update({ 
                            likedBy: firebase.firestore.FieldValue.arrayRemove(user.uid),
                            likes: firebase.firestore.FieldValue.increment(-1)
                        });
                    } else {
                        currentCount++;
                        countSpan.textContent = currentCount;
                        icon.style.fill = "currentColor";
                        await postRef.update({ 
                            likedBy: firebase.firestore.FieldValue.arrayUnion(user.uid),
                            likes: firebase.firestore.FieldValue.increment(1)
                        });
                    }
                } catch (error) {
                    console.error(error);
                }
            };
        });

        document.querySelectorAll(".commentBtn").forEach(btn => {
            btn.onclick = () => {
                const postId = btn.dataset.id;
                const section = document.getElementById("comments-" + postId);
                if (!section) return;
                section.classList.toggle("hidden");
                const isOpen = !section.classList.contains("hidden");
                document.querySelectorAll(`.commentBtn[data-id="${postId}"]`).forEach(el => {
                    el.classList.toggle("active", isOpen);
                });
                if (isOpen) {
                    setTimeout(() => document.getElementById("input-" + postId)?.focus(), 80);
                }
            };
        });

        document.querySelectorAll(".sendCommentBtn").forEach(btn => {
            btn.onclick = async () => {
                const user = getCurrentUser();
                if (!user) return window.showToast ? window.showToast("Log in to comment!", "error") : alert("Log in to comment!");

                const postId = btn.dataset.id;
                const input = document.getElementById("input-" + postId);
                const text = input.value.trim();
                if (!text) return;

                btn.disabled = true;
                btn.innerHTML = `<i data-lucide="loader-2" class="animate-spin" style="width:14px; height:14px;"></i>`;
                window.debouncedIcons?.();

                const postRef = window.db.collection("buzz_posts").doc(postId);

                const newComment = {
                    text: text,
                    authorName: getUserName(),
                    authorUid: user.uid,
                    createdAt: Date.now()
                };

                // arrayUnion = atomic append. The old read-modify-write of the
                // whole comments array lost comments when two people commented
                // at the same time (last writer won).
                try {
                    await window.ContentPolicy.comment(window.db,postRef,newComment);
                    input.value = "";
                } catch(error) {window.showToast?.(error.code==='permission-denied'?'Wait a few seconds before commenting again, and check the comment limits.':error.message,'error');}
                finally {btn.disabled=false;btn.textContent='Send';}
            };
        });
    }

    function buildModernModal() {
        const mBody = document.querySelector("#postModal .modalBody");
        if(!mBody) return;

        mBody.innerHTML = `
            <fieldset class="post-type-fieldset">
                <legend>Post type</legend>
                <div class="post-type-options">
                    <button type="button" class="type-chip active general" data-val="general" aria-pressed="true">General</button>
                    <button type="button" class="type-chip promo" data-val="promo" aria-pressed="false">Promo</button>
                    <button type="button" class="type-chip event" data-val="event" aria-pressed="false">Event</button>
                    <button type="button" class="type-chip tip" data-val="tip" aria-pressed="false">Tip</button>
                    <button type="button" class="type-chip announcement" data-val="announcement" aria-pressed="false">Announcement</button>
                </div>
            </fieldset>
            <div id="bizToggleWrapper" style="display:none;">
                <button type="button" id="toggleBizPostBtn" class="mod-btn-biz" aria-pressed="false"><i data-lucide="megaphone"></i> Post as Business</button>
                <select id="bizPostSelect" class="mod-select-biz" aria-label="Business to post as"></select>
            </div>
            <div class="post-field">
                <label for="postBarangay">Barangay <span>(optional)</span></label>
                <select id="postBarangay"></select>
            </div>
            <div class="post-field">
                <label for="postBody">Post details</label>
                <textarea id="postBody" rows="4" placeholder="Share an update, promo, event, or local tip…" maxlength="500" aria-describedby="charCount"></textarea>
                <div id="charCount" class="post-character-count">0/500</div>
            </div>
            <div id="mediaPreviewWrap" class="post-media-preview" style="display:none;">
                <img id="mediaPreviewImg" alt="Selected post photo" />
                <button type="button" id="removeMediaBtn" aria-label="Remove selected photo"><i data-lucide="x"></i></button>
            </div>
            <label for="postMedia" class="post-upload">
                <i data-lucide="image-plus"></i><span>Add a photo <span>(optional)</span></span>
                <input type="file" id="postMedia" class="post-file-input" accept="image/*" />
            </label>
        `;

        document.querySelectorAll("#postModal .type-chip").forEach(chip => {
            chip.onclick = () => {
                document.querySelectorAll("#postModal .type-chip").forEach(c => {
                    c.classList.remove("active");
                    c.setAttribute("aria-pressed", "false");
                });
                chip.classList.add("active");
                chip.setAttribute("aria-pressed", "true");
            };
        });

        const toggleBtn = document.getElementById("toggleBizPostBtn");
        const bizSelect = document.getElementById("bizPostSelect");
        if (toggleBtn && bizSelect) {
            toggleBtn.onclick = () => {
                isBusinessPost = !isBusinessPost;
                toggleBtn.classList.toggle("active", isBusinessPost);
                toggleBtn.setAttribute("aria-pressed", String(isBusinessPost));
                if (isBusinessPost) {
                    bizSelect.classList.add("show");
                } else {
                    bizSelect.classList.remove("show");
                    bizSelect.value = "";
                }
            };
        }

        const postBodyEl = document.getElementById("postBody");
        const syncPublishState = () => { const pb=document.getElementById("publishPostBtn"); if(pb) pb.disabled = !(postBodyEl?.value.trim() || selectedMediaFile); };
        postBodyEl?.addEventListener("input", (e) => { const cc=document.getElementById("charCount"); if(cc) cc.textContent = `${e.target.value.length}/500`; syncPublishState(); });
        window.__viciSyncPublish = syncPublishState; syncPublishState();

        document.getElementById("postMedia")?.addEventListener("change", (e) => {
            const file = e.target.files[0];
            const wrap = document.getElementById("mediaPreviewWrap");
            const img = document.getElementById("mediaPreviewImg");
            
            if (!file) {
                wrap.style.display = "none";
                selectedMediaFile = null;
                return;
            }
            selectedMediaFile = file;
            window.__viciSyncPublish?.();
            img.src = URL.createObjectURL(file);
            wrap.style.display = "block";
        });

        document.getElementById("removeMediaBtn").onclick = () => {
            document.getElementById("postMedia").value = "";
            document.getElementById("mediaPreviewWrap").style.display = "none";
            selectedMediaFile = null;
            window.__viciSyncPublish?.();
        };

        window.debouncedIcons?.();
    }

    function initModal() {
        buildModernModal();

        document.getElementById("openPostModalBtn")?.addEventListener("click", openModal);
        document.getElementById("closePostModalBtn")?.addEventListener("click", closeModal);
        document.getElementById("cancelPostBtn")?.addEventListener("click", closeModal);
        
        const pubBtn = document.getElementById("publishPostBtn");
        if(pubBtn) {
            pubBtn.addEventListener("click", publish);
        }
    }

    // 🔥 DITO KO PINALITAN YUNG LUMANG TABS PARA MAGING MODERN PILLS 🔥
    function initTabs() {
        const tabsWrap = document.getElementById("buzzTabs");
        if (!tabsWrap) return;
        
        tabsWrap.innerHTML = `
            <button type="button" aria-pressed="true" class="type-chip active all" data-type="all"><i data-lucide="package" style="width:14px; height:14px;"></i> All</button>
            <button type="button" aria-pressed="false" class="type-chip promo" data-type="promo"><i data-lucide="tag" style="width:14px; height:14px;"></i> Promo</button>
            <button type="button" aria-pressed="false" class="type-chip event" data-type="event"><i data-lucide="calendar-days" style="width:14px; height:14px;"></i> Event</button>
            <button type="button" aria-pressed="false" class="type-chip tip" data-type="tip"><i data-lucide="lightbulb" style="width:14px; height:14px;"></i> Tip</button>
            <button type="button" aria-pressed="false" class="type-chip announcement" data-type="announcement"><i data-lucide="megaphone" style="width:14px; height:14px;"></i> Announcement</button>
        `;
        
        tabsWrap.style.display = "flex";
        tabsWrap.style.gap = "8px";
        tabsWrap.style.overflowX = "auto";
        tabsWrap.style.padding = "4px 16px 12px 16px";
        tabsWrap.style.scrollbarWidth = "none";
        
        tabsWrap.addEventListener("click", (e) => {
            const btn = e.target.closest(".type-chip");
            if (!btn) return;
            document.querySelectorAll("#buzzTabs .type-chip").forEach(t => { t.classList.remove("active"); t.setAttribute("aria-pressed", "false"); });
            btn.classList.add("active");
            btn.setAttribute("aria-pressed", "true");
            activeType = btn.dataset.type;
            listenToPosts();
        });
        
        window.debouncedIcons?.();
    }

    document.addEventListener("DOMContentLoaded", () => {
        initTabs();
        initModal();

        const postBrgySelect = document.getElementById("postBarangay");
        if (postBrgySelect) {
            postBrgySelect.innerHTML = `<option value="">Choose a barangay (optional)</option>` +
                BARANGAYS.filter(b => b !== "All Barangays").map(b => `<option value="${b}">${b}</option>`).join("");
        }

        const filterSelect = document.getElementById("barangayFilter");
        if (filterSelect) {
            filterSelect.innerHTML = BARANGAYS.map(b => `<option value="${b}">${b}</option>`).join("");
            filterSelect.addEventListener("change", listenToPosts);
        }

        // Listener starts from render() when the Buzz page is shown —
        // not at boot, so the feed never burns reads on other pages.
    });

    return { render: () => { if (!unsubscribe) listenToPosts(); else renderUI(); }, stopListeners: () => { try { if (typeof unsubscribe === "function") unsubscribe(); } catch (e) {} unsubscribe = null; } };
})();
