# Table Reservations requires a saved table list

## Why the user saw the error
The business had enabled the Table Reservations service, but that checkbox does not create `reservation_tables` entries. `bookTable` did not have a valid option, causing the **Choose one of the business-listed tables** error. If tables were just saved, close and reopen the request to read the newest Firestore place data.

## Owner setup
Business Hub → Edit Establishment → Requests & Cancellation → Tables offered for reservation:

```
Table 1 | 2
Table 2 | 4
Family Table | 6
```

Keep Table Reservations enabled, select Save Changes, reopen the customer request, and select the table with enough seats. Food selection for table reservations remains optional, and may only use saved menu items.

## Patch
- Rejects saving enabled Table Reservations with zero tables, with a focused error pointing to the missing field.
- Table picker shows explicit warning when no tables exist instead of allowing customers to reach menu and only then fail.
- Clear guidance for choosing a table and scroll-to-field if a selection is missing or too small.
- Backend gives separate messages for no tables configured versus a stale/invalid table selection.
- Keeps all recent mobile design and menu-only request validation.

**No Firestore schema or rules change.** No existing data is altered by deployment. Live Firebase behavior must be confirmed on the user site.
