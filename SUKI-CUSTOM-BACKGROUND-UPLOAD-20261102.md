# Vicinify Suki Card Background Upload — Phase 2

## What was changed
- Owner can download the editable 1012×638 SVG design template, edit it in a compatible application and export a raster image.
- Suki Card Studio accepts PNG, JPEG, WebP (maximum 6 MB) matching the 1012:638 card ratio within 1.2%.
- Browser rasterizes and compresses uploaded art to WebP, with a strict 150k-character encoded size cap to avoid Firestore document-limit problems.
- Save Changes writes one optional `suki_background_image` field onto the existing `places` document. Customers see it on both faces of the card; dynamic stamps and customer details remain separate.
- Restore default background clears just that image after Save Changes; saved color, pattern, rewards, stamps and redemption totals are preserved.
- No SVG upload: SVG remains an editable **download-only** template to avoid executing untrusted content.
- Saving only occurs for an authenticated authorized establishment owner/admin via the existing place update path.

## Not changed
- Firebase rules, user roles, bookings, Buzz, customer chat, transactions, existing stamp issuance or redemption.
- Strict server one-stamp-per-day protection, verified online-order counting, VIP eligibility, business signup/admin approval, multiple categories and analytics remain separate planned work.

## Manual test
1. Business Hub → Edit Suki Card → Download template. Customize/export a 1012×638 PNG or JPG.
2. Upload the exported image; see preview, but do not save yet. Try Back to verify unsaved warning.
3. Save Changes; reopen the Studio; verify background persisted. Open establishment as customer and verify live stamps/QR still work.
4. Click Restore default background and Save; verify original design returns.
5. Attempt invalid SVG upload and wrong-ratio PNG; both should be rejected with a clear message.
6. Confirm existing redemption counter, menu, Buzz, booking and auth.

## Deployment
Deploy this ZIP's site and Netlify functions as usual. This phase does not require any new Firestore rule changes if previous owner updates are functioning; Firestore space/quota still applies.
