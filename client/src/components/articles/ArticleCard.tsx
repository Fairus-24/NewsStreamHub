import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Bookmark } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { toggleArticleLike, toggleArticleBookmark } from '@/lib/firebaseArticleActions';

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
  const { user, isAuthenticated } = useAuth();
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likes);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const { toast } = useToast();

  const handleLike = async () => {
    if (!isAuthenticated || !user) {
      window.location.href = '/login';
      return;
    }
    try {
      await toggleArticleLike(id, user.id, !liked);
      setLiked(!liked);
      setLikeCount(prev => liked ? prev - 1 : prev + 1);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to like article",
        variant: "destructive",
      });
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated || !user) {
      window.location.href = '/login';
      return;
    }
    try {
      await toggleArticleBookmark(id, user.id, !bookmarked);
      setBookmarked(!bookmarked);
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
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`group p-2 h-auto flex items-center rounded-full transition-all duration-300 ease-in-out ${
                    liked 
                      ? 'text-red-500 bg-red-50 hover:bg-red-100 scale-105' 
                      : 'text-gray-500 hover:text-red-500 hover:bg-red-50 hover:scale-110'
                  }`}
                  onClick={handleLike}
                >
                  <Heart className={`w-4 h-4 mr-1 transition-all duration-300 ${
                    liked 
                      ? 'fill-current animate-pulse' 
                      : 'group-hover:scale-110 group-hover:animate-bounce'
                  }`} />
                  <span className="font-medium text-xs transition-all duration-200 group-hover:font-semibold">
                    {likeCount}
                  </span>
                </Button>
                <Link href={`/article/${id}#comments`}>
                  <a className="group p-2 flex items-center rounded-full transition-all duration-300 ease-in-out text-gray-500 hover:text-blue-600 hover:bg-blue-50 hover:scale-110">
                    <MessageSquare className="w-4 h-4 mr-1 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
                    <span className="font-medium text-xs transition-all duration-200 group-hover:font-semibold">
                      {comments}
                    </span>
                  </a>
                </Link>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`group p-2 h-auto rounded-full transition-all duration-300 ease-in-out ${
                  bookmarked 
                    ? 'text-amber-600 bg-amber-50 hover:bg-amber-100 scale-105' 
                    : 'text-gray-500 hover:text-amber-600 hover:bg-amber-50 hover:scale-110'
                }`}
                onClick={handleBookmark}
              >
                <Bookmark className={`w-4 h-4 transition-all duration-300 ${
                  bookmarked 
                    ? 'fill-current animate-pulse' 
                    : 'group-hover:scale-110 group-hover:-rotate-12'
                }`} />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="md:flex">
          <div className="md:w-1/3 mb-4 md:mb-0 md:mr-6">
            <Link href={`/article/${id}`}>
              <a>
                <img 
                  src={image} 
                  alt={title} 
                  className="w-full h-32 md:h-40 object-cover rounded-md"
                />
              </a>
            </Link>
          </div>
          <div className="md:w-2/3">
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
              <div className="flex items-center space-x-6">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`group p-2 h-auto flex items-center rounded-full transition-all duration-300 ease-in-out ${
                    liked 
                      ? 'text-red-500 bg-red-50 hover:bg-red-100 scale-105' 
                      : 'text-gray-500 hover:text-red-500 hover:bg-red-50 hover:scale-110'
                  }`}
                  onClick={handleLike}
                >
                  <Heart className={`w-5 h-5 mr-2 transition-all duration-300 ${
                    liked 
                      ? 'fill-current animate-pulse' 
                      : 'group-hover:scale-110 group-hover:animate-bounce'
                  }`} />
                  <span className="font-medium text-sm transition-all duration-200 group-hover:font-semibold">
                    {likeCount}
                  </span>
                </Button>
                <Link href={`/article/${id}#comments`}>
                  <a className="group p-2 flex items-center rounded-full transition-all duration-300 ease-in-out text-gray-500 hover:text-blue-600 hover:bg-blue-50 hover:scale-110">
                    <MessageSquare className="w-5 h-5 mr-2 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
                    <span className="font-medium text-sm transition-all duration-200 group-hover:font-semibold">
                      {comments}
                    </span>
                  </a>
                </Link>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`group p-2 h-auto rounded-full transition-all duration-300 ease-in-out ${
                  bookmarked 
                    ? 'text-amber-600 bg-amber-50 hover:bg-amber-100 scale-105' 
                    : 'text-gray-500 hover:text-amber-600 hover:bg-amber-50 hover:scale-110'
                }`}
                onClick={handleBookmark}
              >
                <Bookmark className={`w-5 h-5 transition-all duration-300 ${
                  bookmarked 
                    ? 'fill-current animate-pulse' 
                    : 'group-hover:scale-110 group-hover:-rotate-12'
                }`} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
