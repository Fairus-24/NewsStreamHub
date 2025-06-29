import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import ArticleCard from '@/components/articles/ArticleCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function BookmarksPage() {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoadingAuth && !user) {
      window.location.href = '/login';
    }
  }, [user, isLoadingAuth]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch bookmarks from Firestore (by user)
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBookmarks() {
      if (!user) return;
      setIsLoading(true);
      const userDoc = await getDoc(doc(db, 'users', user.id));
      const userData = userDoc.exists() ? userDoc.data() : {};
      const bookmarkIds = (userData.bookmarks || []).map((id: any) => String(id));
      if (bookmarkIds.length === 0) {
        setBookmarks([]);
        setIsLoading(false);
        return;
      }
      const articlesRef = collection(db, 'articles');
      // Batch Firestore 'in' queries (max 10 per batch)
      const batches = [];
      for (let i = 0; i < bookmarkIds.length; i += 10) {
        const batchIds = bookmarkIds.slice(i, i + 10);
        const q = query(articlesRef, where('__name__', 'in', batchIds));
        batches.push(getDocs(q));
      }
      const snapshots = await Promise.all(batches);
      let articles = snapshots.flatMap(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch author and category for each article
      articles = await Promise.all(articles.map(async (a: any) => {
        let author = null;
        let category = null;
        if (a.authorId) {
          const authorSnap = await getDoc(doc(db, 'users', a.authorId));
          if (authorSnap.exists()) {
            author = { id: authorSnap.id, ...authorSnap.data() };
          }
        }
        if (a.categoryId) {
          const catSnap = await getDoc(doc(db, 'categories', a.categoryId));
          if (catSnap.exists()) {
            category = { id: catSnap.id, ...catSnap.data() };
          }
        }
        return { ...a, author, category };
      }));

      // Optional: filter by search
      if (debouncedSearch) {
        const lower = debouncedSearch.toLowerCase();
        articles = articles.filter((a: any) =>
          a.title?.toLowerCase().includes(lower) ||
          a.excerpt?.toLowerCase().includes(lower) ||
          a.author?.firstName?.toLowerCase().includes(lower) ||
          a.category?.name?.toLowerCase().includes(lower)
        );
      }
      setBookmarks(articles);
      setIsLoading(false);
    }
    fetchBookmarks();
  }, [user, debouncedSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already handled by the useEffect above
  };

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-headline text-3xl font-bold mb-6">Your Bookmarks</h1>

        <div className="mb-8">
          <Input
            type="text"
            placeholder="Search your bookmarks..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {Array(3).fill(0).map((_, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-border-gray animate-pulse">
                <div className="md:flex">
                  <div className="md:w-1/4 mb-4 md:mb-0 md:mr-6">
                    <div className="h-40 bg-gray-200 rounded-md"></div>
                  </div>
                  <div className="md:w-3/4">
                    <div className="h-4 bg-gray-200 w-1/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 w-3/4 mb-4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : bookmarks && bookmarks.length > 0 ? (
          <div className="space-y-6">
            {bookmarks.map((article: any) => {
              // Convert Firestore Timestamp to string if needed
              let dateStr = '';
              if (article.createdAt) {
                if (typeof article.createdAt === 'string') {
                  dateStr = article.createdAt;
                } else if (article.createdAt.toDate) {
                  dateStr = article.createdAt.toDate().toISOString();
                } else {
                  dateStr = String(article.createdAt);
                }
              }
              return (
                <ArticleCard
                  key={article.id}
                  id={article.id}
                  title={article.title || ''}
                  excerpt={article.excerpt || ''}
                  category={article.category?.name || 'Uncategorized'}
                  date={dateStr}
                  image={article.image || ''}
                  likes={Array.isArray(article.likes) ? article.likes.length : (typeof article.likes === 'number' ? article.likes : 0)}
                  comments={Array.isArray(article.comments) ? article.comments.length : 0}
                  isBookmarked={true}
                  isLiked={Array.isArray(article.likes) && user ? article.likes.includes(user.id) : false}
                  variant="full"
                />
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-border-gray text-center">
            {searchQuery ? (
              <>
                <h2 className="font-headline text-xl font-bold mb-4">No matching bookmarks</h2>
                <p className="text-secondary mb-6">We couldn't find any bookmarks matching your search. Try different keywords or clear your search.</p>
              </>
            ) : (
              <>
                <h2 className="font-headline text-xl font-bold mb-4">No bookmarks yet</h2>
                <p className="text-secondary mb-6">You haven't bookmarked any articles yet. Browse our articles and click the bookmark icon to save them for later.</p>
              </>
            )}
            <Button onClick={() => window.location.href = "/"}>
              Browse Articles
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}