import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Bookmark } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

interface ArticleCardProps {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  image: string;
  likes: number;
  comments: number;
  isBookmarked?: boolean;
  isLiked?: boolean;
  variant?: 'compact' | 'full';
}

export default function ArticleCard({
  id,
  title,
  excerpt,
  category,
  date,
  image,
  likes,
  comments,
  isBookmarked = false,
  isLiked = false,
  variant = 'compact'
}: ArticleCardProps) {
  const { isAuthenticated } = useAuth();
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likes);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const { toast } = useToast();

  const handleLike = async () => {
    if (!isAuthenticated) {
      window.location.href = '/api/login';
      return;
    }

    try {
      await apiRequest('POST', `/api/articles/${id}/like`, { liked: !liked });
      setLiked(!liked);
      setLikeCount(prev => liked ? prev - 1 : prev + 1);
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to like article",
        variant: "destructive",
      });
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      window.location.href = '/api/login';
      return;
    }

    try {
      await apiRequest('POST', `/api/articles/${id}/bookmark`, { bookmarked: !bookmarked });
      setBookmarked(!bookmarked);
      queryClient.invalidateQueries({ queryKey: ['/api/user/bookmarks'] });
      toast({
        title: bookmarked ? "Removed from bookmarks" : "Added to bookmarks",
        description: bookmarked ? "Article removed from your bookmarks" : "Article saved to your bookmarks",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to bookmark article",
        variant: "destructive",
      });
    }
  };

  return (
    <article className={`bg-white rounded-lg shadow-sm overflow-hidden border border-border-gray hover:shadow-md transition-shadow duration-300 ${variant === 'full' ? 'p-4' : ''}`}>
      {variant === 'compact' ? (
        <>
          <Link href={`/article/${id}`}>
            <a>
              <img 
                src={image} 
                alt={title} 
                className="w-full h-48 object-cover"
              />
            </a>
          </Link>
          <div className="p-4">
            <div className="flex items-center mb-2">
              <Badge variant="category" className="text-xs font-semibold px-2 py-1 rounded-md">{category}</Badge>
              <span className="ml-2 text-xs text-secondary">{formatDate(date)}</span>
            </div>
            <Link href={`/article/${id}`}>
              <a>
                <h3 className="font-headline font-bold text-lg mb-2 line-clamp-2 hover:text-primary transition-colors">{title}</h3>
              </a>
            </Link>
            <p className="text-secondary text-sm mb-3 line-clamp-2">{excerpt}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`p-0 h-auto flex items-center text-secondary ${liked ? 'text-red-500' : 'hover:text-primary'}`}
                  onClick={handleLike}
                >
                  <Heart className={`w-4 h-4 mr-1 ${liked ? 'fill-current' : ''}`} />
                  <span className="text-xs">{likeCount}</span>
                </Button>
                <Link href={`/article/${id}#comments`}>
                  <a className="flex items-center text-secondary hover:text-primary">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    <span className="text-xs">{comments}</span>
                  </a>
                </Link>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`p-0 h-auto text-secondary ${bookmarked ? 'text-primary' : 'hover:text-primary'}`}
                onClick={handleBookmark}
              >
                <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="md:flex">
          <div className="md:w-1/4 mb-4 md:mb-0 md:mr-6">
            <Link href={`/article/${id}`}>
              <a>
                <img 
                  src={image} 
                  alt={title} 
                  className="w-full h-40 object-cover rounded-md"
                />
              </a>
            </Link>
          </div>
          <div className="md:w-3/4">
            <div className="flex items-center mb-2">
              <Badge variant="category" className="text-xs font-semibold px-2 py-1 rounded-md">{category}</Badge>
              <span className="ml-2 text-xs text-secondary">{formatDate(date)}</span>
            </div>
            <Link href={`/article/${id}`}>
              <a>
                <h3 className="font-headline font-bold text-xl mb-2 hover:text-primary transition-colors">{title}</h3>
              </a>
            </Link>
            <p className="text-secondary mb-4">{excerpt}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`p-0 h-auto flex items-center text-secondary ${liked ? 'text-red-500' : 'hover:text-primary'}`}
                  onClick={handleLike}
                >
                  <Heart className={`w-4 h-4 mr-1 ${liked ? 'fill-current' : ''}`} />
                  <span className="text-sm">{likeCount}</span>
                </Button>
                <Link href={`/article/${id}#comments`}>
                  <a className="flex items-center text-secondary hover:text-primary">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    <span className="text-sm">{comments}</span>
                  </a>
                </Link>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`p-0 h-auto text-secondary ${bookmarked ? 'text-primary' : 'hover:text-primary'}`}
                onClick={handleBookmark}
              >
                <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
