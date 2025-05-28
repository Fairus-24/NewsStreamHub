import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import CommentItem from './CommentItem';
import { Button } from '@/components/ui/button';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    profileImageUrl: string;
    role: string;
  };
  likes: number;
  dislikes: number;
  isAuthor: boolean;
  replies?: Comment[];
}

interface CommentListProps {
  articleId: string;
}

export default function CommentList({ articleId }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [visibleComments, setVisibleComments] = useState(5);

  useEffect(() => {
    // Subscribe to Firestore comments for this article
    // NOTE: Firestore requires a composite index for this query. If you get an error in the browser, follow the link to create the index.
    const q = query(
      collection(db, 'comments'),
      where('articleId', '==', String(articleId)),
      where('parentId', '==', null),
      // Remove status filter for now to ensure comments always show
      // where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, async (snapshot) => {
      const commentDocs = snapshot.docs.map(doc => {
        const data = doc.data();
        if (!data.createdAt || (typeof data.createdAt === 'object' && typeof data.createdAt.toDate === 'function' && isNaN(data.createdAt.toDate().getTime()))) {
          return null;
        }
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString()),
          author: {
            id: data.authorId,
            name: data.authorName || '',
            profileImageUrl: data.authorImage || '',
            role: data.authorRole || '',
          },
          likes: Array.isArray(data.likes) ? data.likes.length : 0,
          dislikes: Array.isArray(data.dislikes) ? data.dislikes.length : 0,
          isAuthor: false, // will be set in CommentItem
        };
      }).filter(Boolean);
      setComments(commentDocs as Comment[]);
    });
    return () => unsub();
  }, [articleId]);

  const sortedComments = [...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  const displayedComments = sortedComments.slice(0, visibleComments);
  const hasMoreComments = visibleComments < comments.length;
  
  const loadMoreComments = () => {
    setVisibleComments(prev => prev + 5);
  };
  
  if (comments.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-secondary">No comments yet. Be the first to comment!</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {displayedComments.map(comment => (
        <CommentItem 
          key={comment.id} 
          comment={comment} 
          articleId={articleId} 
        />
      ))}
      
      {hasMoreComments && (
        <div className="flex justify-center mt-4">
          <Button variant="loadMore" onClick={loadMoreComments}>
            Load More Comments
          </Button>
        </div>
      )}
    </div>
  );
}
