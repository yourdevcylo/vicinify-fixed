// cleanup-test-data.js
// Deletes ALL documents in the `bookings` and `messages` collections
// of your Vicinify Firestore project. IRREVERSIBLE - test data only.
//
// Setup:
//   1. npm install firebase-admin
//   2. Firebase Console > Project settings > Service accounts >
//      "Generate new private key" -> save as serviceAccountKey.json
//      in the SAME folder as this script.
//   3. node cleanup-test-data.js
//
// If you hit the daily delete quota, just run it again tomorrow -
// it resumes where it left off.

const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(require('./serviceAccountKey.json')),
});
const db = admin.firestore();

async function deleteCollection(name) {
  const snap = await db.collection(name).limit(400).get();
  if (snap.empty) {
    console.log(`${name}: already empty`);
    return 0;
  }
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  console.log(`${name}: deleted ${snap.size} docs...`);
  return snap.size + (await deleteCollection(name));
}

(async () => {
  try {
    let total = 0;
    total += await deleteCollection('bookings');
    total += await deleteCollection('messages');
    console.log(`Done. Total documents deleted: ${total}`);
    process.exit(0);
  } catch (e) {
    console.error('Stopped with error:', e.message);
    console.error('Just run the script again to resume.');
    process.exit(1);
  }
})();
