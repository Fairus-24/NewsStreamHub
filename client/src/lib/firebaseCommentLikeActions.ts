// Firestore-based comment like/dislike actions
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';

export async function toggleCommentLike(commentId: string, userId: string, liked: boolean) {
  const commentRef = doc(db, 'comments', String(commentId));
  const commentSnap = await getDoc(commentRef);
  if (!commentSnap.exists()) throw new Error('Comment not found');
  await updateDoc(commentRef, {
    likes: liked ? arrayUnion(String(userId)) : arrayRemove(String(userId)),
    dislikes: liked ? arrayRemove(String(userId)) : arrayUnion(), // Remove dislike if liking
  });
}

export async function toggleCommentDislike(commentId: string, userId: string, disliked: boolean) {
  const commentRef = doc(db, 'comments', String(commentId));
  const commentSnap = await getDoc(commentRef);
  if (!commentSnap.exists()) throw new Error('Comment not found');
  await updateDoc(commentRef, {
    dislikes: disliked ? arrayUnion(String(userId)) : arrayRemove(String(userId)),
    likes: disliked ? arrayRemove(String(userId)) : arrayUnion(), // Remove like if disliking
  });
}
