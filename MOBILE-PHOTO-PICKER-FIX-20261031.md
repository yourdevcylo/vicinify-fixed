# Vicinify Mobile Photo Selection Fix — October 31, 2026

## Root cause

Menu photo drag-and-drop contained `<input type=file hidden>` and CSS `display:none!important`. It required a JavaScript `input.click()` from its parent box. This can fail to show the Photos/files picker in mobile Safari and installed PWAs. The generic ViciPhotoPicker also used a hidden 1-pixel input with synthetic click.

## Fixes

- Menu item: direct native file input overlay (transparent but full-size and tappable), wrapped in semantic label; no programmatic click. Retains desktop drag-and-drop, photo preview, 5 MB JPG/PNG/WebP validation, and Firestore WebP compression.
- Other photo fields: update the global photo picker (`ViciPhotoPicker`) to use a native input inside a clickable label, including establishment cover/logo.
- Full project with existing centered brand icon and all previously shipped fixes.
- Has no need for Firebase Storage for menu item photos and recently updated establishment cover/logo. Other upload flows may still require Storage.

## Test plan

1. Deploy the complete project via the existing Netlify build and update or reinstall any cached home-screen PWA.
2. Android Chrome or iPhone Safari: open Business Hub → Menu → Add item → tap the dashed Add Photo box.
3. Select a JPEG, PNG, or WebP under 5 MB. Confirm filename and preview, then Save. Check image after reopening the item.
4. Test desktop dragging and dropping a photo.
5. Test establishment cover/logo native picker on mobile.
6. Try a PDF; it must not be saved.

Note: iPhone HEIC-only images are not among allowed formats; use the phone's JPG compatible format or convert to JPG if the picker does not convert it automatically.
