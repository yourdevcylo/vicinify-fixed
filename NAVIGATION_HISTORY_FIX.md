# Navigation history fix (2026-10-30)

- Pages now maintain a browser-compatible, session-local visit order.
- In-app and phone/browser Back return to the previous visited page instead of hardcoded Map/Business Hub.
- Back fallback stays inside Vicinify if there is no earlier in-app page.
- Suki Card Back retains its unsaved-change check; browser Back and bottom navigation do as well.
- Returning to establishment details reattaches its real-time Suki listeners.
- Login/logout reset page history so an earlier account's private page cannot be reopened with Back.
- Inbox-to-place links no longer insert a fake Map entry.
- Firebase, rules, and all data schemas unchanged.

Manual post-deploy checks: Map > Business Hub > Suki Studio > Back > Business Hub > Back > Map; My Activity > establishment details > Back > My Activity; phone browser Back/Forward, and unsaved Suki confirmation.
