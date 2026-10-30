# Vicinify — Admin Manage Categories

Admin Panel → Manage Categories: Add, Rename, Enable/Disable, Delete (only unused non-default categories).

Categories are stored in Firestore `establishment_categories`. Initial built-in categories are displayed without a migration. Existing categories remain in establishments. Custom categories automatically populate Add Establishment, Business Editor, Admin Editor, and map chips; unknown custom marker icons fall back to the standard marker.

## Required deployment steps
1. Deploy updated website to Netlify using the root project with build output `dist/` (or `npm run build` before deploying).
2. **Separately deploy Firestore rules** (`firestore.rules`) to the SAME Firebase project using `firebase deploy --only firestore:rules` after selecting your existing project (`firebase use <your-project-id>`). Website deployment alone cannot update Firestore permissions.
3. Sign in as admin; open Dashboard > Admin Panel > Manage Categories; add `Carinderia`, then verify on Add Establishment and Map.
4. For disabled categories, existing listings keep their original category; assign a new active category in an editor if needed. Deletion is blocked by the UI when any establishment uses the category, and built-in categories cannot be deleted.

## Security / limitations
- Firestore category writes require `isAdmin()` per server security rules. JS UI role checks are not the security boundary.
- Built-in categories are fallbacks until explicitly edited in Firestore; this avoids requiring seed data.
- Default category marker configuration and some advanced AI keyword matching are built-in; new categories use generic markers and can still be stored/displayed/filtered on the map. Natural-language synonyms for new categories are not automatically trained into keyword matching.
- This patch has not been browser/end-to-end tested on your deployed project; test with an admin and a standard user before going live.
