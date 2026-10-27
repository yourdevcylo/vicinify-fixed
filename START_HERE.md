# Vicinify repair candidate — 26 October 2026

This archive contains the complete application source and original visual/audio assets, with security, transaction and Firebase-usage fixes. It is a **repair candidate**, not a claim that every finding in the original audit has been eliminated. Read REMAINING_WORK.md before production rollout. Nothing has been deployed and no production records were changed during this repair.

## What changed

- Booking state changes now use an authenticated server transaction. Booking and chat-card state update together; customer refunds use the saved policy rather than the caller's supplied amount.
- Reviews require a completed customer transaction. Review writes and rating aggregates are server-owned and atomic. Private review text is protected by rules.
- Payment proofs are stored privately in Storage, with authorized image retrieval. New proof uploads no longer duplicate base64 images across Firestore documents.
- AI requests require a verified Firebase session, per-user minute/day limits and server-loaded approved listing data. The multi-model retry chain was removed. AI remains probabilistic; these controls are not a guarantee that every generated sentence is correct.
- The approved map catalog uses short server/CDN caching and a five-minute in-page cache. The obsolete live-map listener and watermark probe were removed.
- Customer activity and notification consumers share the same ordered listener. Receipt writes are limited to text messages. Owner feeds are ordered before limiting; Buzz filters are applied before limiting.
- Private user profiles, listing trust fields, message identities, claims moderation and Buzz edits are more restricted.
- List actions use delegated handlers; other existing inline string helpers encode user text safely. Tests cover HTML-entity and quote injection payloads.
- Admin summary totals use server counts instead of counting a 20-row page.
- Publishing uses a static-asset allowlist. API responses bypass the service-worker cache. Server code, tests, logs and dependencies stay out of the public directory.

## Local checks

Use Node.js 22, Java 21 and a Firebase CLI installation.

```text
npm ci
npm test
npm run test:rules
npm run build
```

The rules command uses the isolated project ID demo-vicinify, never the live project. Firestore port 8086 must be available. The runner keeps Firebase CLI test configuration in tests/.firebase-test-config to avoid modifying the signed-in CLI configuration. Expected permission-denied output is produced by negative security tests.

## Required deployment setup

This version needs **Netlify Functions**. Uploading only dist/ with Netlify Drop, opening index.html directly, or deploying only Firebase Hosting will not provide the new server endpoints.

1. Back up the existing deployment and database before rollout. Use a staging Firebase project first.
2. Configure the existing browser Firebase configuration for the intended project. Browser Firebase configuration is not a service-account secret.
3. In Netlify, configure the server-only environment variables shown in .env.example:
   - FIREBASE_SERVICE_ACCOUNT: the complete JSON of a service account for the intended Firebase project. Keep it out of the repository and public assets. Grant only the required Auth verification, Firestore and Storage access.
   - FIREBASE_STORAGE_BUCKET: the exact bucket name, without gs://.
   - ALLOWED_ORIGIN: the exact HTTPS application origin, with no trailing slash.
   - GEMINI_API_KEY and GEMINI_MODEL: optional AI configuration; set service-side quotas appropriate to the project.
4. Deploy firestore.indexes.json to the intended staging project and wait until the indexes are ready. Then deploy firestore.rules and storage.rules. The provided firebase.json references these files. Select the project explicitly; the test project is not a production destination.
5. Deploy the source through Netlify with the included netlify.toml: build command npm run build, publish directory dist, functions directory netlify/functions. Dependencies are pinned by package-lock.json.
6. Verify catalog loading, customer and owner sign-in, reservation/order creation, acceptance, proof upload/viewing, payment confirmation, fulfilment, receipt confirmation, review creation/editing, private reviews, Buzz and owner/admin workflows in staging.
7. Roll out frontend, functions and rules together. Old browser code cannot use the newly restricted direct booking/review writes. Close/reopen old tabs or refresh the installed PWA. Keep a coordinated rollback of all three components.

## Existing data needs review

Queries ordered by createdAt omit old documents without that field. Reviews lacking isPublic are private under the new rules. Existing unsafe ratings, old base64 proofs and publicly stored Buzz authorEmail fields are not automatically repaired. New reviews initialize missing aggregate sums from existing ratings once; this does not establish that legacy ratings were legitimate. See REMAINING_WORK.md.

The original README and historical audit/changelog files are retained for context. Their older “fixed” claims and deployment instructions do not override this document.

