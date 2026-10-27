# PHASE 5 — Firestore & Storage Security Rules Audit
**Vicinify Capstone — Defense Documentation**
**Rules version:** v53AC (VICINIFY_FINAL_20261005AC) | **Date:** 2026-10-08

> Format per collection: (1) Current rule problem → (2) Why it is dangerous →
> (3) Recommended fix → (4) Exact corrected rule → (5) Explanation.
> Collections with no findings are listed in the verdict table at the end.

---

## Helper functions (shared)

```javascript
function signedIn() {
  return request.auth != null;
}
// NEW (v53AC): writes require a verified email address.
function verifiedEmail() {
  return signedIn() && request.auth.token.email_verified == true;
}
function isAdmin() {
  return isDeveloper()
    || (signedIn()
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin");
}
function isPlaceOwner(placeId) {
  return signedIn()
    && get(/databases/$(database)/documents/places/$(placeId)).data.owner_uid == request.auth.uid;
}
```

---

## 5.1 `places` — Owner self-verification (HIGH, fixed v53AB)

**1. Problem.** The owner-update rule used a 3-field blocklist:
```javascript
allow update: if isAdmin()
  || (isPlaceOwner(placeId)
      && !request.resource.data.diff(resource.data).affectedKeys()
           .hasAny(["owner_uid", "addedBy", "approval_status"]));
```

**2. Why dangerous.** The rule blocked only ownership/approval fields. Trust fields —
`is_verified`, `claimStatus`, `is_premium`, `is_featured` — were left writable.
Using browser DevTools, a business owner could set `is_verified: true` on their own
place, making the "Verified" badge meaningless. Verification must mean
*"the Vicinify admin confirmed this is a legitimate business."*

**3. Fix.** Extend the blocklist with all verification/trust fields. (A blocklist was
chosen over an allowlist because owners legitimately edit dozens of fields —
info, hours, photos, `suki_*` settings — and an allowlist would break features
whenever a new editable field is added.)

**4. Corrected rule:**
```javascript
allow update: if isAdmin()
  || (verifiedEmail()
      && isPlaceOwner(placeId)
      && !request.resource.data.diff(resource.data).affectedKeys()
           .hasAny(["owner_uid", "addedBy", "approval_status",
                    "is_verified", "claimStatus",
                    "is_premium", "is_featured"]));
```

**5. Explanation.** `diff().affectedKeys().hasAny(...)` computes exactly which fields the
write touches and denies the write if any forbidden field is among them. Admins
(`isAdmin()`) bypass the blocklist so they can still verify places. `verifiedEmail()`
was added in v53AC (see 5.5).

---

## 5.2 `reviews` — Review overwrite by another user (HIGH, fixed v53AB)

**1. Problem.**
```javascript
allow create, update: if signedIn()
  && request.resource.data.userId == request.auth.uid;
```

**2. Why dangerous.** The rule checked only the *new* document's `userId`.
User A could overwrite User B's review by submitting an update with
`userId` set to A's own UID — the rule never verified who owned the
*existing* document (`resource.data`).

**3. Fix.** Split create/update; the update rule must verify ownership of the
existing document.

**4. Corrected rule:**
```javascript
allow create: if verifiedEmail()
  && request.resource.data.userId == request.auth.uid;

allow update: if verifiedEmail()
  && resource.data.userId == request.auth.uid      // owns the OLD doc
  && request.resource.data.userId == request.auth.uid;  // keeps own identity
```

**5. Explanation.** `resource` is the document as it exists in the database;
`request.resource` is the document as the write would leave it. Requiring both
to carry the caller's UID closes the overwrite hole while still letting users
edit their own reviews.

---

## 5.3 `bookings` — Status/amount forging (MEDIUM, fixed v53AB)

**1. Problem.**
```javascript
allow create: if signedIn()
  && request.resource.data.userId == request.auth.uid;
allow update: if signedIn()
  && (isAdmin() || resource.data.userId == request.auth.uid
      || isPlaceOwner(resource.data.placeId));
```

**2. Why dangerous.** (a) Create checked only `userId` — a customer could create a
booking already marked `status: "accepted"`. (b) Update let the customer *or* the
owner change *any* field — a customer could set their own booking to
`"payment_confirmed"` without paying, or reassign the booking to another user/place.

**3. Fix.** Force `status == "pending"` on create; on update, forbid reassignment of
`userId`/`placeId` and forbid customers from setting owner-only statuses.

**4. Corrected rule:**
```javascript
allow create: if verifiedEmail()
  && request.resource.data.userId == request.auth.uid
  && request.resource.data.placeId is string
  && request.resource.data.status == "pending";

allow update: if isAdmin()
  || (verifiedEmail()
      && resource.data.userId == request.auth.uid
      && request.resource.data.userId == resource.data.userId
      && request.resource.data.placeId == resource.data.placeId
      && (request.resource.data.status == resource.data.status
          || !(request.resource.data.status in ["accepted", "payment_confirmed", "fulfilled"])))
  || (verifiedEmail()
      && isPlaceOwner(resource.data.placeId)
      && request.resource.data.userId == resource.data.userId
      && request.resource.data.placeId == resource.data.placeId);
```

**5. Explanation.** The intended status chain is
`pending → accepted → payment_submitted → payment_confirmed → fulfilled → received`.
Only the place owner (or admin) may move a booking into `accepted`,
`payment_confirmed`, or `fulfilled`. The customer keeps their legitimate
transitions (`payment_submitted`, `received`, `cancelled`). Neither party may
change *whose* booking it is.

---

## 5.4 Storage `place_covers/{placeId}` & `place_posts/{placeId}` (MEDIUM, fixed v53AB)

**1. Problem.**
```javascript
match /place_covers/{placeId}/{allPaths=**} {
  allow read: if true;
  allow write: if signedIn() && isImageUnder5MB();
}
```

**2. Why dangerous.** Any signed-in user could overwrite or delete another business's
cover photo or menu images. The old comment claimed "ownership is enforced in
Firestore when the URL is saved" — but the *file itself* had no protection.

**3. Fix.** Check place ownership inside the Storage rule via `firestore.get()`
(works because `places` reads are public).

**4. Corrected rule:**
```javascript
function isPlaceOwnerStorage(placeId) {
  return signedIn()
    && firestore.get(/databases/(default)/documents/places/$(placeId))
         .data.owner_uid == request.auth.uid;
}
match /place_covers/{placeId}/{allPaths=**} {
  allow read: if true;
  allow write: if isImageUnder5MB() && verifiedEmailStorage()
    && (isPlaceOwnerStorage(placeId) || isStorageAdmin());
}
```

**5. Explanation.** Storage rules can read Firestore documents with `firestore.get()`.
The write now requires: image type + under 5MB + verified email + (place owner or
admin). Business A can no longer touch Business B's images.

---

## 5.5 `verifiedEmail()` gate on all writes (MEDIUM, fixed v53AC)

**1. Problem.** Email verification was enforced only in the frontend
(`showPage` blocked unverified users from Add/Dashboard). The rules had zero
`email_verified` checks — an unverified user could bypass the UI via DevTools
and write directly to Firestore/Storage.

**2. Why dangerous.** Frontend gates are cosmetic. Without backend enforcement, a
spam account (never verified) could post places, buzz posts, bookings, and reviews.

**3. Fix.** New `verifiedEmail()` helper; all `create`/`update`/`delete` rules use it
instead of bare `signedIn()`. Reads stay open (unverified users can still browse).
`users/{uid}` create is exempt — the profile must exist before the user verifies.

**4. Corrected rule (example):**
```javascript
function verifiedEmail() {
  return signedIn() && request.auth.token.email_verified == true;
}
// ... used in every write rule, e.g.:
allow create: if verifiedEmail()
  && request.resource.data.userId == request.auth.uid;
```

**5. Explanation.** `request.auth.token.email_verified` comes from the Firebase Auth
ID token — it cannot be forged by the client. Admin must verify their own email
before publishing these rules, or admin writes will also be blocked.

---

## 5.6 Collections with no findings (verdict: PASS)

| Collection | Verdict | Key enforcement |
|---|---|---|
| `users` | ✅ PASS | Create forces `role:"user"`; self-update cannot change `role`/`uid`; bulk `list` admin-only |
| `favorites` | ✅ PASS | All ops scoped to `userId == auth.uid` (or admin) |
| `messages` | ✅ PASS | Read/update scoped to customer, place owner, or admin |
| `buzz_posts` | ✅ PASS | `authorUid` pinned on create; others may touch only `likes`/`likedBy`/`comments` |
| `place_posts` | ✅ PASS | Place-owner or admin only |
| `loyalty_cards` | ✅ PASS | Deterministic ID; no stamp minting via client; customer may touch only claim-request fields |
| `stamp_requests` | ✅ PASS | Customer creates own `pending`; owner approves; customer may only cancel |
| `business_claims` | ✅ PASS | Claimant ≠ owner until admin approves (sets `owner_uid` + `role:"business"`) |
| `place_reports` | ✅ PASS | Reporter creates own; admin-only update/delete |
| `admin_audit` | ✅ PASS | Admin-only, append-only (`update`/`delete: if false`) |

**Documented exception:** `isDeveloper()` hardcodes one UID
(`PjUJidBXWoYLCuuJTzoAlx0Ec1G3`) with full admin bypass — the developer's own
account, declared here for the defense panel.

---

## 5.7 Deployment note
Rules are deployed by the capstone proponent (Marc) via Firebase Console or:
```bash
firebase deploy --only firestore,storage --project vicinify-app
```
Firestore rules apply in ~1 minute; Storage rules apply immediately. The 12 composite
indexes in `firestore.indexes.json` deploy with the same command.
