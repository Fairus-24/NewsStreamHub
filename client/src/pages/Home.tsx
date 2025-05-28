import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/layout/Sidebar';
import FeaturedArticle from '@/components/articles/FeaturedArticle';
import ArticleCard from '@/components/articles/ArticleCard';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function Home() {
  const [trendingPage, setTrendingPage] = useState(1);
  const [latestPage, setLatestPage] = useState(1);
  
  const { data: featuredArticle, isLoading: isLoadingFeatured } = useQuery({
    queryKey: ['/api/articles/featured'],
  });
  
  const { data: trendingArticles, isLoading: isLoadingTrending } = useQuery({
    queryKey: ['/api/articles/trending', trendingPage],
  });
  
  const { data: latestArticles, isLoading: isLoadingLatest } = useQuery({
    queryKey: ['/api/articles/latest', latestPage],
  });
  
  const hasMoreTrending = trendingArticles?.hasMore || false;
  const hasMoreLatest = latestArticles?.hasMore || false;
  
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Featured Article */}
      {isLoadingFeatured ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8 animate-pulse">
          <div className="md:flex">
            <div className="md:w-2/3">
              <div className="h-96 bg-gray-200"></div>
            </div>
            <div className="md:w-1/3 p-6">
              <div className="h-4 bg-gray-200 w-1/3 mb-4"></div>
              <div className="h-8 bg-gray-200 w-full mb-4"></div>
              <div className="h-4 bg-gray-200 w-full mb-2"></div>
              <div className="h-4 bg-gray-200 w-full mb-2"></div>
              <div className="h-4 bg-gray-200 w-2/3 mb-4"></div>
              <div className="flex items-center text-sm text-secondary mb-4">
                <div className="h-8 w-8 bg-gray-200 rounded-full mr-2"></div>
                <div className="h-4 bg-gray-200 w-32"></div>
              </div>
            </div>
          </div>
        </div>
      ) : featuredArticle ? (
        <FeaturedArticle
          id={featuredArticle.id}
          title={featuredArticle.title}
          excerpt={featuredArticle.excerpt}
          category={featuredArticle.category?.name || 'Uncategorized'}
          date={featuredArticle.createdAt}
          image={featuredArticle.image}
          author={featuredArticle.author}
          likes={featuredArticle.likes}
          comments={featuredArticle.comments?.length || 0}
          isBreaking={featuredArticle.isBreaking}
          isBookmarked={featuredArticle.isBookmarked}
          isLiked={featuredArticle.isLiked}
        />
      ) : null}

      <div className="flex flex-col lg:flex-row lg:space-x-8">
        {/* Main content area */}
        <div className="lg:w-2/3">
          {/* Trending Section */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline text-xl font-bold">Trending Today</h2>
              <a href="/category/trending" className="text-primary font-ui text-sm font-semibold hover:underline">View All</a>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isLoadingTrending ? (
                Array(4).fill(0).map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden border border-border-gray animate-pulse">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 w-1/4 mb-2"></div>
                      <div className="h-6 bg-gray-200 w-full mb-2"></div>
                      <div className="h-4 bg-gray-200 w-full mb-3"></div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-4 bg-gray-200 w-8"></div>
                          <div className="h-4 bg-gray-200 w-8"></div>
                        </div>
                        <div className="h-4 bg-gray-200 w-4"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : trendingArticles?.articles.map((article: any) => (
                <ArticleCard
                  key={article.id}
                  id={article.id}
                  title={article.title}
                  excerpt={article.excerpt}
                  category={article.category?.name || 'Uncategorized'}
                  date={article.createdAt}
                  image={article.image}
                  likes={article.likes}
                  comments={article.comments?.length || 0}
                  isBookmarked={article.isBookmarked}
                  isLiked={article.isLiked}
                />
              ))}
            </div>
            
            {hasMoreTrending && (
              <div className="flex justify-center mt-6">
                <Button 
                  variant="loadMore" 
                  onClick={() => setTrendingPage(prev => prev + 1)}
                >
                  Load More
                </Button>
              </div>
            )}
          </section>
          
          {/* Latest News Section */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline text-xl font-bold">Latest News</h2>
              <a href="/category/latest" className="text-primary font-ui text-sm font-semibold hover:underline">View All</a>
            </div>
            
            <div className="space-y-6">
              {isLoadingLatest ? (
                Array(3).fill(0).map((_, index) => (
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
                ))
              ) : latestArticles?.articles.map((article: any) => (
                <ArticleCard
                  key={article.id}
                  id={article.id}
                  title={article.title}
                  excerpt={article.excerpt}
                  category={article.category?.name || 'Uncategorized'}
                  date={article.createdAt}
                  image={article.image}
                  likes={article.likes}
                  comments={article.comments?.length || 0}
                  isBookmarked={article.isBookmarked}
                  isLiked={article.isLiked}
                  variant="full"
                />
              ))}
              
              {hasMoreLatest && (
                <div className="flex justify-center">
                  <Button 
                    variant="loadMore"
                    onClick={() => setLatestPage(prev => prev + 1)}
                  >
                    Load More Articles
                  </Button>
                </div>
              )}
            </div>
          </section>
        </div>
        
        {/* Sidebar */}
        <Sidebar />
      </div>
    </div>
  );
}
