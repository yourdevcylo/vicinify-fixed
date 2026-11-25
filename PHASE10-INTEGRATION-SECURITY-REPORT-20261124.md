# VICINIFY | Phase 10 Integration & Security QA

Date: 2026-11-24 (Asia/Manila)
Source baseline: `Vicinify_Business_Notifications_Phase9.zip`
Output: Phase 10 full project ZIP (not a live deployment)

## Release status: CONDITIONAL / NOT YET PRODUCTION-CERTIFIED

This iteration contains **one narrowly scoped backend correctness/security fix** and new regression tests. The absence of *additional* failing tests does **not** mean the site is production-ready. The Firebase/Netlify/Resend project and real browser user flows were **not tested live**.

### Confirmed fix: automatic Suki stamp verifies payment

The previous online Suki award path considered an order eligible when it was marked `received` with `customer_confirmed === true` and had nonempty menu lines. It did **not** also require the business-verified payment data used by the financial reporting system.

Phase 10 now uses `paidCents(order)` from the existing business-analytics policy as the shared source of truth. To receive an **automatic online** Suki stamp, the order must:

- Have `status === 'received'` and `customer_confirmed === true`.
- Have `paymentStatus === 'confirmed'` and a valid `paymentVerifiedAt`.
- Have a positive, valid amount for both `paymentAmount` and `paymentAmountDue`, with those amounts matching exactly.
- Have no open, sent, or received refund status (only blank or `not_required` qualifies).
- Have a nonempty canonical `menuLines` array.
- Pass the existing **one customer + one establishment + one Asia/Manila day** rule, including order idempotency.

**In-store approval is unchanged.** Business staff must still confirm a real, eligible walk-in purchase before approving a stamp. The frontend cannot mint stamps itself.

**Data migration:** No Firestore migration, rules change, or retroactive deletion is included. Previously awarded stamps stay in the database. This also means earlier incorrectly awarded stamps are not automatically reversed. Existing legacy online transactions without complete payment records will not get a new automatic stamp on retry; they require legitimate business review rather than treating missing evidence as paid.

## Actual local validation

| Check | Result | Interpretation |
|---|---|---|
| Phase 10 cross-module security tests | 11 / 11 passed | Offline simulation and source checks, not live Firebase |
| Updated daily-stamp suite | 12 / 12 passed | Includes existing concurrency and timezone tests |
| Full `npm test` run | 297 passed / 352 total; 55 failed | Same **55 failure titles** as Phase 9 baseline |
| Phase 9 baseline full test | 286 passed / 341 total; 55 failed | The 11 additional tests passed; no additional failures |
| `node build.cjs` | Passed | Static output generated in `dist/` |
| Firestore rules | Unchanged | No new rules deployment required just for Phase 10 |
| Project file preservation | 0 baseline files deleted | Only Suki backend code, prior tests, one new suite, this report changed |
| HTML static structure | 352 unique IDs, 0 duplicate IDs | Source inspection only, not browser layout testing |
| Chromium desktop/mobile smoke navigation | Blocked by sandbox policy | `ERR_BLOCKED_BY_ADMINISTRATOR` for localhost and file URLs; **not** counted as passing |
| Live Firebase emulator/rules integration | Not run | Emulator/dependencies unavailable in this environment |
| Actual Netlify + Firebase + Resend E2E | Not run | Requires access to deployment and controlled test accounts |

## Outstanding risks and known limitations

1. **55 pre-existing full-suite failures remain**. Many are due to missing `firebase-admin` and `jsdom` in this test environment; some assertions may require independent fixing. Passing focused tests does not resolve them.
2. **Historical stamps and refunds**: this update prevents a *new* award on an already-refunded order, but it does not retroactively subtract a stamp if a payment is reversed *after* the stamp was awarded. Implementing reversals safely needs an audited policy for partially used or redeemed rewards and other qualifying purchases on the same day.
3. **Financial reports** use manually confirmed in-app payments, not independently verified bank or point-of-sale settlements.
4. **Private permit uploads** are sensitive personal/business documents stored in server-owned Firestore docs (Phase 7 design). Review retention, deletion, administrative access, backups and consent before real applicant onboarding.
5. **No independent live rules verification**: reading the `firestore.rules` file is not proof the deployed rules match. Emulator/deployment tests are still required.
6. **Email configuration**: Resend approval emails need a working `RESEND_API_KEY`, verified `VICINIFY_FROM_EMAIL` and a real delivery test. Failed emails must not change approvals.
7. **Browser UI testing**: mobile responsiveness, visual stacking, popup layering, file uploads and role switching require a normal browser where the site can load.
8. **No real payment processing** is implemented. The application records business confirmations; do not describe it as collecting or settling payments.

## Required human QA before launch

Run against a **staging** Firebase/Netlify project with test accounts and dummy permits. Do not use real government documents as test data.

1. **Customer:** Create account, verify email, open map/list, filter an establishment using secondary category, open menu, request an order or reservation, review server quote.
2. **Business application:** As normal user, save draft, upload test PDF/image, submit, view timeline; verify unauthenticated or unrelated user cannot read application or document.
3. **Admin:** Open business application, request changes, approve after resubmission; verify role unlock and owner UID; verify no second listing approval needed for approved business.
4. **Business:** Add a listing with 2–3 categories; edit categories; check customer map/list/search/Vici AI results. Open Business Analytics; check owner-only access.
5. **Order and payment:** Confirm normal quote, VIP quote, expiry/revocation, forged price rejection, cancellation/refund and the manual payment review. Check no payable amount is silently changed.
6. **Suki online:** Create **two verified paid orders on the same Manila calendar day**; only one Suki stamp and one qualifying day. Also check pending/unpaid/mismatched/refunded orders get **no** automatic stamp. Confirm no double count after retry.
7. **Suki in-store:** Submit QR/walk-in request on the same day as online order; verify no second stamp. Test owner-only approval and one claim per full card; verify lifetime redemption counter and VIP days persist after redemption.
8. **VIP:** Grant on reaching configured qualifying days, manual grant with reason, expiration, revocation and discount calculation. Verify unknown/expired VIP cannot reduce invoice amounts.
9. **Email:** Test submitted, approved, rejected and changes required. Simulate Resend failure; verify admin decision persists, email remains retryable and resending does not repeat the decision.
10. **Mobile:** Test 320px, 375px, 768px and desktop widths for registration, permit uploads, Suki Card, business dashboard, booking dialogs, charts and menus; verify no horizontal overflow.
11. **Security:** Use Firebase Emulator Suite to verify a standard user cannot edit own role, stamp/loyalty counters, payment records, owner-only analytics or private business applications; check admin-only reads.
12. **Data protection:** Delete a test account after concluding bookings; confirm private permit files and application information are handled according to the deletion policy. Back up staging before any migration or rules publish.

## Deployment checklist

- Back up Firestore and confirm the currently deployed production ZIP/commit before making changes.
- Deploy **full Netlify project with Functions**. Static `dist` upload alone will not deploy `sukiStamp` and other backend functions.
- Verify `FIREBASE_SERVICE_ACCOUNT` and other secrets are held only in Netlify environment variables, not committed in the project or shipped to browsers.
- If Phase 9 Firestore Rules are already deployed, no new Firebase Rules publish is needed **for this Phase 10 delta**.
- Re-run `npm ci`, `npm test` and `npm run build` in a normal network-enabled CI/staging environment. Investigate all 55 unresolved failures before calling the release fully tested.
- Use demo customers and staging orders to verify server-side Suki behavior and backward compatibility prior to public rollout.

## Scope of source changes

- Modified: `netlify/functions/lib/suki-stamps.js`
- Updated tests: `tests/suki-daily-ledger.test.cjs` (valid paid-order fixtures matching new policy)
- Added tests: `tests/phase10-security-integration.test.cjs`
- Added: this report.
- **No baseline file removed;** unchanged `firestore.rules`, `firebase.json`, `firestore.indexes.json`, `netlify.toml` and unrelated application logic.

## Suggested future work

The immediate next step is **staging verification and fixing the 55 legacy failures**, followed by a clear post-award refund/reversal policy. Do not claim production readiness until deployed Firebase rules, manual payment records, email sending and actual mobile flows have been tested.
