import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import ArticleCard from '@/components/articles/ArticleCard';
import Sidebar from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';

function CategoryPage() {
  const { slug } = useParams();
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on new search
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch articles by category from backend API
  const fetchArticlesByCategory = async (slug: string, page: number, search: string) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    if (search) params.set('search', search);
    const res = await fetch(`/api/categories/${slug}/articles?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch articles');
    return res.json();
  };

  const { data, isLoading } = useQuery({
    queryKey: ['category', slug, page, debouncedSearch],
    queryFn: () => slug ? fetchArticlesByCategory(slug, page, debouncedSearch) : Promise.resolve({ category: null, articles: [], hasMore: false }),
    enabled: !!slug,
  });

  const category = data?.category;
  const articles = data?.articles || [];
  const hasMore = data?.hasMore || false;

  // Fix: fallback to slug param if category is missing name/slug
  let categoryName = '';
  if (category && typeof category === 'object') {
    categoryName = (category as any).name || (category as any).slug || '';
  }
  if (!categoryName && slug) {
    categoryName = slug.charAt(0).toUpperCase() + slug.slice(1);
  }

  if (!category && !isLoading) {
    // Don't call setLocation here! Instead, show a message or use useEffect for navigation.
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-border-gray text-center">
          <h2 className="font-headline text-xl font-bold mb-4">Category not found</h2>
          <p className="text-secondary mb-6">The category you are looking for does not exist.</p>
          <Button asChild>
            <a href="/">Return to Home</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row lg:space-x-8">
        <div className="lg:w-2/3">
          <h1 className="font-headline text-3xl font-bold mb-6">{categoryName}</h1>
          {/* Search input */}
          <div className="mb-6">
            <input
              type="text"
              className="w-full px-4 py-2 border border-border-gray rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Search articles in this category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
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
                  category={categoryName}
                  date={article.createdAt}
                  image={article.image}
                  likes={article.likes || 0}
                  comments={article.comments?.length || 0}
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
                    Load More Articles
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-sm border border-border-gray text-center">
              <h2 className="font-headline text-xl font-bold mb-4">No articles found</h2>
              <p className="text-secondary mb-6">There are no articles available in this category yet.</p>
              <Button asChild>
                <a href="/">Return to Home</a>
              </Button>
            </div>
          )}
        </div>
        <Sidebar />
      </div>
    </div>
  );
}

export default CategoryPage;
