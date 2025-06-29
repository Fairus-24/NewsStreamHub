// Firebase Admin SDK setup for hybrid backend (Node.js)
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// You should place your service account key JSON in a safe location and never commit it to git!
// Example: process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || './serviceAccountKey.json';

if (!getApps().length) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const serviceAccount = require(serviceAccountPath);
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export const adminDb = getFirestore();
