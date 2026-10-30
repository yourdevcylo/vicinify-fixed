# Vicinify Automatic Open/Closed Status (Asia/Manila)

- The status displayed in Map, List View, place details and Business Hub is calculated from saved `operating_hours` whenever mode is **Auto**. Existing businesses with parseable schedules use Auto by default.
- There is no cron job and no per-minute Firestore write. Every visitor computes the up-to-date status based on Philippine time. List/Map and dashboard refresh visible statuses every 60 seconds and when returning to the tab.
- Business Hub > My Establishments > Live Store Status has **Auto, Open, Busy, Closed**. Choosing a manual status writes `status_mode: manual` and `status`; Auto writes `status_mode: auto` without changing `status`. Manual Closed is useful during emergencies; return to Auto to resume schedule.
- Time formats: `8AM - 9PM`, `8:30AM - 9:30PM`, `08:00 - 21:00`, `24/7`, `24 hours`, `Closed`.
- Overnight schedules such as `6PM - 2AM` continue past midnight into the next day.
- If a saved schedule is missing/invalid, the legacy manual status is used only when no parseable day exists. Blank days in an otherwise configured week are treated as closed.
- This is display status only; it does not cancel existing transactions or automatically prohibit future-dated booking requests. Service Management toggles continue to govern which kinds of new requests can be made.
- Run `node --test tests/business-hours.test.cjs` and `node build.cjs` before deployment. Deploy the project `dist/` and Netlify Functions together.
