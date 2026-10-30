# Business Hub Service Management (Demo build)

Business Hub > Edit Business Profile > Requests & Cancellation now offers independent toggles:
- Table Reservations (`accepts_booking`)
- Food & Drink Orders (`accepts_orders`)
- Advance Bookings (`accepts_advance_booking`): food reservations and advance/bulk orders
- Customer Messages (`accepts_requests`): hides the Message shortcut on the map place page (this is NOT a server-side chat permission; other existing chat entry points can still exist)

Save the business profile to update Firestore fields. The request modal filters available transaction choices; the booking creation backend rejects disabled transaction types. Existing transactions remain viewable and manageable. Existing establishment records with no explicit `accepts_advance_booking` retain legacy advance booking behavior when `accepts_booking=true`, until the owner saves independent switches. New establishments will require enabled service fields to accept transactions.

Deployment:
1. Upload the included website contents to Netlify (the project build creates `dist/`; Netlify functions deploy separately using existing Netlify configuration).
2. Confirm Netlify functions deploy with website. There is no new Firestore collection or rules change required for these flags: existing owner edit authorization applies.
3. In Business Hub > Edit Business Profile, set the four switches and Save. Test with a separate standard user account.
4. Test at least one disabled booking type with the frontend and server; check the transaction status in the owner inbox.

Important scope: The separate Customer Messages toggle controls the primary map Message shortcut only, not all chat entry points or backend chat authorization. AI currently uses `accepts_booking` for table reservation and `accepts_orders` for order actions; it does not actively offer the separate advance-booking type. This implementation does not add reservation capacity, slot inventory, or auto-confirmation.
