# Vicinify — Menu Photo Drag & Drop (October 31, 2026)

## Changes

- `Business Hub → Menu Management → Add/Edit Menu Item → Add Photo` is now a dropzone.
- Desktop: drag one JPG/JPEG, PNG, or WebP image over the dashed box and release. Drag-over state highlights the box.
- Desktop and mobile: click/tap the box to choose an image in the native file picker. Keyboard: Tab to the dropzone; press Enter/Space to open the picker.
- A preview and filename appear when a valid photo is selected. `Clear selection` discards the pending photo (but leaves any previously saved photo untouched).
- Invalid formats, multiple files, and images over 5 MB show an inline error. File data is still decoded and compressed by the existing `photoToFirestoreData` processing function, then sent as a small WebP data URL in the Firestore menu document.
- Other image pickers retain their original behavior. The global photo picker enhancer now skips this custom menu dropzone.

## Testing

- `node --check js/vici-commerce.js` and `node --check js/ui.js`: passed.
- `node build.cjs`: passed.
- `node --test tests/menu-dragdrop-source.test.cjs tests/menu-firestore-photo.test.cjs`: passed.
- Headless Chromium could not complete within the browser runner timeout; a browser-level simulation is included at `tests/menu-dragdrop-browser.html` but was not successfully executed in this environment.
- Live Netlify/Firebase saving has **not** been verified. Deploy the full project with Netlify Functions and test on your site.

## Deployment smoke test

1. Deploy this ZIP using the same build process as the latest Vicinify build (including functions) and hard-refresh the browser.
2. Open Business Hub → Menu Management → Add Menu Item.
3. Drag a JPG/PNG/WebP image onto the photo box. Confirm its preview and filename appear.
4. Fill in name and price and save, then reopen the item to check the image persists.
5. Test dropping a PDF; a clear error should appear and the PDF should not be saved.
6. Test on mobile by tapping the box; the system file picker should open.

## Scope

This changes only the menu-item photo picker UI. Cover/logo photo uploads, menu CSV import, Vici AI, and other services remain unchanged.
