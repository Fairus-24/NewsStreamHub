import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import CommentForm from './CommentForm';
import { Badge } from '@/components/ui/badge';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  MoreVertical,
  Flag,
  Trash2,
  Edit
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

interface CommentItemProps {
  comment: Comment;
  articleId: string;
  isReply?: boolean;
}

export default function CommentItem({ comment, articleId, isReply = false }: CommentItemProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [likesCount, setLikesCount] = useState(comment.likes);
  const [dislikesCount, setDislikesCount] = useState(comment.dislikes);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(false);
  
  const isAdmin = user?.role === 'admin' || user?.role === 'developer';
  const isAuthor = comment.isAuthor || user?.id === comment.author.id;
  
  const handleLike = async () => {
    if (!isAuthenticated) {
      window.location.href = '/api/login';
      return;
    }
    
    try {
      await apiRequest('POST', `/api/comments/${comment.id}/like`, {});
      
      if (isLiked) {
        setLikesCount(prev => prev - 1);
      } else {
        setLikesCount(prev => prev + 1);
        if (isDisliked) {
          setDislikesCount(prev => prev - 1);
          setIsDisliked(false);
        }
      }
      
      setIsLiked(!isLiked);
      queryClient.invalidateQueries({ queryKey: [`/api/articles/${articleId}`] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to like comment",
        variant: "destructive",
      });
    }
  };
  
  const handleDislike = async () => {
    if (!isAuthenticated) {
      window.location.href = '/api/login';
      return;
    }
    
    try {
      await apiRequest('POST', `/api/comments/${comment.id}/dislike`, {});
      
      if (isDisliked) {
        setDislikesCount(prev => prev - 1);
      } else {
        setDislikesCount(prev => prev + 1);
        if (isLiked) {
          setLikesCount(prev => prev - 1);
          setIsLiked(false);
        }
      }
      
      setIsDisliked(!isDisliked);
      queryClient.invalidateQueries({ queryKey: [`/api/articles/${articleId}`] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to dislike comment",
        variant: "destructive",
      });
    }
  };
  
  const handleDelete = async () => {
    if (!isAuthenticated || (!isAdmin && !isAuthor)) {
      return;
    }
    
    try {
      await apiRequest('DELETE', `/api/comments/${comment.id}`, {});
      queryClient.invalidateQueries({ queryKey: [`/api/articles/${articleId}`] });
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    }
  };
  
  const handleUpdate = async () => {
    if (!isAuthenticated || !isAuthor || !editedContent.trim()) {
      return;
    }
    
    try {
      await apiRequest('PATCH', `/api/comments/${comment.id}`, { content: editedContent });
      queryClient.invalidateQueries({ queryKey: [`/api/articles/${articleId}`] });
      setIsEditing(false);
      toast({
        title: "Comment updated",
        description: "Your comment has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update comment",
        variant: "destructive",
      });
    }
  };
  
  const handleReport = async () => {
    if (!isAuthenticated) {
      window.location.href = '/api/login';
      return;
    }
    
    try {
      await apiRequest('POST', `/api/comments/${comment.id}/report`, {});
      toast({
        title: "Comment reported",
        description: "Thank you for helping us maintain a respectful community",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to report comment",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className={isReply ? '' : 'border-b border-border-gray pb-6'}>
      <div className="flex items-start">
        <Avatar className="w-10 h-10 mr-3 flex-shrink-0">
          <AvatarImage src={comment.author.profileImageUrl} alt={comment.author.name} />
          <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-wrap">
              <h3 className="font-ui font-medium">{comment.author.name}</h3>
              {comment.author.role === 'admin' && (
                <Badge variant="default" className="ml-2 text-xs">Admin</Badge>
              )}
              {comment.author.role === 'developer' && (
                <Badge variant="secondary" className="ml-2 text-xs">Developer</Badge>
              )}
              {isAuthor && (
                <Badge variant="outline" className="ml-2 text-xs">Author</Badge>
              )}
              <span className="text-xs text-secondary ml-2">{formatDate(comment.createdAt)}</span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(isAdmin || isAuthor) && (
                  <>
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleReport}>
                  <Flag className="mr-2 h-4 w-4" /> Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {isEditing ? (
            <div className="mt-2">
              <textarea
                className="w-full px-3 py-2 border border-border-gray rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
              />
              <div className="flex justify-end mt-2 space-x-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleUpdate}>
                  Update
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-2">{comment.content}</p>
          )}
          
          <div className="flex items-center mt-2 space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`p-0 h-auto flex items-center text-sm ${isLiked ? 'text-primary' : 'text-secondary hover:text-primary'}`}
              onClick={handleLike}
            >
              <ThumbsUp className="mr-1 h-4 w-4" /> {likesCount}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`p-0 h-auto flex items-center text-sm ${isDisliked ? 'text-primary' : 'text-secondary hover:text-primary'}`}
              onClick={handleDislike}
            >
              <ThumbsDown className="mr-1 h-4 w-4" /> {dislikesCount}
            </Button>
            {!isReply && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-0 h-auto text-secondary hover:text-primary text-sm"
                onClick={() => setIsReplying(!isReplying)}
              >
                Reply
              </Button>
            )}
          </div>
          
          {isReplying && (
            <div className="mt-4 ml-6">
              <CommentForm
                articleId={articleId}
                parentId={comment.id}
                onCancel={() => setIsReplying(false)}
                placeholder="Write a reply..."
              />
            </div>
          )}
          
          {/* Show replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 ml-6">
              {!showReplies ? (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center text-primary p-0 h-auto"
                  onClick={() => setShowReplies(true)}
                >
                  <MessageSquare className="mr-1 h-4 w-4" />
                  Show {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </Button>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center text-primary p-0 h-auto mb-4"
                    onClick={() => setShowReplies(false)}
                  >
                    Hide replies
                  </Button>
                  <div className="space-y-4 border-l-2 border-border-gray pl-4">
                    {comment.replies.map(reply => (
                      <CommentItem 
                        key={reply.id} 
                        comment={reply} 
                        articleId={articleId} 
                        isReply={true}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
