import { Route, Switch } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Home from "@/pages/Home";
import ArticlePage from "@/pages/ArticlePage";
import CategoryPage from "@/pages/CategoryPage";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminArticles from "@/pages/admin/Articles";
import CreateArticle from "@/pages/admin/CreateArticle";
import EditArticle from "@/pages/admin/EditArticle";
import AdminComments from "@/pages/admin/Comments";
import AdminSettings from "@/pages/admin/Settings";
import UserProfile from "@/pages/user/Profile";
import UserBookmarks from "@/pages/user/Bookmarks";
import Search from "@/pages/Search";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/article/:id" component={ArticlePage} />
      <Route path="/category/:slug" component={CategoryPage} />
      <Route path="/search" component={Search} />
      
      {/* User routes */}
      <Route path="/profile" component={UserProfile} />
      <Route path="/bookmarks" component={UserBookmarks} />
      
      {/* Admin routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/articles" component={AdminArticles} />
      <Route path="/admin/articles/create" component={CreateArticle} />
      <Route path="/admin/articles/edit/:id" component={EditArticle} />
      <Route path="/admin/comments" component={AdminComments} />
      <Route path="/admin/settings" component={AdminSettings} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Router />
          </main>
          <Footer />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
