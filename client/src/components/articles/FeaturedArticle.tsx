import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageSquare, Bookmark } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

interface FeaturedArticleProps {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  image: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  likes: number;
  comments: number;
  isBreaking?: boolean;
  isBookmarked?: boolean;
  isLiked?: boolean;
}

export default function FeaturedArticle({
  id,
  title,
  excerpt,
  category,
  date,
  image,
  author,
  likes,
  comments,
  isBreaking = false,
  isBookmarked = false,
  isLiked = false
}: FeaturedArticleProps) {
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
    <section className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
      <div className="md:flex">
        <div className="md:w-2/3 relative">
          <Link href={`/article/${id}`}>
            <a>
              <img 
                src={image} 
                alt={title} 
                className="w-full h-full object-cover"
              />
            </a>
          </Link>
          {isBreaking && (
            <div className="absolute top-0 left-0 bg-accent text-white px-3 py-1 m-4 rounded-md text-sm font-ui font-semibold">
              BREAKING
            </div>
          )}
        </div>
        <div className="md:w-1/3 p-6">
          <Link href={`/category/${category.toLowerCase()}`}>
            <a className="text-primary text-sm font-semibold tracking-wider uppercase">
              {category}
            </a>
          </Link>
          <Link href={`/article/${id}`}>
            <a>
              <h2 className="font-headline text-2xl font-bold mt-2 mb-4 hover:text-primary transition-colors">
                {title}
              </h2>
            </a>
          </Link>
          <p className="text-secondary mb-4 line-clamp-3">{excerpt}</p>
          <div className="flex items-center text-sm text-secondary mb-4">
            <Avatar className="w-8 h-8 mr-2">
              <AvatarImage src={author.avatar} alt={author.name} />
              <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>By <span className="font-semibold">{author.name}</span></span>
            <span className="mx-2">•</span>
            <span>{formatDate(date)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`p-0 h-auto flex items-center text-secondary ${liked ? 'text-red-500' : 'hover:text-primary'}`}
                onClick={handleLike}
              >
                <Heart className={`w-4 h-4 mr-1 ${liked ? 'fill-current' : ''}`} />
                <span>{likeCount}</span>
              </Button>
              <Link href={`/article/${id}#comments`}>
                <a className="flex items-center text-secondary hover:text-primary">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  <span>{comments}</span>
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
    </section>
  );
}
