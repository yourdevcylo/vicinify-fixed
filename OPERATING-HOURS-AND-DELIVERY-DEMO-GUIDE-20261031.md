# Business Hub — Operating Hours and Delivery (2026-10-31)

This change fixes the Operating Hours editor's confusing alternating 2-column order. It now shows Monday–Sunday in one vertical list on desktop and mobile, with working Closed, Copy Monday to Tue–Fri, and Copy Monday to all days controls. Existing saved `operating_hours` Firestore fields, custom formats, and existing days are retained. Copy controls only update fields after explicit user action; remember to click Save. No Firebase rules, account roles, delivery flags, menu data or existing records are modified.

## Suggested sample data — capstone demonstration only (not verified operating hours or confirmed delivery availability)

| Demo establishment | Mon–Fri | Saturday | Sunday | Simulated in-house radius |
|---|---|---|---|---|
| Kape Corner | 8AM - 9PM | 9AM - 9PM | 9AM - 9PM | 3 km |
| Timpla ni Juan | 10AM - 8PM | 10AM - 8PM | Closed | 5 km |
| Tea Haven | 11AM - 9PM | 11AM - 10PM | 11AM - 10PM | 4 km |
| Kusina Lipa | 10AM - 9PM | 10AM - 10PM | 10AM - 10PM | 5 km |
| Sweet Cravings | 9AM - 7PM | 9AM - 8PM | 10AM - 6PM | 3 km |

Use Grab/Foodpanda only when actually available. Enable In-house Delivery only for the scope of demo requests if the participants understand that it is a simulation; do not publish unverified delivery claims as real.
