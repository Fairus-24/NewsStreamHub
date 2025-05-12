import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface ArticleFormProps {
  articleId?: string;
}

const imageUrlPattern = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))$/i;

const formSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  excerpt: z.string().min(20, 'Excerpt must be at least 20 characters'),
  content: z.string().min(100, 'Content must be at least 100 characters'),
  image: z.string().regex(imageUrlPattern, 'Please enter a valid image URL'),
  categoryId: z.string().min(1, 'Please select a category'),
  isBreaking: z.boolean().default(false),
  tags: z.string().optional(),
});

export default function ArticleForm({ articleId }: ArticleFormProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
  });
  
  const { data: article, isLoading: isLoadingArticle } = useQuery({
    queryKey: [`/api/articles/${articleId}`],
    enabled: !!articleId,
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      excerpt: '',
      content: '',
      image: '',
      categoryId: '',
      isBreaking: false,
      tags: '',
    },
  });
  
  useEffect(() => {
    if (article) {
      form.reset({
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        image: article.image,
        categoryId: article.category.id,
        isBreaking: article.isBreaking,
        tags: article.tags?.join(', ') || '',
      });
    }
  }, [article, form]);
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      const processedTags = values.tags 
        ? values.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];
      
      const payload = {
        ...values,
        tags: processedTags,
      };
      
      if (articleId) {
        // Update existing article
        await apiRequest('PATCH', `/api/articles/${articleId}`, payload);
        toast({
          title: 'Article updated',
          description: 'The article has been updated successfully',
        });
      } else {
        // Create new article
        await apiRequest('POST', '/api/articles', payload);
        toast({
          title: 'Article created',
          description: 'The article has been created successfully',
        });
        form.reset();
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/articles/recent'] });
      
      // Redirect to articles list
      navigate('/admin/articles');
    } catch (error) {
      toast({
        title: 'Error',
        description: articleId 
          ? 'Failed to update article. Please try again.' 
          : 'Failed to create article. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoadingArticle && articleId) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter article title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="excerpt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Excerpt</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter a brief summary of the article" 
                  className="min-h-[80px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter the full article content" 
                  className="min-h-[300px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Featured Image URL</FormLabel>
              <FormControl>
                <Input placeholder="Enter image URL" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories?.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags (comma separated)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. politics, economy, climate" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="isBreaking"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Breaking News</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Mark this article as breaking news (will be highlighted)
                </p>
              </div>
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/articles')}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {articleId ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              articleId ? 'Update Article' : 'Create Article'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
