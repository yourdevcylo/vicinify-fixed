# Security and process review — 28 October 2026

This is a source review and local test result, not certification that the live application has no vulnerabilities. Firebase rules, indexes, private-data migration and server secrets are separate deployment tasks. No production database changes were made here.

## Fixed in this release

1. **Client-forged booking state and schedules.** New bookings now go through the authenticated `booking` server function (`action: create`). It validates a future Philippine date/time, real approved business with an assigned owner, prevents self-booking, validates guest/item/address/payment fields and snapshots the refund policy. Identity, business name, request labels, timestamps and initial status come from trusted data. Booking and chat card are created in the same transaction. Browser writes cannot create bookings or booking cards anymore.
2. **Payment-card bypass.** Business auxiliary message updates cannot set payment confirmation or change canonical booking-card state. Proof submission and acceptance remain separate server actions. Changing requirement details does not confirm payment. Delivery auto-requirements no longer duplicate the canonical payment-proof step.
3. **Delivery stage skipping.** Delivery cannot jump to fulfilled. Normal sequence: pending → accepted → payment submission/review for online methods → preparing → out_for_delivery → delivered → customer received. Cash skips online proof. Non-delivery requests cannot dispatch.
4. **Cross-business record changes.** Owners cannot move menu posts, loyalty cards or stamp requests to another business/customer through an update.
5. **History cleanup failures and participant interference.** Business hide actions append only the current account UID. Completed booking cleanup is allowed without deleting customer history. Active bookings cannot be hidden using this rule. Existing legacy owner_deleted markers are still respected when rendering; new writes no longer create them.
6. **Chat validation.** Message creation requires matching sender identity, server creation time, bounded text and approved business for customer messages. Normal text cannot start with a forged delivered/seen status. Missing-index errors show a readable setup message instead of dumping a long raw Firebase URL into the conversation.
7. **Record-ID spoofing.** Data loaded from Firestore can no longer override the actual document ID through an `id` field. New place/message/Buzz IDs are constrained to safe identifiers.
8. **Public ownership email.** New admin ownership writes store the administrative email in admin-only `private_places`, not public `places`. Existing data needs the migration below; uploading frontend code does not erase previously exposed emails.
9. **Storage admin consistency.** Recovery-admin identity is handled consistently in Storage rules. Private payment proofs remain server-only; public image upload paths remain verified-user/owner protected.
10. **Shared-device session cleanup.** Logout clears private dashboard caches and rendered admin/inbox/chat content before another account uses the app.
11. **Dependencies.** Patched the old test SDK's vulnerable gRPC dependency through an override. `npm audit` reported zero known vulnerabilities after installation (all dependencies, including development).

## Validation

- 74 local tests passed, including new booking validation, forged-state input, atomic booking/card creation and delivery transition tests.
- Static production build and whitespace checks passed.
- Additional Firestore/Storage emulator tests were added for unauthorized changes, private data and receipts.
- **Emulator tests were NOT executed successfully:** this environment received HTTP 403 while downloading the Firestore emulator from storage.googleapis.com. Rules compilation/enforcement and end-to-end authenticated Firebase flows therefore remain unverified here.
- No live Gemini, Firebase indexes, private receipt bucket or production payment transfer was exercised. Manual payment review is not a payment gateway. Refunds are manual.

## Deployment and verification sequence

Use a test Firebase project first. Keep a backup/export and the previous frontend deploy available.

1. In the extracted source, run `npm ci`, `npm test`, `npm run build`.
2. With Java 21+ and network access, run `npm run test:rules`. This starts **demo-vicinify** emulators only; it does not publish to production. Fix any emulator failures before publishing rules.
3. Sign into Firebase CLI locally: `npx firebase-tools login`. Explicitly select/check the target project on every deploy command.
4. Deploy all configured indexes: `npx firebase-tools deploy --only firestore:indexes --project vicinify-c9828`. Wait until required indexes show Enabled. Do not delete existing indexes without reviewing the CLI prompt.
5. Configure Netlify Functions secrets in the correct site: FIREBASE_SERVICE_ACCOUNT (same project), FIREBASE_STORAGE_BUCKET, ALLOWED_ORIGIN; GEMINI_API_KEY and optional GEMINI_MODEL for AI.
6. Publish tested Firestore/Storage rules: `npx firebase-tools deploy --only firestore:rules,storage --project vicinify-c9828`. Coordinate with the new frontend deployment: old clients will no longer be allowed to create bookings directly. A short failed-submit window is possible until both are deployed.
7. Upload all source files to GitHub, commit main, wait for Netlify Published. Build `npm run build`, publish `dist`, functions `netlify/functions`. Do not use the source ZIP as a static-only drag-and-drop deploy; server functions are required.
8. Run the ownership-email migration locally with a same-project service account supplied securely via environment. Dry run: `node scripts/migrate-private-owners.cjs`. It prints only the record count. After checking the target project and backup, apply with `node scripts/migrate-private-owners.cjs --apply`. No private keys belong in GitHub or the ZIP.
9. Refresh with Ctrl+Shift+R; test with separate verified Standard and Business accounts. Check chat send/receive/read, a new booking, acceptance, requirement submission, payment correction/resubmission/acceptance, preparation, pickup/delivery/customer receipt, review and account-only hide. Use an unrelated account to confirm private bookings/messages/receipts are denied. Test Admin separately.

## Remaining limits / follow-up checks

- Rules deployment, emulator results, production credential validity, enabled indexes, existing malicious/legacy data and the email migration are not proven by a ZIP's contents or by unit tests.
- Requirement-response payment fields are supporting details. The canonical booking payment method and proof-review card remain authoritative; changing a method in a requirement response does not change an agreed booking method. A future payment-method amendment needs an explicit business-approved server flow.
- Legacy records may have older status names, identities, missing timestamps or public fields. Validate representative historical data in staging; do not bulk rewrite live records blindly.
- Admin tables and several inbox queries have bounded first-page limits. Full pagination for every collection is not implemented; a large database can have older records outside the visible first page.
- Public Firestore documents are readable in full, not field-filtered. Ownership email migration addresses the identified private field; any other private legacy fields must also be removed/migrated, not merely hidden in the UI.
- Firestore client writes still need abuse monitoring/App Check and project quotas. UI checks alone are not anti-abuse enforcement. Manual payment acceptance depends on the business checking its real bank/wallet records.

## Addendum: console-resistant content limits and spam gates

Added after the initial review. Current local suite: **81 tests passed**; earlier counts above refer to that initial review.

| Content | Characters | Whitespace-separated words |
|---|---:|---:|
| Account/display name | 2–80 | 1–12 |
| Business name | 3–120 | 1–20 |
| Buzz post / text menu caption | 3–500 | 1–100 |
| Chat text | 1–2,000 | 1–300 |
| Comment | 1–500 | 1–100 |
| Description | 0–1,000 | 0–200 |
| Optional review feedback | blank, or 3–2,000 | up to 300 |
| Report details | 3–500 | 1–100 |

Photo-only menu posts may omit a caption. Names accept ordinary Unicode names and punctuation, but not HTML angle brackets or line/control characters. UI checks mirror the character/word rules. Post and chat content is still escaped at rendering, not treated as HTML. Unicode space separators count toward the word limit.

### Rate enforcement

- Client-created messages, including supporting action messages, must atomically update `message_limits/{uid}` and the matching message. Its server-time window allows up to **30 messages per minute per account**. Text messages also require **2 seconds since the preceding message**.
- Buzz/menu creation requires an atomic `write_cooldowns/{uid}_{scope}` gate: **30 seconds** per scope. Author Buzz edits also use this gate. Menu caption edits require it too.
- Comments require a **5-second** gate and remain bounded to 100 comments per post.
- New place submissions, claims and reports use separate **60-second** gates. Claim IDs are deterministic; a missing own claim can be read safely before the first submission.
- Gate timestamps must equal Firestore request time. Counters cannot be deleted or reset early. Each write must point at the exact message/post/comment target, preventing a gate from authorizing many records in one batch. Browser clock changes or editing JavaScript do not change these rule predicates.
- Old direct `.add()` calls were replaced by the shared atomic write helper; do not deploy only part of this change. Older clients without the gates will be denied by these rules.
- Names and body edits are checked on write, including administrative edits where applicable. Admins retain intended content-management privileges. Firebase Admin SDK/service-account credentials are trusted and bypass rules by design; never expose them to browsers.

### Additional privacy cleanup

New shared Buzz posts no longer publish `authorEmail`. The existing migration script also removes legacy public Buzz `authorEmail` fields in apply mode. Dry run logs counts only. Private claims/reports still retain applicant contact information under restricted reads.

### Verification boundary

Local tests cover validators, word-regex escaping/Unicode separators, atomic helper payloads, burst rejection logic, booking authorization and session cleanup. Emulator tests additionally cover raw direct-write attempts, missing/forged counters, excess words, fast posting and role escalation, but **have not been executed successfully here**. A further emulator download attempt also received HTTP 403. Passing unit tests is not proof of deployed rule enforcement.

Run `npm run test:rules` in an environment that can download the official Firebase emulators before deploying these rules. Deploy the complete matching frontend and rules together after staging verification. Until the new rules are actually deployed, a source ZIP provides no live protection.

These are per-account limits, not a guarantee of zero spam. Account farming, repeated reaction toggles, storage-upload abuse and distributed traffic still require project quotas, monitoring, appropriate App Check enforcement and, for stronger controls, server-managed upload and moderation paths. Do not substitute a disabled Publish button for those controls.

Legacy reply/feedback text edits also require the same message gate and bounds. A console write cannot replace a creation with an unmetered reply edit. Source tests cover that helper path; its Firestore enforcement tests remain pending with the rest of the emulator suite.

## My Activity / Firebase-read follow-up

The matching source also includes cleaner My Activity rows/tabs, cached public business names, lazy Favorites, shared Suki feeds, a five-minute public session catalog cache and thread-only read marking. See FIREBASE_USAGE.md for costs and measurement limits. Private chats/transactions are not added to session storage.

Current complete local suite after My Activity/read changes: **86 tests passed**. Activity screenshots use sample messages. Responsive checks cover 320/390/820/1440 light and dark mode. Rules emulator/live enforcement remains unverified as described above.

## Suki / menu presentation follow-up

Forest and Mint Linen templates were added alongside existing choices. Existing selected card colors are retained, including after a card fills. Card height accommodates stamp counts and longer reward/name text; visible progress is clamped without changing stored stamps. Claim buttons remain hidden for already-claimed/pending/preview states. Pattern/color/icon strings are sanitized for rendering. The design picker has swatches, selected-state accessibility and dark-mode styling. Establishment menu images use contain sizing and a full-image link.

Latest local suite: **89 tests passed**; production build passed. Browser fixture checks cover 320/390/820/1280 cards and studio, light/dark, 8/24 stamps, long text and template/count changes. Establishment renderer checks cover 320/390/820/1440. Screenshots use sample data. Live stamping, reward claims and Firebase rule enforcement remain outside these fixture checks; prior staging/deployment requirements still apply.

## Fixed-size cards and alert follow-up

Supersedes the earlier auto-height Suki presentation: cards now keep the same 1.586 credit-card aspect ratio across stamp counts. Adaptive columns, denser stamps/type and two-line front summaries keep the contents inside; complete reward details remain on the back. Browser checks verified equal frame heights for 8/24 stamps at 320/390/820/1280 and no front-content overflow.

Buzz selected Like/Comment, comment send/focus and badges now use green. Notifications share one compact, bounded, deduplicated queue. Confirmation dialogs have accessible labels, unique IDs, keyboard focus trapping, Escape cancellation, safe text insertion and focus restoration. Danger/error styling retains semantic red. Tests cover duplicate notices, nested confirmation handling and shared notification rendering.

Current local suite: **93 tests passed**, plus build and light/dark responsive checks. Existing Firebase rules/emulator/live-flow limitations still apply; this visual follow-up did not deploy or verify production rules.


## Customer quick questions and business replies
Customer quick questions send immediately while preserving any typed draft. Business owners enable Automatic replies in Manage listing and may customize menu, hours, delivery and booking answers. Replies use saved business data; they never confirm bookings or payments. Deploy the matching frontend, Netlify functions and Firestore rules together. Each enabled reply adds bounded server reads and one reply write; duplicate calls reuse the same reply. Owner self-chat prompts are blocked; select an actual customer from Business Hub Messages. Rules emulator validation remains required before publishing rules.
