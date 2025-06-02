// Firestore-based category article fetch
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

export async function getArticlesByCategorySlug(slug: string, page: number = 1, pageSize: number = 10) {
  // Fetch category by slug
  const categoriesRef = collection(db, 'categories');
  const qCat = query(categoriesRef, where('slug', '==', slug));
  const catSnap = await getDocs(qCat);
  console.log('[DEBUG] Firestore categories query result:', catSnap.docs.map(d => d.data()));
  if (catSnap.empty) return { category: null, articles: [], hasMore: false };
  const category = { id: catSnap.docs[0].id, ...catSnap.docs[0].data() };

  // Fetch articles by categoryId
  const articlesRef = collection(db, 'articles');
  const qArt = query(
    articlesRef,
    where('categoryId', '==', category.id),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );
  const artSnap = await getDocs(qArt);
  const articles = artSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const hasMore = artSnap.size === pageSize;
  return { category, articles, hasMore };
}
