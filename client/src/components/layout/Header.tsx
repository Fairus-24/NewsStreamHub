import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/types/user';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Menu, ChevronDown, Newspaper, Crown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const categories = [
  { slug: '', name: 'Home' },
  { slug: 'politics', name: 'Politics' },
  { slug: 'business', name: 'Business' },
  { slug: 'technology', name: 'Technology' },
  { slug: 'entertainment', name: 'Entertainment' },
  { slug: 'science', name: 'Science' },
  { slug: 'health', name: 'Health' },
  { slug: 'sports', name: 'Sports' },
];

export default function Header() {
  const [location] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = user?.role === 'admin' || user?.role === 'developer';

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
  };

  return (
    <header className="bg-white border-b border-border-gray sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Newspaper className="text-primary text-3xl mr-2" />
              <h1 className="font-headline font-bold text-2xl text-primary">NewsHub</h1>
            </Link>
          </div>
          
          <div className="hidden md:flex space-x-1">
            <form onSubmit={handleSearch} className="relative mr-2">
              <Input
                type="search"
                placeholder="Search..."
                className="w-[200px] pr-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit" 
                variant="ghost" 
                size="icon" 
                className="absolute right-0 top-0 h-full"
              >
                <Search className="h-4 w-4 text-secondary" />
              </Button>
            </form>

            {isLoading ? (
              <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-2 hover:bg-light-gray rounded-md flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImageUrl} />
                      <AvatarFallback>{getInitials(user?.firstName, user?.lastName)}</AvatarFallback>
                    </Avatar>
                    <span className="font-ui text-sm font-medium">
                      {user?.firstName || 'User'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-secondary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Your Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/bookmarks">Bookmarks</Link>
                  </DropdownMenuItem>
                  
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center">
                          Admin Dashboard
                          <Crown className="h-4 w-4 ml-2 text-accent" />
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/api/logout" className="text-red-600">Sign Out</a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="default">
                <a href="/api/login">Sign In</a>
              </Button>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6 text-secondary" />
          </Button>
        </div>
        
        <nav className="py-2 overflow-x-auto scrollbar-hide">
          <ul className="flex space-x-6 whitespace-nowrap">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link href={category.slug ? `/category/${category.slug}` : '/'} 
                  className={`font-ui font-medium ${
                    (location === '/' && category.slug === '') || 
                    (location.includes(`/category/${category.slug}`) && category.slug !== '')
                      ? 'text-primary border-b-2 border-primary pb-2' 
                      : 'text-secondary hover:text-primary pb-2'
                  }`}>
                    {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white shadow-md rounded-md p-4 mb-6 mx-4">
          <div className="mb-4">
            <form onSubmit={handleSearch} className="relative mb-4">
              <Input
                type="search"
                placeholder="Search for news..."
                className="w-full pr-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit" 
                variant="ghost" 
                size="icon" 
                className="absolute right-0 top-0 h-full"
              >
                <Search className="h-4 w-4 text-secondary" />
              </Button>
            </form>

            {isAuthenticated ? (
              <>
                <div className="flex items-center mb-4">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={user?.profileImageUrl} />
                    <AvatarFallback>{getInitials(user?.firstName, user?.lastName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-ui font-medium">{user?.firstName || 'User'}</p>
                    <p className="text-sm text-secondary">{user?.role || 'User'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Link href="/profile" className="block p-2 rounded-md hover:bg-light-gray text-sm font-ui">
                    Your Profile
                  </Link>
                  <Link href="/bookmarks" className="block p-2 rounded-md hover:bg-light-gray text-sm font-ui">
                    Bookmarks
                  </Link>
                  
                  {isAdmin && (
                    <Link href="/admin" className="block p-2 rounded-md bg-primary bg-opacity-10 text-primary text-sm font-ui mt-2">
                      Admin Dashboard
                    </Link>
                  )}
                  
                  <a href="/api/logout" className="block p-2 rounded-md hover:bg-light-gray text-red-600 text-sm font-ui mt-2">Sign Out</a>
                </div>
              </>
            ) : (
              <Button asChild className="w-full">
                <a href="/api/login">Sign In</a>
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
