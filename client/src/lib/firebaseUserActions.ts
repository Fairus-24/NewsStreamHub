// Firestore-based user profile and preferences actions
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export async function updateUserProfile(userId: string, data: any) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, data);
}

export async function updateUserPreferences(userId: string, preferences: any) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { preferences });
}
