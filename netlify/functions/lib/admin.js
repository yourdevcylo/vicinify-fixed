const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

function services() {
    if (!getApps().length) {
        if (!process.env.FIREBASE_SERVICE_ACCOUNT) throw Object.assign(new Error('Server credentials are not configured.'), { status: 503 });
        const account = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        initializeApp({ credential: cert(account), storageBucket: process.env.FIREBASE_STORAGE_BUCKET });
    }
    return { db: getFirestore(), auth: getAuth(), storage: getStorage(), FieldValue };
}

async function authenticate(event) {
    const authorization = event.headers?.authorization || event.headers?.Authorization || '';
    if (!authorization.startsWith('Bearer ')) throw Object.assign(new Error('Sign in to continue.'), { status: 401 });
    try {
        const user = await services().auth.verifyIdToken(authorization.slice(7), true);
        if (!user.email_verified) throw Object.assign(new Error('Verify your email first.'), { status: 403 });
        return user;
    } catch (error) {
        if (error.status) throw error;
        throw Object.assign(new Error('Your session expired. Sign in again.'), { status: 401 });
    }
}

function identifier(value) {
    if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,180}$/.test(value)) throw Object.assign(new Error('Invalid record identifier.'), { status: 400 });
    return value;
}

async function limit(userId, scope, maximum, intervalMs = 60000) {
    const { db } = services();
    const ref = db.collection('_rate_limits').doc(`${scope}_${userId}`);
    const now = Date.now();
    await db.runTransaction(async transaction => {
        const snapshot = await transaction.get(ref);
        const old = snapshot.data() || {};
        const count = now - (old.startedAt || 0) < intervalMs ? (old.count || 0) + 1 : 1;
        if (count > maximum) throw Object.assign(new Error('Please wait before trying again.'), { status: 429 });
        transaction.set(ref, { startedAt: count === 1 ? now : old.startedAt, count });
    });
}

function reply(statusCode, body) {
    return { statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }, body: JSON.stringify(body) };
}

module.exports = { services, authenticate, identifier, limit, reply };

