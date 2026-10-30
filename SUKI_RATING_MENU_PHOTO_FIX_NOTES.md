# Vicinify — Suki owner notifications, fast ratings, live menus and photo posts

## Included fixes (2026-10-30)

1. **Business Suki requests:** An audible notification is now accompanied by an actionable owner notification and a Business Hub Suki pending count. The owner inbox retries with a compatible real-time query when a composite Firestore index is missing. The Approve/Reject flow is unchanged.
2. **Ratings:** Selecting a star immediately updates the selection with a `Saving your rating…` state. Success or failure is shown only when the server responds; failures revert the visual selection. The app no longer reopens the entire establishment page after each rating, and the displayed aggregate rating subscribes to place-document updates.
3. **Structured menu:** The menu now listens for Firebase `menu_items` changes while a menu page/dialog is open rather than relying solely on the older 30-second cache. Each live listener is stopped on re-mount or when its dialog closes. Menu item editing and backend validation remain unchanged.
4. **Establishment posts:** The posts feed uses an index-backed listener when available, and a placeId-only real-time listener with client sorting when a composite index is unavailable. A visible error/retry is shown if both fail.
5. **Post photos:** Selecting a photo immediately displays an unpublished local preview. The normal Storage upload first compresses it to 640px/0.60 JPEG for faster uploads. If Storage is unavailable, the app tries a very small JPEG thumbnail (maximum 24,000 base64 data-URL characters) in the existing `mediaUrl` field. This may look blurry; it avoids a large Firestore photo attachment. The post is not marked published until the Firestore write succeeds; failures keep the form open.

## Not changed

No changes to Firestore rules/indexes, Firebase configuration, Netlify functions, authentication, Suki 150m proximity restriction or loyalty approval transaction. Previous UI, green-theme, navigation and single Vici AI launcher changes remain present.

## Tests performed

`node --test tests/fast-feedback.test.cjs tests/suki-owner-alert.test.cjs tests/suki-realtime-approval.test.cjs tests/suki-back-navigation.test.cjs tests/suki-proximity.test.cjs tests/vici-single-launcher.test.cjs tests/suki-establishment.test.cjs` — 36/36 passed.

`npm run build` — success; `node --check` for modified JS — success.

Broader jsdom-dependent tests and firebase-admin-dependent tests were not executable without installed dependencies. **This is not a live Firebase/Netlify verification**. Actual timings depend on network/server conditions.

## Suggested live checks

1. With two accounts/devices, customer submits Suki stamp request. Owner hears alert **and** sees a notification with a button to open the Suki inbox. Owner can Approve/Reject; badge decreases when resolved.
2. Customer rates a place: stars change immediately, show 'Saving' until backend acknowledgement; aggregate count updates without page reload. Check a second phone.
3. Owner adds a structured menu item: the open establishment menu on another device updates automatically.
4. Owner posts announcement/photo: preview appears before upload, upload progress appears and post becomes visible without refresh after the database confirms it. Simulate Storage-denied case to verify small thumbnail fallback and verify owner may still share text independently to Buzz.
5. Confirm old Suki card editing, GPS restriction, Vici AI open/close, navigation and green theme remain working.

### Limits

The low-resolution base64 fallback is deliberately limited to small thumbnails. It is not a replacement for Firebase Storage for full-size photos. Large images, offline status, server failure, Firestore permission denial or backend rate limits can still prevent posting. Live badge/notification requires the business account to be logged in with a matching owner UID and active Firestore permissions.

When sharing a low-resolution Firestore-embedded thumbnail to Buzz, Vicinify shares the post text without the thumbnail because the Buzz media URL limit requires a normal HTTPS URL. Full Firebase Storage photo URLs continue to share normally.
