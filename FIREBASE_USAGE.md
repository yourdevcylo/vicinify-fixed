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

