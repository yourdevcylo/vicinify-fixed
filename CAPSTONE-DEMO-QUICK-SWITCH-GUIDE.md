# Vicinify — Capstone Demo Account Switcher

## Setup

1. Deploy full source via Netlify Git build or CLI.
2. Sign in normally to one of the three registered demo Firebase Auth accounts (Standard / Business / Admin). The **DEMO** dropdown appears at top right only when logged into an allowlisted email.
3. Choose another role. On first visit to that role, sign in with that account's own password. The app remembers each role in a distinct Firebase Auth app session on that browser; it never saves the password in source code.
4. Later switches return to previously authenticated role sessions without re-entering credentials, as long as Firebase sessions remain valid.

## Email mapping

- Standard User — projectfreedom12110@gmail.com
- Business User — detorresmarc08@gmail.com
- Admin User — yourdevcylo@gmail.com

Only actual Firebase Auth user sessions grant permissions. No roles are overridden, and the Admin account needs its existing verified backend privileges.

## First-account optimization

The first demo account used in the normal/default session retains its original login, mapped to the `vicinify.capstone.defaultRole.v1` local browser setting. Other roles have separate Firebase apps and sessions. For defense, log in to each account once using the same device and same browser profile; do not use Incognito, clear browser site data, or use a different browser to expect the sessions there.

## Known constraints

- Requires password once per distinct account. Authentication sessions can expire or be invalidated, so browser may ask for password again.
- The dropdown is a convenience feature, not a security measure. Firebase Auth and Firestore/Netlify functions independently enforce role permissions.
- This does not grant one account administrative access through a role picker.
- The settings/normal signout function logs out only the currently selected Firebase Auth session.
- Use live demo accounts with only safe demo data for capstone; do not give passwords to participants.

## After the defense

For a shared computer, switch into each role and use Sign Out for each session, then clear the browser site data. All three roles can remain authenticated until signed out or until sessions expire, so never leave the demo device unattended with a logged-in admin session.

If you do not want the switcher available after capstone, remove the demo-switcher script/CSS/markup and the `VicinifyDemoSwitch` initialization (use normal default Firebase app again), or revert to the pre-demo ZIP. This is a capstone-specific build, not a universal production account-switching feature.
