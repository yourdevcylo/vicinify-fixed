# vici6 Fixed Build Notes

This `VicinifyDesignFixed` build uses the visual design from `vicit.zip` for:

- `index.html`
- `css/style.css`

It keeps the repaired system files from the previous fixed build for:

- `js/common.js`
- `js/map.js`
- `js/add.js`
- `js/buzz.js`
- `js/dashboard.js`
- `js/settings.js`
- `sw.js`

Fixed in this copy:

- Stopped Settings page crashes by exposing shared unread/read helpers and badge updates.
- Added missing customer read-marking for bookings/messages.
- Added client-side owner/admin checks for store update posting and deletion.
- Fixed broken store-update deletion by preserving Firestore document IDs.
- Fixed business portal post list crash from an out-of-scope user ID.
- Fixed business profile Save button getting stuck after validation errors.
- Added admin guard checks around dashboard admin actions and admin data panels.
- Added verified-email checks to request/booking flow.
- Safer toast/confirm text rendering.
- Safer image URL rendering for cards/posts.
- New image uploads try compressed Firebase Storage first, with a compressed data URL fallback.
- Improved map page no-scrollbar behavior and tightened map controls visually.
- Restored the original colored food-category pill gradients from the `vicit` design. The extra black override in `js/map.js` was removed.
- Added compact map filters without changing the main layout: Open now, Verified, Booking, Delivery, and 4+ Rating.
- Added business-hours parsing for the map and establishment pages using existing `operating_hours` data.
- Improved establishment pages with status/verified badges, Claim Business, and Report Info actions.
- Improved verified public reviews with a feedback summary for business insight: average rating, public review count, positive rate, top feedback type, and verified transaction count.
- After completed-transaction feedback is submitted, the app refreshes and opens the establishment page; public reviews stay collapsed until the rating/review chip is clicked.
- Added the July 2 polish pass: wider Add/Buzz/Dashboard/Settings layouts, fuller establishment details page, centered Buzz empty state, modern Settings pill controls, stronger page-switch scroll reset, and a Dashboard Feedback Insights section.
- Settings theme controls now use polished Light/Dark/System pills while keeping the existing saved theme behavior.
- Settings language controls now use English/Tagalog pills and update visible `data-i18n` labels without reloading the app.
- Transaction history now includes a Reviews action that opens the establishment page and jumps to the review section.
- Feedback submission can safely work even when a transaction flow opens the feedback modal without an existing feedback-request message ID.
- Follow-up July 2 adjustment: removed the extra Reviews button from the place action row, made the top rating/review badge clickable, removed the desktop max-width caps for normal pages, widened the place details card, and hardened page-switch scroll reset with delayed document/page resets.
- Added a Business Dashboard feedback toggle so Feedback Insights stays collapsed by default and only shows reviews/ratings when the owner clicks Show Feedback.
- Restored the Add Establishment mini-map pin with a reliable SVG image marker so it does not turn into the broken white/slanted div marker if Leaflet div styles conflict.
- Bumped the app script/style/service-worker versions and changed the service worker to refresh page/script/style files first, so the Add mini-map pin fix is not hidden by old cached code.
- Fixed the establishment/place page scroll lock by overriding the old fixed-position place page rule, and made the top rating/review badge jump reliably to the Verified Reviews section.
- Polished the Send Request modal into a modern booking sheet with cleaner request cards, store chip, step strip, sticky action footer, responsive layout, hidden modal scrollbar, and dynamic submit labels while keeping the existing request submission flow.
- Added the Smart Trust Layer: Ask Vicinify now produces local smart picks scored by category/food match, distance/radius, rating/reviews, open status, verified status, delivery/booking availability, and freshness. Map pins/cards/list/details now show Fresh/Due/Needs update/Unconfirmed/Inactive indicators, and inactive listings are visually down-ranked with gray/red signals.
- Added business dashboard freshness tasks with one-tap "No changes" confirmation and a Post update action, so owners can keep their public listing fresh without opening the full edit flow.
- Cleaned up the small map popup so it is not overloaded: Featured is hidden there, Fresh only appears when it is a warning, rating/address are compact, and delivery badges are collapsed into one quiet line.
- Removed the Dashboard Feedback Insights surface from the business dashboard to keep that page focused on operations and inbox activity.
- Made place reviews on the Map establishment page load only after the top rating/review chip is clicked, while keeping the completed-transaction feedback flow intact.
- Improved Ask Vicinify search matching so natural language prompts use category, radius, rating, freshness, and availability first, with literal text search only for meaningful name/barangay/place words.
- Polished the Ask Vicinify search bar so the sparkle icon no longer overlaps typed text, with better spacing, focus state, icon capsule, and send-button styling.
- Removed the Ask Vicinify auto-suggestions dropdown on focus so a white panel no longer overlaps downward on the map page.
- Reduced the Ask Vicinify focus shadow and hide empty smart-answer panels on focus so the search bar no longer creates a white strip below it.
- Cleaned the Map page controls into a more professional compact layout: tighter search, smaller radius segment, single-line category rail, and extra filters tucked behind one Filters chip.
- Fixed the late-loaded map CSS so the Open/Verified/Booking/Delivery/Rating/Fresh filter pills stay hidden until the Filters chip is clicked, and polished the AI result into a cleaner Vici AI chat card with recommendation cards.
- Reworked the Vici AI answer so it floats as a compact map assistant instead of pushing the radius/category filters down, with cleaner recommendation badges and a helpful prompt for vague searches.
- Converted the Vici AI result into a true mini chat panel with user and assistant bubbles, local recommendation fallback, and an optional backend endpoint hook through `window.VICINIFY_AI_ENDPOINT`.
- Polished the Vici AI popout with a premium header, status pill, animated reveal, assistant bubble avatar, clickable quick prompts, and richer recommendation cards.
- Fixed the Vici AI header so the name/status/close button stay visible while the chat results scroll, and added a dedicated floating AI bubble launcher above the map locate button.
- Turned the bottom-right floating circle into the Vici AI launcher and added an in-panel chat input so users can keep asking inside the AI popout.
- Added a global spacing refinement pass for Add, establishment details, Buzz, Dashboard, Settings, and shared cards so gutters, vertical gaps, form grids, and page widths feel consistent across desktop and mobile.
- Separated normal map search from Vici AI chat so typing in the top search bar filters the map without automatically opening the AI panel; AI opens only from the bubble/chat or while already open.
- Fixed the broken Dashboard/Buzz layout caused by a spacing override that forced Buzz to display even when inactive; added a page visibility guard so only the active page renders.
- Reworked Buzz into a cleaner Facebook-style newsfeed with centered feed width, stronger post cards, reaction/comment rows, comment bubbles, and a polished empty state.
- Forced Buzz posts into a true one-column social feed so posts flow downward like Facebook instead of turning into a two-column card grid.
- Made the establishment details page full-bleed by removing the wide side gutters from the cover/details card while keeping clean inner padding and responsive action buttons.
- Added a brand/logo badge on the establishment cover, turned store updates into a Menu & Store Posts board, and moved public reviews into a scrollable popout card with close/background exit.
- Polished the establishment page layout into structured cards: cleaner cover logo treatment, separated profile/about/menu panels, compact contact/status rows, and cleaner review modal cards.
- Tightened owner permissions for establishment posting/editing/deleting: `addedBy` no longer counts as ownership, only `owner_uid` or admin can post store/menu updates or post as a business in Buzz.
- Added a 3-dot menu on establishment Menu & Store Posts so owners/admins can share a post to Buzz as Update, Announcement, or Promo, with a Shared to Buzz badge and a Buzz card link back to the establishment.
- Forced establishment Menu & Store Posts into a single-column Facebook-style feed so posts go downward one-by-one instead of appearing as two side-by-side cards.
- Added a runtime layout guard for Menu & Store Posts so the feed stays one-column even if an older grid style is still cached or injected.
- Replaced the service worker pass-through with a small same-origin app-shell cache.
- Corrected misleading account deletion wording.
- Aligned Add Establishment required labels with validation.

Checks run:

- `js/map.js` syntax check passed with bundled Node.js.
- `js/common.js` syntax check passed with bundled Node.js.
- `js/dashboard.js` syntax check passed with bundled Node.js.
- `js/settings.js` syntax check passed with bundled Node.js.
- `js/buzz.js` syntax check passed with bundled Node.js.

Still required outside this zip:

- Firestore and Storage security rules must enforce admin, owner, and user ownership checks. Frontend checks improve the app but are not a security boundary.
- Firestore rules/admin screens should allow and manage the new `business_claims` and `place_reports` collections.
- Existing Firestore records that already store base64 images remain as-is until migrated.
- Full live Firebase behavior should be tested against the real project and rules.
