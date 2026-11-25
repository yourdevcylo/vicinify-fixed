# Vicinify Phase 3 — one Suki stamp per Philippine calendar day

**Base:** `Vicinify_Suki_Custom_Background_Phase2.zip` (Phase 2 custom background upload, previous redemption counter and downloadable editable template retained).

## Implemented

- Enforce **maximum one Suki stamp per customer + establishment + Asia/Manila calendar day** in a trusted Firebase Admin SDK transaction on the Netlify backend.
- Both **in-store owner-approved QR stamp requests** and **menu-backed, customer-confirmed completed Vicinify orders** share the same immutable daily ledger (`suki_daily_stamps`).
- Orders are eligible for auto-awarding **only** on the transition to `received` after the business has fulfilled/delivered and the customer confirms receipt. Pending/accepted/owner-only fulfilled orders and table-only reservations without menu items are excluded. Payment still takes place outside Vicinify; this is *transaction confirmation*, not independent payment verification.
- A second same-day order is registered in `suki_order_awards` so re-submitting/retrying it on another day cannot earn another stamp. Original receipt day is kept on retry when available.
- Existing regular stamp counter and `redemptionCount` are preserved. If a stamp card is full, a newly verified purchase day can still increase `verifiedPurchaseDays`, but it does not exceed the card's stamp target.
- `verifiedPurchaseDays` is the **new Phase 3 tracked count**, not a reconstruction of historic customer activity. Do not present it as total lifetime days from before this rollout.
- The customer card shows the new verified-day count and a "Daily stamp already used" notice after today's award.
- Owner's stamp approval and redemption now go through authenticated `/.netlify/functions/sukiStamp`. Previous direct owner updates to `loyalty_cards.stamps` and redemption totals are no longer allowed by new `firestore.rules`.
- New private ledger paths: `suki_daily_stamps/{sha256([placeId,uid,day])}`, `suki_order_awards/{bookingId}`. There is no client read/write permission for these collections.
- A one-time retry is attempted if the booking confirmation succeeded but its separate stamp award initially failed. Recovery endpoint action `retry_order` checks customer/owner/admin authorization and the canonical saved booking before awarding; it cannot create a second award for the same booking.

## Critical deployment order

1. BACK UP deployed Firestore security rules and current Netlify deployment. Keep the previous ZIP as a rollback copy.
2. Verify **FIREBASE_SERVICE_ACCOUNT** in Netlify environment; the secure functions already require this for bookings. Use server-only variables, never add service-account credentials to frontend files.
3. Publish the supplied `firestore.rules` in Firebase Console **Firestore Database → Rules**, including the private stamp ledger restrictions.
4. Deploy the **entire** ZIP as a Netlify source build (the `netlify/functions/sukiStamp.js` server function must be deployed, not just the static `dist/` folder). Netlify build runs `npm run build` and deploys the functions. **Do not just drag `dist/` to Netlify's manual static deploy tool.**
5. Hard refresh website, confirm `/.netlify/functions/sukiStamp` is deployed (an unauthenticated POST should return 401, not 404), and test with real owner and customer accounts in a non-production project if possible.
6. Test two approvals same day, another approval tomorrow, one received menu order, a second online order on the same day, a redemption, and cross-owner authorization. Confirm actual Firestore rules and permissions in your Firebase project.

**Important:** Website deploy and Firestore rules deploy are different. Deploying only one can break stamp approvals or leave old client-side writes allowed. The new rules deliberately deny direct owner mutation of stamp counts; legacy website code will fail after new rules until the new Netlify functions are deployed. Plan a short coordinated maintenance period.

## Code areas changed relative to Phase 2

- `js/common.js`: Suki approve/redeem now invoke trusted endpoint; daily UI hint, verified-day display.
- `js/settings.js`: one-time loyalty retry after saved customer confirmation.
- `netlify/functions/booking.js`: best-effort stamp award after successful customer confirmation (does not roll back the booking on a loyalty error).
- NEW `netlify/functions/sukiStamp.js` and `netlify/functions/lib/suki-stamps.js`: owner auth, idempotent Suki transactions, PH day ledger and order-once ledger.
- `firestore.rules`: lock down client stamp changes, create private ledger collections.
- `tests/suki-daily-ledger.test.cjs` and updated `tests/suki-redemption-counter.test.cjs`.

### Unchanged scope

Login/signup, Business Hub menu editor, Buzz, restaurant search/map, Vici AI, card graphic uploads, existing Suki design options, existing booking status policy, and other collections are not intentionally altered. Existing booking code received a small post-confirmation stamp hook only. Existing Firestore indexes and storage rules remain unchanged.

### Remaining work

- VIP status, owner-defined VIP discounts/benefits, business registration with private document review, multiple categories, approval notification emails, and business analytics are **not** included.
- Stamp requests originating in-store still depend on the owner correctly verifying the purchase; browser GPS/QR is not independent proof of payment and cannot stop colluding parties.
- Existing legacy stamps cannot be reconstructed into actual unique visit dates. Initial verified-day progress begins from this update.
- No scheduled background retry exists. If both first award and one-time retry fail, the authenticated Suki `retry_order` endpoint allows recovery, but a future Admin recovery UI is still needed.

## Test notes

- Core JavaScript syntax and static build: successful.
- Focused no-external-dependency tests (Suki daily ledger, render, proximity, navigation, establishment): **35/35 passed**.
- Wider test attempt found pre-existing environmental dependency problems: no `firebase-admin`, `jsdom`, or Firebase emulator in this container. `npm ci` could not download npm packages due DNS/network failure. Therefore full dependency-backed/emulator tests and production Firebase integration are **not verified**; do not claim the project is fully regression-tested until testing in your own environment.
