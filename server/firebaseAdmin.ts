// Firebase Admin SDK setup for hybrid backend (Node.js)
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || './serviceAccountKey.json';

let adminDb: ReturnType<typeof getFirestore>;

async function initFirebaseAdmin() {
  if (!getApps().length) {
    const serviceAccount = (await import(serviceAccountPath)).default || (await import(serviceAccountPath));
    initializeApp({
      credential: cert(serviceAccount),
    });
  }
  adminDb = getFirestore();
}

await initFirebaseAdmin();

export { adminDb };
