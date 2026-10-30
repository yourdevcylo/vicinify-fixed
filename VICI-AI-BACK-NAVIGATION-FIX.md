# Vici AI restaurant back-navigation fix (2026-10-30)

## Changed
- `js/vici-chat.js`: Record an AI return target when opening View Restaurant from either recommended place cards or AI-generated action buttons.
- `js/common.js`: On browser/in-app Back from place details to Map, reopen the same Vici AI conversation overlay. Return targets are one-shot and cleared on login-history resets; normal navigation is unchanged.
- `tests/navigation-history.test.cjs`: Added automated regression test to ensure the overlay is restored only once.

## Deploy
Deploy the entire archive in the usual Vicinify project pipeline. No Firestore rules or schema changes are needed for this navigation-specific fix. The archive retains previous Admin Categories and Service Management changes.

## Check
1. Open Map > Vici AI and ask for a restaurant.
2. Tap View Restaurant on a result or model action.
3. Tap the restaurant's Back or browser/phone Back.
4. Confirm the Map returns AND the same Vici AI conversation reappears.
5. Reopen the restaurant from normal Map results; Back should not unexpectedly force Vici AI open.
