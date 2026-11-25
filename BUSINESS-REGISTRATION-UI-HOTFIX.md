# Phase 10 — Business Registration standalone UI hotfix

The public Register Your Business entry leads to the existing Firebase sign-up/sign-in, with an explicit business application notice. A verified signed-in user is taken directly to a standalone application page, without the dashboard header or sidebar. Pending and approved users see the tracker rather than an editable permit form. Applicants can sign out or return to regular Vicinify. Existing admin approval and role assignment, Firestore rules, Suki and VIP flows are unchanged.

For a direct applicant link, append `?business=1` to the public site URL. For transactional emails configure `RESEND_API_KEY`, `VICINIFY_FROM_EMAIL` and optionally `VICINIFY_PUBLIC_URL` (HTTPS; defaults to Netlify's URL). No passwords are sent. Firebase verification emails must still be enabled. Email failures do not reverse approval. Reopen application via the public registration entry or My Activity.

Deploy the full project using the current GitHub/Netlify workflow; keep existing environment variables and database. If Phase 10 rules/indexes have not yet been deployed, use the existing Phase 10 deployment guide. Test with dummy documents only.

Validation: 41 targeted registration, analytics, notification and integration backend tests passed using mocked services; build passed. Offline browser simulation at 1280x800 and 375x812 passed entry, unverified notice, verified form, submit visibility, pending and approval tracker. Live Firebase authentication, permit upload, production email delivery and actual Netlify deployment are not tested. Prior full-suite failures are not addressed by this scoped change.
