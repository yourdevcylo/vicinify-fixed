# Vicinify — Mobile Booking / Menu-Only Requests UI Fix

## What's different
- Booking and order modal fills the usable phone width with a single scrollable content area.
- Header and Cancel / Review buttons remain reachable, including on notched phones.
- Menu items no longer suffer overlapping full-width quantity inputs: Qty has a fixed, tappable control and a separate row on narrow viewports.
- Menu option radios/checkboxes have sensible touch targets and avoid inherited `display:block` label problems.
- Removed nested scrolling inside long menu lists on mobile; use the modal scroll only.
- More compact request choice cards, date/time inputs, table picker, notes, chips, and responsive fields.
- Narrow phones (320px) stack date and time; larger phones keep two columns.
- Business-owned reservation table editor keeps its input inside the screen width.

## What was NOT changed
- Firebase database schema, saved menus, orders, pricing, authentication, role switching, booking validation, and desktop design.
- Business still sets the reservation tables. Table pre-order food remains optional. All ordered food must be chosen from real menu items and validated on the backend.

## Test notes
- Run: `node --test tests/mobile-request-polish.test.cjs tests/menu-only-requests.test.cjs tests/booking-mobile-safari.test.cjs`
- Run: `npm run build`
- Verified in local Chromium fixture at 320, 360, 390, 430, 768 and 1200px: menu items and qty controls had no horizontal overflow. The full live site and Firebase were not exercised.

## Deployment
1. Deploy the full ZIP to Netlify (include `dist/` and `netlify/functions/`).
2. Clear cache/hard refresh, especially for installed PWA.
3. In Standard User, open an establishment > Request > Table Reservation, add an optional menu pre-order, and try a Pickup Order. Check at phone width.
