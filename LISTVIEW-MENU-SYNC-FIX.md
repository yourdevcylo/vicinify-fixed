# List View Menu & CSV Import Refresh Fix — October 30, 2026

## What was wrong

The List View's Menu popup loaded `place_posts`, which contain store updates and legacy photos. Business Hub's Menu Management and CSV importer save to `places/{placeId}/menu_items`. Therefore a successfully imported item could show on the establishment page but appear missing in List View.

The CSV import modal also opened a second confirmation dialog above the first. Some browsers kept the initial Confirm button visible even after the records had saved.

## What changed

- List View Menu loads the actual `places/{placeId}/menu_items` collection, including category, description, price, photo when present, and availability.
- The optional legacy `place_posts` content remains available under **Store posts & menu photos**, below the structured menu.
- The List View preview listens for live Firestore menu updates while it remains open, and unsubscribes when closed.
- Every time a place is opened it fetches fresh menu data, avoiding stale menu caching.
- CSV import runs directly from its **Confirm and save** button, displays progress, and closes after successful completion; no nested confirmation popup.
- Refreshes the Business Hub and List View after successful menu imports or edits.

## How to test after Netlify deploy

1. Open Map → List View → Sweet Cravings → Menu, confirm imported items display with prices.
2. In Business Hub, add a test menu item; reopen the List View menu and verify it is there.
3. Try importing a new CSV once and observe the progress; the import dialog closes upon successful import.
4. Do **not** import the previous Sweet Cravings CSV a second time if those five items were already saved; duplicate entries are not desired.

Tests: JavaScript syntax and website build passed; browser smoke test using a local mocked Firestore passed for list view, live menu update, CSV modal completion and post-import refresh. Live Firebase/Netlify not exercised.
