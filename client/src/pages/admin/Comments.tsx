import AdminLayout from '@/components/admin/AdminLayout';
import CommentModeration from '@/components/admin/CommentModeration';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function CommentsPage() {
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
    <AdminLayout title="Comment Moderation">
      <CommentModeration />
    </AdminLayout>
  );
}
