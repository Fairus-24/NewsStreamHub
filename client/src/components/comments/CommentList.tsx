import { useState } from 'react';
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
  comments: Comment[];
  articleId: string;
}

export default function CommentList({ comments, articleId }: CommentListProps) {
  const [visibleComments, setVisibleComments] = useState(5);
  
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
