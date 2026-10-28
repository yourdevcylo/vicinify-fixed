# Why Firebase usage can rise

These are code-based causes, not a diagnosis of the actual bill. No billing export or production metrics were available.

1. Multiple live query windows watch overlapping bookings and messages. Different query limits/orderings can create separate targets. Identical SDK queries may share an underlying target, so callback count is not equivalent to billable reads.
2. A document update can notify every subscribed client. Delivery, seen and read markers add writes and can cause subsequent reads. The existing guards prevented a demonstrated infinite loop; no infinite-loop billing claim is made.
3. Payment proof base64 was duplicated in bookings and chat cards. This increases document size, transfer and storage, not the number of document reads by itself. New uploads use private Storage paths.
4. The old map freshness probe could repeatedly invalidate an approved-only result when a newer excluded listing existed. The repair replaces this with a cached approved catalog.
5. Repeated page entry, reconnects, joins and whole-query reloads can produce extra reads. The customer listener is now shared and the catalog has explicit caching.
6. Small arbitrary limits do not solve data-model problems: sorting after a limit can hide recent records. Ordered windows improve correctness, while full pagination/conversation summaries remain outstanding.

## Costs introduced or retained

Server verification and authorization still read data. Durable per-user AI/proof limits use Firestore transactions. The first review for a legacy place without ratingSum reads its existing reviews to initialize the sum. Catalog cache misses can read up to 2,001 approved documents per warm function instance/cache cycle. Private proof viewing consumes Storage/function transfer. These are tradeoffs, not zero-cost operations.

## Measure the result

Compare equal traffic periods before and after staging/rollout: Firestore reads/writes, Storage bytes/downloads, function invocations/duration and AI requests. Segment by page/session, number of active listeners and status actions. Avoid counting developer console reads as user traffic. Use provider budget alerts and API quotas; alerts alone are not a hard spending cap.

Firebase's billing documentation explains listener updates and reconnect behavior:
https://firebase.google.com/docs/firestore/pricing

No percentage reduction or guaranteed bill amount is asserted.


## 28 October update — read-specific changes

- The approved public discovery catalog now has a **five-minute session cache** across reloads. Only an explicit public-field allowlist is stored; ownership email and private chats/transactions are not persisted there. Expired/corrupt entries are ignored, and explicit invalidation clears the entry. This is a freshness/read-cost tradeoff, not a permanent cache.
- My Activity starts the Favorites query only when Favorites is first opened, rather than on every hub entry. It remains live during that hub session and stops on leaving it.
- The Suki wallet and notifier use one shared bounded subscription through ViciData, and cached public places are reused for card design/name joins. Identical native SDK queries may already share an underlying target; no separate billing saving is asserted solely from merging callback code.
- Opening Chat History no longer writes read markers to every message in the list. A selected thread is marked when opened. This avoids unnecessary writes and their listener-update reads for untouched conversations.
- The existing bounded customer feeds, in-flight request deduplication, receipt-write guards and listener cleanup remain in place. Activity row cleanup does not add a query per conversation.

Read counts already charged will not be undone by this release. Firestore usage is cumulative over its displayed period. If a daily quota is exhausted, code changes do not reset it. Check the Firebase Console period, quota/error status and current read rate before assuming a new deployment failed.

The new anti-spam gates add document access checks and, for messages, an explicit transaction read plus a gate write. Server authentication, payment review and booking validation also read trusted records. Those are deliberate security costs. Avoid deleting these checks solely to lower the dashboard count.

Measure equal traffic windows before/after: total reads, number of fresh sessions, catalog size, active chat users, listener reconnects and console browsing. A cold catalog query can still read up to 2,001 approved places. Larger deployments should move discovery to indexed geographic/paginated queries and maintain server-written conversation summaries; these larger data-model changes are not implemented here. Budget alerts notify; they do not enforce a hard spending cap.


## Customer quick questions and business replies
Customer quick questions send immediately while preserving any typed draft. Business owners enable Automatic replies in Manage listing and may customize menu, hours, delivery and booking answers. Replies use saved business data; they never confirm bookings or payments. Deploy the matching frontend, Netlify functions and Firestore rules together. Each enabled reply adds bounded server reads and one reply write; duplicate calls reuse the same reply. Owner self-chat prompts are blocked; select an actual customer from Business Hub Messages. Rules emulator validation remains required before publishing rules.
