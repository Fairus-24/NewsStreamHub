import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import ArticleCard from '@/components/articles/ArticleCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function BookmarksPage() {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBookmarks, setFilteredBookmarks] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoadingAuth && !user) {
      window.location.href = '/login';
    }
  }, [user, isLoadingAuth]);

  // Fetch bookmarks from Firestore
  useEffect(() => {
    async function fetchBookmarks() {
      if (!user) return;
      setIsLoading(true);
      // Fetch articles where articleId in user.bookmarks
      const userDoc = await (await import('firebase/firestore')).getDoc((await import('firebase/firestore')).doc(db, 'users', user.id));
      const userData = userDoc.exists() ? userDoc.data() : {};
      let bookmarkIds = userData.bookmarks || [];
      // Pastikan semua ID string
      bookmarkIds = bookmarkIds.map((id: any) => String(id));
      if (bookmarkIds.length === 0) {
        setBookmarks([]);
        setFilteredBookmarks([]);
        setIsLoading(false);
        return;
      }
      // Firestore hanya mengizinkan max 10 ID per query
      let articles: any[] = [];
      for (let i = 0; i < bookmarkIds.length; i += 10) {
        const batchIds = bookmarkIds.slice(i, i + 10);
        const articlesRef = collection(db, 'articles');
        const q = query(articlesRef, where('__name__', 'in', batchIds));
        const snapshot = await getDocs(q);
        articles = articles.concat(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
      setBookmarks(articles);
      setFilteredBookmarks(articles);
      setIsLoading(false);
    }
    fetchBookmarks();
  }, [user]);

  // Filter bookmarks when search query changes
  useEffect(() => {
    if (bookmarks) {
      if (!searchQuery) {
        setFilteredBookmarks(bookmarks);
      } else {
        const lowercaseQuery = searchQuery.toLowerCase();
        setFilteredBookmarks(
          bookmarks.filter((bookmark: any) => 
            bookmark.title?.toLowerCase().includes(lowercaseQuery) ||
            bookmark.excerpt?.toLowerCase().includes(lowercaseQuery) ||
            bookmark.category?.name?.toLowerCase().includes(lowercaseQuery)
          )
        );
      }
    }
  }, [searchQuery, bookmarks]);

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

        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Search your bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </form>

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
        ) : filteredBookmarks && filteredBookmarks.length > 0 ? (
          <div className="space-y-6">
            {filteredBookmarks.map((bookmark: any) => (
              <ArticleCard
                key={bookmark.id}
                id={bookmark.id}
                title={bookmark.title}
                excerpt={bookmark.excerpt}
                category={bookmark.category?.name || 'Uncategorized'}
                date={bookmark.createdAt}
                image={bookmark.image}
                likes={bookmark.likes}
                comments={bookmark.comments.length}
                isBookmarked={true}
                isLiked={bookmark.isLiked}
                variant="full"
              />
            ))}
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
            <Button asChild>
              <a href="/">Browse Articles</a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}