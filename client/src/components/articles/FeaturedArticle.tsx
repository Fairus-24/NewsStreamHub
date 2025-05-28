import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageSquare, Bookmark } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { toggleArticleLike, toggleArticleBookmark } from '@/lib/firebaseArticleActions';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { onSnapshot, doc as firestoreDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(firestoreDoc(db, 'articles', String(id)), (snap) => {
      const data = snap.data();
      setLiked(Array.isArray(data?.likes) && data.likes.includes(user.id));
      setLikeCount(Array.isArray(data?.likes) ? data.likes.length : 0);
    });
    return () => unsub();
  }, [id, user]);
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(firestoreDoc(db, 'users', String(user.id)), (snap) => {
      const data = snap.data();
      setBookmarked(Array.isArray(data?.bookmarks) && data.bookmarks.includes(String(id)));
    });
    return () => unsub();
  }, [id, user]);

  return (
    <section className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
      <div className="md:flex">
        <div className="md:w-2/3 relative">
          <Link href={`/article/${id}`}>
            <a className="block w-full">
              <img 
                src={image} 
                alt={title} 
                className="w-full h-64 md:h-full object-cover"
              />
            </a>
          </Link>
          {isBreaking && (
            <div className="absolute top-0 left-0 bg-accent text-white px-3 py-1 m-4 rounded-md text-sm font-ui font-semibold">
              BREAKING
            </div>
          )}
        </div>
        <div className="md:w-1/3 p-6 flex flex-col justify-between">
          <Link href={`/category/${(category || 'uncategorized').toLowerCase()}`}>
            <a className="text-primary text-sm font-semibold tracking-wider uppercase">
              {category || 'Uncategorized'}
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
            <div className="flex items-center space-x-6">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`group p-2 h-auto flex items-center rounded-full ${liked ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-gray-500 hover:text-red-500 hover:bg-red-50'}`}
                onClick={handleLike}
              >
                <Heart className={`w-5 h-5 mr-2 ${liked ? 'fill-current' : ''}`} />
                <span className="font-medium text-sm">
                  {likeCount}
                </span>
              </Button>
              
              <Link href={`/article/${id}#comments`}>
                <span className="group p-2 flex items-center rounded-full transition-all duration-300 ease-in-out text-gray-500 hover:text-blue-600 hover:bg-blue-50 hover:scale-110 cursor-pointer">
                  <MessageSquare className="w-5 h-5 mr-2 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
                  <span className="font-medium text-sm transition-all duration-200 group-hover:font-semibold">
                    {comments}
                  </span>
                </span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`group p-2 h-auto rounded-full ${bookmarked ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-gray-500 hover:text-amber-600 hover:bg-amber-50'}`}
                onClick={handleBookmark}
              >
                <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
