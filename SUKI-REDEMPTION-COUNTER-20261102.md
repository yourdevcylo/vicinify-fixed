# Vicinify: Suki Lifetime Redemption Counter — Safe Incremental Update

## What changed
- Customer Suki Card displays current stamp progress AND "X rewards redeemed" on the front, and "Total redeemed" on the back.
- Business Hub > Suki pending claim cards show "Previously redeemed: X reward(s)" for the claiming customer.
- When an authorized business owner clicks **Mark as claimed** and confirms the reward was actually given, a Firestore transaction:
  1. Reads the existing customer loyalty card and establishment's configured stamp threshold.
  2. Checks for an active pending claim and enough stamps.
  3. Consumes the required stamps, clears the claim, increments `redemptionCount` exactly once, and saves `claimedAt`.
  4. Leaves any excess stamps (from older cards) on the card.
- For old cards with `claimed: true` but no `redemptionCount`, the UI recognizes one prior redemption; next successful stamp approval starts a new cycle rather than locking the card forever.
- Old cards that have no claim history cannot have their full historical redemption totals reconstructed. Counts are accurate for confirmed redemptions after this update.

## Data and compatibility
- Existing collection: `loyalty_cards/{placeId}_{customerUid}`.
- New optional numeric field: `redemptionCount`. Defaults to 0 for new cards. Preserves existing records.
- `claimedAt` is retained as the latest redemption timestamp, not a complete history.
- Owner-confirmed redemptions are counted, not unapproved `claimRequested` messages.
- Do not treat this as completed-order verification: that and one-stamp-per-day enforcement are separate future backend work.

## Scope / deployment
- Changes are limited to `js/common.js`, `js/dashboard.js`, one new focused test, this guide, and rebuilt `dist` deployment files.
- **No changes** to `firestore.rules`, `firestore.indexes.json`, `firebase.json`, reservation, map, Buzz, Vici AI, or account code.
- Deploy the updated Netlify project. No new Firestore Rules publication is required solely for this change, assuming the previous working rules are already deployed.

## Test procedure (after deployment)
1. Open a customer's Suki Card; inspect both faces for redemption total (0 on a new card).
2. Reach configured stamp threshold and request reward claim.
3. In Business Hub > Suki inbox, see previous redemption count; click Mark as claimed, confirm reward was given.
4. Refresh customer Suki card. Total redeemed increases by 1, stamps used for the reward are consumed, and card can accumulate a new cycle.
5. Try a second Mark as claimed for the same request: must not increment again.
6. Confirm stamp request, booking, Buzz and login behavior still functions.

## Verification
Focused tests: `node --test tests/suki-redemption-counter.test.cjs tests/suki-establishment.test.cjs tests/suki-owner-alert.test.cjs` — 16/16 passed. Build and syntax checks passed. Three previously known `suki-design.test.cjs` harness failures (`document is not defined`) remain; live Firebase/browser regression testing is still required.
