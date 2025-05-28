// Firestore-based article actions for like/bookmark
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc } from 'firebase/firestore';

// Like or unlike an article for a user
export async function toggleArticleLike(articleId: string, userId: string, liked: boolean) {
  const articleRef = doc(db, 'articles', String(articleId));
  const articleSnap = await getDoc(articleRef);
  if (!articleSnap.exists()) {
    // Optionally create the article doc if not exists
    await setDoc(articleRef, { likes: [] }, { merge: true });
  }
  await updateDoc(articleRef, {
    likes: liked ? arrayUnion(userId) : arrayRemove(userId)
  });
}

// Bookmark or unbookmark an article for a user
export async function toggleArticleBookmark(articleId: string, userId: string, bookmarked: boolean) {
  const userRef = doc(db, 'users', String(userId));
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    throw new Error('User not found');
  }
  await updateDoc(userRef, {
    bookmarks: bookmarked ? arrayUnion(String(articleId)) : arrayRemove(String(articleId))
  });
}
