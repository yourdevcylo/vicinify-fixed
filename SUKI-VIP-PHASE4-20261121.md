# Vicinify Phase 4 — VIP Suki Membership

Baseline: Vicinify_Suki_Daily_Stamp_Phase3.zip.

## What changed
- Suki Card Studio: owner can enable VIP, set required verified purchase days, choose permanent/30/90/365 day status, and describe a custom benefit.
- Owner can load the first 100 loyalty-card holders for that establishment, approve eligible VIPs, manually grant VIPs with an audit reason, or revoke with a reason.
- `sukiStamp` server action `set_vip` confirms Firebase token and place ownership, performs the card change in a transaction, and creates a private audit event.
- Customer Suki Card displays active VIP status, progress, benefit description and expiry. Stamp count, verified days, and reward redemptions remain separate.
- No automatic discount application to online order quotes in this phase. Benefits are display-only until server-side discount pricing and receipt calculations are added safely. Do not claim an online discount is already deducted.

## Deploy
1. Back up the live project and current `firestore.rules`.
2. Deploy the complete project to Netlify with Netlify functions enabled; verify `FIREBASE_SERVICE_ACCOUNT` is set server-side.
3. Publish the included `firestore.rules` in Firebase Console. It adds a private deny-all rule for `suki_vip_events` (all other data restrictions retained).
4. Test with one owner + one customer: customer obtains verified purchase days; owner sets VIP program, saves, loads customers and approves; customer reloads card and sees VIP. Test a different owner cannot grant or revoke.
5. Confirm stamps, total rewards redeemed, menu, booking, Buzz, and chat still work.

## Limitations
- Customer list shows only first 100 cards per establishment (pagination is a later enhancement).
- Manual VIP grants are allowed by owner with a reason; threshold-based qualification is automatic *eligibility*, not automatic grant.
- The benefit text does not modify payments or quotations.
- Live Firebase and mobile regression testing remains necessary before production deployment.
