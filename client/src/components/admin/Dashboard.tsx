import { useQuery } from '@tanstack/react-query';
import { 
  Newspaper, 
  Users, 
  MessageSquare, 
  Eye,
  FileText,
  ArrowUp, 
  ArrowDown,
  Edit,
  Trash2,
  BarChart2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { formatDate } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { data: metrics } = useQuery({
    queryKey: ['/api/admin/metrics'],
  });
  
  const { data: recentArticles } = useQuery({
    queryKey: ['/api/admin/articles/recent'],
  });
  
  const { data: commentsForModeration } = useQuery({
    queryKey: ['/api/admin/comments/moderation'],
  });
  
  const { toast } = useToast();
  
  const handleCommentAction = async (commentId: string, action: 'approve' | 'reject' | 'flag') => {
    try {
      await apiRequest('POST', `/api/admin/comments/${commentId}/${action}`, {});
      queryClient.invalidateQueries({ queryKey: ['/api/admin/comments/moderation'] });
      
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

  return (
    <div>
      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-light-gray p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <h3 className="font-ui font-semibold text-secondary">Published Articles</h3>
            <Newspaper className="text-primary" />
          </div>
          <p className="font-headline text-3xl font-bold mt-2">
            {metrics?.articleCount ?? <span className="animate-pulse">--</span>}
          </p>
          <p className="text-sm text-green-600 mt-1">
            <ArrowUp className="inline mr-1 h-3 w-3" />
            {metrics?.articleGrowth ?? '--'}% this month
          </p>
        </div>
        
        <div className="bg-light-gray p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <h3 className="font-ui font-semibold text-secondary">Total Comments</h3>
            <MessageSquare className="text-primary" />
          </div>
          <p className="font-headline text-3xl font-bold mt-2">
            {metrics?.commentCount ?? <span className="animate-pulse">--</span>}
          </p>
          <p className="text-sm text-green-600 mt-1">
            <ArrowUp className="inline mr-1 h-3 w-3" />
            {metrics?.commentGrowth ?? '--'}% this month
          </p>
        </div>
        
        <div className="bg-light-gray p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <h3 className="font-ui font-semibold text-secondary">Active Users</h3>
            <Users className="text-primary" />
          </div>
          <p className="font-headline text-3xl font-bold mt-2">
            {metrics?.userCount ?? <span className="animate-pulse">--</span>}
          </p>
          <p className="text-sm text-green-600 mt-1">
            <ArrowUp className="inline mr-1 h-3 w-3" />
            {metrics?.userGrowth ?? '--'}% this month
          </p>
        </div>
        
        <div className="bg-light-gray p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <h3 className="font-ui font-semibold text-secondary">Page Views</h3>
            <Eye className="text-primary" />
          </div>
          <p className="font-headline text-3xl font-bold mt-2">
            {metrics?.pageViews ? `${(metrics.pageViews / 1000).toFixed(1)}k` : <span className="animate-pulse">--</span>}
          </p>
          <p className="text-sm text-green-600 mt-1">
            <ArrowUp className="inline mr-1 h-3 w-3" />
            {metrics?.viewsGrowth ?? '--'}% this month
          </p>
        </div>
      </div>
      
      {/* Recent Articles Admin Table */}
      <div className="overflow-x-auto mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-headline text-xl font-bold">Recent Articles</h3>
          <Button asChild>
            <Link href="/admin/articles/create">
              <FileText className="mr-2 h-4 w-4" />
              New Article
            </Link>
          </Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentArticles ? (
              recentArticles.map((article: any) => (
                <TableRow key={article.id} className="hover:bg-light-gray">
                  <TableCell className="font-medium">{article.title}</TableCell>
                  <TableCell>{article.author.name}</TableCell>
                  <TableCell>
                    <Badge variant="category">{article.category.name}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(article.createdAt)}</TableCell>
                  <TableCell>{article.viewCount}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/articles/edit/${article.id}`}>
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this article?')) {
                            apiRequest('DELETE', `/api/articles/${article.id}`, {})
                              .then(() => {
                                queryClient.invalidateQueries({ queryKey: ['/api/admin/articles/recent'] });
                                toast({
                                  title: 'Article deleted',
                                  description: 'The article has been permanently removed',
                                });
                              })
                              .catch(() => {
                                toast({
                                  title: 'Error',
                                  description: 'Failed to delete article',
                                  variant: 'destructive',
                                });
                              });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/articles/${article.id}/analytics`}>
                          <BarChart2 className="h-4 w-4 text-secondary" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              Array(3).fill(0).map((_, index) => (
                <TableRow key={index} className="animate-pulse">
                  <TableCell colSpan={6}>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Comments Moderation */}
      <div>
        <h3 className="font-headline text-xl font-bold mb-4">Comments Requiring Moderation</h3>
        <div className="space-y-4 mb-6">
          {commentsForModeration ? (
            commentsForModeration.length > 0 ? (
              commentsForModeration.map((comment: any) => (
                <div key={comment.id} className="bg-light-gray p-4 rounded-lg">
                  <div className="flex justify-between">
                    <div className="flex items-start">
                      <img 
                        src={comment.author.profileImageUrl} 
                        alt={comment.author.name} 
                        className="w-10 h-10 rounded-full object-cover mr-3"
                      />
                      <div>
                        <p className="font-ui font-medium">{comment.author.name}</p>
                        <p className="text-xs text-secondary">On article: "{comment.article.title}"</p>
                        <p className="mt-2">{comment.content}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-green-600 hover:text-green-800" 
                        title="Approve"
                        onClick={() => handleCommentAction(comment.id, 'approve')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-800" 
                        title="Reject"
                        onClick={() => handleCommentAction(comment.id, 'reject')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-yellow-600 hover:text-yellow-800" 
                        title="Flag for Review"
                        onClick={() => handleCommentAction(comment.id, 'flag')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                          <line x1="4" y1="22" x2="4" y2="15"></line>
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-6 bg-light-gray rounded-lg">No comments requiring moderation at this time.</p>
            )
          ) : (
            Array(2).fill(0).map((_, index) => (
              <div key={index} className="bg-light-gray p-4 rounded-lg animate-pulse">
                <div className="flex">
                  <div className="rounded-full bg-gray-300 h-10 w-10 mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded mb-2 w-1/4"></div>
                    <div className="h-3 bg-gray-300 rounded mb-2 w-1/2"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="text-center">
          <Button asChild>
            <Link href="/admin/articles/create">Create New Article</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
