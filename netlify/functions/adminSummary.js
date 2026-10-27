const { services, authenticate, reply } = require('./lib/admin');
exports.handler = async event => {
    if (event.httpMethod !== 'POST') return reply(405, { error: 'POST only' });
    try {
        const user = await authenticate(event);
        const { db } = services();
        const profile = await db.collection('users').doc(user.uid).get();
        if (profile.data()?.role !== 'admin' && user.uid !== 'Z45NZhQTgsTUX79WJ5ksCH8N3c02') return reply(403, { error: 'Admin only' });
        const [places, pending, owners] = await Promise.all([
            db.collection('places').count().get(),
            db.collection('places').where('approval_status', '==', 'pending').count().get(),
            db.collection('users').where('role', '==', 'business').count().get()
        ]);
        return reply(200, { totalPlaces: places.data().count, pendingApprovals: pending.data().count, totalBusinessOwners: owners.data().count });
    } catch (error) { return reply(error.status || 500, { error: error.status ? error.message : 'Summary unavailable.' }); }
};

