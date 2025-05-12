import { Link } from 'wouter';
import { formatDate, formatViewCount } from '@/lib/utils';

interface MostReadItemProps {
  rank: number;
  title: string;
  date: string;
  views: number;
  articleId: string;
}

export default function MostReadItem({ rank, title, date, views, articleId }: MostReadItemProps) {
  return (
    <div className="flex items-start">
      <span className="text-2xl font-headline font-bold text-accent mr-4">{rank}</span>
      <div>
        <Link href={`/article/${articleId}`}>
          <a className="font-headline font-bold text-base hover:text-primary">{title}</a>
        </Link>
        <p className="text-xs text-secondary mt-1">{formatDate(date)} • {formatViewCount(views)} reads</p>
      </div>
    </div>
  );
}
