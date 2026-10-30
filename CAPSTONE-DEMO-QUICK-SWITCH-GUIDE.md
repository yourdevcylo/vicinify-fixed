# Vicinify — Capstone Developer Panel (keyboard-only)

## Shortcut

1. Sign in normally with one of your three designated capstone accounts (Standard, Business or Admin).
2. Press **Ctrl + Alt + D** on desktop (Windows/Linux) to open the **Developer Demo Panel**.
3. Choose **Standard User**, **Business User**, or **Admin User**.
4. The first time you enter a different role, sign in with *that role's own* account and password. The login email is prefilled.
5. Press **Ctrl + Alt + D** again on the login screen to return to a previous demo role, if the browser was already set up.
6. Once the three Firebase sessions are individually signed in, switching is one selection while those sessions remain valid.
7. Press **Esc**, click outside the panel, or the close button to dismiss it.

**Normal Vicinify UI is restored.** There is no DEMO chip or role dropdown in the header; no role-picker is visible on the login page.

## Security limitations

The shortcut is convenience only, not a secret or an authentication mechanism. The panel is gated in the UI by the three designated demo account emails; a signed-out demo browser may reopen it for session navigation only. Users still need the real Firebase account credentials and backend-authorized roles. Never put passwords in source code. The site is client-side JavaScript; do not treat a hidden shortcut as a security boundary. Use a dedicated browser profile and sign out / clear its site data after defense.

## Deployment

Deploy the entire project ZIP through Netlify build (the `dist/` output and `netlify/functions/` are included). If the old DEMO header remains, redeploy and hard-refresh or clear the installed PWA site cache.
