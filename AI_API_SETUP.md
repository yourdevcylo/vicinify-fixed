# Vici AI — Saan ilalagay ang API key mo

## Bawal dito
Huwag na huwag ilagay ang API key (OpenAI, Gemini, etc.) sa `index.html` o sa kahit anong `js/*.js`.
Public ang files ng web app: kahit sinong user pwedeng mag-View Source, makopya ang key mo,
gamitin ito sa ibang app, at ubusin ang billing/quota mo.

## Tamang lugar: Firebase Cloud Functions (backend mo)
Ang app ay tatawag lang sa isang URL (endpoint). Ang endpoint ang may hawak ng key, sa server.

### 1) Gawa ng function
Sa project mo, kung wala pang `functions/` folder:
```
npm i -g firebase-tools
firebase login
firebase init functions
```

### 2) Ilagay ang key bilang SECRET (hindi sa code)
```
firebase functions:secrets:set OPENAI_API_KEY
# o kung Gemini:
firebase functions:secrets:set GEMINI_API_KEY
```
I-paste ang key mo pag tinanong. Naka-encrypt ito sa Google Secret Manager.

### 3) Halimbawang function (Gemini, libre ang tier)
`functions/index.js`:
```js
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

exports.askVici = onRequest(
  { region: "asia-southeast1", secrets: [GEMINI_API_KEY], cors: true },
  async (req, res) => {
    const { query, recommendations = [] } = req.body || {};
    const placesText = recommendations
      .map((p, i) => `${i + 1}. ${p.name} (${p.category}) - ${p.distance || "?"}, rating ${p.rating || "none"}, ${p.status || ""}`)
      .join("\n");

    const prompt = `You are Vici AI, a friendly food finder for Lipa City in the Vicinify app.
User asked: "${query}"
Here are the real nearby places from our database:
${placesText || "(none)"}
Answer in short, friendly Taglish. Recommend only from the list above. Mention distance and rating when helpful.`;

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY.value()}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    const data = await r.json();
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    res.json({ answer });
  }
);
```
(Kung OpenAI: palitan ang fetch ng `https://api.openai.com/v1/chat/completions`,
header `Authorization: Bearer ${OPENAI_API_KEY.value()}`, body ay messages array,
at ang sagot ay `data.choices[0].message.content`.)

### 4) Deploy
```
firebase deploy --only functions
```
May ibibigay na URL, halimbawa:
`https://askvici-<hash>-as.a.run.app` o
`https://asia-southeast1-vicinify-c9828.cloudfunctions.net/askVici`

### 5) Ikabit sa app (URL lang, walang key)
Sa `js/map.js`, hanapin ang `VICI AI CONFIG` at ilagay:
```js
window.VICINIFY_AI_ENDPOINT = "https://asia-southeast1-vicinify-c9828.cloudfunctions.net/askVici";
```
Tapos ang status chip sa AI panel ay magiging **Live** pag may nasagot ang endpoint.
Pag walang endpoint o bumagsak ang API, automatic na babalik sa **Local** finder ng app —
hindi mag-crash ang AI panel.

## Gusto mo ng mabilisang test lang (hindi pang-public)?
Pansamantala, pwede kang gumawa ng sariling maliit na proxy (Cloudflare Worker / Vercel function)
na ganito rin ang trabaho. Pareho ang prinsipyo: **key sa server, URL lang sa app.**
