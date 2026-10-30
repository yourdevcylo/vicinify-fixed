# Vicinify — Cover versus Profile Photo (2026-10-31)

## Roles
- **List View and small preview avatar:** `logoUrl` (with legacy logo aliases). Shows fallback pin when not uploaded. Does not use cover photo as logo.
- **Full establishment banner:** `coverPhoto` (legacy `photos[0]` only when cover is absent). Uses an actual `<img>` element to ensure WebP data URLs appear even with dark-mode CSS rules.
- **Full establishment logo:** `logoUrl` inside the small brand square.
- **Edit Establishment:** preserves separate `coverPhoto` and `logoUrl` writes from the previous Firestore-upload fix.

## Testing
1. In Business Hub > Edit Establishment upload two **different** images; save.
2. Map > List View should show profile/logo thumbnail, not the cover.
3. List preview should use the profile/logo thumbnail.
4. View full establishment: the cover should span the top banner and profile should appear within the smaller brand box.
5. Switch between light and dark modes, reload and repeat.
6. Hard-refresh/refresh installed PWA if an old view remains cached.

This is a client rendering fix. It does not automatically swap values already saved in reversed Firestore fields. If the saved photos are genuinely in the wrong fields, use Edit Establishment to reselect the correct image for each field.
