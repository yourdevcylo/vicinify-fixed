# Vicinify — Suki Studio and real-time stamp fix (2026-10-30)

## UI
- Removed duplicate, full-width bottom Save bar and its non-interactive “Editing Suki Card” label.
- Kept one **Save Changes** button, aligned with the fields inside the Suki Card Studio form.
- Status now appears next to Save on saving, success, or error rather than occupying space at all times.

## Customer Suki Card
- The establishment's customer card now listens to its own `loyalty_cards/{placeId}_{customerUid}` Firestore document using `onSnapshot`. Approved stamps and claim states update on the open card without a page refresh.
- The pending stamp request control also listens for changes. When an owner handles the request, the pending display updates automatically. On projects missing the composite index it falls back to a customer-scoped listener; the existing Firestore indexes have not been changed.
- Listeners detach on page unmount, avoiding old subscriptions and stale page updates.

## QR scan performance
- Removed an unnecessary second read of the establishment document after a successful QR scan.
- Keeps recent, accurate GPS positions fresh while the scanner is open. GPS fix reuse is limited to eight seconds and still requires the saved pin to match and its GPS distance plus uncertainty to be within the existing 150-metre threshold. Long scans require fresh GPS verification.
- The request uses the existing Firestore stamp request collection and owner approval.
- Removed the extra zero-stamp loyalty card write after request submission. That write could race with a fast owner approval and reset stamps back to zero; owner transaction already creates the card on first approval.
- Shows a sending state while the stamp request is being processed.

## Deployment and validation
- Does not change Firebase project, schema, Firebase rules, or authentication configuration.
- `npm run build` produces `dist` and Netlify Functions remain in `netlify/functions` for Git/CLI deployment.
- Offline Node regression tests cover the real-time stamp update, request state transition, subscriber cleanup, location checks, and UI markup.
- These are offline browser simulations/mocked Firestore checks, **not** a live Firebase device/integration test.
- Browser GPS is inherently spoofable; the customer-side 150m check is a usability guard, not a server-enforced guarantee. Owner approval is still required.
