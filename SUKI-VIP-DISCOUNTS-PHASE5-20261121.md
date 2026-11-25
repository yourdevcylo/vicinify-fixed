# Vicinify Phase 5 — Server-validated VIP discounts

**Baseline:** `Vicinify_VIP_Suki_Phase4.zip` (Phase 4). This is an incremental release, not a rewrite.

## Scope and behavior

- The existing Business Hub > Edit Suki Card > VIP Suki Program has a NEW **Automatic VIP discount for Vicinify menu orders (%)** field. Accepts whole-number 0–50; `0` disables online discount. Freeform `VIP benefit description` remains separate and does not automatically alter amounts.
- Discount is only offered when: the establishment has Suki & VIP enabled, the owner has set a positive percentage, and the authenticated customer has an **active, nonexpired, owner-approved VIP card for this exact establishment**.
- `orderQuote` obtains current menu item prices/options and valid VIP state inside a Firestore transaction; it returns original menu subtotal, VIP percent, VIP saving, and discounted menu total. The UI shows a breakdown in both menu-cart and booking-review forms.
- `booking` revalidates all menu items/options, VIP membership, expiry, and percentage inside its own transaction. If prices, VIP status, or rate changed, it refuses the previous quote and asks for a new review. Customer-supplied amounts, fake VIP flags, and claimed discount percentages are ignored.
- A new booking records immutable snapshot fields: `estimatedSubtotalCents` (gross), `vipDiscountPercent`, `vipDiscountCents`, `estimatedTotalCents` (after discount), `vipApplied`, and `quoteDigest`. The message card mirrors these values for transaction display. **These snapshots are preserved if VIP is later revoked or the owner changes the program**; old requests are never repriced silently.
- When setting payment terms for a VIP-discounted order, the owner cannot replace the discounted menu subtotal. The payment dialog instead asks for **additional fees only**, zero by default, and a reason (required for a positive fee). The backend computes `paymentAmountDue = estimatedTotalCents + additionalFeeCents`. Optional additional fees are capped at PHP 5,000 and itemized for customer review. The owner's separate payment recipient/instructions are still required.
- The normal legacy payment-terms flow for orders without an applied VIP discount is **unchanged**.
- The customer's payment proof is still verified against the agreed amount due through the existing protected server flow. Vicinify does not directly charge or transfer money.
- No changes to stamp issuing, 1-stamp-per-day ledger, VIP grants/revocations, redeemed reward counts, login, Buzz, standard menus, or ordinary order status transitions.

## Examples

**10% VIP menu discount on a PHP 500.00 order**
- Menu subtotal: PHP 500.00
- VIP discount: PHP 50.00
- Discounted menu total: **PHP 450.00**
- Extra fee: PHP 0.00 → Amount due: **PHP 450.00**
- If the owner separately adds PHP 40.00 with a clear fee reason → Amount due: **PHP 490.00**

The discount applies to listed menu line totals including valid add-ons. It does NOT automatically discount separately added delivery/handling fees. No menu order means no VIP discount (for example, a table-only reservation).

## How to enable and test

1. **Back up** the currently deployed website, Firestore rules and data.
2. Deploy the **full Phase 5 ZIP project through Netlify** (Netlify Functions are required). Verify the server has `FIREBASE_SERVICE_ACCOUNT`. Do not upload only `dist/`; that would omit the validated order quote/booking code.
3. **Firestore rules are byte-for-byte UNCHANGED from Phase 4**. If the Phase 4 rules are already published, no new rules publish is necessary for Phase 5. If they have not been published, deploy the existing rules supplied with this ZIP along with all prerequisite Phase 3/4 functionality.
4. Using an approved business owner account: open **Business Hub > Edit Suki Card**; enable Suki + VIP; set **VIP online discount to 10%**, save, and make sure the customer has a previously approved active VIP for that business.
5. Sign in as the VIP customer. Add an available menu item, review the price breakdown, submit one test request, and check the Business Hub shows the same breakdown.
6. Owner accepts; selects **No additional details needed** (or confirms requested details); opens the payment instructions dialog; enters an additional fee `0.00` and payment instructions. Confirm the displayed **Amount Due** matches the discounted total. For a delivery fee use a positive amount and an explicit fee reason.
7. Test a **regular customer** (no discount), an expired/revoked VIP (no discount), a disabled VIP program, and changes to the percentage between review and confirmation (fresh review required).
8. Re-check ordinary bookings, menus, chat, Buzz, Suki stamps and reward redemptions. Test a phone screen as well as desktop before switching production users to this release.

## Testing and safeguards

- New `tests/vip-discount-phase5.test.cjs`: nine tests, all passing in local test fixture (quotes, percentage, tampering, expiration, owner fees, locked saved amounts, UI, tiny price edge).
- Existing payment and Suki tests: relevant passing assertions retained. Full test suite still has the **same 55 failing cases as Phase 4** in the current test environment, largely missing `firebase-admin` and `jsdom`, with some previously failing assertions. No additional failures were introduced in the comparison.
- JS syntax and static production build completed. ZIP integrity checked.
- **Not yet live-tested** on the actual Netlify deployment / production Firebase. A live authorized test is needed before declaring the change production-ready.

## Limitations

- This phase implements a single, establishment-wide percent discount on the **menu subtotal** (0–50%). It does not implement per-item coupons, stacking multiple discounts, loyalty-tier pricing, commission/payment settlement, or live income analytics.
- Discounts are only applied to **newly confirmed menu-backed requests**; existing reservations and historical payment terms remain unchanged.
- An owner can still propose a separately described fee (capped), so customer and administrator review remains important. The software cannot prove offline fee legitimacy or that a manual bank transfer occurred.
- Zero-priced menu items cannot produce a negative/zero payable order through VIP rounding; the order keeps at least one cent of menu total.
