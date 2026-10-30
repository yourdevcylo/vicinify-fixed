# Smart Vici AI, menus and confirmed customer requests

This extends the existing Vicinify HTML/CSS/JS, Firestore and Netlify architecture. Existing map, Business Hub, booking/payment/refund workflow, transaction chat, reviews and Suki features remain in place. The assistant uses the configured server-side model for semantic interpretation, not a keyword booking parser. Small greeting replies remain local to avoid model usage.

## Owner workflow

1. Business Hub → **Manage menu**, or establishment page → **Menu**.
2. **Add menu item**: name, description, PHP price, category, optional public HTTPS photo URL, availability. Add required option groups or optional add-ons as needed; each choice can have an extra price and availability.
3. Enable **Accept menu orders** only when the business actually supports requests. This is separate from the existing **Accepts booking** setting for table reservations.
4. **Establishment posts** remains a separate tab for announcements/promos/photos. Existing `place_posts` are preserved. They are not silently converted into priced/available menu items. No OCR or guessed prices.
5. Incoming requests appear in the existing Business Hub transaction inbox. Owner accepts/declines and updates the actual transaction. Verified payment is still required before preparation. Cancellation and refund/customer receipt controls remain unchanged.

Images are optional existing/public HTTPS URLs. This feature does not require enabling Firebase Storage or paid uploads. No external image generation, email, SMS or paid notification service was introduced.

## Customer workflow

- Ask in English, Tagalog or Taglish. The server supplies approved establishment records and bounded actual menu data to the model. It validates the structured answer and application-defined actions before rendering.
- Recommendation cards show saved ratings/price ranges/address, available photos, approximate distance when map location is supplied, and supported actions. No raw AI HTML or JavaScript executes.
- View menu opens actual structured menu cards; search/filter by category; view details; add available items. Establishment name opens full details, map button highlights the existing marker, directions reuse existing navigation.
- Conversational food orders use actual menu item IDs. Required options, unavailable items and missing information are handled by the editable cart. The listed subtotal is calculated from menu data, not accepted from AI text.
- **Review current prices** gets a server quote. The summary shows place, schedule, fulfillment, item quantities/options, notes and estimated subtotal. Delivery fees/other agreed charges are separate and must be set before payment.
- **Confirm request** is a separate, explicit customer click. It submits a pending request only after the backend rechecks current menu prices/options/availability and quote digest.
- Table reservations open the existing editable form: Review request → Send Request. No live table inventory is asserted; business confirmation is required.
- The request reference and real status are shown in a status card and the existing transaction screen. In-app toasts reflect actual Firestore status changes while the assistant is open; no claim of external notification delivery.
- A connection failure after submission retains the exact pending payload/key. **Recover request result** retries the same request rather than creating another one. Do not change/discard an uncertain submission until its result is recovered or checked in Transactions.

## Storage/schema changes

Inspection found existing `places`, `place_posts`, `bookings`, and `messages`, but no structured priced menu collection. This update adds:

- `places/{placeId}/menu_items/{itemId}`: name, description, category, integer `priceCents`, PHP currency, optional HTTPS photo URL, availability, archived flag, option groups and server-owned version/timestamps. Up to 80 active items per place; up to 4 groups and 12 choices/group. Archived items remain for history but are excluded from public menu queries.
- `places.accepts_orders`: explicit owner-controlled ordering capability; defaults off until enabled. Existing `accepts_booking` continues to control reservations.
- `request_keys/{sha256(uid + key)}`: server-only idempotency record tied to canonical request content and booking ID.
- Existing `bookings`: validated menu-line snapshots, estimated subtotal, quote digest and unique reference, alongside existing transaction fields. Existing `messages` booking cards mirror the same real request.

Menu reads are bounded. Non-focused AI menu previews use at most 12 items/place with a 60-second process cache; focused/named/current-order menus are refreshed up to the 80-item cap. Model menu context is capped to 18,000 characters. Missing preview items require opening the full menu, not invented products. UI menu fetches are capped to 80 active items and cached for 30 seconds, refreshed for checkout. Cold-start reads and provider quotas still count; free-tier usage is not unlimited or guaranteed.

## Security and actions

The model proposes only: VIEW_RESTAURANT, VIEW_MENU, SHOW_ON_MAP, GET_DIRECTIONS, ADD_TO_ORDER, VIEW_ORDER, EDIT_ORDER, REQUEST_ORDER, REQUEST_RESERVATION, VIEW_REQUEST_STATUS and CANCEL_DRAFT. These open trusted UI or change local drafts; none directly submits a transaction. Unknown action identifiers/restaurant IDs are dropped or rejected.

- Server authentication uses the existing verified account. Menu saves/settings require current place ownership, with closure/transfer locks.
- Menu writes, transaction creation, quote validation, idempotency and status transitions run in trusted Netlify functions. Client Firestore menu writes and request-key access are denied.
- Consequential submission requires `confirmed: true` plus an idempotency key. The client cannot choose owner/customer identity, final prices, acceptance/payment state or initial transaction status.
- Quote and final submit read the actual menu. Stale prices/version/options cause a conflict and require a fresh review. Concurrent confirmation is atomic through Firestore transactions.
- A status action is bound to a server-verified own request. Private booking records/status/notes are not included in the model prompt. Only public catalog/menu and the customer's unsent conversational draft/history go to the model.
- Other customers' records, arbitrary writes, automatic payment, fabricated acceptance and model-generated scripts are not allowed. Ordinary account actions do not demand unnecessary extra personal details.

## Existing status mapping

The existing backend statuses are retained to avoid breaking payments/history:

| Backend | Customer meaning |
|---|---|
| pending | Pending Establishment Confirmation |
| accepted | Owner accepted; reservation accepted, requirements/payment may still follow |
| payment_submitted | Payment under review |
| payment_confirmed | Payment verified |
| preparing | Preparing |
| ready | Ready |
| out_for_delivery / delivered / fulfilled | Actual fulfillment stage, then customer receipt |
| received | Completed |
| rejected | Declined |
| cancelled | Cancelled; any refund obligation still follows its existing workflow |

No request is marked accepted/confirmed merely because the AI generated it.

## Deployment

1. Deploy **firestore.rules** from this full source before testing new menus:
   `firebase deploy --only firestore:rules --project vicinify-c9828`
2. Commit/push the complete matching frontend + Netlify functions; wait for Published. Build remains `npm run build`, publish `dist`, functions `netlify/functions`.
3. New menu queries use a single `archived` filter in each menu subcollection, so there is no new composite index definition. Earlier indexes still need to be Enabled if not deployed already.
4. Keep GEMINI_API_KEY secret in Netlify Functions/Production. Gemini is the only provider; OpenRouter is no longer called. See AI_API_SETUP.md.
5. Owner adds real menu items and enables ordering. No fake production records or automatic menu migration is performed.
6. Test real customer/owner accounts after deployment: menu search, order options, quote, confirmation, actual acceptance/decline, customer status, reservation and existing payment/refund process. Check Google AI Studio usage or sanitized provider logs to verify the real model call.

## Validation and limits

- 31 automated test files pass, including authorization, stale prices, unavailable choices, explicit confirmation, server-generated identity/status, duplicate/concurrent confirmation, lost-response retry, cancelled requests and private status-action binding.
- Six Chromium workflows at 320/393/1280 widths in light/dark use the actual UI and actual local backend handlers with test authentication/model fixtures: owner publishes/edits menu, customer chooses options, price changes reject, interrupted confirmation recovers one request, owner acceptance updates status, editable reservation requires Review then Send, and Menu/Posts tabs remain separate.
- Existing establishment layouts were checked at four widths in both themes. Static production build passes.
- Firebase emulator integration tests were added but could not run here: npm/emulator startup was blocked by the environment proxy/network (EPERM). Latest rules still need CLI compilation/deployment and production authorization checks. Live Gemini credentials, billing activation, model availability and quotas were not verified here. Browser tests use mocked model responses, not a claim of live model intelligence.
