Green light/dark theme audit: fixed legacy input palette, Add Establishment focus and controls, editor/Suki fields, signup checkbox, Business Posts action, body-mounted dialogs, feedback/payment styling and text contrast. Includes all earlier fixes. See THEME-AUDIT.md for scope and validation. 24 test files and build passed; local rendered-page and dynamic-dialog fixtures verified. Live service actions not performed.

Direct transaction: removed the internal transaction dropdown. Customer history and business inbox now pass the exact booking ID; new requests open the returned booking ID. A selected request listens to its own document (including older history beyond the recent-five limit); no fallback to another request. Inquiries remain separate; all previous refund/archive/theme fixes retained. Tests and build passed.

Refund/transaction archive: owner must approve server-calculated refund, separately confirm manual transfer with reference; only customer can explicitly confirm receipt. Customer can dispute nonreceipt; refund chat remains open. Completed/rejected or cancelled-and-settled conversations close on live transition; history is retained, archived composer hidden and linked text writes denied by rules. Zero computed refunds resolve without a transfer. Backend audit timestamps track approval/sent/receipt. Image proof upload is not yet implemented (Firebase Storage follow-up); current evidence is manual reference. Deploy updated rules before Netlify/client release. 24 test files and 60 browser refund-stage/role/layout checks passed; live Firebase/emulator not verified.

Transaction chat + single payment flow: remove legacy payment import endpoint/button, old receipt autofill and payment requirements controls. Restore compact transaction composer; link text to selected booking; filter per transaction and exclude from inquiries. Rules validate matching booking customer/place and immutable transaction link. Deploy Firestore rules BEFORE new client. Existing paid records retained; no data deleted. Expanded client/server tests and 32 browser layout cases passed; build passed. Live Firebase/emulator validation unavailable.

Submit-once feedback: review endpoint rejects existing transaction reviews regardless of createOnly. Atomic review + booking completion marker + validated feedback-request status update; UI uses canonical submitted marker/responses and prevents reopening submitted feedback. No client status-sync dependency. Previously saved reviews remain protected by deterministic review ID; old stale cards may require reloading. All 24 test files passed, expanded server/UI tests passed, build passed. Netlify deployment required for server endpoint.

Feedback theme: green request card, waiting badge and primary actions; green checkbox/focus; theme-aware dialog/inputs; gold rating stars preserved. Mobile/tablet light/dark browser checks and build passed. Includes all previous changes.

Inquiry chat adjustment: 90 messages/minute and no per-message delay in client/rules. Refresh verified user token and retry once only after rejected permission write; preserve draft on failure. Deploy Firestore rules separately BEFORE updated client. No access restrictions bypassed. Exact production permission cause not confirmed; Firestore emulator/live verification unavailable. Content-policy checks/build passed.

Ownership language fix: explicit English translation keys on dynamic ownership button, modal headings, statuses and actions; preserve business/person names. Switching PH to EN restores labels even when first rendered in PH. Browser switching and 48 layout checks, regression test, build passed.

Admin tabs fix: repaired missing filter-content closing tag that nested Users through Audit inside the hidden Establishments panel. Restored booking/approval filter groups. Regression test and Chromium all-8-tab visibility check use fixture data; live Firebase permissions not tested. Static build passed.

Transaction picker: show reservation date/time, readable status, and short reference instead of type + random ID only. Legacy Date/Time details supported. Build and label checks passed.

Transfer modal and receipt upload fix

- Receipt photo picker now styled inside body-mounted modals: one visible control, unchanged native selection event.
- Ownership transfer has compact green header, circular close, aligned Cancel/submit footer. Password verification and recipient acceptance remain required.
- Browser: 48 viewport/theme/language dialog checks; receipt selection updates verified; static build passed.

CURRENT REVIEWABLE BUILD — 2026-10-29

Includes all prior cumulative account/ownership/Suki/password/modal/transaction fixes. New: Netlify-native IP/domain rate-limit declarations (120 page requests/minute,600 Netlify API requests/minute), JSON/HTML HTTP429 response with Retry-After60, and green document error handling for400/401/403/404/408/413/429/500/502/503/504. A custom static404 is generated for Netlify missing routes; original error statuses are preserved. API errors stay JSON instead of replacing in-progress forms with HTML. Static app assets are excluded from the page counter. Firebase sessions unchanged.

Read CURRENT-DEPLOY-STEPS.md. Deploy source+Netlify Functions+Edge Functions, Firebase indexes then matching Firestore/Storage rules; wait indexes Enabled. Configure Firebase Auth password policy and reset template separately as described in PASSWORD-RESET-SETUP.md.

VERIFICATION LIMITS
22 local test files passed; build passed. Error-response unit tests pass, including true error statuses/no-store/Retry-After/HEAD/API behavior. Native Netlify counter enforcement is NOT tested until deployment accepts the inline declarations and a staging/live check is performed. Firebase rules emulator is NOT verified because the official emulator download was blocked by environment network policy. Production email policy, real-device camera/location and production multi-account flows remain separate checks. No production deployment, deletion, transfer or password change was executed here.

Latest cumulative update — 2026-10-29

OLD -> NEW
- Blue reset-password icon, square close and blue focus/shadow -> shared green icon/focus palette, circular SVG close control, compact spacing and neutral cancel action.
- Terms modal outer scrolling/large blank header -> fixed header/footer, scrolling reading area, section separators, compact Close button, circular X, Escape close and focus return/trap. Terms text is unchanged.
- Sign-up/change forms with duplicated checks and default Firebase email reset -> shared js/password-policy.js and custom reset-password.html with matching 8-character/upper+lower/number/special requirements, confirmation, link verification, duplicate guard and action-code removal on success.

IMPORTANT FIREBASE SETUP STILL REQUIRED
No production Authentication configuration was changed. A ZIP cannot set your Firebase project's password policy or email template. Set Authentication > Settings > Password policy to Require, minimum8, uppercase/lowercase/number/non-alphanumeric. In Templates > Password reset > Customize action URL, use the actual published site origin plus /reset-password.html. Read PASSWORD-RESET-SETUP.md. Until configured, existing/native reset links can still use the old hosted form. Use a fresh email for testing after configuration.

VALIDATION
21 local test files passed; build passed. 16 viewport/language/theme checks each for reset modal and Terms, including narrow320px layout and fixed Terms header/footer; custom strong-password reset form checked with mocked Firebase. Real password reset/email delivery and project-level enforcement are not verified here. Previous rules-emulator download blocker remains; see ACCOUNT-DELETION-TRANSFER.md. No production deployment or account/password mutation was performed.

Latest cumulative release — 2026-10-29

OLD -> NEW
1. Client-only profile/Auth deletion -> recent password authentication, server preflight blockers, explicit close-business choice, paged/resumable cleanup, anonymous essential ledger/reviews, storage cleanup and Auth deletion. Counterpart records/payment evidence are preserved. Server-only deletion tombstones remain.
2. No manual transfer -> Business Hub > Manage Listing > Transfer ownership. Current owner enters registered verified-business recipient email and current password. Ownership does not change until recipient accepts in Business Hub > Ownership transfers. Pending transactions/refunds block transfer. User-folder business images are copied into place-owned storage so deleting the former owner does not break them. No automatic email is sent.
3. Hard-to-scan QR -> bundled local QR libraries, explicit black/white contrast and quiet margin, larger QR, fixed concurrent script loading/retry, rear camera preference, bounded decode resolution and ~10fps attempts. Client display rotates every30s/current+previous windows valid up to60s from window start. This remains the legacy CLIENT token model, not a server-issued anti-replay challenge. Owner stamp approval still required.
4. Credentials left in hidden form after logout -> app-held email/password fields and settings passwords cleared; password visibility reset. Browser password-manager entries are not deleted by the app.
5. Featured/Premium remnants -> all client/admin controls, flag writes, filters, public flags, marker pulse/star and misleading list favorite-star removed. No featured/premium ranking/display effect remains. Historical fields may remain stored; security rules keep guards for legacy privileged fields. Customer ratings and green Favorites remain. Internal dashboard.js filename is unchanged.

VALIDATION
20 local test files passed, build passed. Browser fixtures:48 screen-size/language/theme form checks; actual bundled QR generator output successfully decoded by bundled jsQR. Physical phone camera/location and production multi-account flows are not verified here. Firestore/Storage emulator run was attempted but blocked downloading the official emulator from storage.googleapis.com by environment network policy. New rules tests are included but the modified rules are NOT emulator-verified here.

DEPLOYMENT REQUIRED
Read ACCOUNT-DELETION-TRANSFER.md. Deploy matching full source AND Netlify functions, Firestore/Storage rules and new indexes. Wait for Enabled before using the feature. Commands:
firebase deploy --only firestore:rules,firestore:indexes,storage --project vicinify-c9828
Run npm run test:rules where Firebase emulator download is allowed before production rollout. No production deployment, account deletion or ownership transfer was executed by this workspace task.

Current cumulative update — 2026-10-29. Supersedes earlier flow notes below.

OLD -> NEW
- Duplicate controls inside conversation cards -> one pinned transaction desk; linked cards become compact timestamped updates. Legacy unlinked records retain their fallback controls.
- Inquiries and transaction updates mixed -> separate modes and unread classification. Transactions open from request records; normal Messages opens inquiries. Header switch moves between views. The inquiry composer is absent from transaction mode. Existing data is not deleted or migrated.
- Long permanent process/details -> collapsible progress, requirements and payment details, preserving the next action. Green transaction buttons, including Activity transaction/review actions.
- Preparation possible before cash payment -> all requests must have verified payment before preparation. New requests offer GCash/Maya/bank transfer only, including table reservations. Server blocks acceptance-to-preparation bypass. Legacy cash requests require business to explicitly choose prepaid instructions; never auto-marked paid.
- Broad requirements for table reservations -> table reservations do not request delivery address/current location; request only missing reservation details. Skip requested details does not verify or skip payment.
- Refunds -> manual transfer, visible stored refund policy before payment, server amount calculation, owner reference and customer receipt confirmation retained. No bank transfer is performed by the app.
- Favorite heart mismatch -> green in My Activity, consistent with establishment theme.
- Confusing list photo star -> removed (this was a Save establishment action, not a premium badge). True featured/premium map styling, public flag fields and admin filters removed. Customer rating stars remain. Stored historical flags are not deleted.
- Add-place location fields stuck after first result -> newest detected address/barangay replaces prior auto-values, stale responses ignored, manual edits preserved. Street/house data only if supplied by map provider; no invented address.
- Textarea size transition -> height/width no longer animated. User confirmed dragging the textarea resize handle was slow. Description/editor textareas resize vertically within form width; verified in Chromium by dragging from 82.5px to 171px height, unchanged width and no height/width transition.

VALIDATION
17 test files passed; build succeeded. 32 browser combinations passed for transaction panel viewport/theme/language/requirements states at widths 320,393,768,1440, including no inquiry composer in transaction mode. Screenshots use local fixture data, not production accounts. New tests cover pin-update races/manual edits, no-payment preparation bypass, allowed request payment methods and transaction-history separation. Live multi-account payment/refund and deployment still require verification.

DEPLOY
Deploy full source plus Netlify functions. This ZIP does not deploy itself or change Netlify environment variables. Keep ALLOWED_ORIGIN equal to the actual site origin. Set GEMINI_MODEL to the model available in your Gemini project. Required bookings index remains in firestore.indexes.json; deploy indexes separately and wait Enabled. No rule loosening needed for the transaction UI changes.

Language, layout and AI chat update — 2026-10-29

Old -> New
- Translated category/theme labels could escape narrow buttons -> bounded grid columns, fixed-size icons and measured single-line text fitting after container resize, translation updates and font loading. Dessert category uses concise Filipino Panghimagas.
- English install help button in Filipino mode -> translatable installation label.
- Blue Buzz comment count and shifting actions -> green count and equal columns with reserved count space.
- Tagalog guard response in English mode -> English guard and fallback; Gemini prompt follows selected English/Filipino app language. Existing history is preserved as originally received.
- Yellow AI unavailable bubble -> green theme error styling, error text retained.
- Only clear-all chat history -> individual chat deletion, with pending answer cancellation for deleted active chat.
- Minimize hid the chat without a visible return control -> floating Vici AI resume button restores the conversation; close remains a separate dismissal.

Validation: npm test (16 test files passed), node build.cjs. Added delete/pending-answer and minimize/resume regression coverage. Visual browser verification/screenshots remain pending because automatic approval review rejected the browser check due to review-service usage limit. No production deployment was performed here.
Deploy the full source AND Netlify functions for the AI language changes. Keep ALLOWED_ORIGIN exactly matching the actual site origin. Gemini model availability depends on the deployed GEMINI_MODEL environment variable; this ZIP does not change that setting.

Navigation and place details update — 2026-10-29

Old: abrupt page switches; generic banner slogan and local-favorites label; blue dark-mode place panels and warning-style owner rating notice.
New: 160ms opacity fade on a changed page, immediate activation, no additional database requests, honors reduced motion; actual establishment name/category in banner; generic label removed; place panels use shared green theme and owner notice uses neutral green styling.
Validation: npm test (16 test files passed), node build.cjs. Navigation test covers immediate activation, duration, same-page behavior and reduced motion. Browser screenshot verification was blocked by the automatic approval review service usage limit; visual device checks are still pending.

Latest update — 2026-10-29

Old: AI failures showed one generic unavailable message; setup guide described an outdated deployment flow.
New: frontend distinguishes origin rejection, incomplete server setup, login rejection, rate limits and timeout, with Filipino translations. Setup guide describes the current Netlify function.
Confirmed production error: Forbidden origin. In Netlify set ALLOWED_ORIGIN to the EXACT origin used in the address bar, without trailing slash (e.g. https://viciweb.netlify.app), then redeploy. This ZIP cannot set your Netlify environment variables.
All cumulative source and Netlify functions retained, including admin saved-status display fix and request/payment/refund work.
Validation: npm test (16 test files passed), node build.cjs. Production AI still needs validation after the environment change and deployment.
Deploy the complete source through the connected Git repository; Netlify builds dist and deploys netlify/functions. This download HTML is only a ZIP delivery page, not the website deployment.
