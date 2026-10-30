# Vici AI deployment — Netlify

Vici uses `/.netlify/functions/askVici`. No frontend API keys or SDK installation needed.

## Netlify environment variables

- `OPENROUTER_API_KEY`: your new secret key, Functions scope, Production context. Never paste it into code, chat, GitHub or logs.
- OpenRouter model is pinned server-side to `google/gemma-4-31b-it:free`; no automatic paid model or model override.
- `GEMINI_API_KEY`: optional. When configured, Gemini is tried first (5-second timeout), then OpenRouter (7-second timeout). With only OpenRouter configured it is called directly. Gemini access may have its own billing terms; remove that variable if you want OpenRouter only.
- `GEMINI_MODEL`: optional, defaults to `gemini-2.5-flash`.
- `FIREBASE_SERVICE_ACCOUNT`: existing server credential for login validation, rate limits, and public catalog reads.
- `ALLOWED_ORIGIN`: exact deployed website origin, including https://, no trailing slash. Defaults to Netlify URL when unset.

Redeploy matching frontend and Netlify functions after adding variables. No new Firebase rules or index changes for this integration.

## Scope and fallback

Only selected approved public establishment fields are projected into the model prompt: name, category, address/barangay, saved hours, rating, price range, delivery flags and description. No database lookups of private bookings, payments, chats or personal Suki records. Recent Vici chat text (up to six messages, 500 characters each) is included as question context; users should not enter personal secrets. Saved menu details not supplied are treated as unknown.

Rate limits remain 6 requests/minute and 50 per rolling 24-hour account window. Provider quotas are separate and may change. Upstream quota errors, timeouts, missing credentials and invalid replies fall back to a deterministic public-list response. Authentication and application rate limits still return their error codes.

## After deployment

1. Wait for Netlify Published. Sign in with a verified email.
2. Ask about a listed establishment's saved hours or address.
3. In the browser Network panel inspect the askVici response: `source: openrouter` means OpenRouter answered; `basic` is fallback; `guard` means the topic/output guard responded; `gemini` means Gemini answered.
4. A basic response is not proof that the key works. Check OpenRouter Activity for successful requests. If needed check the key expiration/limit, model availability and project quota. Do not share raw keys or request authorization headers.

Local mocked tests cover routing, quota fallback, timeout, malformed replies, pinned model and public-field projection. They do not verify live Netlify credentials, OpenRouter model availability or free-tier quota.

## Conversation memory

Each AI conversation keeps its own public establishment focus (up to three IDs) and search context (up to 500 characters), plus the last six non-error messages sent to the model. Up to 20 visible messages per conversation and 20 recent conversations are saved on the current browser, scoped to the signed-in account. Reopen a recent chat to continue after refresh; New chat resets context. Clearing browser storage or deleting a chat removes that local history; it does not sync across devices. Selecting View on map remembers the chosen establishment for the next follow-up. Focus IDs are rechecked against the current approved public catalog. No private account data is loaded. Context is bounded, not unlimited memory.

## Assisted requests and direct menu

Vici can prepare an UNSENT request draft from customer-provided place, ISO date or today/tomorrow (Philippine time), explicit AM/PM or 24-hour time, guest count and explicit `Items:` text. Common English/Tagalog booking phrases are recognized deterministically; ambiguous/unsupported details are left blank and requested, not invented. This draft flow uses no model call. General establishment answers still use the configured AI providers. Non-greeting Vici chat requests are limited to 30/minute; actual model questions additionally retain 6/minute and 50/24-hour account limits.

`Review reservation/request` opens the existing editable request form. Nothing is submitted until the customer reviews that form and presses Send Request. Approval, requirements and verified payment still follow the existing transaction process. Drafts do not read booking history or payment/account records. Cancel draft only discards the unsent draft, never cancels an actual booking. Only the latest active draft has an action button. Disabled request settings are checked again on server booking creation.

Recommendation cards have View menu (a compact dialog of up to 20 saved public menu/store posts), View on map, and a clickable place name for full details. Missing menu/images are clearly handled; no generated menu, image uploads or Firebase Storage setup is introduced. No new indexes: the menu query matches the existing place-post feed.
