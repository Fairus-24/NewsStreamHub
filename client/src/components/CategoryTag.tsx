import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';

interface CategoryTagProps {
  category: string;
  slug: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CategoryTag({ category, slug, size = 'md' }: CategoryTagProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'px-3 py-1',
    lg: 'text-sm px-4 py-1.5'
  };

  return (
    <Link href={`/category/${slug}`}>
      <a>
        <Badge 
          variant="category" 
          className={`${sizeClasses[size]} inline-block font-semibold rounded-md hover:bg-primary transition-colors duration-200`}
        >
          {category}
        </Badge>
      </a>
    </Link>
  );
}
