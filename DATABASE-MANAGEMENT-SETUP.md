# Vicinify Database Management — deployment and limitations

- Admin Panel > Database Management. Netlify Functions **must** deploy and `FIREBASE_SERVICE_ACCOUNT` must be configured. `FIREBASE_STORAGE_BUCKET` must reference the existing Firebase Storage bucket for server backups.
- Export JSON includes supported Firestore collections and nested `places/{id}/menu_items`. CSV is a reporting export with `path,data_json` columns and is **not** an import format.
- Import accepts Vicinify JSON only. Preview lists existing/new counts. Import is **create-only**: it never edits or deletes existing records. A backup created from a live database is NOT a point-in-time atomic snapshot; writes can happen during export. For emergency production recovery, use managed Firestore backup/export as well.
- Saved backups are private objects in Firebase Storage under `private-admin-backups/`, with metadata in `_admin_backups`; server-only via Firebase Admin SDK. Download via the authenticated admin function; avoid sharing these sensitive files.
- `Firebase Authentication users`, storage photos, non-allowlisted collections, and secrets are **not backed up**. For complete disaster recovery, separately back up Storage and Firebase Auth and consider Firestore managed exports.
- Limits: 1,800 documents and 4 MB per operation. Large databases need server-side paginated jobs, beyond this capstone implementation. Restore does not preserve concurrent changes or guarantee an all-or-nothing transaction over all batches.
- Deploy accompanying `firestore.rules` if using Firebase CLI. No client can read `_admin_backups` directly. Server admin claims are checked against current Firestore profile.
- Live test with an isolated staging project and test records before using production. Set up secure admin-only operational practices, signed backups, and periodic restore drills for production use.
