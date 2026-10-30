# Gemini API only — current Vici setup

Vici now uses only Google's Gemini API through `/.netlify/functions/askVici`. OpenRouter is not called, even if an old OPENROUTER_API_KEY remains configured. No automatic provider/model fallback or retry is performed.

## Billing setup

1. Open https://aistudio.google.com/projects and locate the project that owns the Gemini API key you intend to use.
2. Choose Set up billing / Upgrade for that project and complete Google Cloud Billing setup. This is Gemini API pay-as-you-go billing, not a Gemini app/Google AI subscription. Do not post card details or API keys in chat/screenshots.
3. Confirm billing is active for the SAME project as the API key. Firebase Storage setup is not required for this AI integration or the structured text menu.
4. In Cloud Billing, configure a budget alert you are comfortable with. A budget alert is a notification, not a hard spending cap.

## Netlify environment variables (Functions / Production)

- GEMINI_API_KEY: the project's actual secret Gemini API key.
- GEMINI_MODEL: `gemini-2.5-flash` (default). The selected model must be available to the project. Use an available compatible model ID if Google retires/changes access to it.
- FIREBASE_SERVICE_ACCOUNT: retain the existing Firebase Admin credential.
- ALLOWED_ORIGIN: retain the exact deployed origin, including https:// and no trailing slash; otherwise Netlify URL is used.
- OPENROUTER_API_KEY: may be deleted; it is ignored by the code.

Redeploy the complete matching source after updating variables. Never include secret values in frontend code or GitHub.

## Behavior and cost controls

All substantive establishment conversations use actual Gemini interpretation with approved public place/menu data and bounded recent conversation/drafts. Greetings/thanks remain small local replies. Structured AI results cannot bypass customer confirmation, backend quote validation, permissions, or owner acceptance.

The provider makes one call to the configured model, requests JSON output, and exposes final content only. Default Flash thinking is disabled to reduce latency/usage; Gemini timeout is 25 seconds and browser transport timeout is 35 seconds. App limits remain 6 model questions/minute and 50 per rolling 24-hour window PER ACCOUNT. These are not a global monetary cap and provider quotas still apply.

Billing does not guarantee uptime or eliminate all 429/503 errors. A rejected/timed-out request is shown clearly with no fake recommendations or simulated confirmations. Safe provider/status/reason messages appear in Netlify Functions logs.

## Verify after Published

1. Customer: New chat → “May kape ba?” or ask a listed establishment's actual hours. Greeting alone is not an API test.
2. Browser Network → askVici → Response: `source: gemini` confirms a model response was received and validated. `unavailable` or `guard` does not mean success.
3. Check Google AI Studio usage/limits for the matching project and Netlify askVici logs if needed. Share only sanitized error/status lines.
4. Owner: add real menu items from Business Hub → Manage menu; enable menu ordering only when supported. Test menu, order quote/confirmation, owner acceptance and editable reservation flow.

See SMART-AI-COMMERCE.md for menu schema and transaction protections. This provider update adds no Firestore rule/index changes; the earlier structured-menu rules still need deployment if not done already.
