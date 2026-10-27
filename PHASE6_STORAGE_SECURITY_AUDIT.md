# PHASE 6 — Firebase Storage Security Audit
**Vicinify Capstone — Defense Documentation**
**Rules version:** v53AC (VICINIFY_FINAL_20261005AC) | **Date:** 2026-10-08

---

## 6.1 Storage path inventory

| Path | Purpose | Used by |
|---|---|---|
| `places/{uid}/*` | Establishment photos (Add/suggest page) | Standard users suggesting a place |
| `buzz_posts/{uid}/*` | Buzz post photos | Any verified user posting to Buzz |
| `place_covers/{placeId}/*` | Business cover photos | Place owner / admin |
| `place_posts/{placeId}/*` | Menu / store post images | Place owner / admin |

All paths: **public read** (`allow read: if true`) — images are shown on the map,
place pages, and Buzz feed, so reads must be open by design.

---

## 6.2 Per-path audit (after v53AB + v53AC fixes)

### `places/{uid}/*` — ✅ PASS
```javascript
allow write: if verifiedEmailStorage()
  && request.auth.uid == userId
  && isImageUnder5MB();
```
- **Upload:** only the owning UID, verified email only.
- **Overwrite/delete another user's files:** blocked — the `{uid}` folder segment must
  match the caller's UID.
- **File type/size:** `contentType.matches('image/.*')` and `< 5MB` enforced by the rule.

### `buzz_posts/{uid}/*` — ✅ PASS
- Same UID-locked pattern as above. A user can only write inside their own folder.

### `place_covers/{placeId}/*` — ✅ PASS (fixed v53AB)
```javascript
allow write: if isImageUnder5MB() && verifiedEmailStorage()
  && (isPlaceOwnerStorage(placeId) || isStorageAdmin());
```
- **Before fix:** `allow write: if signedIn()` — any logged-in user could overwrite any
  business's cover photo (HIGH/MEDIUM finding, Phase 2 #4).
- **After fix:** ownership is checked against Firestore
  (`places/{placeId}.owner_uid`) via `firestore.get()`. Only the place owner or an
  admin may write.

### `place_posts/{placeId}/*` — ✅ PASS (fixed v53AB)
- Same owner-or-admin pattern as `place_covers`.

### Catch-all — ✅ PASS
```javascript
match /{allPaths=**} { allow read, write: if false; }
```
- Any path outside the four folders is fully denied (default-deny).

---

## 6.3 Attack tests

| # | Attack | Expected | Actual (v53AC rules) | Verdict |
|---|---|---|---|---|
| 1 | Business A overwrites Business B's cover | Denied | Denied — `owner_uid` mismatch | ✅ PASS |
| 2 | Business A deletes Business B's menu image | Denied | Denied — write covers delete | ✅ PASS |
| 3 | Normal user uploads arbitrary file (e.g. `.exe`) | Denied | Denied — `image/.*` content-type check | ✅ PASS |
| 4 | User uploads 50MB image | Denied | Denied — `< 5MB` check | ✅ PASS |
| 5 | User overwrites another user's Buzz photo | Denied | Denied — UID folder lock | ✅ PASS |
| 6 | Unverified user uploads image | Denied | Denied — `verifiedEmailStorage()` (v53AC) | ✅ PASS |
| 7 | Unauthenticated user reads a place photo | Allowed | Allowed — public read by design | ✅ PASS |
| 8 | Write to undefined path (`/hacks/x`) | Denied | Denied — catch-all `if false` | ✅ PASS |

---

## 6.4 Design notes for the panel

1. **Why public reads?** Establishment photos, covers, and Buzz images are displayed
   to all visitors (including logged-out users browsing the map). There is no
   sensitive image content in the system — payment proofs are stored as compressed
   data URLs in Firestore (not in Storage), scoped by Firestore rules to the
   customer, place owner, and admin only.
2. **Why 5MB + image-only?** Prevents storage abuse (quota) and blocks malicious
   file uploads (scripts disguised as uploads).
3. **Why UID-locked folders for user content?** The folder name *is* the
   authorization — no database lookup needed, and one user can never address
   another user's files.
4. **Why `firestore.get()` for place folders?** Place ownership lives in Firestore
   (`owner_uid`), not in the path. The Storage rule reads it directly — this works
   because `places` documents are publicly readable.
5. **Payment proof is NOT in Storage.** The GCash screenshot flow (v53Y) saves a
   client-compressed JPEG data URL (≤ ~900KB) on the booking/message documents in
   Firestore, avoiding the Blaze billing requirement for Storage on the new
   project. Access is governed by the `bookings`/`messages` Firestore rules.

---

## 6.5 Deployment note
```bash
firebase deploy --only storage --project vicinify-app
```
(Or together with Firestore: `firebase deploy --only firestore,storage --project vicinify-app`.)
