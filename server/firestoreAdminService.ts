// Firestore-based admin metrics aggregation & articles listing
import { adminDb } from './firebaseAdmin';

export async function getFirestoreAdminMetrics() {
  // Article count and growth
  const articlesSnap = await adminDb.collection('articles').get();
  const articleCount = articlesSnap.size;

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const newArticlesSnap = await adminDb.collection('articles')
    .where('createdAt', '>=', oneMonthAgo)
    .get();
  const newArticleCount = newArticlesSnap.size;

  // Comment count and growth
  const commentsSnap = await adminDb.collection('comments').get();
  const commentCount = commentsSnap.size;
  const newCommentsSnap = await adminDb.collection('comments')
    .where('createdAt', '>=', oneMonthAgo)
    .get();
  const newCommentCount = newCommentsSnap.size;

  // User count and growth
  const usersSnap = await adminDb.collection('users').get();
  const userCount = usersSnap.size;
  const newUsersSnap = await adminDb.collection('users')
    .where('createdAt', '>=', oneMonthAgo)
    .get();
  const newUserCount = newUsersSnap.size;

  // Page views (optional, if tracked in Firestore)
  // For now, set to 0
  const viewCount = 0;
  const newViewCount = 0;

  // Growth percentages
  const percent = (curr: number, prev: number) => prev === 0 ? 100 : Math.round(((curr - prev) / prev) * 100);

  return {
    articleCount,
    newArticleCount,
    articleGrowth: percent(newArticleCount, articleCount - newArticleCount),
    commentCount,
    newCommentCount,
    commentGrowth: percent(newCommentCount, commentCount - newCommentCount),
    userCount,
    newUserCount,
    userGrowth: percent(newUserCount, userCount - newUserCount),
    viewCount,
    newViewCount,
    viewGrowth: 0,
  };
}

export async function getFirestoreAdminArticles(page = 1, search = '', category = 'all') {
  const PAGE_SIZE = 20;
  let query = adminDb.collection('articles');

  if (search) {
    // Firestore doesn't support OR, so only search title for now
    query = query.where('title', '>=', search).where('title', '<=', search + '\uf8ff');
  }
  if (category && category !== 'all') {
    query = query.where('categoryId', '==', category);
  }
  query = query.orderBy('createdAt', 'desc');

  // Pagination
  const offset = (page - 1) * PAGE_SIZE;
  const snap = await query.limit(PAGE_SIZE + offset).get();
  const docs = snap.docs.slice(offset, offset + PAGE_SIZE);

  const articles = await Promise.all(docs.map(async (doc: FirebaseFirestore.QueryDocumentSnapshot) => {
    const data = doc.data();
    // Get category and author if needed (optional, can be expanded)
    let categoryData = null;
    if (data.categoryId) {
      const catSnap = await adminDb.collection('categories').doc(data.categoryId).get();
      categoryData = catSnap.exists ? catSnap.data() : null;
    }
    let authorData = null;
    if (data.authorId) {
      const authorSnap = await adminDb.collection('users').doc(data.authorId).get();
      authorData = authorSnap.exists ? authorSnap.data() : null;
    }
    return {
      id: doc.id,
      ...data,
      category: categoryData,
      author: authorData,
    };
  }));

  // Total count for pagination
  const totalSnap = await adminDb.collection('articles').get();
  const totalPages = Math.ceil(totalSnap.size / PAGE_SIZE);

  return { articles, totalPages };
}
