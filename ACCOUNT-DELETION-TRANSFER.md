# Account deletion, ownership transfer, and Suki scan update

## Before production deployment
Deploy the complete source and Netlify functions, and deploy the included Firestore/Storage rules and indexes to the correct project. Wait for the new ownership-transfer indexes and events.actorUid collection-group index to become Enabled:

```
firebase deploy --only firestore:rules,firestore:indexes,storage --project vicinify-c9828
```

The new account_deletions and ownership_transfers collections are server-only. Signed-in clients with a deletion job are blocked from normal protected access. The matching server functions also check the deletion lock. Do not deploy only the frontend or only the functions.

The existing FIREBASE_SERVICE_ACCOUNT must have the required Auth deletion/user lookup, Firestore, and Storage list/copy/delete permissions. FIREBASE_STORAGE_BUCKET can override the known Vicinify bucket. No credentials are included in this package.

## Deletion behavior
Settings > Delete account performs checks before cleanup. Active transactions, unresolved refunds, pending claims/transfers, and administrator handoff block deletion. The permanent protected administrator cannot self-delete. A business owner explicitly chooses permanent establishment closure or completes a manual transfer first.

The customer reauthenticates with their password. The server checks recent authentication, the events cleanup index, and bucket listing before starting. A server-owned job locks normal account activity; the final obligation check runs after locking. New booking creation reads both participant deletion locks inside its transaction.

Cleanup is paged and idempotent. Browser progress calls perform actual work; no idle polling is added. The browser saves a random, account-scoped cleanup secret so an interrupted request can resume, including when Auth deletion succeeded but its response was lost. A valid recent sign-in can recover a lost cleanup session before Auth deletion. Once Auth is deleted, recovery requires the saved secret or administrator assistance. Keep the deletion tab open until completion; do not clear browser storage midway. Concurrent workers use a lease.

Personal profiles, favorites, customer loyalty data, authored Buzz posts, submitted claims/reports, customer payment-proof files, uploaded personal-prefix files, local Vici history, and the Auth user are removed. Structured customer booking/history records lose addresses, notes, names, payment references and proof links, retaining essential amounts/stages/timestamps under a random deleted-account identifier. Customer reviews keep their rating/aggregate, lose written feedback and names, and move away from UID-bearing review document IDs. Transaction event actor IDs and ownership/audit references are scrubbed. Embedded comments/reactions are removed from other Buzz posts.

Closing a business archives a sanitized, publicly readable 'Closed establishment' tombstone so other participants can still open their retained transaction history. Other participants' own payment evidence and loyalty/history are not deleted as if they belonged to the departing owner. Their records may retain their own personal information and third-party financial evidence. An identifier-based, server-only completion tombstone remains to block stale sessions and support idempotent completion; this is not a claim that every third-party mention, external copy, backup, or browser-managed password was erased.

Deletion includes one-time paged scans of embedded Buzz arrays and rate-limit records. This costs reads proportional to those collections; it is not a cheaper background subscription. Very large preflight histories may require operational support. Direct deletions made outside this workflow in Firebase Auth/console are not an Auth onDelete-trigger implementation.

## Ownership transfer
Business Hub > Manage Listing exposes Transfer ownership for that establishment and Ownership transfers in its top actions. The current owner enters a registered, verified business account email and confirms their current password through Firebase reauthentication; the password is never sent to the Netlify function or stored. The server requires a recent sign-in. This creates a pending request, not an immediate transfer.

The recipient accepts or declines in Business Hub > Ownership transfers. The sender can cancel an idle pending/paused transfer. Active transactions/refunds must be resolved. Acceptance temporarily blocks new bookings and owner edits, copies user-folder business images to place-owned storage, and atomically changes public/private ownership records and the transfer status. A paused image migration can be retried; copied image names are deterministic. No email is sent automatically. The transfer changes establishment ownership, not the recipient's account role or the old owner's account.

## Suki scanner changes and limits
The existing client token display now rotates every 30 seconds and accepts current/previous windows (up to 60 seconds from the window start). This is still the legacy client-generated/client-validated token model, NOT a server-issued anti-replay challenge. Owner stamp approval remains required; this update does not claim screenshot/forgery resistance.

QR generator and decoder are bundled locally (MIT and Apache-2.0 licenses in js/vendor). QR has explicit black/white contrast and quiet margin, larger rendering, shared library load/retry handling, visible expired/wrong-store feedback, rear-camera preference, bounded 960px decode input and ~10 decode attempts per second. Camera tracks stop on closing/unmounting. Physical iPhone/Android camera and location behavior still require device testing.

## Other changes
Logout clears app-held email/password fields and resets password visibility. Browser password-manager entries are controlled by the browser, not deleted by logout.
Featured/Premium controls, flag writes, admin filters, marker pulse/badges, public projections, and the misleading list-photo star overlay are removed. Historical flags can remain in stored records but have no display/ranking effect; legacy security guards still prevent clients from setting privileged fields. Customer review stars and Favorites hearts remain.

## Validation
20 local test files passed during development; final result is recorded in LATEST-UPDATE.md. Added deletion retry/obligation/privacy tests, transfer reauthentication/recipient acceptance/asset survival tests, QR token/load tests, and logout clearing coverage. Browser fixtures checked 48 viewport/theme/language form combinations; an actual generated QR was decoded with the bundled jsQR library.

Firestore/Storage emulator execution was attempted but blocked while downloading the official emulator from storage.googleapis.com by this environment's network policy. New emulator regression cases are included, but the modified rules are NOT emulator-verified here. Run npm run test:rules in an environment that can download Firebase emulators before production rollout. No production accounts, records, ownerships, or deployments were changed in this workspace task.
