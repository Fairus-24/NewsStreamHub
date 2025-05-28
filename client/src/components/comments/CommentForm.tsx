import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { addComment } from '@/lib/firebaseCommentActions';
import { useToast } from '@/hooks/use-toast';

interface CommentFormProps {
  articleId: string;
  parentId?: string;
  onCancel?: () => void;
  placeholder?: string;
}

export default function CommentForm({ 
  articleId, 
  parentId,
  onCancel,
  placeholder = "Add your thoughts..."
}: CommentFormProps) {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      window.location.href = '/login';
      return;
    }
    if (!content.trim()) {
      toast({
        title: "Comment cannot be empty",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await addComment({
        articleId,
        user,
        content,
        parentId
      });
      setContent("");
      toast({
        title: "Comment posted",
        description: "Your comment has been posted successfully",
      });
      if (onCancel) {
        onCancel();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="mb-8 p-4 bg-light-gray rounded-lg">
        <p className="text-center mb-4">Please sign in to join the discussion</p>
        <Button asChild className="w-full">
          <a href="/api/login">Sign In to Comment</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <form onSubmit={handleSubmit} className="flex items-start">
        <Avatar className="w-10 h-10 mr-3 flex-shrink-0">
          <AvatarImage src={user?.profileImageUrl} alt={user?.firstName || 'User'} />
          <AvatarFallback>{user?.firstName?.[0] || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder={placeholder}
            className="w-full px-4 py-2 border border-border-gray rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex justify-end mt-2 space-x-2">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
