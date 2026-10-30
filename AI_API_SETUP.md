# Vici AI — OpenAI-only integration

Vici AI uses **OpenAI GPT-6 Luna only** via `/.netlify/functions/askVici`.
It sends AI text-generation requests to OpenAI Responses API and safety checks to the OpenAI Moderations API.
No Gemini, OpenRouter, Ollama, or other AI provider is called. No provider fallback/retry is enabled.

## Netlify server configuration

In **Site configuration → Environment variables**, configure the following for **Functions** (Production):

- `OPENAI_API_KEY`: your OpenAI project's secret API key. Never commit or paste it into frontend code.
- `FIREBASE_SERVICE_ACCOUNT`: keep your existing Firebase Admin service account JSON; do not replace or remove it.
- `FIREBASE_STORAGE_BUCKET`: keep your existing value (if already configured).
- `ALLOWED_ORIGIN`: your exact production `https://…` origin with no trailing slash; otherwise Netlify's `URL` variable is used.

Obsolete Gemini/OpenRouter environment variables can be **deleted from Netlify** after deploying and verifying the new setup. They are not used by this code. Do not delete your Firebase variables.

The OpenAI key should have **Responses: Write** and **Moderations: Request** permissions. Rotate it if exposed. The model is fixed in server code as `gpt-6-luna`; it is not chosen by the browser. OpenAI API billing and ChatGPT subscriptions are separate.

## Guardrails and cost controls

1. Netlify verifies Firebase Auth (verified email required) before reading server-side public catalog data or calling OpenAI.
2. A Firestore transaction enforces **20 model questions per user per Philippine calendar day** (midnight reset, Asia/Manila). Greetings and thanks answered locally do not use the model. A separate **6 requests/minute** limit also applies. Rejected or failed AI requests may still consume a daily slot to reduce abuse.
3. The backend moderates the user message, calls OpenAI once for a JSON response, validates permitted public IDs/actions against Firebase, then moderates the final reply. Moderation errors fail closed. Moderation is not a complete substitute for other safety validation.
4. The AI gets only selected public establishment/menu data and bounded chat history; it cannot read private inboxes or submit bookings/orders by itself. Customer confirmation and the existing secure transaction endpoints are required.
5. Public data may have stale prices/availability; server-side order quote and owner confirmation are authoritative.
6. OpenAI credits and project budget alerts are **not** guaranteed hard spending caps. Watch actual usage in OpenAI dashboard. Use production request logs without copying user data or keys.

## Deployment & verification

1. Back up the existing production deploy. Deploy this **complete source ZIP** through your normal Netlify build pipeline (build: `npm run build`, publish: `dist`, functions: `netlify/functions`). Do not manually upload `dist/` alone, because it does not deploy your Functions.
2. Confirm Netlify Functions includes `askVici` and `OPENAI_API_KEY` is available to functions; no secret appears in the website source.
3. Test as a verified **customer account**: ask “May affordable cafe ba malapit sa akin?” (not just “Hi”). Inspect the browser Network response to `/.netlify/functions/askVici`—`source: openai` indicates the backend returned an OpenAI model result; `unavailable` and `guard` are not a successful model reply.
4. Confirm that valid place cards come from the saved public database, not invented businesses. Test a blocked request and a normal menu query. Use a separate owner account to confirm a genuine booking still requires approval.
5. Verify 50 questions/day quota with a dedicated test account rather than spending all credits on a production account. The counter resets at **00:00 Philippine time**.
6. If error 503: check `OPENAI_API_KEY`, billing, access permissions (Responses Write/Moderations Request), Firebase service account, and Netlify function logs. If error 429: check daily quota, OpenAI API account limits, or request frequency.

Local tests use mocked OpenAI/Firebase responses. **Actual live API connectivity is not verified until after deployment.**
