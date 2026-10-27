# Remaining work and release boundaries

This is a complete source archive, but not a completed redesign or a production security certification.

## Before production approval

- Run real-browser mobile/desktop staging acceptance tests with customer, business and admin accounts. Current automated UI tests use jsdom; they are not a full visual or authenticated end-to-end review.
- Test Storage rules and the full upload/download path against staging. Firestore rules and booking/review transactions have emulator coverage; Storage and Netlify deployment have not been exercised end to end.
- Review and migrate legacy data: missing createdAt, missing isPublic, spoofed legacy ratings/trust fields, old base64 payment proofs, and old Buzz authorEmail data. No production migration was run.
- Confirm the intended refund and payment policy. Some owner transitions still permit accepted-to-fulfilled without online payment, preserving the existing offline/manual-payment workflow.
- Existing admin recovery UID remains in rules/client/server code. Confirm it is your trusted account before deployment. Existing admin user roles remain authoritative.
- Verify platform quotas, Firebase rules/index deployment and service-account permissions. No live credentials or billing reports were inspected.

## Product and architecture work still outstanding

- Full cursor pagination and a conversation-summary model are not implemented. Customer activity/notifications show the latest 50 records; open chat loads the latest 100; map catalog is capped at 2,000 with an explicit warning. Other owner/admin lists still have bounded windows. Older records remain in Firestore but some are not reachable from these views.
- The map catalog may be stale for up to its five-minute client cache plus server/CDN caching. It is designed for modest local catalogs; large citywide coverage needs geospatial indexing and paginated retrieval.
- Suki still uses owner-approved requests and the existing client-location/token flow. It is not tamper-proof geofencing or a cryptographically signed one-time QR protocol.
- Account deletion removes sign-in/private/public profile data through the existing client flow, with retained-history disclosure. It is not complete linked-data erasure; ownership transfer, anonymization, media cleanup and resumable server deletion remain to be designed.
- Legacy chat requirement/completion/feedback display cards still have client workflow fields. Canonical booking/payment state and trusted reviews are server-owned; a full server event model for every display card remains future work.
- Buzz comments remain an embedded array capped at 100 by rules. Reaction count consistency for concurrent duplicate likes and very large engagement needs a subcollection/counter redesign.
- Proof uploads can leave an unreferenced private object if a concurrent status change rejects the final transaction; retention/cleanup is not implemented.
- AI is authenticated and budgeted per user, but App Check, provider/project hard quotas, broader abuse controls and structured deterministic output validation remain outstanding.
- The large stylesheet, inline templates and global scripts were not rewritten into a component framework. Comprehensive accessibility, keyboard/focus, responsive visual QA, performance profiling and modular architecture work remain.
- Not every listener was consolidated. Read savings are not a measured percentage, and sustained billing improvements require a before/after usage baseline.

These limitations are intentionally explicit. Do not describe this candidate as “all flaws fixed” or deploy it without staging validation.

