# Latest package: security and process review

Read SECURITY-FLOW-AUDIT.md first. It contains changes, validation limits and deployment sequence.

Run npm ci, npm test, npm run build. Run npm run test:rules on a machine with Java 21+ and access to the Firebase emulator downloads before deploying rules.

This release needs coordinated frontend/Netlify Functions + Firebase rules deployment. Booking creation now uses the authenticated server function; old browser-direct booking writes are denied by the new rules.

29 composite indexes are configured in firestore.indexes.json. A GitHub upload does not deploy them or the rules. Netlify secrets remain outside source control.

Ownership email migration is dry-run by default: node scripts/migrate-private-owners.cjs. Read the audit instructions before applying it to any database. No migration or production deployment was performed here.

Latest addition: read the anti-spam addendum in SECURITY-FLOW-AUDIT.md. The new content-policy module, atomic write helpers and Firestore spam gates must be deployed together. Old clients will be denied by the new rules. Emulator verification remains required before production rules rollout.
