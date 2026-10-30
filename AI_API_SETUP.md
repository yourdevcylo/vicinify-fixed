# Vici AI — current setup

Use `/.netlify/functions/askVici` on Netlify. Secrets remain server-side; no browser AI key or SDK is required.

## Environment variables (Functions / Production)

- OPENROUTER_API_KEY: new secret key. The selected model is pinned to `google/gemma-4-31b-it:free`; there is no paid OpenRouter model fallback.
- GEMINI_API_KEY: optional; when present, Gemini is tried first, then OpenRouter. Remove it if you want OpenRouter only. The app cannot guarantee Google's billing terms; use a free-tier project/model if budget is zero.
- GEMINI_MODEL: optional, default `gemini-2.5-flash`.
- FIREBASE_SERVICE_ACCOUNT: existing Firebase Admin credential for authenticated server operations.
- ALLOWED_ORIGIN: exact deployed origin, including https:// and no trailing slash. Otherwise Netlify URL is used.

Redeploy after environment changes. Do not paste keys into code, GitHub, chat or screenshots.

## Actual AI behavior

All substantive messages go to the model for semantic interpretation with bounded recent conversation, approved public places, real menu previews and the customer's unsent drafts. Greetings/thanks are small local replies. No keyword booking parser or generic all-establishments fallback is used. New cravings/budgets must not be mistaken for guest-count corrections. Structured output is validated by the server; only supported public actions and unsent drafts are rendered.

The model cannot execute writes, accept reservations, change prices, confirm payments, access other customers or submit without the customer's confirmation screen. Orders are quoted/validated again against live Firestore menus. See SMART-AI-COMMERCE.md for schema, permissions and owner/customer workflows.

Provider calls request JSON and final answer content only, not internal reasoning. Timeouts are 5 seconds for Gemini, 18 seconds for OpenRouter, with 28-second browser transport timeout. No available provider or invalid structured output produces a clear failure message, not fake AI recommendations or simulated transactions. Application model limits remain 6 requests/minute and 50 per 24-hour account window; provider limits are separate and change over time.

## Verify after publishing

1. Owner: add real menu items from Business Hub → Manage menu, and enable Accept menu orders only if supported.
2. Customer: New chat → “I’m thirsty and have 500 pesos” → relevant suggestions/clarification; “yung pangalawa, ano menu nila?” → real listed menu; “dalawa nung chicken meal” → editable draft only if that item exists.
3. Use Review current prices → Confirm request; owner must accept/decline before any confirmation claim.
4. Check askVici Network JSON `source`: `openrouter` / `gemini` means the provider answered; `basic` is only greeting, `unavailable` is provider failure, `guard` is invalid/rejected output.
5. Check OpenRouter Activity for actual successful requests. Netlify Functions logs report safe provider/status/reason only; share a sanitized status line, never authorization headers or keys.

Unit/browser fixtures are local verification, not proof of live API credentials/model availability. The production smoke test is still required.
