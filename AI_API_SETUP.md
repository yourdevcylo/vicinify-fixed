# Vici AI deployment — current Netlify implementation

Vici AI uses `/.netlify/functions/askVici`, not Firebase Cloud Functions.

In Netlify Project configuration → Environment variables, configure:
- GEMINI_API_KEY: valid Gemini key, available to Functions in the Production context.
- GEMINI_MODEL: optional, default gemini-2.5-flash; the key/project must have access.
- FIREBASE_SERVICE_ACCOUNT: existing server credential for Firebase token validation, rate limits and the approved establishment catalog.
- ALLOWED_ORIGIN: if set, must match the actual site origin exactly, e.g. https://viciweb.netlify.app (no trailing slash). Otherwise the function uses Netlify URL.

Redeploy after changing environment variables. Deploy matching frontend and Netlify functions. Firebase index deployment does not configure AI.

Send a food question while signed in with a verified email. Inspect Netlify Functions logs for askVici. Missing setup, origin rejection, authentication, rate limits, Gemini key/model/quota failures and timeouts have different causes. A generic unavailable message alone cannot identify the production cause.

Never paste API keys or service-account contents into chat, browser code or logs. Share only the sanitized error/status line. Local mock tests do not verify production credentials, model availability or quota.
