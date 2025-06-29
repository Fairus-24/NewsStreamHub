// Firestore-based article service for hybrid backend
import { adminDb } from './firebaseAdmin';

export async function getFirestoreArticleById(id: string) {
  const docRef = adminDb.collection('articles').doc(id);
  const docSnap = await docRef.get();
  if (!docSnap.exists) return undefined;
  return { id: docSnap.id, ...docSnap.data() };
}

export async function getFirestoreArticles({ limit = 10, page = 1 }: { limit?: number; page?: number } = {}) {
  const snapshot = await adminDb.collection('articles')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .offset((page - 1) * limit)
    .get();
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
}

export async function getFirestoreArticlesByCategory(categorySlug: string, { limit = 10, page = 1 }: { limit?: number; page?: number } = {}) {
  const snapshot = await adminDb.collection('articles')
    .where('categorySlug', '==', categorySlug)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .offset((page - 1) * limit)
    .get();
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
}
