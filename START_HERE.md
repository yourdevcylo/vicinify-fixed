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
