# Vicinify Phase 9 — Business Application Emails & Status History

Baseline: `Vicinify_Business_Analytics_Phase8.zip` (2026-11-24 work session). This is a scoped upgrade to Phase 7 business application notifications.

## What's new

- `submitted` applications generate a private application timeline event and optionally send an application-received email.
- Admin `approve`, `reject` and `changes_required` actions each create their own private timeline event and optionally send a relevant email.
- Applicants can read their own event history in **Register Your Business → Application Updates**. Admins can view the history in **Admin Dashboard → Business Applications**.
- Admin can retry the latest failed/not-configured notification **without repeating** the application decision or business-role update.
- Older Phase 7/8 applications with a single `notificationStatus` field remain readable. Admin retry of a legacy unsent review notification creates a history entry.
- Bounded history: last 20 application events; each contains type, event timestamp, email delivery status, retry attempts and optional sent time. The history does not contain uploaded business permits.
- Concurrency handling: a Firestore transaction claims the send attempt. Resend requests use a unique `Idempotency-Key` for the event; a send lock prevents simultaneous attempts. Retry limit is five send attempts per event. Provider de-duplication has a finite window; in exceptional timeout/long-delay cases, duplicate delivery cannot be categorically ruled out.
- If the provider fails or is not configured, a successfully committed business application decision stays committed. The in-app status history remains available.
- Email provider 'sent' means the API accepted the request, not guaranteed inbox delivery.

## Deploy

1. **Back up** current Firestore data and Netlify deployment before rollout.
2. Deploy the **full project** with Netlify Functions (`netlify/functions`) and website static files (`dist`). Do **not** upload `dist/` alone if the app depends on Functions.
3. In **Netlify → Environment variables**, set `RESEND_API_KEY` and `VICINIFY_FROM_EMAIL` (must be an approved sender/domain in Resend). Never expose these secrets in browser code or commit them to Git.
4. Deploy the updated Functions. The function `businessRegistration` uses the new `netlify/functions/lib/business-notifications.js` module; the deploy must contain both files.
5. **No new Firestore rules or indexes for Phase 9** if Phase 8 is correctly deployed. Previous Phase 7 protected business application rules are still required.
6. Use a test applicant and test Admin; perform all scenarios below before accepting actual permit documents.

## Manual tests

- Verify applicant email in Firebase Auth; save an application draft, upload required test documents, submit. Expect status **Pending Review**, **Application received** in history, and a submission email if Resend is configured.
- As Admin: inspect **Business Applications**, open uploaded test files and click **Request Changes**. Expect applicant status and timeline update, with changes-requested email.
- Correct and resubmit. As Admin approve. Expect Business role, Business Hub access, new approval history item and approval email.
- Reject a separate test application. Expect rejection remarks in app and an email. Reapply as needed.
- Turn off test email credentials; submit another test application. Expect in-app status and `Email not configured` but successful submission. Restore credentials and use **Retry latest email** as Admin. Expect email status `Email sent`.
- Retry an already-sent event: backend should reject. Parallel admin retries must not send twice while a claim is active.
- Verify an unrelated signed-in user cannot view another applicant's documents or application history; verify published listings, VIP discounts, stamps, menus and booking continue working.

## Data model (private)

Document `business_applications/{ownerUid}` adds `notificationHistory` array (maximum 20 records). Existing field `notificationStatus` stays in place for older UI compatibility. All reads and writes go through the authenticated Netlify function. The Firestore client rules for `business_applications` remain deny-all.

## Scope / known limitations

- This version triggers email synchronously as part of the submission/review HTTP request, after the Firestore transaction. If the function stops between database commit and delivery, the event may remain **pending**; the Admin can retry. This is not a scheduled worker or guaranteed background delivery service.
- There is no Resend webhook in Phase 9; successful API acceptance is labeled **Email sent**, not verified delivery. Failed delivery after API acceptance (bounce/spam) is not automatically detected.
- Live Firebase/Netlify/Resend testing and production security/privacy review **still required**. This package does not make private identity/permit document storage compliant by itself. The existing Phase 7 private Firestore-file approach should be reviewed for retention and access controls before real applications.

## File changes (vs Phase 8)

- `netlify/functions/businessRegistration.js` — lifecycle events, protected retry, existing-role preservation, status API.
- `netlify/functions/lib/business-notifications.js` — transactional send claims, bounded history and Resend email delivery.
- `js/business-registration.js`, `index.html`, `css/business-registration.css` — applicant and Admin timelines and retry controls.
- `.env.example` — documentation of optional server-only email credentials.
- `tests/business-notifications-phase9.test.cjs` — dedicated Phase 9 tests.

No changes to `firestore.rules`, `firestore.indexes.json`, `firebase.json`, Netlify config, VIP, bookings, menus, category, or analytics business logic.
