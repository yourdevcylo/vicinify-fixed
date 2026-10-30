# Vicinify — Simplified Capstone Demo Switcher

## One-time setup

1. Sign in as one of the three demo accounts in the normal login form.
2. Open the `DEMO` dropdown at the top-right, then select Business / Standard / Admin.
3. For an account that is not signed in yet, the login screen will say which role is selected and will prefill its email. Sign in with that account's password.
4. You can use the **Switch demo account** buttons or **Back to previous account** when another role has not yet been signed in. You cannot get trapped on the first-time-login screen.
5. After all three sessions are saved, select a role in the top-right dropdown to switch without typing passwords again while the sessions are valid.

## Security

The selector never grants roles or copies credentials. The selected account must be signed in for real; Firebase authentication and database authorization are unchanged. Only the three preconfigured addresses are eligible for the authenticated switcher. The helper navigation on the first-time-login screen does not bypass login. Never share or store the demo account passwords in project source.

## Troubleshooting

If a role redirects you to login, it means that account has not yet signed in on this browser/session or the session expired. Use **Back to previous account** and try again. Use the same browser profile, not private mode. If the account is signed in but cannot access a restricted dashboard, confirm its actual Firestore role permissions.

After the defense, sign out each demo account and clear browser site data on shared computers.


## Persistent top DEMO dropdown fix (2026-10-31)

The DEMO selector remains visible at the top while switching between already authenticated demo accounts. If you select a demo account that has not signed in yet, the selector stays visible on that account's login page as well. Choose another role to return immediately; no password is stored. The selector still does not grant access to any account's data: Firebase requires separate authentication and actual backend permissions.

If a non-demo account signs in, no demo controls are displayed.
