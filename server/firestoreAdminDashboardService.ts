// Firestore-based admin dashboard data aggregation and storage
import { adminDb } from './firebaseAdmin';

import { getFirestoreAdminMetrics } from './firestoreAdminService';

export async function saveAdminDashboardSnapshot() {
  // Aggregate metrics
  const metrics = await getFirestoreAdminMetrics();
  const snapshotRef = adminDb.collection('adminDashboardSnapshots').doc();
  await snapshotRef.set({
    ...metrics,
    createdAt: new Date(),
  });
  return metrics;
}

export async function getLatestAdminDashboardSnapshot() {
  const snap = await adminDb.collection('adminDashboardSnapshots')
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();
  if (snap.empty) return null;
  return snap.docs[0].data();
}
