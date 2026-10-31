# Vicinify — Photo Posting, Sharing & Sending (2026-10-31)

## Summary

This update addresses the two reported failures:

- **Post Establishment Update** stopped at “Uploading photo…” when Firebase Storage was unavailable. It now re-encodes the chosen JPG/PNG/WebP and saves a **small WebP image in Firestore** alongside the establishment post. When the Firestore write succeeds, the modal displays **Share to Buzz** and **Share as Promo**.
- **Buzz Post as Business switched OFF** still produced a permission error with a photo because an older upload route used Firebase Storage. Both personal and business Buzz photo posts now write a small image in `buzz_media/{postId}`, atomically with the `buzz_posts/{postId}` document. Personal posting does not require business ownership; business posting still does.

Other photo paths reviewed/updated:

| Location | New handling |
|---|---|
| Establishment post | Compressed inline WebP in `place_posts`; share to Buzz references the original post's image |
| Buzz personal / Business | Small photo in public `buzz_media`, tied to post author; text-only posts can also be deleted |
| Customer–business chat | New optional JPG/PNG/WebP photo attachment; image is stored in the private `messages` document and accessible only to authorized chat participants |
| Add Establishment | Previously discarded selected listing photos/logo are now compressed and saved on the pending listing; admin approval still gates publication |
| Menu Management | Existing compressed Firestore menu item upload retained |
| Business cover/logo | Existing Firestore-based profile upload retained |
| Payment receipt | JPEG re-encoded and stored as private server-only `payment_proofs/{bookingId}`; retrieved via authenticated Netlify function, not Firebase Storage |
| Account deletion | Cleanup of private payment receipt docs added; a missing legacy Storage bucket no longer blocks the new no-Storage workflow |

## Important setup steps (not done automatically)

1. Back up the current Firebase data and keep the original project until the new build works.
2. Deploy the **entire updated project**, including **`dist/` AND `netlify/functions/`**, using your existing Netlify build flow. Static-only uploads without the functions will not enable payment proof and other server endpoints.
3. **Deploy the included `firestore.rules` to the SAME Firebase project** that the website uses. A Netlify deploy does not update Firestore rules. For example, from the project folder with Firebase CLI:

   `firebase deploy --only firestore:rules,firestore:indexes --project YOUR_FIREBASE_PROJECT_ID`

   Or manually deploy Firestore Rules in Firebase Console, then indexes if required.
4. Verify that the Netlify Firebase Admin environment variable (`FIREBASE_SERVICE_ACCOUNT`) targets the same project; do not paste private keys or secrets into chat.
5. Reload the website (hard refresh) and, if installed as a PWA, refresh/reinstall to eliminate stale JS/service worker cache.
6. Ensure the posting account's email is **verified**. Firestore post writes enforce a verified email, even for personal Buzz.

## Live test sequence

1. **Business → Establishment page → Add post/photo:** choose JPG/PNG/WebP <=5 MB; type "New iced coffee!"; click Post Update; verify the post is visible under **Establishment Posts** with its image. This is a *store update*, not a priced structured menu item. Add priced foods through **Menu Management**.
2. On the success view, click **Share to Buzz**; open Buzz and verify the **same image and caption** appear with an establishment link. Avoid repeatedly posting within the 30-second anti-spam cooldown.
3. **Buzz:** disable Post as Business; publish a personal post with a photo; verify it displays. Then enable Post as Business and publish with a business selected; confirm both modes work independently.
4. **Chat:** select a photo via the camera/photo icon; confirm preview; send it; verify both customer and business can view the attachment in the same chat. New photo messages require the updated Firestore Rules.
5. **Add Establishment:** select listing photos/logo, submit pending listing, review in Admin and check images persist after approval.
6. **Payment proof:** for an online-payment booking, upload an optional receipt and reference; verify the customer and authorized business can view it and unrelated users cannot. Netlify Functions are required.
7. Test on a phone and desktop, and verify failures show errors rather than false success.

## File limits, security, and limitations

- Input JPG/JPEG, PNG, or WebP, typically up to 5 MB for posts/chat. Each becomes a **small WebP preview**, capped at 70 KB for posts, 62 KB for chat, and 34 KB for newly suggested listing images. These are intentionally low-resolution to fit Firestore free-plan limits.
- Receipt is **private** and limited to roughly 450 KB after conversion to JPEG. The original image is not stored in a public URL.
- Some unusually detailed photos will be rejected; crop or resize and try again. HEIC is not a supported post/chat input format (use JPG/PNG/WebP).
- **Firebase Storage is not required** for these newly supported flows; Firestore quota and storage usage still apply. Compressed media is not suitable for unlimited full-resolution galleries. Firestore has document-size and daily usage limits.
- Buzz is public, so do not upload sensitive or private information there. Chat attachments and receipts follow separate access rules.
- This update was tested with source checks, mocked receipt flow, and successful production build. **It was not live-tested against your Firebase or Netlify accounts.** A Chromium mobile fixture could not complete due a test-browser startup limitation.

## Files relevant to the patch

`js/map.js`, `js/buzz.js`, `js/common.js`, `js/add.js`, `index.html`, `css/components.css`, `css/style.css`, `firestore.rules`, `netlify/functions/proof.js`, `netlify/functions/accountDeletion.js`, `netlify/functions/lib/account-deletion.js`, and `tests/photo-flow-no-storage-20261031.test.cjs`.
