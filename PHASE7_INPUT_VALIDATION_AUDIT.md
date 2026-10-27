# PHASE 7 — Input Validation Audit
**Vicinify Capstone — Defense Documentation**
**Version:** v53AD (VICINIFY_FINAL_20261005AD) | **Date:** 2026-10-08

---

## 7.1 XSS / HTML injection — ✅ PASS

All user-controlled content rendered via `innerHTML` passes through `escapeHtml()`:

| Render site | Escaped? |
|---|---|
| Vici AI chat (user query + AI reply) | ✅ `escapeHtml(query)`, `escapeHtml(replyText)` |
| Buzz posts (body, author name, barangay) | ✅ `escapeHtml(p.body)`, `escapeHtml(displayName)` |
| Reviews (reviewer name, label, date) | ✅ `escapeHtml(name)`, `escapeHtml(...)` |
| Buzz media URLs | ✅ `escapeHtml(safeImageUrl)` (+ `safeImageUrl` filter) |
| Admin tables (claim names, emails) | ✅ `escapeHtml(c.userName)`, `escapeHtml(c.userEmail)` |

**Attack test:** submitting `<script>alert("test")</script>` or
`<img src=x onerror=alert(1)>` as a Buzz post / review / place name renders as
**plain text** — the payload is entity-encoded (`&lt;script&gt;...`) and never executes.

`escapeHtml` implementation (js/common.js, js/map.js, js/dashboard.js):
```javascript
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s =>
    ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[s]));
}
```

---

## 7.2 Length limits — ⚠️ 1 gap found & fixed (v53AD)

| Input | Before | After |
|---|---|---|
| Buzz post body | `maxlength="500"` ✅ | — |
| Business name (Add form) | min 3, **no max** ❌ | `maxlength="120"` + JS check + rules check |
| Description (Add form) | min 10, **no max** ❌ | `maxlength="1000"` + JS check + rules check |
| Vici AI query | sliced to 500 chars in Netlify Function ✅ | — |
| Review rating | 1–5 enforced ✅ | — |
| Photos (Add form) | max 5 files ✅ | — |
| Storage uploads | image-only, < 5MB (rules) ✅ | — |

**Why it mattered:** without a max length, a user could submit a multi-megabyte
description via DevTools (bypassing the absent `maxlength`), wasting Firestore
quota and breaking card layouts.

**Fix (v53AD):**
1. `index.html`: added `maxlength="120"` (name) and `maxlength="1000"` (description).
2. `js/add.js`: JS validation rejects over-limit input with a toast/alert.
3. `firestore.rules` (`places` create): server-side guard —
   `name.size() <= 120`, `description.size() <= 1000` — so the limit holds even
   if the client is bypassed.

---

## 7.3 Type / empty / malformed values

| Check | Status |
|---|---|
| Empty business name / description | ✅ Blocked (min-length checks) |
| Empty Buzz post | ✅ Publish button disabled when empty |
| Invalid rating (0, 6, text) | ✅ `1–5` range check before write |
| Malformed email on register | ✅ Firebase Auth rejects; client trims input |
| Phone number | ⚠️ Free-text field, no format enforcement — acceptable for capstone; stored as plain text, escaped on render |
| GPS coordinates | ✅ Numeric, from `geolocation` API or map picker — not free text |

---

## 7.4 Dangerous file uploads — ✅ PASS
Covered in Phase 6: Storage rules enforce `contentType.matches('image/.*')` and
`< 5MB`. Payment proofs bypass Storage entirely (compressed data URL in Firestore,
≤ ~900KB, client-side guard).

---

## 7.5 Defense-in-depth summary
Validation happens at **three layers**:
1. **HTML attributes** (`maxlength`, `required`) — first line, UX-friendly.
2. **JavaScript checks** — user-friendly error messages (toasts/alerts).
3. **Firebase Security Rules** — the real enforcement; cannot be bypassed via DevTools.
