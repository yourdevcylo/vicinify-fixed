# Vicinify incremental loyalty improvements — Phase 1

This build changes only the Suki Card Studio HTML to add a download link and includes an editable 1012×638 SVG card artwork template at `icons/suki-card-editable-template.svg` (also in dist). No Firebase rules, collections, booking, stamping, roles, or existing reward settings are changed.

The SVG is editable in compatible vector design apps; the link works after deploying the built site. This phase **does not** implement image re-upload into Vicinify.

## Proposed future phases (not implemented in this build)
1. Owner upload of branded background artwork, exact 1012×638 or same aspect ratio, sanitized/recompressed and size-limited; versioned preview with clear reset and permission checks. Preserve dynamic personal stamps and customer QR separate from uploaded art.
2. Owner-defined VIP tier configuration: qualification by *business-verified fulfilled orders* or manually granted by owner, configurable threshold, validity/renewal, benefits text and optionally discount percentage with cap and exclusions.
3. Customer VIP upgrade workflow: eligible status -> owner approval or owner manual grant -> customer receives in-app notice -> VIP benefit is shown on customer card.
4. Redemption and billing: checkout must check current VIP status and the place's benefit rules on the server; record benefit application and totals in a transaction; do not automatically deduct discounts merely from uploaded graphics.
5. Analytics uses verified completed orders; distinguish recorded Vicinify sales from total offline revenue.

## Verification
`node build.cjs` passed and copied the SVG into `dist/icons/`. Focused test run: 9 passed, 3 failed with `document is not defined` in a pre-existing standalone test harness, not asserted as passing.
