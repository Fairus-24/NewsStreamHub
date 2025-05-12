import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'wouter';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, BarChart2, Plus, Search } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function ArticlesPage() {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const { toast } = useToast();
  
  useEffect(() => {
    if (!isLoadingAuth && user && user.role !== 'admin' && user.role !== 'developer') {
      setLocation('/');
    }
  }, [user, isLoadingAuth, setLocation]);

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'developer')) {
    return null; // Will redirect in useEffect
  }

  const { data, isLoading } = useQuery({
    queryKey: ['/api/admin/articles', page, search, category],
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
  });

  const articles = data?.articles || [];
  const totalPages = data?.totalPages || 1;

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      try {
        await apiRequest('DELETE', `/api/articles/${id}`, {});
        queryClient.invalidateQueries({ queryKey: ['/api/admin/articles'] });
        toast({
          title: 'Article deleted',
          description: 'The article has been permanently removed',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete article',
          variant: 'destructive',
        });
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    queryClient.invalidateQueries({ queryKey: ['/api/admin/articles'] });
  };

  return (
    <AdminLayout title="Articles">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-headline font-bold">Manage Articles</h2>
          <Button asChild>
            <Link href="/admin/articles/create">
              <Plus className="mr-2 h-4 w-4" />
              New Article
            </Link>
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 md:items-end">
          <div className="flex-1">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                type="search"
                placeholder="Search articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>
          
          <div className="w-full md:w-auto">
            <Select
              value={category}
              onValueChange={(value) => {
                setCategory(value);
                setPage(1);
                queryClient.invalidateQueries({ queryKey: ['/api/admin/articles'] });
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-border-gray overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Comments</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(10).fill(0).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell colSpan={6}>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : articles.length > 0 ? (
                articles.map((article: any) => (
                  <TableRow key={article.id}>
                    <TableCell className="font-medium">{article.title}</TableCell>
                    <TableCell>
                      <Badge variant="category">{article.category.name}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(article.createdAt)}</TableCell>
                    <TableCell>{article.viewCount}</TableCell>
                    <TableCell>{article.commentCount}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="sm" asChild title="Edit">
                          <Link href={`/admin/articles/edit/${article.id}`}>
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(article.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                        <Button variant="ghost" size="sm" asChild title="Analytics">
                          <Link href={`/admin/articles/${article.id}/analytics`}>
                            <BarChart2 className="h-4 w-4 text-secondary" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-secondary font-medium">No articles found</p>
                    <p className="text-sm text-muted-foreground mt-1">Try a different search or category filter</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className={`cursor-pointer ${page === 1 ? 'pointer-events-none opacity-50' : ''}`}
                />
              </PaginationItem>
              
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                
                // Show first page, current page, last page, and one page before and after current page
                if (
                  pageNum === 1 || 
                  pageNum === totalPages || 
                  (pageNum >= page - 1 && pageNum <= page + 1)
                ) {
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        isActive={page === pageNum}
                        onClick={() => setPage(pageNum)}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                
                // Show ellipsis
                if (
                  (pageNum === 2 && page > 3) || 
                  (pageNum === totalPages - 1 && page < totalPages - 2)
                ) {
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                
                return null;
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className={`cursor-pointer ${page === totalPages ? 'pointer-events-none opacity-50' : ''}`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </AdminLayout>
  );
}
