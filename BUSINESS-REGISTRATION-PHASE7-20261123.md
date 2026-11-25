# Vicinify — Phase 7: Business Self-Registration and One-Time Admin Approval

**Baseline:** `Vicinify_Multiple_Categories_Phase6.zip`.
**Policy choice:** Option A — **one approval per application**, no second approval for initial establishment publication.
**Tagline:** Discover Good Food in Your Neighborhood.

## What was added

1. Login screen: **Register Your Business** entry. New applicants create a normal Firebase account, verify their email, and continue the application. Existing Standard Users use **My Activity → Register Your Business**.
2. Business Application page: verified account email (read-only), legal name, trade/store name, registration type, registration and permit numbers, owner/representative name, contact, address, barangay, applicant relationship and declaration.
3. File uploads: Mayor's/Business Permit, DTI/SEC/CDA registration, barangay business clearance; authorization letter required for representatives; sanitary permit optional (as applicable).
4. Tracker: Draft → Pending Review → Approved / Changes Required / Rejected. Applicant may resubmit after Changes Required or Rejected; Pending/Approved applications are not editable.
5. Admin Dashboard → **Business Applications**: private document viewer, Approve, Request Changes, Reject, retry email.
6. Admin approval is **server-authenticated** and updates the user's `role: business`, the application status and a `verified_businesses` owner record in a Firestore transaction.
7. Approved applicant → Business Hub → Add Establishment: new **backend publishing path** creates a publicly visible listing immediately with owner UID and private owner email taken **only from Firebase Authentication**. Regular user submissions and existing Admin direct-approval path remain unchanged.
8. Approval/change/rejection emails via Resend, **only when configured**. The email contains the decision, not sensitive permit attachments.
9. Account deletion cleanup includes business applications, permit documents and verified owner records.

## Deploy — BOTH are required

1. Save a rollback copy of the previous deployed website and Firestore rules.
2. Upload the **full Phase 7 project** to Netlify and run the configured build (`npm run build`). Deploy the `netlify/functions` functions, especially **`businessRegistration`** and **`businessPlace`**, not just `dist`.
3. In Firebase Console → Firestore Database → Rules, publish the supplied **`firestore.rules`**. Phase 7 changes are necessary to protect the verified owner flags and to deny all client access to permit/application storage.
4. Ensure `FIREBASE_SERVICE_ACCOUNT` remains configured in Netlify environment variables for the existing server functions; do not paste it into frontend files. The existing app Firebase project ID must correspond to the service account.
5. Optional: add `RESEND_API_KEY` and `VICINIFY_FROM_EMAIL` (verified sender/domain) to Netlify environment variables, then redeploy. If unconfigured, **Admin approval still works, but automatic approval emails do not send**; the applicant can view status in the tracker. `notificationStatus` shows `not_configured`.
6. Hard-refresh the deployed website. Use **test accounts and test permit files only** until you complete live permission tests and privacy checks.

## Test scenarios

| Test | Expected result |
|---|---|
| Unverified applicant starts registration | Email verification prompt; no permit submission |
| Existing Standard User applies | Same account/UID and automatic email, no second account |
| Missing required permit | Submit rejected; application does not become Pending |
| Uploaded document has mismatched extension/MIME and signature | Rejected |
| Standard User tries to approve an application | 403 from backend |
| Admin approves pending application | Server updates role, business record, audit log, and tracker |
| Admin tries to approve twice | Duplicate approval rejected |
| Admin asks for changes | Applicant sees remarks and can resubmit |
| Another customer requests someone's documents | 403; documents are not public |
| Approved owner publishes Add Establishment | Public `places` record, owner UID server-generated, owner email in `private_places` |
| Standard user uses Add Establishment | Existing pending suggestion path remains |
| Approved owner enters a forged owner UID/email in request | Forged fields ignored by server |
| Suspended / unapproved business tries direct publishing | Rejected |
| Account deletion | Private application and document records removed through existing cleanup plan |

## Data and privacy

- `business_applications/{uid}` stores application metadata; `business_application_files/{uid}_{kind}` contains private (base64-encoded) document data; `verified_businesses/{uid}` stores approved ownership metadata. All three collections deny direct client reads and writes in `firestore.rules`. Authenticated Netlify Functions provide strictly authorized access.
- **No Firebase Storage dependency** for this version. Each private file is limited to **600 KB** because a single Firestore document has a ~1 MiB limit and base64 increases payload size. Large scanned PDFs must be compressed while preserving legibility or handled by a future private object-storage integration. Never use the public Suki, menu or Buzz photo uploader for permits.
- The system does not perform malware scanning, government registry validation, or automated document authenticity checking. Administrator must manually verify documents and business legitimacy.
- A successful **platform verification** means the Admin reviewed submitted evidence; it is **not government certification**. Existing publication moderation, account deletion and report handling remain relevant.
- Private document retention after approval should have a defined policy before accepting real applications. Account deletion cleanup now includes these files.
- The new Add Establishment backend enforces a conservative Lipa-area coordinate bound and uses the Lipa barangay list; this **is not a precise municipal polygon/geofence**. For production, use a verified municipal boundary and an official business registry/permit verification method.

## Important implementation notes and limitations

- Users with `role: business` from older/manual assignments **retain legacy behavior**. Only users approved through this new Phase 7 application can take the new direct-publish path.
- The approved owner's public listing is not marked `is_verified: true` merely because it was self-published; verification refers to their **business registration**, not a second verification of the location/listing's content. It can still be reported or removed for violations.
- This is a capstone implementation, **not a production-level permit vault**. Private object storage with antivirus scanning, formal retention/deletion rules, and audit review is recommended before storing live government permits.
- Business analytics and sales reports are **not yet implemented**. That is the next separate phase.

## QA results in this environment

- **12/12** new Phase 7 backend tests passed (mocked Firebase services, no live Firebase writes).
- Phase 7 full test suite: **268/323 passed**, **55 unresolved failures**. Phase 6 baseline: **256/311 passed**, **55 unresolved failures**; new failure names: **none**. Existing failures mostly reflect unavailable dependencies and pre-existing test assertions.
- Business registration form simulated in headless Chromium at desktop 1280px and mobile 375px. Both showed 5 document controls, a Draft status, no horizontal overflow and no JS errors. This used mocked account data, **not live Firebase**.
- `npm run build` succeeded. **Live Netlify, Firestore Rules, email provider, real permit upload, and actual Admin approval still require testing after deployment.**
