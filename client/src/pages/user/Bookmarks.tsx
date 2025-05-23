import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import ArticleCard from '@/components/articles/ArticleCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useEffect } from 'react';

export default function BookmarksPage() {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBookmarks, setFilteredBookmarks] = useState<any[]>([]);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!isLoadingAuth && !user) {
      window.location.href = '/api/login';
    }
  }, [user, isLoadingAuth]);
  
  const { data: bookmarks, isLoading } = useQuery({
    queryKey: ['/api/user/bookmarks'],
    enabled: !!user,
  });
  
  // Filter bookmarks when search query changes
  useEffect(() => {
    if (bookmarks) {
      if (!searchQuery) {
        setFilteredBookmarks(bookmarks);
      } else {
        const lowercaseQuery = searchQuery.toLowerCase();
        setFilteredBookmarks(
          bookmarks.filter((bookmark: any) => 
            bookmark.title.toLowerCase().includes(lowercaseQuery) ||
            bookmark.excerpt.toLowerCase().includes(lowercaseQuery) ||
            bookmark.category.name.toLowerCase().includes(lowercaseQuery)
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
            {filteredBookmarks.map((article: any) => (
              <ArticleCard
                key={article.id}
                id={article.id}
                title={article.title}
                excerpt={article.excerpt}
                category={article.category.name}
                date={article.createdAt}
                image={article.image}
                likes={article.likes}
                comments={article.comments.length}
                isBookmarked={true}
                isLiked={article.isLiked}
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
