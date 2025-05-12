import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import ArticleCard from '@/components/articles/ArticleCard';
import Sidebar from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon } from 'lucide-react';

export default function Search() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  
  // Extract search query from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    if (query) {
      setSearchQuery(query);
    }
  }, [location]);
  
  const { data, isLoading } = useQuery({
    queryKey: ['/api/articles/search', searchQuery, page],
    enabled: !!searchQuery,
  });
  
  const articles = data?.articles || [];
  const hasMore = data?.hasMore || false;
  const totalResults = data?.total || 0;
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update URL with search query
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set('q', searchQuery);
    }
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    
    // Reset page to 1 for new searches
    setPage(1);
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row lg:space-x-8">
        <div className="lg:w-2/3">
          <h1 className="font-headline text-3xl font-bold mb-6">Search Results</h1>
          
          <form onSubmit={handleSearch} className="flex mb-6">
            <Input
              type="search"
              placeholder="Search for news..."
              className="flex-1 rounded-r-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" className="rounded-l-none">
              <SearchIcon className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
          
          {searchQuery && (
            <p className="text-secondary mb-6">
              {isLoading ? (
                "Searching..."
              ) : (
                `Found ${totalResults} result${totalResults !== 1 ? 's' : ''} for "${searchQuery}"`
              )}
            </p>
          )}
          
          {isLoading ? (
            <div className="space-y-6">
              {Array(5).fill(0).map((_, index) => (
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
          ) : articles.length > 0 ? (
            <div className="space-y-6">
              {articles.map((article: any) => (
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
                  isBookmarked={article.isBookmarked}
                  isLiked={article.isLiked}
                  variant="full"
                />
              ))}
              
              {hasMore && (
                <div className="flex justify-center">
                  <Button 
                    variant="loadMore"
                    onClick={() => setPage(prev => prev + 1)}
                  >
                    Load More Results
                  </Button>
                </div>
              )}
            </div>
          ) : searchQuery ? (
            <div className="bg-white p-8 rounded-lg shadow-sm border border-border-gray text-center">
              <h2 className="font-headline text-xl font-bold mb-4">No results found</h2>
              <p className="text-secondary mb-6">We couldn't find any articles matching your search query. Try different keywords or browse our categories.</p>
              <Button asChild>
                <a href="/">Return to Home</a>
              </Button>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-sm border border-border-gray text-center">
              <h2 className="font-headline text-xl font-bold mb-4">Start searching</h2>
              <p className="text-secondary mb-6">Enter a search term above to find articles, topics, or authors.</p>
            </div>
          )}
        </div>
        
        <Sidebar />
      </div>
    </div>
  );
}
