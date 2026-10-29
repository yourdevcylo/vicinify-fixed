// Broad anonymous/IP protection, in addition to stricter per-account command limits.
// A generous ceiling reduces accidental blocks for users sharing a Wi-Fi/NAT address.
export default async (_request, context) => context.next();
export const config = {
    path: '/.netlify/functions/*',
    rateLimit: {
        windowLimit: 600,
        windowSize: 60,
        aggregateBy: ['domain', 'ip'],
        action: 'rewrite',
        to: '/__rate-limited'
    }
};
