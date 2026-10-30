# Vicinify — Chat auto-reply View Menu integration

- Menu questions using the preset quick question or brief English/Filipino phrases (for example, “May menu po ba?”) can trigger an opted-in business auto-reply.
- The auto-reply now includes a **View Menu** button, which opens the existing Firestore-backed menu dialog directly above the active chat without clearing the chat or typed text.
- Users can browse prices, categories and item details. Ordering remains available only when enabled by that establishment.
- No new Firestore rules are needed; the existing `quickQuestion: menu` value is unchanged.
- Deploy the **full Netlify site and functions**, including `netlify/functions/autoReply.js`, to support natural-language menu questions.
- Automatic replies still require the owner to enable the auto-reply setting in Business Hub.
- This behavior is tested locally but not yet verified on the live deployment.
