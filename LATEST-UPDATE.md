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
