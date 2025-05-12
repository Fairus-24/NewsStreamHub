import { useState } from 'react';
import { Link } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import MostReadItem from '@/components/articles/MostReadItem';
import { useQuery } from '@tanstack/react-query';

export default function Sidebar() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: mostReadArticles, isLoading: isLoadingMostRead } = useQuery({
    queryKey: ['/api/articles/most-read'],
  });
  
  const { data: popularTopics } = useQuery({
    queryKey: ['/api/topics/popular'],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
  };

  const defaultTopics = [
    '#ClimateAction',
    '#GlobalEconomy',
    '#HealthInnovation',
    '#TechTrends',
    '#ElectionUpdate',
    '#SportChampions'
  ];
  
  const topics = popularTopics || defaultTopics;

  return (
    <aside className="lg:w-1/3 space-y-8">
      {/* Search */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-border-gray">
        <h3 className="font-headline font-bold text-lg mb-4">Search Articles</h3>
        <form onSubmit={handleSearch} className="relative">
          <Input
            type="text"
            placeholder="Search for news..."
            className="w-full px-4 py-2 border border-border-gray rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button 
            type="submit" 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
          >
            <Search className="h-4 w-4 text-secondary hover:text-primary" />
          </Button>
        </form>
      </div>
      
      {/* Popular Topics */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-border-gray">
        <h3 className="font-headline font-bold text-lg mb-4">Popular Topics</h3>
        <div className="flex flex-wrap gap-2">
          {topics.map((topic, index) => (
            <Link key={index} href={`/search?q=${encodeURIComponent(topic.replace('#', ''))}`}>
              <a className="px-3 py-1 bg-light-gray rounded-full text-secondary text-sm hover:bg-primary hover:text-white transition-colors duration-300">
                {topic}
              </a>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Most Read */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-border-gray">
        <h3 className="font-headline font-bold text-lg mb-4">Most Read</h3>
        <div className="space-y-4">
          {isLoadingMostRead ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-start animate-pulse">
                <div className="text-2xl font-headline font-bold text-accent mr-4">{i + 1}</div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-full mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))
          ) : (
            mostReadArticles?.map((article, index) => (
              <MostReadItem
                key={article.id}
                rank={index + 1}
                title={article.title}
                date={article.createdAt}
                views={article.viewCount}
                articleId={article.id}
              />
            ))
          )}
        </div>
      </div>
      
      {/* Newsletter */}
      <div className="bg-primary bg-opacity-10 p-5 rounded-lg">
        <h3 className="font-headline font-bold text-lg text-primary mb-2">Subscribe to Our Newsletter</h3>
        <p className="text-secondary mb-4">Get the latest news delivered directly to your inbox.</p>
        <form>
          <Input
            type="email"
            placeholder="Your email address"
            className="w-full px-4 py-2 rounded-md border border-border-gray mb-3 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button type="submit" className="w-full">
            Subscribe Now
          </Button>
        </form>
      </div>
    </aside>
  );
}
