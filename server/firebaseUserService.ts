// Firestore-based user profile service for hybrid backend
import { adminDb } from './firebaseAdmin';

export async function getFirestoreUserProfile(userId: string) {
  const docRef = adminDb.collection('users').doc(userId);
  const docSnap = await docRef.get();
  if (!docSnap.exists) return undefined;
  return { id: docSnap.id, ...docSnap.data() };
}

export async function updateFirestoreUserProfile(userId: string, data: any) {
  const docRef = adminDb.collection('users').doc(userId);
  await docRef.set(data, { merge: true });
  const updatedSnap = await docRef.get();
  return { id: updatedSnap.id, ...updatedSnap.data() };
}
