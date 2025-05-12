import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { 
  LayoutDashboard, 
  FileText, 
  MessageSquare, 
  Settings,
  Home,
  ChevronRight
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Redirect if not admin or developer
  if (user && user.role !== 'admin' && user.role !== 'developer') {
    window.location.href = '/';
    return null;
  }
  
  const navigationItems = [
    { href: '/admin', icon: <LayoutDashboard className="w-5 h-5 mr-3" />, label: 'Dashboard' },
    { href: '/admin/articles', icon: <FileText className="w-5 h-5 mr-3" />, label: 'Articles' },
    { href: '/admin/comments', icon: <MessageSquare className="w-5 h-5 mr-3" />, label: 'Comments' },
    { href: '/admin/settings', icon: <Settings className="w-5 h-5 mr-3" />, label: 'Settings' },
  ];
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center text-secondary mb-4">
        <Link href="/">
          <a className="hover:text-primary">
            <Home className="w-4 h-4" />
          </a>
        </Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <Link href="/admin">
          <a className="hover:text-primary">Admin</a>
        </Link>
        {location !== '/admin' && (
          <>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-primary">{title}</span>
          </>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 border border-border-gray">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-headline text-2xl font-bold">{title}</h2>
          <div>
            <span className="bg-primary text-white px-3 py-1 rounded-full text-sm">Admin Mode</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {navigationItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a 
                    className={`flex items-center py-3 px-4 rounded-md ${
                      location === item.href 
                        ? 'bg-primary text-white'
                        : 'text-secondary hover:bg-light-gray'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </a>
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
