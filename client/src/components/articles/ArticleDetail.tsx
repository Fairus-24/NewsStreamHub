import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatFullDate, getReadingTime } from '@/lib/utils';
import { 
  Heart, 
  MessageSquare, 
  Eye, 
  Bookmark, 
  Share2,
  ChevronLeft
} from 'lucide-react';
import CommentList from '@/components/comments/CommentList';
import CommentForm from '@/components/comments/CommentForm';

interface ArticleDetailProps {
  id: string;
}

export default function ArticleDetail({ id }: ArticleDetailProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const { data: article, isLoading } = useQuery({
    queryKey: [`/api/articles/${id}`],
  });

  const { data: userInteractions } = useQuery({
    queryKey: [`/api/articles/${id}/user-interactions`],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (userInteractions) {
      setLiked(userInteractions.liked);
      setBookmarked(userInteractions.bookmarked);
    }
  }, [userInteractions]);

  useEffect(() => {
    // Record view when component mounts
    if (id) {
      apiRequest('POST', `/api/articles/${id}/view`, {}).catch(console.error);
    }
  }, [id]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      window.location.href = '/api/login';
      return;
    }

    try {
      await apiRequest('POST', `/api/articles/${id}/like`, { liked: !liked });
      setLiked(!liked);
      queryClient.invalidateQueries({ queryKey: [`/api/articles/${id}`] });
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Article link copied to clipboard",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-article mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-border-gray animate-pulse">
          <div className="h-8 bg-gray-200 w-32 mb-4"></div>
          <div className="h-10 bg-gray-200 w-full mb-4"></div>
          <div className="flex items-center mb-6">
            <div className="rounded-full bg-gray-200 h-12 w-12 mr-3"></div>
            <div>
              <div className="h-5 bg-gray-200 w-40 mb-1"></div>
              <div className="h-4 bg-gray-200 w-24"></div>
            </div>
          </div>
          
          <div className="h-60 bg-gray-200 w-full mb-6"></div>
          
          <div className="space-y-4">
            <div className="h-5 bg-gray-200 w-full"></div>
            <div className="h-5 bg-gray-200 w-full"></div>
            <div className="h-5 bg-gray-200 w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-article mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-border-gray">
          <h1 className="font-headline text-2xl font-bold mb-4">Article not found</h1>
          <p className="mb-4">The article you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section className="container mx-auto px-4 py-6 mb-10 max-w-article">
      <article className="bg-white rounded-lg shadow-md p-6 border border-border-gray mb-6">
        <Link href={`/category/${article.category.slug}`}>
          <a className="text-primary text-sm font-semibold tracking-wider hover:underline mb-2 block flex items-center">
            <ChevronLeft className="h-4 w-4 mr-1" /> 
            Back to {article.category.name}
          </a>
        </Link>
        
        <h1 className="font-headline text-3xl md:text-4xl font-bold mb-4">{article.title}</h1>
        
        <div className="flex items-center mb-6">
          <Avatar className="h-12 w-12 mr-3">
            <AvatarImage src={article.author.profileImageUrl} alt={article.author.name} />
            <AvatarFallback>{article.author.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-ui font-medium">By {article.author.name}</p>
            <p className="text-sm text-secondary">
              {article.author.role} • Published {formatDate(article.createdAt)} • {getReadingTime(article.content)} min read
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`p-0 h-auto flex items-center text-secondary ${liked ? 'text-red-500' : 'hover:text-primary'}`}
              onClick={handleLike}
            >
              <Heart className={`mr-1 h-5 w-5 ${liked ? 'fill-current' : ''}`} />
              <span>{article.likes}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto flex items-center text-secondary hover:text-primary"
              onClick={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <MessageSquare className="mr-1 h-5 w-5" />
              <span>{article.comments.length}</span>
            </Button>
            <span className="flex items-center text-secondary">
              <Eye className="mr-1 h-5 w-5" />
              {article.viewCount}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`p-0 h-auto text-secondary ${bookmarked ? 'text-primary' : 'hover:text-primary'}`}
              onClick={handleBookmark}
            >
              <Bookmark className={`h-5 w-5 ${bookmarked ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto text-secondary hover:text-primary"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <img 
          src={article.image} 
          alt={article.title} 
          className="w-full h-auto rounded-lg mb-6"
        />
        
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: article.content }} />
        
        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-8 mb-6">
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag: string, index: number) => (
                <Link key={index} href={`/search?q=${encodeURIComponent(tag)}`}>
                  <a className="px-3 py-1 bg-light-gray rounded-full text-secondary text-sm hover:bg-primary hover:text-white transition-colors duration-300">
                    #{tag}
                  </a>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Author Bio */}
        <div className="mt-8 p-4 bg-light-gray rounded-lg">
          <div className="flex items-start">
            <Avatar className="w-16 h-16 mr-4">
              <AvatarImage src={article.author.profileImageUrl} alt={article.author.name} />
              <AvatarFallback>{article.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-headline font-bold text-lg">About {article.author.name}</h3>
              <p className="text-secondary mb-2">{article.author.bio || `${article.author.name} is a contributor at NewsHub.`}</p>
              <Link href={`/search?author=${article.author.id}`}>
                <a className="text-primary font-semibold hover:underline">View all articles by {article.author.name}</a>
              </Link>
            </div>
          </div>
        </div>
      </article>
      
      {/* Comments Section */}
      <div id="comments" className="bg-white rounded-lg shadow-md p-6 border border-border-gray">
        <h2 className="font-headline text-2xl font-bold mb-6">Comments ({article.comments.length})</h2>
        
        <CommentForm articleId={id} />
        
        <CommentList comments={article.comments} articleId={id} />
      </div>
    </section>
  );
}
