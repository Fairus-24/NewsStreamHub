import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
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
    <header className="bg-white/95 backdrop-blur-md border-b border-border-gray sticky top-0 z-50 shadow-sm transition-all duration-300">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center group">
            <Link href="/" className="flex items-center transition-transform duration-300 hover:scale-105">
              <Newspaper className="text-primary text-3xl mr-3 transition-all duration-300 group-hover:rotate-12 group-hover:text-accent" />
              <h1 className="font-headline font-bold text-2xl text-primary transition-all duration-300 group-hover:text-accent bg-gradient-to-r from-primary to-accent bg-clip-text">
                NewsHub
              </h1>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <form onSubmit={handleSearch} className="relative group">
              <Input
                type="search"
                placeholder="Search news..."
                className="w-[280px] pr-12 pl-4 py-2 rounded-full border-2 border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 hover:shadow-md"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit" 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-primary text-white hover:bg-primary/90 transition-all duration-300 hover:scale-110"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>

            {isLoading ? (
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 animate-pulse"></div>
            ) : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="group p-3 hover:bg-primary/5 rounded-xl flex items-center gap-3 transition-all duration-300 hover:shadow-lg hover:scale-105">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                      <AvatarImage src={user?.profileImageUrl} />
                      <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-white font-bold">
                        {getInitials(user?.firstName, user?.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-ui text-sm font-medium group-hover:text-primary transition-colors duration-300">
                      {user?.firstName || 'User'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-secondary group-hover:text-primary transition-all duration-300 group-hover:rotate-180" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white/95 backdrop-blur-md border-0 shadow-xl rounded-xl p-2 animate-in slide-in-from-top-2 duration-300">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center px-3 py-2 rounded-lg hover:bg-primary/10 transition-all duration-200">
                      Your Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/bookmarks" className="flex items-center px-3 py-2 rounded-lg hover:bg-primary/10 transition-all duration-200">
                      Bookmarks
                    </Link>
                  </DropdownMenuItem>
                  
                  {isAdmin && (
                    <>
                      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-2" />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center px-3 py-2 rounded-lg hover:bg-accent/10 transition-all duration-200">
                          Admin Dashboard
                          <Crown className="h-4 w-4 ml-auto text-accent animate-pulse" />
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-2" />
                  <DropdownMenuItem asChild>
                    <a href="/api/logout" className="flex items-center px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200">
                      Sign Out
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="default" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white px-6 py-2 rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <a href="/api/login">Sign In</a>
              </Button>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden p-2 rounded-xl hover:bg-primary/10 transition-all duration-300 hover:scale-110" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className={`h-6 w-6 text-secondary transition-all duration-300 ${mobileMenuOpen ? 'rotate-90 text-primary' : 'hover:text-primary'}`} />
          </Button>
        </div>
        
        <nav className="py-3 overflow-x-auto scrollbar-hide border-t border-gray-100">
          <ul className="flex space-x-8 whitespace-nowrap">
            {categories.map((category, index) => (
              <li key={category.slug} className="relative group" style={{ animationDelay: `${index * 50}ms` }}>
                <Link 
                  href={category.slug ? `/category/${category.slug}` : '/'} 
                  className={`relative font-ui font-medium py-2 px-3 rounded-lg transition-all duration-300 hover:scale-105 ${
                    (location === '/' && category.slug === '') || 
                    (location.includes(`/category/${category.slug}`) && category.slug !== '')
                      ? 'text-primary bg-primary/10 shadow-sm' 
                      : 'text-secondary hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  {category.name}
                  <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-300 ${
                    (location === '/' && category.slug === '') || 
                    (location.includes(`/category/${category.slug}`) && category.slug !== '')
                      ? 'w-full' 
                      : 'w-0 group-hover:w-full'
                  }`} />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md shadow-xl rounded-b-2xl mx-4 mb-4 overflow-hidden animate-in slide-in-from-top-2 duration-300">
          <div className="p-6">
            <form onSubmit={handleSearch} className="relative mb-6 group">
              <Input
                type="search"
                placeholder="Search for news..."
                className="w-full pr-12 pl-4 py-3 rounded-full border-2 border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit" 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-primary text-white hover:bg-primary/90 transition-all duration-300"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>

            {isAuthenticated ? (
              <>
                <div className="flex items-center mb-6 p-3 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5">
                  <Avatar className="h-12 w-12 mr-4 ring-2 ring-primary/20">
                    <AvatarImage src={user?.profileImageUrl} />
                    <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-white font-bold">
                      {getInitials(user?.firstName, user?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-ui font-semibold text-lg">{user?.firstName || 'User'}</p>
                    <p className="text-sm text-secondary capitalize">{user?.role || 'User'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Link href="/profile" className="block p-3 rounded-xl hover:bg-primary/10 text-sm font-ui transition-all duration-300 hover:translate-x-2">
                    Your Profile
                  </Link>
                  <Link href="/bookmarks" className="block p-3 rounded-xl hover:bg-primary/10 text-sm font-ui transition-all duration-300 hover:translate-x-2">
                    Bookmarks
                  </Link>
                  
                  {isAdmin && (
                    <Link href="/admin" className="block p-3 rounded-xl bg-gradient-to-r from-accent/10 to-accent/20 text-accent text-sm font-ui font-semibold transition-all duration-300 hover:translate-x-2">
                      Admin Dashboard
                    </Link>
                  )}
                  
                  <a href="/api/logout" className="block p-3 rounded-xl hover:bg-red-50 text-red-600 text-sm font-ui transition-all duration-300 hover:translate-x-2">
                    Sign Out
                  </a>
                </div>
              </>
            ) : (
              <Button asChild className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white py-3 rounded-xl font-semibold transition-all duration-300">
                <a href="/api/login">Sign In</a>
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
