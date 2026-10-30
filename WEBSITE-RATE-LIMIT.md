# Website-level HTTP 429 protection

The matching Netlify deployment includes three Edge Functions in netlify/edge-functions. These use Netlify's native rateLimit configuration, not in-memory JavaScript counters, browser storage or Firebase documents.

- Page/route requests: 120 requests per 60-second window, aggregated by domain and IP.
- Netlify API requests under /.netlify/functions/*: 600 requests per 60-second window, aggregated by domain and IP, in addition to stricter existing per-account command limits.
- Normal /js, /css, /icons, /logo-options, service worker, manifest, sound and favicon requests are excluded from the page counter. API calls have their own guard.
- Over-limit requests rewrite to /__rate-limited. That Edge Function returns a real HTTP 429, Retry-After: 60, and Cache-Control: no-store. Browser navigations receive a self-contained green English/Filipino page; API requests receive JSON with RATE_LIMITED and retryAfterSeconds.
- The error route is excluded from the guard to avoid rewrite loops. No automatic retry/refresh is performed. Existing service-worker code does not cache non-success page responses and bypasses Netlify function requests.

## Deployment and validation
Deploy the full source through Netlify's build pipeline so Edge Functions are included; a static dist-only upload is insufficient. Inline configs are supported by the official @netlify/edge-functions Config/RateLimitConfig declarations (inspected version 4.0.3). Do not treat local passthrough tests as proof that Netlify's distributed counters are active.

Verify in the Netlify deployment log that all three Edge Functions are deployed and that rateLimit declarations are accepted for the site's plan/configuration. In a staging deployment, temporarily lower a limit for a small controlled test, verify an over-limit request actually reaches the error route with HTTP 429 and Retry-After, then restore production values. Verify ordinary page loading and API calls remain unaffected below threshold. No production traffic/load test was run in this workspace task.

If the deployment rejects or omits native rate-limit configuration, the site is NOT protected by these counters; resolve that platform configuration before claiming protection. There is deliberately no misleading in-process fallback that resets per server instance.

## Usage and scope
These guards add no Firebase reads/writes. Edge invocations and Netlify request usage still follow Netlify billing; this is not a guarantee of zero cost or full DDoS protection. Shared Wi-Fi/NAT users share an IP limit, so the API ceiling is intentionally generous. Review real traffic before tightening it.

This covers requests served through Netlify. Browser requests directly to Firebase Authentication, Firestore, Storage, third-party map services and OpenAI's server-side API use their own separate quotas/protections; this does not impose an overall Firebase spending cap. Firebase Auth sessions are unchanged: login persists normally until logout/revocation/expiry behavior, with no new idle timeout added.

Local tests cover config routing/exclusions, safe origin passthrough, JSON/HTML/HEAD 429 responses, Retry-After, no-store behavior and no auto-refresh. Native counter distribution/enforcement requires a deployed Netlify check.

## Other error pages in the current build
The same green renderer covers 400, 401, 403, 404, 408, 413, 429, 500, 502, 503 and 504 for document responses that reach the site's Edge Function. It keeps the original HTTP status rather than redirecting errors to a 200 page. API responses remain JSON and are not replaced with full-screen HTML. Origin errors thrown during document handling receive a 503 page. Provider failures that happen before application/Edge execution cannot be customized by this code.

The build generates publish/404.html (dist/404.html) from the same renderer. Netlify automatically uses this custom file for missing pages with a 404 status. No catch-all 200 rewrite is added to netlify.toml. Firebase Hosting's separate existing configuration is not the Netlify deployment; use the scoped Firebase rules/index commands below, not a Hosting deploy.

## Inquiry chat adjustment
Inquiry messages allow bursts with no per-message delay, bounded at 90 messages per account per 60-second window (client and Firestore rules). Other action limits remain unchanged. Deploy firestore.rules separately before publishing the updated client. Verification-token refresh retries only rejected permission writes, once; drafts are preserved on failure. Permission errors can also indicate stale rules, unverified email, or an unavailable/unapproved establishment; do not bypass access checks.
