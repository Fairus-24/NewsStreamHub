// Firestore-based user stats aggregation for backend (admin SDK)
import { adminDb } from './firebaseAdmin';

export async function getFirestoreUserStats(userId: string) {
  // Count comments
  const commentsSnap = await adminDb.collection('comments').where('authorId', '==', userId).get();
  const commentsCount = commentsSnap.size;

  // Count likes (articles liked by user)
  // We assume each article doc has a 'likes' array of userIds
  const articlesSnap = await adminDb.collection('articles').get();
  let likesCount = 0;
  articlesSnap.forEach((doc: FirebaseFirestore.DocumentData) => {
    const data = doc.data();
    if (Array.isArray(data.likes) && data.likes.includes(userId)) {
      likesCount++;
    }
  });

  // Count bookmarks (from user doc)
  const userSnap = await adminDb.collection('users').doc(userId).get();
  let bookmarksCount = 0;
  let bookmarkIds: string[] = [];
  if (userSnap.exists) {
    const userData = userSnap.data();
    bookmarkIds = Array.isArray(userData.bookmarks) ? userData.bookmarks : [];
    bookmarksCount = bookmarkIds.length;
  }

  // Articles read (optional, if tracked)
  // For now, set to 0
  const articlesRead = 0;

  // Recent comments (last 5)
  const recentCommentsSnap = await adminDb.collection('comments')
    .where('authorId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(5)
    .get();
  const recentComments = await Promise.all(recentCommentsSnap.docs.map(async (docSnap: FirebaseFirestore.DocumentData) => {
    const data = docSnap.data();
    let articleTitle = '';
    if (data.articleId) {
      const articleSnap = await adminDb.collection('articles').doc(data.articleId).get();
      articleTitle = articleSnap.exists ? articleSnap.data().title : '';
    }
    return {
      id: docSnap.id,
      content: data.content,
      articleId: data.articleId,
      articleTitle,
      createdAt: data.createdAt instanceof Date ? data.createdAt.toISOString() : (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()),
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
