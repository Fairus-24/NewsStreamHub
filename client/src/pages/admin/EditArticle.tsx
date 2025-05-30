import AdminLayout from '@/components/admin/AdminLayout';
import ArticleForm from '@/components/admin/ArticleForm';
import { useAuth } from '@/hooks/useAuth';
import { useParams, useLocation } from 'wouter';
import { useEffect } from 'react';

export default function EditArticlePage() {
  const { id } = useParams();
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user && user.role !== 'admin' && user.role !== 'developer') {
      setLocation('/');
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'developer')) {
    return null; // Will redirect in useEffect
  }

  return (
    <AdminLayout title="Edit Article">
      <ArticleForm articleId={id} />
    </AdminLayout>
  );
}
