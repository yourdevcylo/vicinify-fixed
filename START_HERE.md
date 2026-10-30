## Gemini-only provider update — 30 October 2026

Vici now calls only Gemini. OpenRouter fallback is removed. Complete the billing setup for the Google AI Studio project owning your key (API billing, not the Gemini app subscription), then set Netlify Functions/Production GEMINI_API_KEY and GEMINI_MODEL=gemini-2.5-flash. Keep your Firebase service-account/origin configuration. Delete the unused OpenRouter variable if desired. Redeploy this complete source. See AI_API_SETUP.md for exact steps and cost-control limits.

This update changes no Firestore rules/indexes. The structured-menu rules below are still required if not deployed previously. Gemini timeout is now 25 seconds; default Flash thinking is disabled. Paid billing does not guarantee provider availability. Local tests pass; live API billing/key/model verification remains after deploy.

---

## Current release — Smart Vici AI, structured menus and confirmed requests (30 October 2026)

Read SMART-AI-COMMERCE.md first; it supersedes older AI instructions below. Menu and Establishment posts are separate tabs. Business Hub → Manage menu lets the current owner add priced items/options and enable menu ordering. Existing announcement posts remain intact; they are not treated as verified menu prices.

Deploy the new Firestore rules for menu read permissions and private idempotency records:

```sh
firebase deploy --only firestore:rules --project vicinify-c9828
```

Then commit/push the full source and wait for Netlify Published. No new composite indexes were introduced by structured menus; prior indexes still apply. Keep provider keys only in Netlify Functions/Production. No new Firebase Storage setup is needed for text menus and optional public HTTPS image URLs.

Actual AI interprets conversation; the app renders validated actions and drafts. Only an explicit customer confirmation submits a pending request. Server quote validation, request keys and real owner status updates protect the transaction. Existing prepaid preparation and refund controls remain.

Validation: 31 test files and build pass; six actual UI/local backend fixture workflows cover mobile/light/dark. Firebase emulator startup was blocked by the environment network/proxy, and live provider/production verification remains after deployment.

---

## Vici AI flow finalization — 30 October 2026

Deploy the complete ZIP source through GitHub/Netlify and wait for Published. Keep OPENROUTER_API_KEY secret in Netlify Functions environment variables. Read AI_API_SETUP.md for current provider setup, public-data scope, memory and assisted requests. No new Firebase indexes/rules are introduced by this AI update; earlier transaction rules still need to be deployed if not done yet.

Vici offers public establishment answers, recent conversation context, View menu, View on map, and an UNSENT request draft. Review reservation opens the editable form; the customer must still review and press Send Request. Owner approval, requirements, payment and refund handling remain separate. The model cannot approve a booking or payment. Unsupported natural-language details are left blank for clarification or completion in the form.

Validation: 29 test files and static build passed; local browser checks cover menu and prefilled-request hand-off at 320/393/1280 pixels in light/dark mode with no database write. Live provider/key/quota and actual two-account booking confirmation still require production checks after deployment.

---

## Latest payment/refund update — 29 October 2026
Deploy the matching frontend AND Netlify functions. Deploy the included Firestore indexes once before testing the pinned transaction summary:

```sh
firebase deploy --only firestore:indexes --project vicinify-c9828
```

Wait for the new bookings index (placeId, userId, createdAt DESCENDING) to become Enabled in Firebase. No Firestore rules need widening for this update. Netlify build: npm run build; publish dist; functions netlify/functions. Open the permanent site URL, or /update.html on the same domain for safe app-cache recovery.

The app records manual payments/refunds; it does not transfer money. New requests use the current transaction summary for address, agreed amount/instructions, payment verification, preparation and refund tracking. Existing legacy receipt details are never automatically treated as paid.

---

# Latest package: security and process review

Read SECURITY-FLOW-AUDIT.md first. It contains changes, validation limits and deployment sequence.

Run npm ci, npm test, npm run build. Run npm run test:rules on a machine with Java 21+ and access to the Firebase emulator downloads before deploying rules.

This release needs coordinated frontend/Netlify Functions + Firebase rules deployment. Booking creation now uses the authenticated server function; old browser-direct booking writes are denied by the new rules.

29 composite indexes are configured in firestore.indexes.json. A GitHub upload does not deploy them or the rules. Netlify secrets remain outside source control.

Ownership email migration is dry-run by default: node scripts/migrate-private-owners.cjs. Read the audit instructions before applying it to any database. No migration or production deployment was performed here.

Latest addition: read the anti-spam addendum in SECURITY-FLOW-AUDIT.md. The new content-policy module, atomic write helpers and Firestore spam gates must be deployed together. Old clients will be denied by the new rules. Emulator verification remains required before production rules rollout.


## Customer quick questions and business replies
Customer quick questions send immediately while preserving any typed draft. Business owners enable Automatic replies in Manage listing and may customize menu, hours, delivery and booking answers. Replies use saved business data; they never confirm bookings or payments. Deploy the matching frontend, Netlify functions and Firestore rules together. Each enabled reply adds bounded server reads and one reply write; duplicate calls reuse the same reply. Owner self-chat prompts are blocked; select an actual customer from Business Hub Messages. Rules emulator validation remains required before publishing rules.


Latest QA: 99 local tests, build and dependency audit passed. Browser fixture checks cover light/dark responsive requests, establishment/menu, activity, Vici layout, Suki designs, alerts, Settings overlap and amenities alignment. These are not live backend passes. User emulator result: 20 passed on earlier snapshot. Re-run rules tests after latest favorite rule changes. Known live blockers: Vici AI unavailable needs askVici response/logs; Firebase Storage not initialized. Dynamic translation coverage is partial. Actual camera/location, payment proof privacy, account deletion and multi-account production flows still require manual testing.

Current account/ownership/QR update: read ACCOUNT-DELETION-TRANSFER.md before deploying. Deploy matching source, Netlify functions, Firestore rules/indexes and Storage rules together; wait for the ownership-transfer and events.actorUid indexes to be Enabled. Local tests pass, but the new rules emulator run was blocked by the emulator download host network policy. No production account deletion or ownership transfer was executed here.
