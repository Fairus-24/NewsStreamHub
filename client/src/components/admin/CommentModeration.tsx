import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, CheckCircle, XCircle, Flag } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CommentModeration() {
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  
  const { data: comments, isLoading } = useQuery({
    queryKey: [`/api/admin/comments/${filter}`, search],
  });
  
  const handleAction = async (commentId: string, action: 'approve' | 'reject' | 'flag') => {
    try {
      await apiRequest('POST', `/api/admin/comments/${commentId}/${action}`, {});
      queryClient.invalidateQueries({ queryKey: [`/api/admin/comments/${filter}`] });
      
      const messages = {
        approve: 'Comment approved successfully',
        reject: 'Comment rejected and removed',
        flag: 'Comment flagged for further review'
      };
      
      toast({
        title: 'Success',
        description: messages[action],
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${action} comment`,
        variant: 'destructive',
      });
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    queryClient.invalidateQueries({ queryKey: [`/api/admin/comments/${filter}`] });
  };
  
  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Select 
          value={filter} 
          onValueChange={(value) => {
            setFilter(value);
            queryClient.invalidateQueries({ queryKey: [`/api/admin/comments/${value}`] });
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending Review</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="search"
            placeholder="Search comments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Button type="submit" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-light-gray p-4 rounded-lg animate-pulse">
              <div className="flex items-start">
                <div className="w-12 h-12 rounded-full bg-gray-300 mr-3"></div>
                <div className="flex-1">
                  <div className="w-1/4 h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="w-1/2 h-3 bg-gray-300 rounded mb-3"></div>
                  <div className="w-full h-16 bg-gray-300 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : comments?.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment: any) => (
            <div key={comment.id} className="bg-white border border-border-gray p-4 rounded-lg shadow-sm">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                <div className="flex items-start mb-4 md:mb-0">
                  <Avatar className="h-12 w-12 mr-3">
                    <AvatarImage src={comment.author.profileImageUrl} alt={comment.author.name} />
                    <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center">
                      <p className="font-ui font-medium">{comment.author.name}</p>
                      {comment.author.role && (
                        <Badge 
                          variant={comment.author.role === 'admin' ? 'default' : 'secondary'} 
                          className="ml-2"
                        >
                          {comment.author.role}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-secondary mt-1">
                      <p>On article: <a href={`/article/${comment.article.id}`} className="hover:underline">{comment.article.title}</a></p>
                      <p className="mt-1">Posted: {formatDate(comment.createdAt)}</p>
                    </div>
                    <div className="mt-3 p-3 bg-light-gray rounded-md">
                      {comment.content}
                    </div>
                    {comment.status !== 'pending' && (
                      <div className="mt-2">
                        <Badge 
                          variant={
                            comment.status === 'approved' 
                              ? 'default' 
                              : comment.status === 'flagged' 
                                ? 'secondary' 
                                : 'destructive'
                          }
                        >
                          {comment.status.charAt(0).toUpperCase() + comment.status.slice(1)}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {(comment.status === 'pending' || comment.status === 'flagged') && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-green-600 border-green-600"
                      onClick={() => handleAction(comment.id, 'approve')}
                    >
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Approve
                    </Button>
                  )}
                  
                  {(comment.status === 'pending' || comment.status === 'flagged') && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 border-red-600"
                      onClick={() => handleAction(comment.id, 'reject')}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Reject
                    </Button>
                  )}
                  
                  {comment.status === 'pending' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-yellow-600 border-yellow-600"
                      onClick={() => handleAction(comment.id, 'flag')}
                    >
                      <Flag className="mr-1 h-4 w-4" />
                      Flag
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-light-gray p-6 rounded-lg text-center">
          <p className="text-secondary">No comments found matching the current filter.</p>
        </div>
      )}
    </div>
  );
}
