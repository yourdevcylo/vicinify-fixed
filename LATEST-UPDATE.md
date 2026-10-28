FULL LATEST — 2026-10-28
Includes accumulated login/layout/dark-mode changes, list spacing, Menu/Overview/Reviews/About panel, owner feature editor, request/date validation, customer/business chat, cancellation, manual payment references and owner accept/decline, and Vici AI option B (large desktop window/full-screen mobile).

DEPLOY
Extract and upload all 87 files, including folders, to the repository root. Commit to main. Netlify: npm run build; publish dist; functions netlify/functions. Wait for Published, then hard-refresh (Ctrl+Shift+R), or test in an incognito window.

Server secrets stay in Netlify: FIREBASE_SERVICE_ACCOUNT, GEMINI_API_KEY, optional GEMINI_MODEL=gemini-2.5-flash, ALLOWED_ORIGIN matching the deployed site; FIREBASE_STORAGE_BUCKET for private receipts. No actual credentials are included.

Local validation: 68 tests passed; build passed; AI layout checked at 320/390/820/1440 in light/dark. Production deployment and live AI were not verified here. Payments/refunds are manual, not automatic transfers.
