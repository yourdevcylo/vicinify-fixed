# Updated Vicinify source bundle

This ZIP contains the working application source, built dist assets, Netlify Functions, Firebase rules/indexes, dependency lockfile, and 18 automated tests. It excludes credentials, Git metadata, and node_modules.

## Deploy the whole project

Extract this ZIP into a directory. The directory containing package.json and netlify.toml is the project root.

Use a Netlify deployment workflow that builds source and deploys Functions (Git integration or Netlify CLI). Build command: npm run build. Publish directory: dist. Functions directory: netlify/functions. The Netlify configuration pins Node.js 22.

Uploading only dist through a static drag-and-drop deploy will not supply the backend endpoints. The standalone HTML design preview is not the deployable application.

Configure the server environment securely using .env.example: FIREBASE_SERVICE_ACCOUNT, FIREBASE_STORAGE_BUCKET, and ALLOWED_ORIGIN. Optional Vici AI needs GEMINI_API_KEY and GEMINI_MODEL. Do not put credentials into public assets. Browser Firebase configuration currently targets vicinify-c9828; follow START_HERE.md for staging and coordinated rule/index/function deployment.

Before deploying: npm ci, npm test, npm run build. Optional security integration checks need Java 21 and Firebase CLI: npm run test:rules (isolated demo-vicinify project).

## Included UI changes

Latest: split login hero restored without pet or Netlify badge; visible mobile radius and Map/List controls; persistent List selection; three quick filters plus More filters.

Responsive sidebar/control/map layout; aligned Radius and search/send controls; floating arrow removed; restored split-hero login; working keyboard/ARIA auth tabs; theme-aware discovery controls; updated versioned offline UI precache.

Verification: 18 automated tests pass, build passes, browser checks cover 320–1920px layouts and light/dark modes, and the real service worker serves the new local UI assets offline after a fresh install. These checks do not establish live Firebase/Gemini functionality, external SDK/map availability offline, production deployment, or rules-emulator acceptance. No production deployment was performed.

See REVIEW_REPORT.md and START_HERE.md for scope and outstanding live-service checks. Historical audit files describe earlier versions.




## Latest UI polish

Use css/components.css with the other styles; it is included in source, dist, index.html and the service-worker precache. Includes consistent page spacing, dark dialogs and status pills, green Buzz/Create Post categories, accessible post fields/photo input, Publish state reset on reopen, one selected navigation item, and bounded chat/edit panels. The cache version is vicinify-ui-20261027-7. Browser checks cover 320–1920px layouts. All 18 automated tests and the build pass. Radius now uses a bounded six-column grid, wraps into two rows only when its card is very narrow, keeps its hint and buttons inside the border, and uses a plain Radius label without the crosshair icon. The discovery heading now uses card-sized typography with consistent gaps, and the sidebar/login/mobile brand uses one grouped wordmark and fixed-size icon. Readable scale restored: 32px desktop heading, 30px tablet heading, 26px wordmark and 34x38px icon. The discovery panel is wider, with larger search, distance, category and view controls; overflow checks passed in light/dark modes. No live deployment was performed.
