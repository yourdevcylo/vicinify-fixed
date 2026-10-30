# Vicinify Suki Card – Edit / Save Fix (2026-10-30)

## Fixed
- Business Hub now shows **Edit Suki Card** instead of an ambiguous Suki Card button.
- Suki Card Studio now displays all editing controls even when `suki_enabled` is false. Owners can design the card before enabling it.
- Added a second **Save Changes** button that stays visible above the bottom navigation on mobile. Top Save Changes is also available.
- Save buttons share the same guarded save function; duplicate rapid clicks are blocked, success/error status is shown, and both buttons re-enable after completion.
- Successful saves keep the owner on the editor with the updated draft, instead of leaving the page immediately.
- Updated asset query versions and the service worker cache identifier to help clients load the changes.

## Database
No migration or schema changes. Firebase Auth, Firestore, and all existing Suki Card field names are unchanged.

## Checks
- Chromium isolated tests at 390px, 320px, and 1280px: editor visible when disabled, button accessible, Firebase update payload correct, reopened saved data retained, error message and button recovery.
- `node --test tests/suki-design.test.cjs`: 3/3 passed.
- `node --check js/dashboard.js` and `node build.cjs`: successful.

## Deploy
Deploy the complete project using the existing Netlify build configuration (`npm run build`, publish `dist`). After publishing, refresh/reopen the site so the new service worker and assets are fetched. Real production Firebase permissions and network updates must be verified using the business owner's account.
