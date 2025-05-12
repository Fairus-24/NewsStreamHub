import { useParams } from 'wouter';
import ArticleDetail from '@/components/articles/ArticleDetail';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function ArticlePage() {
  const { id } = useParams();
  
  const { isError } = useQuery({
    queryKey: [`/api/articles/${id}`],
  });
  
  if (isError) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-article mx-auto bg-white rounded-lg shadow-md p-6 border border-border-gray">
          <h1 className="font-headline text-2xl font-bold mb-4">Article not found</h1>
          <p className="mb-4">The article you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return <ArticleDetail id={id || ''} />;
}
