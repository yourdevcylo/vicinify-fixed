# Current build — deploy checklist (2026-10-29)

This archive contains the complete cumulative source. Extract it and replace/update the connected Git repository contents, including netlify/functions AND netlify/edge-functions. A dist-only drag-and-drop deployment will not deploy the server/Edge code.

## Firebase indexes first
From this extracted folder:

```
firebase deploy --only firestore:indexes --project vicinify-c9828
```

Wait until indexes are Enabled. In particular:
- bookings: placeId ASC, userId ASC, createdAt DESC (transaction desk).
- ownership_transfers: fromUid ASC, updatedAt DESC (outgoing transfer list).
- ownership_transfers: toUid ASC, updatedAt DESC (incoming transfer list).
- events.actorUid ASC, collection-group scope (deletion event cleanup).

The file also retains existing required indexes. Do not replace the whole index file with just the four entries above.

## Firebase rules

```
firebase deploy --only firestore:rules,storage --project vicinify-c9828
```

Deploy the included firestore.rules and storage.rules with the matching functions. The rules include server-only deletion/transfer records, deletion write locks and safe ownership/media boundaries. The Firestore/Storage emulator attempt was blocked while downloading the official Google emulator in this environment; run npm run test:rules with permitted emulator downloads before production use of deletion/transfer.

## Netlify
Deploy the updated connected repository. Verify Published and check that accountDeletion, ownershipTransfer and the existing functions deploy, along with the three Edge handlers site-rate-limit, api-rate-limit and rate-limit-response. Netlify-native rate-limit declarations must be accepted and verified on a staging/deployed site; local tests do not prove that native counters are enabled for the actual site configuration.

Keep existing server environment credentials private. ALLOWED_ORIGIN must exactly match the actual site origin, without trailing slash. OPENAI_API_KEY must be available to Netlify Functions (Responses Write / Moderations Request). New Edge/IP guards do not use Firebase counters. Scope:120 page requests/minute/IP+domain and600 Netlify API requests/minute/IP+domain, plus existing per-account command limits. Shared Wi-Fi users share the IP ceiling. This is not an overall Firebase spending cap.

## Password reset setup
Follow PASSWORD-RESET-SETUP.md. Firebase Authentication password policy must be Require, minimum8, uppercase/lowercase/numeric/non-alphanumeric. Password-reset email template action URL must point to the real deployed origin plus /reset-password.html. These Firebase-console settings have not been changed here.

## Current validation
22 local test files passed. Build passed. Prior modal and account/transfer browser fixtures passed; native Netlify counter enforcement, production email/password policy and physical phone-camera/location checks remain separate deployed/device checks. No production deployment, account deletion or ownership transfer was executed by this workspace task.
