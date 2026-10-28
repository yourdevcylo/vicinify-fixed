const { catalog } = require('./lib/catalog');
const { reply } = require('./lib/admin');
exports.handler = async event => {
    if (event.httpMethod !== 'GET') return reply(405, { error: 'GET only' });
    try {
        return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', 'Netlify-CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=60', 'X-Content-Type-Options': 'nosniff' }, body: JSON.stringify(await catalog()) };
    } catch (error) { return reply(503, { error: 'Catalog is unavailable. Check server configuration.' }); }
};
