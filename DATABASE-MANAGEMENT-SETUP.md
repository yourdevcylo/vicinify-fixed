# Vicinify Database Management — No Firebase Storage required

- Open Admin Panel > Database Management. Deploy Netlify Functions and configure `FIREBASE_SERVICE_ACCOUNT` for authenticated admin-only Firestore access. Firebase Storage is NOT required for this feature.
- **Export JSON** downloads a backup file to the admin's device. Store it securely; it is not automatically saved on a server. **Export CSV** downloads reporting data; CSV cannot be imported back as a backup.
- **Import JSON** accepts valid Vicinify export files only. It previews existing and new records before confirmation and is **create-only**: existing records are never overwritten, edited or deleted. This is not a complete point-in-time rollback or a full disaster recovery system.
- Supported Firestore collections and nested `places/{id}/menu_items` only. **Firebase Authentication accounts, uploaded images, credentials, and unlisted collections are excluded**.
- Limits: 1,800 records and 4 MB per request. Large databases require a separate managed backup design.
- Exporting across multiple Firestore collections is not an atomic snapshot. Importing in multiple batches is not atomic either; test in staging with sample data before production restores.
- No Create Backup, Backup History, Firebase Storage bucket or `_admin_backups` functionality is required or exposed.
