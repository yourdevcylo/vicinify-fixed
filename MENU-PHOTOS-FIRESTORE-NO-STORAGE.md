# Vicinify: Menu photos stored in Firestore (no Firebase Storage)

## What's changed

- In **Business Hub → Menu Management → Add/Edit menu item → Add Photo**, select JPG, JPEG, PNG, or WebP (original file ≤ 5 MB).
- Before saving, Vicinify checks the image file type and signature, decodes the pixels and re-encodes them into **small WebP**. It retries with smaller sizes and lower quality until the image is **≤ 28 KiB** of binary image data, then stores it in the menu item's Firestore document as `photoData`.
- The **menu save Netlify Function** accepts and checks this WebP data, restricts length, verifies basic WebP/RIFF structure, and checks that the caller owns the establishment. It does **not** require Firebase Storage.
- Photos render in **Business Hub menu** and **Map → List View → Menu**. Older menu items with external HTTPS `photoUrl` remain readable. The server doesn't send the big inline image to Vici AI's prompt.
- CSV imports are still text-only; attach photos by editing menu items after importing.

## Deploy

1. Deploy the full project via Netlify **build with Netlify Functions**. Merely uploading the `dist` folder won't deploy `netlify/functions/menu.js` changes.
2. Refresh the web page (Ctrl+Shift+R) to avoid the old cached code.
3. As the establishment owner, open **Business Hub → Menu Management**, edit an existing menu item, select a photo, and **Save menu item**.
4. Verify the item photo appears in Business Hub and in the public List View menu.

**No Firebase Storage bucket or Storage rules are required for these menu photos.** Your existing Firestore rules must still allow the appropriate users to *read* `places/{placeId}/menu_items/{itemId}`. Only the authorized Netlify backend writes menu documents.

## Limits and tradeoffs

- Binary photo ≤ 28 KiB (compressed; Base64 string takes roughly 37 KiB), far below Firestore's 1 MiB per-document limit. Resolution and quality vary automatically according to image complexity; some photos may be refused if too complex even at the smallest size.
- Each menu read now transfers the embedded image with the document, so Firestore bandwidth and database backup size increase; appropriate for a small demo, not recommended for high-volume or full-resolution photo storage.
- Browser file checks plus server-side format/size/header validation reduce risk, but they **do not constitute a malware-scanning service or full server-side image decode**. A production hardened upload service should independently decode/re-encode the image server-side.
- Other image sections such as establishment covers, Buzz and profile images still have separate upload paths and may require Firebase Storage. This patch **only** removes the Storage dependency from structured **menu photos**.
- The existing bulk-menu import remains available; **Vici AI daily quota remains 50** in this package.

## Tests

- `node --test tests/menu-firestore-photo.test.cjs` covers the new validation, basic malformed-image rejection, backward compatibility with HTTPS URL photos, and public menu exclusion of the Base64 field.
- `node build.cjs`, and `node --check` on modified JavaScript.
- The live Firebase/Netlify save flow must be verified after deployment.
