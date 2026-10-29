# Green theme audit — 2026-10-29

The shared light/dark palette now covers legacy dynamic templates as well as the main workspace. This release includes all previous transaction, refund, archive, permission and feedback fixes.

## Changes

- Defined the shared primary/text aliases and mapped legacy surface/field variables to the current green palette. Body-mounted dialogs now inherit the correct dark colors.
- Removed old decorative blue values in Add Establishment, Buzz, Business Hub/admin, activity and transaction/chat templates.
- Corrected Add Establishment focus rings, disabled city field and editor controls, including amenities and file-picker states.
- Corrected dark Manage Listing/Suki editor fields, signup Terms checkbox and Business Posts action.
- Converted payment-review panels and feedback headers to green; removed leftover blue button shadows.
- Improved small-text/placeholder contrast and kept primary buttons dark green with white text.
- Preserved semantic red errors/destructive actions, amber warnings/password-strength indicators, gold rating stars, black/white QR contrast, map location/route indicators and user-selected Suki card designs.

## Verification

- All 24 automated test files passed; static build passed.
- Chromium: 40 static page/theme/viewport combinations, including login, signup, Add Establishment, map controls, settings, Manage Listing, Suki editor, Business Posts, Buzz and Business Hub shells. No remaining blue controls or horizontal overflow detected by the rendered-control audit.
- Dynamic fixture checks: actual establishment renderer, menu/reviews/about tabs and amenities editor; admin panels; settings/editor responsive layouts; password-reset and Terms dialogs; account deletion/transfer; feedback; payment/refund dialogs and refund stages for both roles. Light/dark and mobile/desktop cases were exercised as appropriate.
- Checked shared foreground/background contrast: primary button 4.89:1, light muted labels at least 4.65:1 on tested soft surfaces, dark muted labels 7.49:1, success text 6.40:1 (light) / 8.61:1 (dark).

These are local browser fixtures, not live production accounts or payment transfers. Firebase Auth email actions, physical QR camera scanning, Storage uploads and live security-rule enforcement were not exercised by this visual audit.

## Publish

Commit and push the updated source, wait for Netlify to publish, then use `/update.html` if an older installed/cached app still appears. This theme-only update introduces no new database fields or indexes. Deploy the previously supplied Firestore rules if they have not yet been published.
