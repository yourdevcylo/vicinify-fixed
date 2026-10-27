# VICIN3 FINAL — Deep Fix (2026-10-03, OMNI)
Base: user's VICIN3__2.zip (Sep 24 version, with Business Hub heroes). All new features merged onto THAT, not the old July build.

## 1. Merged new features
- Login: Forgot password? + modal (Firebase sendPasswordResetEmail, privacy-safe message, prefills email, hides in Sign Up)
- Settings: Password & Security card (account email, Send Reset Email w/ confirm, Change Password Now with reauth + strong validation, Google-account handling)
- Map 403 fixed: tile.openstreetmap.org -> CARTO Voyager in map.js AND add.js (Sep base had regressed add.js back to OSM)
- Modern design v1-v4: glass search, pill chips WITH category colors back (inactive white+colored icon, active = category gradient), blue radius, clean header, CARTO tiles
- Pinned lucide@0.469.0, leaflet-routing-machine@3.2.12 (was @latest)
- Fonts via <link>+preconnect (was render-blocking @import), removed useless OSM preconnects, added CARTO preconnects

## 2. Deep error / security check
- JS syntax: all files pass node --check. No duplicate IDs in HTML. No eval/document.write/javascript: URLs. No http:// externals (except SVG xmlns). No target=_blank.
- REAL BUG FOUND: dashboard feedbackInsightsOpen was used but NEVER declared (ReferenceError if called). It survived only because its UI was removed earlier (FIX_NOTES) so the functions were never invoked. Whole dead feedback-insights block removed (~142 lines: formatReviewDate, syncFeedbackToggle, renderFeedbackInsights, toggleFeedbackInsights).
- Security fix: dashboard innerHTML interpolated ${e.message} unescaped in several error blocks -> now escapeHtml(e.message). Firebase error text is low-risk, but no reason to inject it raw.
- Still valid warning (cannot fix in frontend): 100 innerHTML uses app-wide; user data must always go through escapeHtml()/safeImageUrl(). Firestore/Storage RULES are the real security boundary. Firebase web apiKey in config is normal, not a secret.
- Buzz: added null-guards (postBody/charCount/postMedia) that could throw and kill the script.

## 3. Useless / dead code removed (safe only)
- dashboard.js feedback-insights block above (dead + buggy)
- common.js: writeJSON (defined, never called), getTransactionKey (never called), renderTransactionCommandCenter (one-line wrapper, never called)
- Production console.log spam ("VICINIFY ... LOADED") in all files
- OSM tile preconnect links in <head> (no longer used after CARTO)
- CSS @import for fonts (replaced by link)
NOT removed (reported, not safe to bulk-delete): 2,623 !important + duplicate CSS selectors — deleting cascade duplicates blindly can change rendering. Needs a visual regression pass, file by file.

## 4. Dark mode fixed
- Bug: ThemeManager only added body.dark-mode, but 18 CSS rules use body.dark — they never ran (e.g. Buzz dark styles). Manager now adds BOTH classes, and dataset.theme/color-scheme stay in sync.
- v5 CSS: heroes (Sep inline white styles), biz-edit header, cards, inputs, modals, request-choice buttons, Leaflet popup, logout button now actually go dark. Inline style="background:white;color:#0f172a" heroes were staying white in dark mode before.

## 5. English <-> Tagalog
- Before: only 16 data-i18n tags in HTML, dictionary had duplicate keys, most headings untranslatable.
- Now: 34 data-i18n tags (Business Hub, My Establishments, Customer Inbox, Database Management, Nearby Buzz, Add Establishment, Profile, Password & Security, Forgot password, categories, etc.), dictionary expanded (+~30 keys), duplicate handling cleaned, window.t(key) helper exposed for JS, and DOM re-translates after page navigation (dynamic pages render on switch).
- Honest limit: dynamic JS-generated cards/alerts are still mostly English strings in code. Translating 100% of those means replacing every hardcoded string in templates with t() — listed as next step, not silently half-done.

## Versions
- index/css/js cache: VICINIFY_FINAL_20261003, SW cache: vicinify-final-20261003-1
- Requires for password reset live: Firebase Email/Password provider enabled + authorized domains.

## v6 follow-up (user report: dark mode + map gone)
- Map is now theme-aware: Light=Voyager, Dark=CARTO dark_all. Before, dark mode still showed bright tiles / blank-looking contrast.
- Map fallback: if CARTO tiles error 12+ times, auto-switch to Esri World Street Map — map should never stay blank/grey. Retries init if Leaflet CDN is late. invalidateSize called twice on load/refresh (hidden login page initializes map at 0 size).
- Dark mode v6: JS-generated cards use inline background:white/color:#0f172a — added attribute-selector dark overrides for those exact inline patterns (cards, panels, generated rows), plus Leaflet controls/bottom nav in dark. Tiles verified 200 for Voyager, dark_all, and Esri.

## v7 — Map reverted per user screenshot
- CARTO is OUT: basemaps.cartocdn.com now returns a 2KB 'API KEY REQUIRED' watermark tile (screenshot on Add mini-map), not a real map. Verified vs OSM 40KB real tile for Lipa.
- Back to kanina: standard tile.openstreetmap.org in main map, Add mini-map, and map mini-map. Preconnects restored to OSM.
- Fix for the original 403 block WITHOUT changing provider look: if OSM tiles error 10+ times on a domain, JS auto-switches to tile.openstreetmap.de (same OSM style/data, no key/watermark), then Esri as last resort. Normal deployment on user's own domain should stay on standard OSM.
- Dark map: OSM has no dark tiles and CARTO dark is watermarked too, so dark mode now uses a CSS filter on the tile pane only (invert/hue-rotate) — dark map, bright pins, no API key needed.

## v8 — Radius cleaned (user screenshot)
- Deleted the Radius: label + crosshair icon from HTML entirely.
- Removed outer pill container (bg/border/shadow), sliding radiusIndicator pill, and active blue pill background. Radius is now plain text row: 300m 500m 1km..., active = blue bold with 2px underline. Dark mode: light blue active.

## v8 REVERTED
- User clarified v8 radius change was not what they meant. Radius label, outer segmented pill, and blue active pill restored to v7 state exactly. Pending user clarification on which stray pill/icon in screenshot to remove.

## v9 — Request Requirements modernized (user screenshot)
- Radius restored to v7 first (user clarified v8 was wrong interpretation — radius label/pill/active blue are BACK, untouched in v9).
- My take for both sides: same modern sheet for Business (Request) and Customer (Submit): bottom-sheet mobile, header icon+close, selectable option cards with Lucide icons + descriptions (emoji removed), check-circle selected state with blue border/tint, labeled fields (₱ amount wrap), sticky blur footer, slide-up animation.
- Business: inline hint when nothing selected. Customer: note banner, section cards with icon headers, modern inputs, green location button, same footer. All original element IDs/logic preserved — only markup/classes changed, lucide.createIcons() after insert.
- Dark mode variants for the whole req system.
- Screenshot stacking cleaned: stronger blurred backdrop so chat behind is obscured, sheet is the clear focus.

## v10 — Seen / Sent / Delivered + Leaflet decision
- LEAFLET CHOICE: Keep OLD implementation (leaflet@1.9.4 global script + leaflet.css, already in index.html). Leaflet 2.0.0-alpha.1 (module importmap or global) is ALPHA: breaking changes, leaflet-routing-machine 3.2.12 and all app L.* code target 1.x, module version would require rewriting scripts to imports. No user-visible gain, high break risk. Stable 1.9.4 is the maganda choice for production.
- RECEIPTS: messages now carry status/deliveredAt/seenAt/seenBy. sendChatMessage + requirement_request stamp status:'sent'. Recipient app (GlobalNotifier customer + owner listeners) marks deliveredAt on snapshot receipt. Opening the thread (listenToChatRoom) marks seenAt + seenBy (and deliveredAt if skipped — straight to Seen, like Messenger when recipient is in-chat). My bubbles show: check Sent / double-check Delivered / blue double-check Seen + time. Legacy messages without fields default to Sent. Requirement request card also shows receipt. Fail-safe: if Firestore Rules deny cross-user receipt updates, marking fails silently and messages still work (stays Sent) — rules should allow participants to update only deliveredAt/seenAt/status/seenBy.

## v11 — Send Request modal cleaned (user screenshot)
- Removed: bookingStoreChip (duplicated 'Send Request to X' title), booking-intro-card (explainer box whose CSS ::before rendered an EMPTY BLUE SQUARE in screenshot), fake 1-Request/2-Details/3-Confirm step pills (not actual steps). Header now: VICINIFY REQUEST eyebrow + title + close only.
- Choice cards: flat modern, 1.5px border, blue active with small check badge top-right, icon tile. Date/Time stay 2-col even on mobile (was stacking). Modal is flex column with truly scrollable body + sticky footer so fields (e.g. Table/Seating) no longer hide under footer. Footer primary = blue gradient. Dark-mode sheet added.
- Also in this session (v10 fixes while live testing): map tiles primary switched to tile.openstreetmap.de (same OSM look; std OSM serves 403 block tile to this preview domain + fallback counter missed it because block tile is an image). showPage('page-map') now resets List View -> Map View on every navigate (user report).

## v12 — Navigation rebuilt (user: 'maganda, nagzo-zoom, 2D or 3D')
- Honest limit: Leaflet = 2D only. True 3D needs MapLibre GL migration (all maps/markers/plugins rewritten); CSS tilt hack breaks Leaflet pan math. Delivered best-in-class 2D instead.
- routeToPlace rewritten: default LRM itinerary panel hidden, fitSelectedRoutes off (we fly ourselves): flyToBounds whole route (1s) -> flyTo your position zoom 17 (1.25s). Route = white casing + blue line + animated marching-ants overlay. Custom nav card (distance + ETA from routesfound), Steps sheet (instructions), Recenter + Overview + Stop actions. Live follow via watchPosition (marker moves, smooth panTo); Stop clears watch/route/UI and flyTo back. Old red cancel button replaced by nav bottom bar.

## v13 — Broken-image placeholder (user crop diamond-? + 'd7')
- Identified: browser missing-image glyph + clipped alt text = an image that failed to load, peeking at the Request modal corner (business logo/media from the place behind/inside the flow).
- Fix: place brand logo now has onerror removal with initial-letter fallback underneath; place menu media removes itself on error; global capture-phase img error guard in common.js hides any failed image app-wide (no ◆? placeholder anywhere). Booking modal close switched from text glyph to Lucide X icon.
- If artifact persists after hard refresh, need a FULL screenshot (not crop) to pinpoint which element still renders it.

## v14 — Navigation placement fixed (user: nakaharang)
- Problem: v12 nav card sat at top:76px inside the map, overlapping zoom controls / crowding search+radius+chips; bottom actions floated mid-air above bottom-nav.
- Fix: nav mode (body.nav-active while navigating): Ask bar, radius toolbar, category chips, locate button, Leaflet zoom, and bottom-nav all hide. Route card moves to the very top (safe-area), steps below it, Steps/Recenter/Stop in bottom thumb zone (16px). Map invalidates size after entering/exiting nav mode. Stop restores everything.

## v15 — Login / Sign Up modernized (user request)
- Design: soft blue/orange gradient backdrop, glass card, gradient logo tile, left-aligned clean form. New segmented Sign In | Sign Up tabs at top (synced with existing toggle logic; footer now reads 'Don't have an account? Sign up' / 'Already have an account? Sign in'). Sign-up subtitle restored ('Join Vicinify and discover Lipa City'), password requirements as checklist rows, autocomplete name/email/current-new password, bigger 52px inputs with blue focus ring, gradient primary button. Forgot password row right-aligned. Dark-mode auth added. All IDs/auth logic (strength gate, verification email, users doc) untouched.

## v16 — Login polish from user screenshots
- Real bug found in screenshots: Email/Password/User icons rendered OUTSIDE inputs (Lucide swaps <i> for <svg>; old .input-group i selector orphaned). Fixed: .input-group > svg pinned inside, blue.
- Added: card entrance animation, subtle logo pulse, 'Lipa City - Local Guide' brand chip, 'Secure sign-in powered by Firebase' footer note, password requirements turn into green check (li.met) not just green text, primary button hover lift. Card bottom whitespace tightened by content flow (secure note fills it with purpose).

## v17 — All alerts -> Modern Toast (user choice)
- Discovery: alerts were ALREADY intercepted (window.alert override in common.js) but rendered as an old top-right pill, and showToast was a fallback that called alert() — tangled and dated. Replaced the whole block with ONE engine: vicinifyToast(msg, type) with success(green check)/error(red x)/warning(amber !)/info(blue i) icon chips, Firebase error-message cleaning (auth codes -> human text), auto-type detection for alert(), top-center stack (max 3), progress bar, tap/X dismiss, duration scales with length (3.6-8.5s). window.alert and window.showToast both route to it, so all ~130 call sites (add/buzz/dashboard/settings/common/map) upgrade with zero per-site rewrites and no native browser popup can appear. Also removed leftover production console.log in index.html.
- Note: vConfirm (Yes/No decisions) intentionally stays a modal — it needs a real choice, not a toast.

## v18 — Toast icons made readable (user feedback)
- Inside colored boxes were thin SVG glyphs (check/X/!/i at 18px, stroke 2.4) - hard to see. Now: 42px solid circles, 22px icons at stroke 3.4 with white ring, plus a bold text title per toast (Success / Something went wrong / Heads up / Info) above the message, so the meaning is readable even without decoding the icon.

## v19 — Map place popup card modernized (user screenshot TESTFOOD)
- Bugs visible in screenshot: address line showed a raw hash (aadcafa56756756), delivery line truncated ('4km r...'), no category/avatar identity. Card rebuilt: category-colored avatar (colors kept, matches pins/chips), name+verified, 'Category - Place' line with ID-looking addresses sanitized to 'Lipa City', status+dista nce row kept, rating + distance-away, delivery split into individual chips (no truncation), View/Navigate (navigation icon) buttons, rounded popup + styled close, dark mode.

## v20 — Vici AI modernized + API key guidance (user request)
- Panel: floating chat card/bottom sheet, blue-violet gradient AI avatar+header, Local/Live status chip, AI/user bubbles, prompt chips (+2 more: may delivery, open now), pill composer with gradient send, pulsing floating AI bubble. Dark mode added. Local finder logic unchanged.
- API KEY: code already supported window.VICINIFY_AI_ENDPOINT; added a marked VICI AI CONFIG block in js/map.js (URL only). AI_API_SETUP.md added to the build: NEVER put OpenAI/Gemini key in frontend JS (view-source theft/billing abuse); key goes in Firebase Cloud Functions secret (functions:secrets:set GEMINI_API_KEY), sample Gemini function included, deploy, then paste only the endpoint URL into the app. Without endpoint it stays on Local finder; chip shows Live when API answers.

## v21 — Add / Settings / Business Hub / Buzz unified polish (user 4 screenshots)
- Complaints from screenshots: Settings had giant full-width blue bars; desktop cards stretched edge-to-edge; Add photo box double-dashed; Buzz repetitive rows; Hub actions bulky. One system now: 920px readable column (1120 Hub), unified heroes/cards (20px radius, soft border/shadow), 50px inputs with focus ring, Add form 2-col grid, single dashed dropzone, sticky green Submit, Settings buttons right-sized (auto width on desktop, right-aligned; logout/delete calmer), segmented theme/language controls, Hub KPI cards tightened + pill tabs, Buzz: filter tabs + source pill + stats row + 2-col Like/Comment actions, liked state. Dark-mode variants for all four pages. No JS logic changed.

## v22 — List View cards rebuilt (user screenshot)
- Screenshot issues: cards stretched full-width with big empty space, grey pin placeholder, yellow star badge overlapping thumb, yellow card border, address showing literal 'ADDRESS' or raw number 56756756756, distance always raw meters. Rebuilt renderListView with classes: photo thumb w/ category-colored fallback (same colors as pins/popup), verified only when true, amber star rating, status pill, km/m distance format, sanitized address (ID-like/literal 'Address' -> Lipa City), Chat/Request/Navigate row (Navigate gradient, navigation icon), 760px column / 2-col grid on wide screens, dark mode. Favorite star badge removed from list cards (it read as clutter; favorite stays on place page).

## v22 REVERTED per user ('Hindi ganyan. Yung List View ang pinapaayos ko')
- My v22 redesign of List View was not what user meant. Restored the ORIGINAL list card design/layout exactly, keeping ONLY the true bug fixes: (1) address showing raw number/ID (56756756756) or literal 'ADDRESS' -> sanitized to Lipa City, (2) verified badge only when is_verified, (3) distance formatted km/m, (4) broken cover image removes itself. No new layout/colors. Awaiting user's exact clarification of what to fix in List View.

## v23 — Inactive cards no longer washed out (user clarified w/ screenshot)
- Root cause: CSS rule .freshness-inactive.est-card { filter: grayscale(.45); opacity:.86 } applied to the WHOLE card, so an Inactive place (testfood) showed a dull grey-blue Navigate button and faded photo vs a Fresh place (Kape, bright blue). Fix: removed card-wide grayscale/opacity; only the thumbnail image is slightly muted (.35) and the grey Inactive badge carries the state. All cards/buttons now share identical colors. Original List View design otherwise untouched.

## v24 — Establishment (Place) page polished (user: 'mas ayusin mas pagandahin')
- Cover: taller hero, bottom fade, glass back/favorite buttons, brand logo tile (60px, white ring) + white name/category over the cover. Details card sections constrained to a 920px readable column; category line in brand blue caps; status pills fully rounded; contact rows became two info tiles; actions 52px (Navigate blue gradient first); About/Menu became clean white section cards; rate panel warm amber with 34px stars; menu post cards + empty state refined; dark mode variants. Also fixed the same raw-ID address bug on this page (address/brgy/addr sanitized, fallback Lipa City). No handlers/logic changed.

## v25 — Create Post composer polished (user screenshot)
- Bottom sheet on mobile (slide-up), clean card on desktop; sticky header/footer; type chips keep their per-type colors with stronger 16px icons (Announcement megaphone was rendering faint); barangay select + textarea 50px with blue focus ring; photo picker is now a full-width dashed dropzone; Publish gradient and DISABLED until the post has text or a photo (char counter already existed); Post as Business pill states. Publish handler/logic unchanged.

## v26 — Create Post second pass (user: still not clean enough)
- Type chips: each type now has a colored icon tile (blue/green/purple/yellow/red tinted squares w/ strong icon) even unselected; active chip keeps its full gradient with a frosted icon tile. Added small uppercase section labels (POST TYPE / LOCATION / DETAILS) for a cleaner, organized form. Same colors, fields, publish logic untouched.

## v26 REVERTED per user ('pumangit ayusin mo')
- Colored icon tiles + section labels in Create Post were rejected. Removed both; Create Post is back to the exact v25 look (sheet modal, per-type chip colors, disabled-until-filled Publish). Lesson logged: chip icons should stay simple; do not add decorative tiles/labels to this modal unless asked.

## AUDIT FIXES (Marc's rules received; full pre-launch audit)
- firestore.rules WRITTEN (fixed version of Marc's live rules): (1) users create now FORCES role="user" (was: self-create with role admin = full takeover); (2) users bulk list is admin-only, single get stays signed-in (anti email-scraping); (3) own-doc delete allowed (Settings delete-account was broken under admin-only delete); (4) place owners cannot change owner_uid/addedBy/approval_status via update (self-approval hole); (5) buzz_posts create must carry own authorUid, non-authors can only touch likes/likedBy/comments (was: ANY signed-in user could rewrite ANY post); (6) ADDED business_claims + place_reports rules (had none — Claim Business & Report Info were permission-denied).
- storage.rules WRITTEN: image-only, <5MB; places/{uid} and buzz_posts/{uid} uid-locked; place_covers/place_posts signed-in (ownership enforced in Firestore); everything else denied.
- firebase.json added (rules + hosting config).
- Code: Buzz comments now atomic arrayUnion (was read-modify-write, simultaneous comments overwrote each other); booking creation is one batch (booking + chat card together, no half-created requests); approved-places query capped at 500; storage-upload fallback capped (~350KB) instead of silently embedding huge base64 in Firestore; offline/back-online toast added.
- PWA: local icons/icon-192.png + icon-512.png generated (blue pin), manifest + favicon now local (was hotlinked Flaticon 512 only — install prompt risk).
- NOT done (needs Marc/console): deploy rules in Firebase Console, enable App Check (anti-spam), authorize production domain for auth emails, two-account live test of chat receipts + rules.

## Admin Panel rename + Claims/Reports (user chose 'Admin Panel')
- 'Admin Console' title -> 'Admin Panel'; section heading 'Database Management' -> 'Admin Panel'. (Marc: it is a moderation/management console, not an analytics dashboard — correct.)
- ADDED Claims tab: admin can finally see business_claims in-app and Approve (batch: place owner_uid + approval approved + verified, claimant role=business, claim approved) or Reject.
- ADDED Reports tab: place_reports list with Resolve/Dismiss.
- Fixed firestore.rules claims update so ADMIN can actually review claims (previously update required claimant uid — approve would have been denied).
- Admin loads capped: users 500, buzz/bookings/messages lists 100 (was unbounded).
- Still open: rules must be deployed in Console + two-account live test before launch (unchanged).

## Fix-what-should-be-fixed pass (user: 'ayusin mo na ung dapat')
- Admin audit log: admin actions (claim approve/reject, report resolve/dismiss, role change, record hide/delete) now write admin_audit entries (actor, action, target, time); new Audit tab in Admin Panel to read them. Rules: admin_audit admin read/create only, append-only (no update/delete).
- Load More pagination on Admin Panel Buzz/Transactions/Messages lists (cursor-based, 100 per page, appends rows; button disappears at end of data).
- Still NOT done by design (needs Marc): deploying rules in Firebase Console, enabling App Check in Console, two-account live test, production authorized domain. Not claiming launch-ready until those pass.

## Translate + Dark Mode completion (user asked if fixed)
- HONEST STATE BEFORE: both existed but incomplete — translator covered only ~34 static data-i18n elements; dynamic JS content (cards/chat/buzz/place) stayed English. Dark mode had 182 rules + inline-white attribute overrides, but Leaflet popups/controls, generic modals, toasts, chat bg were still light.
- FIXED: dictionary expanded with ~34 dynamic strings (Open/Closed/Busy, Fresh/Inactive, Chat/Request/Navigate/Message/View, Comment, empty states, About/Menu/Rate, Claims/Reports/Audit, Load more); data-i18n spans added to dynamic templates in renderListView, chat loading/empty, Buzz feed (Comment, no-comments, comment placeholder), map popup card, Place page actions/sections; renderers now re-run LangManager.translateDOM() after rendering (list, buzz feed, place page).
- FIXED dark: Leaflet popup/tip/close/zoom/attribution dark, .modalBox + its inputs/selects/textarea/footer dark, toast dark, chat message list + map container dark bg. Theme manager itself (light/dark/system, persisted, theme-color) was already working.
- STILL NOT 100%: long-tail dynamic strings (admin tables, request-requirement cards, toast message TEXT itself) remain English — dictionary-based, expandable; and map tiles in dark mode remain the standard OSM look (CSS filter approach from before) rather than a native dark tile set.

## v29 — True dark mode (user screenshot: Settings > Account History cards stayed white)
- User: dark mode must be dark everywhere with white text, like popular apps. Root cause: theme CSS variables (--v-card/--v-bg/--v-ink) were only defined for light, and components like .transaction-history-card hardcoded white.
- Fix: body.dark-mode now redefines all --v-* variables (bg #0b1220, card #16213a, ink #f1f5f9, line #263650) so every var()-based surface flips; explicit dark rules for transaction history card/details/meta, history note, action buttons, status badges (dark tinted bg + light text), inbox rows, settings sections, inputs, bottom nav, ask bar, category chips, admin tables, biz tabs.

## v30 — Dark mode screenshot completion (user sent 7 screenshots)
- Still light in dark mode: Place page (page bg + details card + rating panel with invisible heading), map popup place card, Ask Vicinify bar, Buzz 'View place' pill + Like/Comment buttons, Business Hub freshness card, chat transaction (vtx) card.
- Fix: dark overrides for #page-place bg/card, .place-rating-panel (dark amber), .modern-est-card + mec children, .askBar (page-map scoped), buzz source pill/actions/comments, .business-freshness-task + biz tabs, .vtx-command family, review summary/stat, dash hero/stat cards. All dark surface + light text.

## v31 — Dark mode: remaining light killed (user: 'bat may liwanag pa din')
- Root cause: legacy page-background rules (body:not(.map-page-lock):not(.vici-map-lock) #page-* { background:#f3f6fb/#eef2f7 }) outrank ordinary body.dark-mode rules, so Place/Buzz/Dashboard/Settings pages kept light backgrounds under dark cards.
- Fix: same-specificity dark selectors placed at the end of the cascade for page-place (+ polished details card), page-buzz, page-dashboard/settings/add, page-map (all lock states), plus login page/card, Buzz header, dash hero, and the no-photo place cover gradient.

## v32 — Tokenized dark theme (user: "meron pa din, ano ba maganda")
- Instead of chasing individual white boxes, dark mode now redefines the app's core theme variables (--bg/--card/--text/--muted/--line) and maps legacy class-based surfaces, JS-injected styles, and inline light-background templates to dark tokens (#0b1220 page, #16213a card, #0f1c33 field, #f8fafc text).
- High-specificity dark overrides cover Add/Settings inputs that previously beat global rules through ID selectors, map controls, Place page cards, Buzz, Business Hub/Admin Panel, chat transaction cards, modals, tables, Leaflet popups/controls, scrollbars, and form placeholders.
- Inline pastel/white generated cards are remapped only when their inline background is a light value; Vicinify blue/green actions and category colors remain intact. Light mode is untouched.
- Verification: JS syntax checks pass and CSS brace balance is valid; live phone screenshot verification still required for any remaining one-off generated element.

## v33 — Dark mode: ID-scoped winners (user: "ung iba puti pa")
- Root cause found: broad class-based dark rules lose to legacy ID-scoped rules (#page-buzz .buzz-feed-card, #page-place.active .place-menu-card, #page-dashboard .card) and JS-injected map styles (#page-map #catChips.modern-chips .chip).
- Fix: equal-or-higher specificity dark overrides for Map (inactive category chips, radius/toggle containers, smart filters, AI cards), Buzz (header/filter/feed/comments/empty), Place (details/about/menu/review cards + chips), Dashboard/Hub/Admin (cards, items, tables, status groups), Add/Settings/Login, Booking/Request/Post modals, chat body, filter popovers, and inline pastel status/freshness badges (dark surface, colored text kept).
- Active category chips and colored active states keep their colors per Marc's standing preference. Light mode untouched.

## v34 — Dark mode: screenshot parts (Buzz + Business Hub)
- Marc sent two screenshots; dark mode was mostly working there. Remaining light: Buzz author/comment avatar circles (#e8f0ff class rule), Business Hub KPI icon tiles (pastel .accent-* class rules), Fresh badge (inline #f0fdf4, missed by the pastel list), KPI card borders.
- Fix: dark blue avatar tiles, dark-tinted KPI icons (blue/green/amber/red meaning kept), freshness badge dark surface, KPI cards ID-scoped dark + border. Nothing else changed.

## v35 — Dark mode: white edges on Buzz + Dashboard (user: "may puti puti sa gilid")
- Pixel-sampled Marc's screenshots: the light lines are #edf2f7 (Buzz .buzz-feed-actions top/bottom dividers, old line 6364) and #e5ebf5 (Dashboard .dash-pro-hero/.dash-pro-section borders from the ID rule at old line 8208, which outranked class-only dark rules).
- Fix: ID-scoped dark border-color (#22304d) + dark shadows for Buzz header/filter/feed cards/actions dividers/comments and Dashboard hero/sections/KPI cards/freshness/inbox/admin panels, including inline-styled borders inside those two pages. Edges only — no layout or color changes.

## v36 — Dark mode: Ask Vicinify bar (user screenshot)
- White element: the #askInput itself. map.js injects `#page-map #askInput { background:rgba(255,255,255,.98) !important; color:#0f172a !important }` (two IDs) at runtime, beating the generic dark input rule.
- Fix: `html body.dark-mode #page-map #askInput` (stronger) -> dark field #0f1c33, light text, dark border/shadow, incl. :focus and ::placeholder; sparkles chip -> dark blue.

## v37 — Dark mode: Vici AI panel (user screenshot)
- White element: the inner .vici-ai-chat card + head/bubble/prompt chips. Their light backgrounds carry !important (old lines 7745/7757/7851/7898) while the v20 dark rules had none, so light won.
- Fix: html body.dark-mode #page-map rules with !important for .vici-ai-chat (dark gradient card), .vici-ai-head (dark violet gradient), title text, close/status chips, .vici-ai-bubble.ai, bubble icon, prompt chips, picks border, composer focus. Panel shell already dark.

## v38 — Dark mode: Place star-rating box + Menu Board cards (user screenshots)
- Rating panel stayed #f8fafc: old `#page-place.active .place-rating-panel.rating-section { background:#f8fafc !important }` (1,3,0) beat `body.dark-mode .place-rating-panel` (0,2,1). Fixed with (1,4,2) dark-amber rule + light heading/note text; amber stars untouched.
- Menu Board post cards stayed white: `#page-place.active #placeUpdatesList > .place-menu-card { background:#fff !important }` (two IDs) beat v33. Fixed with two-ID dark rule; author avatar/names/body and the Shared-to-Buzz pill darkened to match.

## v39 — Dark mode: popup delivery box (user screenshot)
- White element: `.leaflet-popup-content .mec-delivery-summary` (background:#f8fafc !important) — the rounded box holding the Grab/Panda / In-house / radius chips in the map popup card. Chips themselves were already dark.
- Fix: dark field background + border for the summary box (and its icon) in dark mode.

## v40 — Chat fixes (user: cannot send / receive / scroll)
- sendChatMessage: composer text is no longer wiped before the write; it clears only after a successful send, and failures now show a toast with the real error.
- listenToChatRoom: added an error handler — if Firestore blocks the listener (rules/permissions), the chat now shows the actual error instead of silently hanging on old content.
- Scroll: re-renders no longer yank the list to the bottom unless the user was already at the bottom (seen/delivered updates were resetting scroll); chat body gets touch pan + overscroll containment.
- NOTE: live Firestore Rules still must be deployed by the owner for chat to work end-to-end.

## v41 — Chat message ordering (user screenshot: new messages at top)
- Just-sent messages have a null createdAt locally (pending server timestamp); the listener sorted null as 0, so new messages jumped ABOVE older cards. Pending messages are now treated as "now" and stay at the bottom where they belong.

## v42 — Chat input stays filled after sending (user screenshot)
- v40 cleared the composer only after the Firestore write was acknowledged, so the text ("YO") stayed in the box while the bubble already showed. Now the box clears instantly on send; if the write fails, the text is restored and an error toast shows.

## v43 — Bottom nav glow (user request)
- Active tab now glows: blue gradient pill behind the icon with a soft outer glow, lit label, and a glowing dot under the active tab (light + dark mode). Bar layout/labels unchanged.
- Dashboard tab rename/replacement: waiting for the owner's pick before changing.

## v44 — Nav glow dot removed (user: "bakit parang may dot")
- The small glowing dot under the active tab (added in v43) is removed; the glowing pill + lit label remain.

## v45 — Settings: history lists scroll inside their own box (user request)
- Transactions (#myBookingsList), Chat History (#myChatsList), and Favorites (#myFavoritesList) on the Settings page are capped at 380px with internal scrolling, so the page no longer grows with every record and Log Out / Delete Account are quick to reach.

## v46 — Dashboard nav tab replaced (user: "GO")
- Bottom-nav Dashboard tab: generic 4-squares icon replaced with a storefront (store) icon, and the label now shows "Business Hub" (English dictionary entry added; Tagalog shows "Sentro ng Negosyo" as before). Badge and destination (page-dashboard) unchanged.

## v47 — Spark read-burn fix (owner: 183K reads in 24h on free Spark)
- Root cause: no local cache — every reload re-read every listener's full result set from the server, and the Buzz feed listener had no limit.
- Fixes: Firestore local persistence enabled (device cache serves reloads; only changes bill reads), Buzz feed capped at the latest 50 posts.

## v48 - Notification spam fix (owner: "dami notif you have message")
- Cause: GlobalNotifier popped a blocking window.alert on EVERY snapshot change, so Delivered/Seen/read-receipt edits re-alerted as if new, for both customer and owner threads.
- Fix: alerts removed entirely; sound + system notification now fire only for genuinely new incoming items (docChanges type "added"), never for edits.

## v49 — Stuck "Posting..." fix (owner: posts hang forever, "FIRESTORE INTERNAL ASSERTION FAILED: Unexpected state")
- Root cause: v47's multi-tab cache sync (enablePersistence synchronizeTabs:true) crashes the Firestore client when several app tabs/windows are open at once (two test windows + InPrivate + downloaded local copies). Once the client dies, reads still render from cache but writes never reach the server — Buzz posts hang on "Posting..." and never appear on the other account. NOT a rules problem: buzz create writes authorUid correctly and the rules allow it.
- Fix: single-tab persistence only (first tab gets the cache, other tabs fall back to live mode via the existing catch). App works with or without cache.
- Owner action needed: close ALL old Vicinify tabs/windows, then test ONLY from the v49 preview link (Edge temp downloaded files are stale copies and must not be used).

## v50 — Usage-flood hardening + Suki Card build (owner: "ilagay mo na ang suki card", alisin ang nagfflood ng usage, ayusin ang errors/bugs)

### A. Usage-flood audit (Spark blew 50K reads / 20K writes on 2026-10-04, ~250K/40K)
- FINDING: no whole-collection onSnapshot listeners exist — every live listener is already scoped (where userId/placeId/owner_uid/approval_status) and every re-attach path unsubscribes first (verified across common.js, dashboard.js, map.js, settings.js, buzz.js). No setInterval Firestore polling. `synchronizeTabs` stays REMOVED (single-tab persistence only).
- REMAINING RISK FOUND: unbounded one-shot `.get()` queries + silently swallowed listener errors (14 of 15 listeners had no error callback), so quota exhaustion showed as a silent spinner.
- FIXES:
  - New central guard in js/common.js (~line 324): `window.isFirestoreQuotaError(err)` + `window.handleFirestoreError(err, fallback)` — quota errors now show toast "Free database quota is exhausted for today. Please try again later." (throttled 1/min). Quota exhaustion is never silent again.
  - Added .limit() to unbounded gets: review-average recompute .limit(500) (common.js x2), GlobalNotifier owned-places .limit(100), owner establishments .limit(100), chat-thread get .limit(500), booking-card sync .limit(50), email user lookups .limit(1), public-reviews .limit(100), booking confirm .limit(50), thread-hide .limit(500), owned-places (buzz.js) .limit(100).
  - Quota-aware error callbacks added to 14 listeners (common.js x6, dashboard.js x3, map.js x1, settings.js x3, buzz.js feed).
- NOTE: 250K/40K not fully explained by code alone — previously-unbounded gets (now capped) + multi-tab duplicates likely; quota toast now makes any future exhaustion visible.

### B. Bug deep-check
- node --check: all 6 js files OK (before and after edits).
- 204 getElementById + querySelector(#id) targets cross-checked vs index.html: all resolve; the two missing-from-HTML IDs are null-guarded and intentional (viciAiBubbleBtn legacy cleanup, bookingStoreChip).
- All 12 inline onclick handlers resolve; script load order correct (common.js first).
- No syntax/reference/event-wiring bugs remained.

### C. Suki Card build (ONLY Premium feature going live)
- js/common.js: shared Suki module (~470 lines) — SukiDesign (templates Kraft/Minimal White/Midnight/Sorbetes Pastel/Ginto + Custom; gradients Sunset/Ocean/Matcha/Berry/Ginto/Midnight + custom 2-color; patterns none/dots/waves/lines/stars/beans/watermark), Suki.designOf() (owner override wins, else CAT_CONFIG category icon/color — map/filter category colors untouched), Suki.textTone() (auto white/black), Suki.renderCard() (one shared 3D card renderer), attachInteraction (pointer-drag rotate clamped, flip front/back, moving shine, tap flip fallback), rotating ~30s QR token make/parse/validate (demo-grade, commented), lazy-CDN qrcodejs owner QR + jsQR customer scanner with "Request Stamp" fallback button (camera permission never dead-ends the demo), requestStamp (dedupes pending, customer creates own card doc), approveRequest (transaction: status approved + exactly one stamp on deterministic card ID placeId_customerUid — double-tap cannot double-stamp), rejectRequest, markClaimed, requestClaim, mountPlaceSection.
- css/style.css: marked SUKI CARD block (fixed 1.586 credit-card layout, gold-full state, pattern overlays, shine, studio chips, inbox rows, scanner overlay, wallet list).
- index.html: owner inbox 3rd tab "Suki" (ownerSukiBadge) + #biz-panel-suki; settings "Suki Cards" tab + #mySukiCardsList; #page-biz-edit new "Suki Card Studio" section (enable toggle, live 3D preview, template chips, solid/gradient mode + picker, gradient presets + custom from/to, pattern picker, stamp-icon picker, stamp count, reward text, Show customer QR). Studio preview is 100% local — works even when Firestore quota is blocked.
- js/dashboard.js: renderMy .biz-card Suki status line + studio shortcut; listenToSukiInbox (unsub-first, bounded owner_uid==me + status==pending + limit 50) renders "Si {customer} humihingi ng selyo" rows with [Aprubahan]/[Tanggihan] + claim-request section; studio init in openPremiumBizPortal; suki_* fields added to savePremiumBizPortal updateData; save catch calls handleFirestoreError.
- js/map.js: read-only window.vicinifyCatConfig(key) accessor (CAT_CONFIG colors untouched, ranking untouched); viewPlace renders #placeSukiSection: owner sees rotating QR, customer sees card + Request Stamp / Scan QR, logged-out sees login prompt.
- js/settings.js: "My Suki Cards" wallet (bounded loyalty_cards where customerUid==me limit 100, per-doc place join), one 3D card per establishment in its own design.
- Data: places/{placeId} suki_* fields (suki_enabled default off, stamp count default 8); loyalty_cards/{placeId}_{customerUid}; stamp_requests/{requestId}.
- firestore.rules (LOCAL ONLY, NOT published): added loyalty_cards + stamp_requests matches — customers create/read/update only their own; place owners (existing isPlaceOwner) read requests and perform approval writes. Publishing is gated; needs Marc's go-ahead.

### D. Version bump
- index.html ?v= → VICINIFY_FINAL_20261005A; sw.js CACHE_NAME → vicinify-final-20261005-50.

### E. Build method
- Replicated v49 method exactly via /tmp/build_vicinify.py: preview = index.html with css/style.css inlined into <style> ("/* inlined v50 */") + 6 js files inlined into <script> blocks (order common, map, add, buzz, dashboard, settings; CDN scripts untouched; no </script> sequences in JS verified). Zip = folder contents under VICIN3/ prefix.
- ~/workspace/vicinify-final-preview.html (1,066,316 bytes, 517 "suki" markers) and ~/workspace/VICIN3_FINAL_2026.zip (273,300 bytes, 19 entries incl. new firestore.rules) rebuilt and verified by grep.

### F. Unresolved / needs live test (do NOT claim these work live)
- Two-account end-to-end stamp test (Cylo/Kape, Lorenso/testfood): customer request → [Aprubahan] → stamp → gold card → [I-claim] → owner marks claimed. Needs Firebase quota headroom + firestore.rules published first.
- Live camera QR scan on a real phone.
- Kape/testfood smoke test of non-Suki flows after deploy (expected fine — no unrelated edits).
- Other Premium features (badge, expanded gallery, analytics, auto-reply, FAQ chatbot, scheduled posts) remain future enhancement — untouched.

## v51 — 2026-10-05 (VICINIFY_FINAL_20261005B / cache vicinify-final-20261005-51)

Marc's directive: Suki Card Studio and Posts must NOT live inside Edit Establishment — each gets its own clean dedicated page. Business Hub establishment card now opens three separate areas: Edit Establishment (info only), Suki Card Studio, Posts.

### A. Page separation refactor
- index.html: removed the Suki Card Studio section from #page-biz-edit (page is now info-only: Basic Info, cover photo, delivery settings, operating hours).
- index.html: NEW dedicated page #page-suki-studio — own header ("Suki Card Studio" + establishment name + PREMIUM badge), back button → Business Hub (page-dashboard), own Save button. Contains the full studio: enable toggle, live 3D preview, template chips, solid/gradient pickers, custom gradient, pattern picker, stamp-icon picker, stamp count, reward text, Show customer QR. Hidden #sukiStudioPlaceId carries the placeId.
- index.html: removed the Manage Store Posts section from #page-biz-edit.
- index.html: NEW dedicated page #page-biz-posts ("Establishment Posts" + establishment name), back → Business Hub, Add Post button in header, #bizPostsList grid. Hidden #bizPostsPlaceId carries the placeId.
- js/dashboard.js: biz-card now has three entry buttons — "Manage Listing" (existing, → openPremiumBizPortal), "Suki Card" (data-suki-edit → NEW openSukiStudio(placeId)), "Posts" (data-posts → NEW openBizPosts(placeId)). Each loads that establishment's data into its own page.
- js/dashboard.js: NEW openSukiStudio(id) — sets placeId + place name, calls sukiStudioInit(place), showPage("page-suki-studio"). NEW saveSukiStudio() — canManagePlaceId check, writes ONLY suki_* fields + updatedAt to places/{id}, refreshes cached place, quota-aware error handling, returns to Business Hub.
- js/dashboard.js: openPremiumBizPortal no longer inits the studio; savePremiumBizPortal no longer writes suki_* fields (verified: zero "suki" references remain in it — edit saves cleanly).
- js/dashboard.js: openAddPostFromEdit replaced by openAddPostFromPosts (reads bizPostsPlaceId/bizPostsPlaceName); listenToBizPortalPosts renamed to listenToBizPosts targeting #bizPostsList; removed the posts listener call from openPremiumBizPortal. Exports updated (openSukiStudio, saveSukiStudio, openBizPosts, openAddPostFromPosts exposed; openAddPostFromEdit removed).
- js/dashboard.js: QR "Show customer QR" handler now reads the studio page's placeId (sukiStudioPlace) instead of bizPortalId.
- Untouched: owner inbox Suki tab + [Aprubahan] flow, customer place-page card + Request Stamp fallback, My Suki Cards wallet, category colors, ranking, other Premium features, manuscript files.

### B. Cute 3D rotation upgrade (js/common.js + css/style.css)
- Drag rotation is now physical: eased pointer chase (no jitter), release momentum from smoothed pointer velocity (clamped), then a gentle spring snap-back to rest. Angles still clamped ±40°/±25°.
- Idle hover animation when NOT dragging: the card softly bobs (translateY sine ±7px), sways tilt ±4°, the soft shadow beneath breathes (opacity/scale follow the bob), and the shine/glare subtly drifts — like the card is floating. Pause while dragging; resumes ~0.9s after release.
- Tap-flip front↔back kept, now smoothly eased in the same rAF loop (JS-driven; CSS transition disabled for the flip element).
- New .suki-shadow element in renderCard markup + CSS (radial-gradient ellipse, blur, transform/opacity only).
- Performance: one rAF loop per card, transform/opacity updates only; loop self-stops when the card is detached (isConnected check) so studio preview re-renders don't leak loops.
- Accessibility: prefers-reduced-motion disables the idle float (static card, physics still settle to rest).

### C. Verification
- node --check: all 6 js files OK.
- Every new getElementById target verified present in index.html (page-suki-studio, sukiStudioPlaceId/PlaceName, saveSukiStudioBtn, page-biz-posts, bizPostsPlaceId/PlaceName, bizPostsList, studio field IDs).
- No stale references to sukiStudioSection / bizPortalPostsList / openAddPostFromEdit / listenToBizPortalPosts anywhere.
- Structure check: #page-biz-edit contains only info fields (no suki/posts); #page-suki-studio has full studio; #page-biz-posts has posts list + Add Post.

### D. Version bump
- index.html ?v= → VICINIFY_FINAL_20261005B; sw.js CACHE_NAME → vicinify-final-20261005-51.

### E. Build
- Rebuilt via /tmp/build_vicinify.py (same v49/v50 method).
- ~/workspace/vicinify-final-preview.html (1,075,155 bytes; page-suki-studio + page-biz-posts + idleResumeAt + suki-shadow markers confirmed) and ~/workspace/VICIN3_FINAL_2026.zip (277,648 bytes, 19 entries) rebuilt and grep-verified.

### F. Unresolved / needs live test (do NOT claim these work live)
- Two-account end-to-end stamp test (Cylo/Kape, Lorenso/testfood) — needs Firebase quota headroom + firestore.rules published (Marc is publishing the rules himself).
- Live camera QR scan on a real phone.
- Visual confirmation of the new 3D idle float on a real device (no console errors expected; rAF loop verified by code inspection only).

## v52 — All-English UI + Vicinify Scan anti-fraud (VICINIFY_FINAL_20261005C, 2026-10-05)

### A. Language consistency (Marc's rule: UI all-English by default, no mixed Tagalog/English)
Converted every hardcoded Tagalog user-facing string to natural, concise English. Text-only changes; no logic, layout, styling, or identifier changes.
- index.html: search placeholder ("Ask Vicinify (e.g. 'Where is cheap coffee?')"), locate title ("Find my location"), Buzz nickname helper, Language selector label + aria-label ("Language"), wallet flip hint ("…tap Scan with Vicinify on the store page to request a stamp"), Edit Establishment section/field labels, cover-photo helper, studio intro + "Live 3D Preview (drag to rotate, tap ⟳ to flip)" + "Template (Canva-style: pick one, then edit freely)" + "e.g. Free coffee" placeholder.
- js/common.js (Suki module): "{customer} is requesting a stamp", "Approve"/"Reject", "Not yet full", "Owner", "Free reward", "Claimed ✔", "Claim pending — waiting for the owner", "Full! Claim it now 🎁", "Claim reward", "Card is full!", "N more stamp(s) to go", flip "Flip"/"Back", QR errors, all request/claim/cancel/approve/reject toasts and dialogs in English.
- js/dashboard.js (Business Hub inbox): "Requesting a stamp (N)", "{name} is requesting a stamp", "Approve"/"Reject", "No pending stamp requests.", "No claims waiting.", "wants to claim the reward 🎁", "No establishment selected."
- js/settings.js (wallet): "You don't have a Suki Card yet. Visit a store and scan with Vicinify!", "Open store", "Could not load Suki Cards…".
- js/map.js (Vici AI): "Ask me something like \"cheap coffee\", \"milk tea open now\", or \"best food near me\".", example chips in English, "Where is cheap food nearby?"
- Deliberately left untranslated: phDictionary Tagalog pack (opt-in language; English is the default since translateDOM defaults to 'en'), Tagalog code comments, ASK_STOP_WORDS Tagalog NLP tokens (map.js, internal), /sarado/ hours-regex and category keyword lists like "kape" (internal matching), CSS class names (data-suki-claim etc.).

### B. Vicinify Scan anti-fraud (Marc's feature request)
- Removed the plain "Request Stamp" fallback button on the place page — stamps are requested ONLY through the built-in live-camera scanner. No image-upload/screenshot scanning option exists (jsQR runs on the live video feed only).
- Entry button: "Scan with Vicinify"; scanner overlay titled "Vicinify Scan" ("Point the camera at the store's Suki QR. You must be at the establishment — your location will be verified.").
- Post-decode flow: rotating token validated as before, then location gate — navigator.geolocation → Haversine distance to the establishment's lat/lng, SUKI_SCAN_RADIUS_M = 200. Outside radius: "You must be at the establishment to scan for a stamp." (no request created). Geolocation denied/unavailable: English guidance to enable location access (no request created). Establishment without coordinates: check skipped (owner approval remains the gate).
- Owner-tap [Approve]/[Reject] inbox flow unchanged — location check is an additional guard, not a replacement.
- Quota-safe: geolocation is device-side (zero Firestore cost), no new listeners, no silent failures.

### C. Verification
- node --check: all 6 js files OK.
- Post-edit greps: zero occurrences of "humihingi ng selyo", "May-ari", "Hindi pa puno", "Aprubahan", "Tanggihan", "Libreng reward" outside the opt-in Tagalog dictionary; English markers confirmed ("is requesting a stamp", "Not yet full", "Scan with Vicinify", "Vicinify Scan", "You must be at the establishment").

### D. Version bump
- index.html ?v= → VICINIFY_FINAL_20261005C; sw.js CACHE_NAME → vicinify-final-20261005-52.

### E. Build
- Rebuilt via /tmp/build_vicinify.py (same v49–v51 method).
- ~/workspace/vicinify-final-preview.html (1,077,300 bytes) and ~/workspace/VICIN3_FINAL_2026.zip (280,004 bytes, 19 entries) rebuilt and grep-verified (English markers present, old Tagalog strings absent in both).

### F. Unresolved / needs live test (do NOT claim these work live)
- Two-account end-to-end stamp test (Cylo/Kape, Lorenso/testfood) — needs Firebase quota headroom + firestore.rules published (Marc is publishing the rules himself).
- Live camera QR scan + location-gate on a real phone (browser geolocation permission flow varies by device; the denied/unavailable paths have only been code-inspected).

## v53 — Deep bug audit + Firestore rules tightening (2026-10-05)
Version: VICINIFY_FINAL_20261005E / sw.js CACHE_NAME vicinify-final-20261005-54.

### A. Bugs found and fixed (code)
1. js/common.js (custBookUnsub) — unbounded `.where("userId","==",uid).onSnapshot` on bookings (quota risk) → added `.limit(100)`.
2. js/dashboard.js (bookingUnsub) — unbounded `.where("placeId","in",chunk).onSnapshot` on bookings → added `.limit(100)`.
3. js/dashboard.js (messageUnsub) — unbounded `.where("placeId","in",chunk).onSnapshot` on messages → added `.limit(100)`.
4. js/settings.js (custChatsUnsub) — unbounded `.where("userId","==",uid).onSnapshot` on messages → added `.limit(100)`.
5. js/settings.js (custFavoritesUnsub) — unbounded `.where("userId","==",uid).onSnapshot` on favorites → added `.limit(100)`.
6. js/common.js createCardDocIfMissing — showed an error toast on repeat stamp requests (the merge-set on an existing card doc becomes an update; now correctly denied for customers) → permission-denied is swallowed quietly with a console.warn; other errors still surface via handleFirestoreError.

### B. Firestore rules tightened (firestore.rules — Marc publishes)
- loyalty_cards create: safe starting state now enforced — claimed == false, claimRequested == false, deterministic cardId == placeId_customerUid. Customer self-create requires stamps == 0. NEW: place owner/admin may create the card inside the approval transaction (stamps == 1) — previously the owner's transactional `set` for a missing card was permission-denied, which would have failed the whole approval.
- loyalty_cards update: customer self-update restricted to claim-request fields only via affectedKeys().hasOnly(["claimRequested","claimRequestedAt","updatedAt"]) plus pinned placeId/stamps/claimed — customers can no longer mint stamps or flip claimed state from DevTools. Owner/admin approval writes unchanged.
- stamp_requests create: added placeId is string check.
- stamp_requests update (customer cancel): now also pins customerUid and restricts changed keys to ["status","updatedAt"] — a cancel can no longer rewrite other fields.
- No legitimate flow broken: requestStamp (customer add), cancelRequest (customer cancel), requestClaim (customer claim fields), approveRequest/rejectRequest/markClaimed (owner transaction/updates), inbox + wallet reads all re-checked against the new rules.

### C. Audit coverage (no issues found)
- Reference integrity: all getElementById/querySelector targets resolve (219 html ids + JS-created ids; 9 apparent misses verified as prefix-concatenations, optional-chained, null-guarded, or dynamically rendered).
- Suki pages: page-suki-studio / page-biz-posts controls all present; openSukiStudio/openBizPosts/saveSukiStudio wired; studio listeners bound once.
- Suki E2E trace: studio save → designOf → renderCard (gold/full/claim states) → owner QR (10s rotation + countdown) → openScanner (jsQR live feed, token parse) → tokenValid (10s window ±1) → verifyScanLocation (200m, denied/unavailable/no-coords paths) → requestStamp (dup check) → inbox approve/reject → deterministic cardId increment → claim → markClaimed. All steps traced; logic sound.
- English-only: zero Tagalog in user-visible text (html text nodes + js strings).
- sw.js: install/activate/fetch handlers sane; cache name bumped.
- Top-level code: all js files use safe IIFE/window-assignment patterns; no load-time throw risks.

### D. Build
- Recreated /tmp/build_vicinify.py (VM replacement had wiped /tmp); durable copy saved at ~/workspace/vicinify-final/build_preview.py (now included in the ZIP → 20 entries).
- node --check: all 6 js files OK.
- Rebuilt ~/workspace/vicinify-final-preview.html (1,077,649 bytes; markers: page-suki-studio, page-biz-posts, suki-shadow, prefers-reduced-motion, Vicinify Scan, TOKEN_WINDOW_MS = 10000, VICINIFY_FINAL_20261005E; zero v52D leftovers) and ~/workspace/VICIN3_FINAL_2026.zip (283,079 bytes, 20 entries; sw.js -54, tightened rules with hasOnly, limit(100) fixes verified inside the zip).

### E. Still needs live verification (do NOT claim working)
- Two-account end-to-end stamp test (Cylo/Kape, Lorenso/testfood) — needs Firebase quota headroom + Marc publishing the tightened firestore.rules.
- Live camera QR scan + 200m location gate on a real phone.
- Rules were syntax-reviewed only; deploy via Firebase Console and watch for permission-denied toasts during the live test.

## v53F — Mobile-friendliness + load performance pass (VICINIFY_FINAL_20261005F / vicinify-final-20261005-55) — 2026-10-05

### Responsive fixes (additive CSS, no visual redesign)
- `.filter-popover` (css/style.css): fixed `width: 480px` caused horizontal overflow on phones → now `width: min(480px, calc(100vw - 24px))` with `max-width: calc(100vw - 24px)`.
- `.nav-item` (bottom nav): added `min-width: 52px; min-height: 52px` touch targets with centered content.
- iOS Safari auto-zoom: inputs/selects/textareas under 16px trigger page zoom on focus → mobile media query forces `font-size: 16px` at ≤768px.
- Touch targets: `.suki-approve-btn`, `.suki-deny-btn`, `.biz-edit-btn`, `.suki-plain-btn` → `min-height: 44px`; `.req-close` → 44px.
- Business Hub card action row (Suki Card / Posts buttons): added `flex-wrap: wrap` + `biz-card-actions-row` class so buttons wrap on 360px phones instead of squeezing.
- Safe-area: bottom nav now respects iPhone home-indicator inset via `env(safe-area-inset-bottom)`.
- Small-phone tightening (≤380px): reduced page paddings, suki request card and req-sheet padding.
- Global guard: `.page { overflow-x: clip }` + `img,video,canvas,svg { max-width: 100% }` (Leaflet tiles unaffected — Leaflet CSS uses !important overrides).

### Performance fixes
- Removed duplicate user-doc read on auth change (js/common.js `onAuthStateChanged`): previously fired both `onSnapshot` AND a one-shot `.get()` on the same `users/{uid}` doc (2 reads per login). The live snapshot now doubles as the profile loader; deleted-account logout check, fallback profile creation, and error fallback behavior preserved.
- Added `<link rel="preconnect">` hints for `https://www.gstatic.com`, `https://firestore.googleapis.com`, `https://firebase.googleapis.com` so Firebase SDK + Firestore API handshakes start earlier.
- Verified already-good: scripts at end of body (non-blocking parse), card/menu images already `loading="lazy"`, fonts use `display=swap`, notif.mp3 created on demand only, no `<img>` in index.html.

### Verification
- `node --check`: 6/6 OK. No unguarded fixed width >480px remains in CSS. Version strings confirmed in preview + ZIP.
