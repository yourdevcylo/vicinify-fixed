# Vicinify — Business Analytics, Phase 8

**Baseline:** `Vicinify_Business_Registration_Phase7.zip` (Phase 7). The Phase 8 ZIP is a complete Netlify project, not only the static `dist` directory.

## How to use

1. Sign in with a verified **Business User** who is the actual `owner_uid` of a place.
2. Open **Business Hub → Business Analytics**.
3. Choose the establishment, then click **Load report**.
4. Switch **Weekly**, **Monthly**, and **Annual**; use **Export CSV** to export only the currently selected aggregated series.

The server checks Firebase ID token validity, verified email, and exact `places/{placeId}.owner_uid` before reading bookings. An admin account does not automatically receive another business's sales details just because it is an admin. No customer names, IDs, bank references or receipts are returned in the reports.

## Definition of an eligible transaction

A transaction counts as completed in analytics only when all of these are true:

- `status === 'received'` — the customer confirmed receipt;
- `customer_confirmed === true`;
- `paymentStatus === 'confirmed'`;
- `paymentVerifiedAt` exists and is a valid timestamp.

An eligible transaction contributes to **Recorded Verified Payments** only if `paymentAmount` and `paymentAmountDue` are both valid positive PHP amounts, are equal to the cent, and no refund status requiring reconciliation exists. Transactions that fail this narrower amount check remain visible in **Completed, missing verified amount**, not in recorded sales. Pending, accepted, rejected, cancelled and merely fulfilled (not customer-confirmed) requests are excluded.

**Important limitations:** Vicinify does not process GCash/Maya/bank payments. Business confirmation and the recorded payment fields are **not independent proof of settlement**. This dashboard does not measure the business's entire POS income or expenses, and does not calculate profit. Refund/dispute cases are excluded conservatively from the money totals rather than guessed. The current week/month/year is incomplete, so comparisons with earlier full periods are not normalized.

## Reporting coverage

- Grouping uses **Asia/Manila** local dates. Weeks begin Monday.
- New transactions use `customerConfirmedAt` as completion time. Old records without that field use `createdAt` as a clearly counted legacy fallback.
- Weekly chart: last 10 weeks, including the current week.
- Monthly chart: last 13 months, including the current month.
- Annual chart: previous and current calendar year.
- Top-selling items: verified `menuLines` quantities over the last 13 calendar months. Does not infer sales from free-text messages.
- Read scope: bookings created since January 1 of the previous calendar year, limited to 4,000 most recently created bookings per selected establishment. If exceeded, the report warns that figures are **incomplete**; an accurate full historical report requires a dedicated scalable aggregation pipeline.
- No auto-polling: load or refresh manually to avoid unnecessary Firestore reads.

## Deployment

1. Back up your current working Netlify project and Firebase Firestore rules.
2. Deploy the full Phase 8 source through your existing Git / Netlify CLI build so `netlify/functions/businessAnalytics.js` is deployed with the static assets. A `dist`-only upload will not deploy this protected function.
3. Ensure the existing Netlify `FIREBASE_SERVICE_ACCOUNT` server environment variable and authentication still work. Never expose it to the browser.
4. The Phase 7 `firestore.rules`, `firestore.indexes.json`, `firebase.json`, and `netlify.toml` are **unchanged** by Phase 8. The existing index for `(placeId ASC, createdAt DESC)` covers the analytics query. Do not replace newer production rules with older copies.
5. Sign in as an assigned owner, load a report, check one paid-and-customer-received transaction and one pending/cancelled transaction, compare recorded totals, and test CSV export.
6. Attempt the same place ID while logged in as a different business owner; the backend must return HTTP 403. Confirm that customer screens and existing Suki/booking flows still work.

## Source changes

- `index.html`: one Business Analytics section and two asset links.
- `js/dashboard.js`: pass assigned-owner establishments to analytics and clear the report on logout/role change.
- `js/business-analytics.js`: dashboard visuals, accessibility, API call and aggregate CSV export.
- `css/business-analytics.css`: scoped, mobile-friendly styles.
- `netlify/functions/businessAnalytics.js`: server-only authenticated query and ownership check.
- `netlify/functions/lib/business-analytics.js`: deterministic PHP-local aggregation and recorded-payment safeguards.
- `tests/business-analytics-phase8.test.cjs`: focused boundary, amount, date, authorization, and compatibility checks.

No change to original booking transitions or payment confirmation, Suki stamps, VIP discounts, business registration, or unrelated app modules.

## Tests (local)

- `node --test tests/business-analytics-phase8.test.cjs`: all 11 focused tests passed.
- `node --test tests/*.test.cjs`: 279 passed / 334 total, 55 failures. The 55 failures match the existing Phase 7 baseline; this does **not** constitute a clean full regression pass.
- `node build.cjs`: successful; outputs `dist/` for static hosting.

Not yet live-tested against the user's real Firebase/Netlify deployment or real payment records. Deploy to a test environment first.
