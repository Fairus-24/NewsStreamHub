// Firestore-based comment actions
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function addComment({ articleId, user, content, parentId }: {
  articleId: string;
  user: { id: string; firstName?: string; lastName?: string; profileImageUrl?: string };
  content: string;
  parentId?: string;
}) {
  const commentsRef = collection(db, 'comments');
  await addDoc(commentsRef, {
    articleId: String(articleId),
    authorId: String(user.id),
    authorName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    authorImage: user.profileImageUrl || '',
    content,
    parentId: parentId ? String(parentId) : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    likes: [],
    dislikes: [],
    status: 'approved', // or 'pending' if moderation is needed
  });
}
