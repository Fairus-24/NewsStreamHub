import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDate, getReadingTime } from '@/lib/utils';
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
import { toggleArticleLike, toggleArticleBookmark } from '@/lib/firebaseArticleActions';

interface ArticleDetailProps {
  id: string;
}

// Tambahkan tipe untuk article
interface ArticleDetailData {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  likes: number;
  isLiked: boolean;
  isBookmarked: boolean;
  author: {
    id: string;
    name: string;
    profileImageUrl: string;
    role: string;
  };
  category: {
    id: number;
    name: string;
    slug: string;
  };
  comments: any[];
  tags?: string[];
}

interface UserInteractions {
  liked: boolean;
  bookmarked: boolean;
}

export default function ArticleDetail({ id }: ArticleDetailProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const { data: article, isLoading } = useQuery<ArticleDetailData>({
    queryKey: [`/api/articles/${id}`],
  });

  const { data: userInteractions } = useQuery<UserInteractions>({
    queryKey: [`/api/articles/${id}/user-interactions`],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (userInteractions) {
      setLiked(!!userInteractions.liked);
      setBookmarked(!!userInteractions.bookmarked);
    }
  }, [userInteractions]);

  const handleLike = async () => {
    if (!isAuthenticated || !user) {
      window.location.href = '/login';
      return;
    }
    try {
      await toggleArticleLike(id, user.id, !liked);
      setLiked(!liked);
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

  const handleShare = async () => {
    if (navigator.share && article) {
      try {
        await navigator.share({
          title: article.title,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
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
        {/* Loading skeleton here if needed */}
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
        <Link href={`/category/${article.category?.slug}`}>
          <a className="text-primary text-sm font-semibold tracking-wider hover:underline mb-2 flex items-center">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to {article.category?.name}
          </a>
        </Link>

        <h1 className="font-headline text-3xl md:text-4xl font-bold mb-4">{article.title}</h1>

        <div className="flex items-center mb-6">
          <Avatar className="h-12 w-12 mr-3">
            <AvatarImage src={article.author?.profileImageUrl} alt={article.author?.name} />
            <AvatarFallback>{article.author?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-ui font-medium">By {article.author?.name}</p>
            <p className="text-sm text-secondary">
              {article.author?.role} • Published {formatDate(article.createdAt)} • {getReadingTime(article.content)} min read
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
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
              <Heart className={`mr-2 h-5 w-5 transition-all duration-300 ${
                liked 
                  ? 'fill-current animate-pulse' 
                  : 'group-hover:scale-110 group-hover:animate-bounce'
              }`} />
              <span className="font-medium text-sm transition-all duration-200 group-hover:font-semibold">
                {article.likes}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="group p-2 h-auto flex items-center rounded-full transition-all duration-300 ease-in-out text-gray-500 hover:text-blue-600 hover:bg-blue-50 hover:scale-110"
              onClick={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <MessageSquare className="mr-2 h-5 w-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
              <span className="font-medium text-sm transition-all duration-200 group-hover:font-semibold">
                {article.comments?.length}
              </span>
            </Button>
            <span className="group flex items-center p-2 rounded-full transition-all duration-300 ease-in-out text-gray-500 hover:text-green-600 hover:bg-green-50">
              <Eye className="mr-2 h-5 w-5 transition-all duration-300 group-hover:scale-110" />
              <span className="font-medium text-sm transition-all duration-200 group-hover:font-semibold">
                {article.viewCount}
              </span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
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
              <Bookmark className={`h-5 w-5 transition-all duration-300 ${
                bookmarked 
                  ? 'fill-current animate-pulse' 
                  : 'group-hover:scale-110 group-hover:-rotate-12'
              }`} />
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
      </article>
      
      {/* Comments Section */}
      <div id="comments" className="bg-white rounded-lg shadow-md p-6 border border-border-gray">
        <h2 className="font-headline text-2xl font-bold mb-6">Comments ({article.comments?.length})</h2>
        
        <CommentForm articleId={id} />
        
        <CommentList comments={article.comments || []} articleId={id} />
      </div>
    </section>
  );
}
