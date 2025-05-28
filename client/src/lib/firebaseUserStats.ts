// Firestore-based user stats aggregation
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';

export async function getUserStats(userId: string) {
  // Count comments
  const commentsQuery = query(collection(db, 'comments'), where('authorId', '==', userId));
  const commentsSnap = await getDocs(commentsQuery);
  const commentsCount = commentsSnap.size;

  // Count likes (articles liked by user)
  // We assume each article doc has a 'likes' array of userIds
  const articlesQuery = query(collection(db, 'articles'));
  const articlesSnap = await getDocs(articlesQuery);
  let likesCount = 0;
  articlesSnap.forEach(doc => {
    const data = doc.data();
    if (Array.isArray(data.likes) && data.likes.includes(userId)) {
      likesCount++;
    }
  });

  // Count bookmarks (from user doc)
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  let bookmarksCount = 0;
  let bookmarkIds: string[] = [];
  if (userSnap.exists()) {
    const userData = userSnap.data();
    bookmarkIds = Array.isArray(userData.bookmarks) ? userData.bookmarks : [];
    bookmarksCount = bookmarkIds.length;
  }

  // Articles read (optional, if tracked)
  // For now, set to 0
  const articlesRead = 0;

  // Recent comments (last 5)
  const recentCommentsQuery = query(
    collection(db, 'comments'),
    where('authorId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(5)
  );
  const recentCommentsSnap = await getDocs(recentCommentsQuery);
  const recentComments = await Promise.all(recentCommentsSnap.docs.map(async (docSnap) => {
    const data = docSnap.data();
    let articleTitle = '';
    if (data.articleId) {
      const articleSnap = await getDoc(doc(db, 'articles', data.articleId));
      articleTitle = articleSnap.exists() ? articleSnap.data().title : '';
    }
    return {
      id: docSnap.id,
      content: data.content,
      articleId: data.articleId,
      articleTitle,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()),
    };
  }));

  return {
    comments: commentsCount,
    likes: likesCount,
    bookmarks: bookmarksCount,
    articlesRead,
    recentComments,
  };
}
