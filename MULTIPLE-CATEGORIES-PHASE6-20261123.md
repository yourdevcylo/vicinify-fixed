# VICINIFY — Phase 6: Multiple Establishment Categories

Based on `Vicinify_VIP_Discounts_Phase5.zip` (the previous completed phase). This is a scoped source-code update, NOT a new Firebase project or automatic data migration.

## What's new
- **Add Establishment**: check up to **3 categories** and select one **Primary Category**.
- **Business Hub → Edit Establishment**: restores and edits multiple categories and a primary category.
- **Admin → Establishments → Edit**: same multi-category selection.
- **Map/List filter**: an establishment appears under any of its selected categories.
- **Search / Vici AI**: multiple categories are included in public metadata and recommendation context.
- **Admin categories manager**: prevents deletion of a category referenced in the new `categories` array.
- **Legacy compatibility**: still writes `category` and `cat` with the primary category. Older records with only `category`/`cat` continue to display and edit.

Example:
```
category: "restaurant"       // Primary; legacy readers and map marker use this
cat: "restaurant"            // Legacy alias
categories: ["restaurant", "cafe", "dessert"]
```

Limit: **1–3 categories per establishment**, validated by the form. The currently deployed Firestore rules were intentionally left unchanged in Phase 6; this is not yet a server-enforced limit against custom direct Firestore API writes. Admin moderation remains available.

## Deploy carefully
1. Back up the currently deployed site and your Firestore data. Do not delete or replace existing Firestore collections.
2. Deploy the **complete** Phase 6 source through your existing Netlify build pipeline, including `/netlify/functions/`. Do not treat `dist` alone as the backend.
3. **No new Firestore Rules are required for this feature**, because `firestore.rules`, `firestore.indexes.json` and `firebase.json` are unchanged from Phase 5. If Phase 5 or Phase 4 rules have not yet been deployed, do not assume your current Firebase rules are sufficient; reconcile with the latest complete version before deployment.
4. Hard refresh browser / test mobile Safari and Chrome. Verify actual live backend before using in production.

## Suggested manual checks
- Add a proposed establishment with Restaurant + Café + Dessert, primary Café. Confirm saved Firestore fields `category: "cafe"`, `cat: "cafe"`, and `categories: ["cafe", "restaurant", "dessert"]` (saved order may vary after primary selection).
- Test the old single-category listing. It should display only its original category.
- Edit an older listing as its real owner, save, refresh, and verify it stays visible in Map/List.
- Edit an existing multi-category listing, deselect one, change primary, save. Verify no category is silently lost.
- Map and List: filter Restaurant, Café, and Dessert separately; the multi-category establishment should appear under all three if it matches geographic radius and other filters.
- Vici AI: ask for secondary category food types. The AI receives a secondary category list but actual output still depends on OpenAI and the catalog.
- Test Add/Edit modal and checkbox tap targets on desktop and mobile.
- Check categories admin manager: a category in use as a secondary category should not be deletable.

## Tests and limitations
- 8 new targeted Phase 6 tests passed, including browser-like event simulation and legacy compatibility.
- Regression suite: **255 passed / 55 failed** out of 310; comparison with Phase 5 baseline (248 passed / 55 failed out of 303) confirms **zero additional failed tests**. The 55 failures already existed in Phase 5 and are not claimed fixed.
- Production build and JavaScript syntax checks passed. Chromium live UI automation was attempted but hung in the test environment and is **not** claimed passed.
- This ZIP has **not been tested on your live Netlify/Firebase deployment**.

## Scope control
No existing accounts, bookings, sales, VIP eligibility, stamp counters, chat, Buzz, menu items, or Firebase configuration were intentionally modified. The only changes are the multi-category form, map/list/search display/filtering, public AI context, category management references, tests, generated `dist` assets, and this guide.

## Next phase
Business self-registration: verified email, business permit and registration document submission, admin review, **one approval only**, and restricted Business Hub activation. Private document storage and transactional email service must be configured securely before this can go live.
