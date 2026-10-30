# One Vici AI entry point (2026-10-30)

The Map header's **Open Vici AI** button is the only AI launcher. Chat close (X) and backdrop click fully hide the workspace. Reopen via the same button; account-scoped conversation history is preserved. Removed the minimization-driven `viciAiResume` button and the old draggable dock. The `locateBtn` has been restored to its intended map geolocation action.

Unchanged: Vici AI API/queries, Firebase/auth/data, Suki Card, navigation/back history, UI theme, transactions. This is a UI/navigation change only. The unused legacy `js/vici-launcher.js` remains in source for migration history but is no longer included or cached in the deployed application.

Quick test: Map > Open Vici AI > New chat > Close (X) > no floating button > Open Vici AI again > same chat history. Click map location icon to confirm geolocation still works. Test on both phone and desktop after deploy.
