Latest update — 2026-10-29

Old: AI failures showed one generic unavailable message; setup guide described an outdated deployment flow.
New: frontend distinguishes origin rejection, incomplete server setup, login rejection, rate limits and timeout, with Filipino translations. Setup guide describes the current Netlify function.
Confirmed production error: Forbidden origin. In Netlify set ALLOWED_ORIGIN to the EXACT origin used in the address bar, without trailing slash (e.g. https://viciweb.netlify.app), then redeploy. This ZIP cannot set your Netlify environment variables.
All cumulative source and Netlify functions retained, including admin saved-status display fix and request/payment/refund work.
Validation: npm test (16 test files passed), node build.cjs. Production AI still needs validation after the environment change and deployment.
Deploy the complete source through the connected Git repository; Netlify builds dist and deploys netlify/functions. This download HTML is only a ZIP delivery page, not the website deployment.
