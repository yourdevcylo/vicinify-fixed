# Vicinify

A location-based service discovery Progressive Web App (PWA) for Lipa City, Batangas, Philippines. Users discover nearby establishments, business owners manage their listings and customer loyalty (Suki) programs, and an AI assistant (Vici) helps with local recommendations.

**Current build:** `VICINIFY_FINAL_20261005BK` (v53BK)

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Vanilla HTML/CSS/JavaScript (ES6+) | No build step, minimal bundle size, direct DOM control for map-heavy rendering. Performance profiling showed bottlenecks were in specific rendering patterns (icon re-renders, marker recreation, GPU effects) — not in the language choice — so we optimized those directly instead of migrating frameworks. |
| Backend / Database | Firebase Firestore | Real-time listeners, offline-friendly, generous free tier. All queries are capped at 20 documents; filters run client-side on cached data. |
| Authentication | Firebase Auth (Email/Password) | Email verification is enforced as a write gate across all Firestore rules. |
| File Storage | Firebase Storage | Establishment cover images (compressed client-side before upload). |
| Maps | Leaflet + OpenStreetMap | Free, no API key required, lightweight. Markers use diff-based updates (only changed markers are rebuilt). |
| AI Assistant | Google Gemini via Netlify Function | API key lives only in the `GEMINI_API_KEY` server environment variable — never in client code. Server-side prompt restricts answers to Vicinify topics. |
| Hosting | Netlify (static) + Netlify Functions | Zero-config static hosting; serverless function for the AI endpoint. |
| Icons | Lucide | Rendered through a debounced batching helper to avoid layout thrash. |

## Project Structure

```
├── index.html              # Single-page app shell (all views)
├── css/
│   └── style.css           # Full design system (no CSS framework)
├── js/
│   ├── common.js           # Shared: auth, navigation, chat, Suki/QR, places cache, UI helpers
│   ├── map.js              # Leaflet map, markers, filters, Vici AI search, voice navigation
│   ├── dashboard.js        # Business Hub: establishment management, bookings, Suki inbox
│   ├── buzz.js             # Community feed (posts, likes, comments)
│   ├── settings.js         # User settings, wallet, activity history
│   └── add.js              # Add-establishment form (barangay dropdown, Lipa City locked)
├── netlify/
│   └── functions/
│       └── askVici.js      # Gemini proxy — API key never touches the client
├── firestore.rules         # Security rules (verifiedEmail gate on all writes)
├── storage.rules           # Storage rules (owner-or-admin for place images)
├── firestore.indexes.json  # 13 composite indexes
├── firebase.json           # Firebase deploy config
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker (cache-first for app shell)
└── netlify.toml            # Netlify build config
```

### Module responsibilities

- **common.js** — the shared core. Owns `AppState`, page navigation (`showPage`), Firebase initialization, the places cache (20-doc cap with 1-doc freshness check), chat modal, Suki QR rendering, and global UI helpers. Other modules call into it; it does not import from them.
- **map.js** — owns the Leaflet instance, marker diffing (`markerMap`), category/barangay/radius/text filters (all client-side on cached places), lazy popup rendering, and Vici AI search.
- **dashboard.js** — business-owner views: establishment editor, Suki Card Studio, booking inbox, Suki stamp approvals.
- **buzz.js** — community feed with cursor-based pagination.
- **settings.js** — profile, wallet, notification preferences, activity history.
- **add.js** — establishment submission form with Lipa City barangay dropdown.

## Key Architectural Decisions

### Why vanilla JavaScript (not React/Vue/Angular)
The performance problems we encountered were traced to specific rendering patterns — 71 full-document icon re-renders, full marker recreation on every map update, persistent GPU-heavy blur effects, and duplicate Firebase subscriptions. These were fixed directly (batched icon rendering, marker diffing, opaque backgrounds, listener cleanup). A framework migration would not have addressed these root causes and would have invalidated the full functional test suite. Vanilla JS also gives us zero build step and the smallest possible bundle for low-end Android devices.

### Places cache (quota discipline)
The initial places fetch is capped at 20 documents. Subsequent refreshes run a single-document freshness check (`approval_status == approved`, ordered by `updatedAt` desc, limit 1) — if nothing changed, the cache is reused (1 read total). All search/filter/radius operations run client-side on cached data; map movement never triggers Firestore queries. Estimated cost: ~180 reads per full user session (~0.36% of the 50k/day free tier).

### Suki stamp anti-fraud (two gates)
1. **Vicinify Scan** — customers must scan the establishment QR with the app's live camera (no photo upload). A 200m GPS radius check against the establishment's coordinates blocks remote requests. QR tokens rotate every 10 seconds.
2. **Owner approval** — the stamp request appears in the owner's Business Hub Suki inbox; the owner taps Approve. Stamps are only issued after both gates pass.

### Security model
- `verifiedEmail()` is required for **all** Firestore and Storage writes (unverified users are read-only).
- Place owners cannot self-verify, self-feature, or modify `is_verified` / `claimStatus` / `is_premium` / `is_featured` (server-side blocklist).
- Reviews can only be updated by their author (`resource.data.userId` check).
- Bookings are created with forced `status: 'pending'`; `userId` and `placeId` are immutable after creation.
- Login returns a generic "Invalid email or password" (no account-enumeration leak).

## Performance Optimizations (v53BK)

1. **Batched icon rendering** — 70 direct `lucide.createIcons()` calls consolidated through a debounced helper; full-document renders reduced from ~71 to 1.
2. **Marker diffing** — `markerMap` keyed by place ID; only new/changed markers are rebuilt, unchanged markers are kept.
3. **Blur removal** — persistent `backdrop-filter` removed from bottom nav, Ask Bar, and toolbar (replaced with near-opaque backgrounds); transient modal blur kept.
4. **Duplicate subscription cleanup** — Settings page no longer double-subscribes on navigation.
5. **Duplicate render cleanup** — Add Establishment no longer renders the dashboard twice after submit.
6. **Booking render batching** — rapid Firestore snapshot bursts are coalesced via `scheduleRenderBookings()`.
7. **Lazy popup rendering** — place card HTML is generated on popup open, not for every marker upfront.
8. **Suki QR timer hygiene** — QR refresh interval is module-scoped with a generation guard; leaving the establishment page stops the timer (no orphaned intervals).
9. **Chat single-read** — opening a chat performs one `places.get()` instead of two sequential reads.

## Setup

### Prerequisites
- A Firebase project with Firestore, Authentication (Email/Password), and Storage enabled
- A Netlify account (for hosting + Functions)
- A Google AI Studio API key (for Vici AI)

### Deploy steps
1. **Verify the admin account's email** in Firebase Auth — the `verifiedEmail()` write gate blocks unverified writers, including the admin.
2. **Publish security rules and indexes:**
   ```bash
   firebase deploy --only firestore,storage --project <your-project-id>
   ```
   (Run from the project root; deploys `firestore.rules`, `storage.rules`, and all 13 composite indexes from `firestore.indexes.json`.)
3. **Set the Gemini API key** as a Netlify environment variable: `GEMINI_API_KEY`.
4. **Deploy the frontend** via Netlify Drop (drag the project folder) or `netlify deploy`.

### Local development
No build step required — serve the folder with any static server:
```bash
npx serve .
```
The Netlify Function (`netlify/functions/askVici.js`) requires `netlify dev` for local AI testing.

## Testing
See `PHASE9_FUNCTIONAL_TEST_MATRIX.md` for the 35-case functional test matrix (23 passed live, 12 passed via code inspection as of the last run). Security audit phases are documented in `PHASE5_FIRESTORE_RULES_AUDIT.md` through `PHASE8_UIUX_AUDIT.md`.

## License
Capstone project — STI College Lipa. All rights reserved.
