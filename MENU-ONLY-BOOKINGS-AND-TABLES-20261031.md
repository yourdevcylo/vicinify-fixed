# Vicinify — Menu-only requests and business-configured reservation tables

## What changed

- **Business Hub → Edit Establishment → Requests & Cancellation** has a new **Tables offered for reservation** field. Each line is `Table name | seat capacity`, e.g. `Table 1 | 4`. Up to 40 tables; 1–99 seats per table. Saved in `places/{placeId}.reservation_tables` and visible to customers as an explicit table dropdown. Table IDs are stable when rows are reordered.
- **Table Reservation**: customer must select one owner-listed table that fits the guest count. Food and drinks **optional**, selected only through real menu items.
- **Food Reservation, Pickup Order, Delivery Order, Advance Order**: at least one active, available menu item is **required**; no manual food text box.
- The request form loads real `places/{placeId}/menu_items` records; customers can search, set quantities and choose required or optional item options. Image thumbnails show when available.
- The review step checks live prices through the authenticated Netlify `orderQuote` function before submission; the `booking` Netlify function performs the authoritative quote again in its Firestore transaction, checks the quote digest, and saves verified `menuLines` and `estimatedSubtotalCents`.
- Server rejects manually typed/unlisted menu items and invalid table IDs or insufficient seat capacity. New menu-backed transactions do not offer a later free-text replacement of the food order in the requirements workflow.
- Existing transactions remain intact. No Firebase Storage is required.

## Configure tables before testing Table Reservations

Open **Business Hub → Edit Establishment → Requests & Cancellation**, enable **Table Reservations**, and populate **Tables offered for reservation**. The customer cannot reserve a table until the business has listed at least one table.

Suggested fictitious demo table setups (adjust to your own capstone data):

| Establishment | Example lines to copy into the tables field |
|---|---|
| Kape Corner | `Window Table | 2`, `Cafe Table | 4`, `Patio Table | 4` |
| Timpla ni Juan | `Table 1 | 4`, `Family Table | 6` |
| Tea Haven | `Couple Table | 2`, `Group Table | 4` |
| Kusina Lipa | `Table 1 | 4`, `Family Table | 6`, `Group Table | 8` |
| Sweet Cravings | `Cafe Table 1 | 2`, `Cafe Table 2 | 4` |

Each entry goes on its own line, for example:

```
Table 1 | 2
Table 2 | 4
Family Table | 6
```

**Also ensure** the establishment has saved structured menu items in Menu Management. For non-table requests, an empty menu prevents order submissions.

## Customer journey

1. Open the establishment → **Request**.
2. For **Table Reservation**, select date/time, guest count, and listed table. Optionally choose food from its menu. For other food requests, select at least one menu item.
3. Choose item quantity and any required variants, then **Review request**.
4. The app fetches an authoritative current menu quote and shows the estimated subtotal (subject to the establishment's confirmation and any separately agreed fees).
5. Customer confirms → request sent with validated IDs, quantities, options, and quoted prices.
6. The business accepts or rejects. **Selecting a table does not guarantee real-time availability**; business confirmation is still required. This update does not introduce a live table-occupancy calendar or enforce concurrent table inventory.

## Verification

- `node build.cjs`: passed.
- `node --test tests/menu-only-requests.test.cjs tests/menu-firestore-photo.test.cjs`: 16/16 passed.
- Browser integration with mocked Firestore and quote service: passed for table-only reservation, table + optional menu pre-order, and pickup order that blocks empty/invalid selections and submits structured IDs.
- **Not yet verified** against the live Firebase accounts or deployed Netlify functions. Deploy the full project (including `netlify/functions`), configure tables for the demo establishments, and test in a real browser before the capstone defense.

## Notes

The order details field remains readable for historic bookings and transactions. Free-text **notes** remain available for instructions, but they do not add purchasable menu items. If a customer needs a new food item, it must be published in the establishment's menu first.
