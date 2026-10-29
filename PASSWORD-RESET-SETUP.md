# Password policy and reset handler

The website now uses js/password-policy.js for sign-up, Settings password change, and reset-password.html. Requirements: at least 8 characters, both uppercase and lowercase letters, a number and a listed special character. A reset link is checked before showing the form; weak/mismatched passwords are not submitted; duplicate submits are guarded; success clears the password inputs and action-code URL. English and Filipino are supported. Only the existing public Firebase web configuration is included; no service credential is present.

These files do NOT configure Firebase Authentication project policy. To enforce the same categories for hosted Firebase reset pages and direct Auth API calls, configure the project:

1. Firebase Console > Authentication > Settings > Password policy.
2. Enforcement mode: Require (not Notify).
3. Minimum password length: 8.
4. Require uppercase, lowercase, numeric and non-alphanumeric characters.
5. Save the policy.

Then use the custom reset form:

1. Deploy the full updated website, including reset-password.html, js/reset-password.js, js/password-policy.js and css/password-reset.css.
2. Authentication > Templates > Password reset > Edit > Customize action URL.
3. Set it to the ACTUAL published site origin plus /reset-password.html. For the currently discussed domain: https://viciweb.netlify.app/reset-password.html (verify whether your live hostname has one or two b characters; they are different sites).
4. Ensure that actual hostname is present in Authentication > Settings > Authorized domains.
5. Send a fresh reset email and test the newly generated link. Old emails may continue to point at the old handler. The normal default Firebase handler remains in use until the email template is changed.

Do not merely set actionCodeSettings.url and assume that replaces the handler: it is a continuation URL. This code intentionally does not claim that setting a continuation URL alone enforces the policy. The custom reset page safely routes non-reset account-action modes to the trusted project's default Firebase handler rather than sending action codes to a user-provided continueUrl.

Validation: local shared-policy and reset-flow tests; browser fixtures. Real email delivery, Firebase project policy and template configuration cannot be verified without access to the project's Authentication configuration. No production password was reset in this task.
