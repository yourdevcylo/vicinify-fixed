# Vicinify — Menu Remove Confirmation Layer Fix (31 October 2026)

## Symptom
Clicking **Remove from menu** from the open native menu-item editor appears to do nothing. The confirmation appears only after the editor is closed with X.

## Cause
`vConfirm()` created a fixed-position `div` with a high `z-index`, but the menu-item editor is a native `dialog.showModal()` element. Native modal dialogs render in the browser top layer, above every normal positioned `div` regardless of its `z-index`.

## Fix
- Shared `vConfirm()` now uses a native `dialog.showModal()` confirmation on supported browsers, ensuring it appears above the currently open menu editor.
- Cancel and Escape resolve the confirmation without deleting anything, while keeping the edit form open and its unsaved inputs intact.
- After confirming Remove, the existing archive backend call runs. No backend, menu data, auth, or Firestore permissions changed.
- The old fixed overlay remains a fallback for browsers without native modal dialog support.
- A minimal responsive dialog CSS rule aligns and constrains the confirmation on mobile.

## Deployment
Deploy the latest `dist/` folder (or rebuild using `node build.cjs`) and the existing Netlify configuration. Hard refresh to pick up the new JavaScript and styles. No Firebase rule changes are needed for this fix.

## Test
Open **Business Hub > Menu Management > Edit an item > Remove from menu**. The confirmation must immediately appear above the editor. Cancel should leave the edit form open; Remove should archive the item once and refresh the menu.
