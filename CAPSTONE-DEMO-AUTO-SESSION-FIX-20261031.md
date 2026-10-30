# Vicinify Capstone — Quick Switching Session Fix

## What was fixed

- First demo login from a URL like `?demoRole=standard` or `?demoRole=admin` now registers the default Firebase Auth session. The old code skipped that and then refused later role changes.
- On a selected demo role URL, the sign-in email must match that role. This prevents accidentally filling a different role's saved Firebase Auth slot.
- After the normal sign-out/auth initialization clears input fields, the expected demo email is restored on the login screen.
- Firebase Auth LOCAL persistence is selected before password login so each valid login can be restored after page reload, subject to browser storage policy and Firebase session validity.
- Normal header and login design unchanged. Press `Ctrl + Alt + D` to open the hidden demo panel.

## How to use for the capstone presentation

1. Deploy the **new** build to Netlify. Use the same site URL and normal browser profile, not Incognito.
2. Log into your Standard demo account using its own password.
3. Press `Ctrl + Alt + D`. Select Business. Sign in with the Business account once.
4. Press `Ctrl + Alt + D`. Select Admin. Sign in with the Admin account once.
5. Press `Ctrl + Alt + D` and select Standard/Business/Admin to switch back without re-entering passwords **while each session is valid**.
6. Use the panel to switch rather than the normal **Log Out** action. Logging out intentionally clears the currently selected Auth session.

The demo panel cannot grant permissions or log in to a never-authenticated account without credentials. Real Firestore/Firebase security rules remain enforced. Because the browser stores three authenticated demo sessions, do this only on a controlled device. After defense, sign out of each account and clear the site's stored data.

## Deployment and cache

The full ZIP contains root project files, `dist/`, and `netlify/functions/`. The build produces a fingerprinted cache version to replace old scripts. For Netlify's source/build deployment use `npm run build`, publish directory `dist`, functions directory `netlify/functions`. A drag-and-drop of only the source folder is NOT a full functions deployment. If the old panel remains, hard refresh/clear this site's PWA cache and verify that the deployed `js/demo-switcher.js` matches the latest build.

## Tests and limits

- 20 automated switcher tests passed, including a 6-role-transition state simulation with three independent mocked Auth slots.
- Production build and JS syntax checks passed.
- Chromium rendered and opened the hotkey panel successfully at 1366, 460 and 360 px widths.
- Live end-to-end Firebase account authentication, real Netlify deployment, and real multi-page navigation were NOT tested here. Passwords were never requested, stored, or embedded.
