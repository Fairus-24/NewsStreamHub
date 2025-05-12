import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import { 
  articleSchema, 
  categorySchema, 
  insertArticleSchema, 
  insertCommentSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Categories
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Home page data
  app.get('/api/articles/featured', async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const featured = await storage.getFeaturedArticle(userId);
      res.json(featured);
    } catch (error) {
      console.error("Error fetching featured article:", error);
      res.status(500).json({ message: "Failed to fetch featured article" });
    }
  });

  app.get('/api/articles/trending', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const userId = req.user?.claims?.sub;
      const trending = await storage.getTrendingArticles(page, userId);
      res.json(trending);
    } catch (error) {
      console.error("Error fetching trending articles:", error);
      res.status(500).json({ message: "Failed to fetch trending articles" });
    }
  });

  app.get('/api/articles/latest', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const userId = req.user?.claims?.sub;
      const latest = await storage.getLatestArticles(page, userId);
      res.json(latest);
    } catch (error) {
      console.error("Error fetching latest articles:", error);
      res.status(500).json({ message: "Failed to fetch latest articles" });
    }
  });

  app.get('/api/articles/most-read', async (req, res) => {
    try {
      const mostRead = await storage.getMostReadArticles();
      res.json(mostRead);
    } catch (error) {
      console.error("Error fetching most read articles:", error);
      res.status(500).json({ message: "Failed to fetch most read articles" });
    }
  });

  app.get('/api/topics/popular', async (req, res) => {
    try {
      const topics = await storage.getPopularTopics();
      res.json(topics);
    } catch (error) {
      console.error("Error fetching popular topics:", error);
      res.status(500).json({ message: "Failed to fetch popular topics" });
    }
  });

  // Articles by category
  app.get('/api/categories/:slug/articles', async (req, res) => {
    try {
      const { slug } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const userId = req.user?.claims?.sub;
      const result = await storage.getArticlesByCategory(slug, page, userId);
      res.json(result);
    } catch (error) {
      console.error("Error fetching articles by category:", error);
      res.status(500).json({ message: "Failed to fetch articles by category" });
    }
  });

  // Article details
  app.get('/api/articles/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      const article = await storage.getArticleById(id, userId);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      res.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  // User interactions with article
  app.get('/api/articles/:id/user-interactions', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const interactions = await storage.getUserArticleInteractions(id, userId);
      res.json(interactions);
    } catch (error) {
      console.error("Error fetching user interactions:", error);
      res.status(500).json({ message: "Failed to fetch user interactions" });
    }
  });

  // Article view tracking
  app.post('/api/articles/:id/view', async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.claims?.sub;
      await storage.recordArticleView(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error recording article view:", error);
      res.status(500).json({ message: "Failed to record article view" });
    }
  });

  // Like article
  app.post('/api/articles/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const { liked } = req.body;
      
      if (liked) {
        await storage.likeArticle(id, userId);
      } else {
        await storage.unlikeArticle(id, userId);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error liking/unliking article:", error);
      res.status(500).json({ message: "Failed to like/unlike article" });
    }
  });

  // Bookmark article
  app.post('/api/articles/:id/bookmark', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const { bookmarked } = req.body;
      
      if (bookmarked) {
        await storage.bookmarkArticle(id, userId);
      } else {
        await storage.unbookmarkArticle(id, userId);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error bookmarking/unbookmarking article:", error);
      res.status(500).json({ message: "Failed to bookmark/unbookmark article" });
    }
  });

  // Comments
  app.post('/api/articles/:id/comments', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const commentData = insertCommentSchema.parse({
        content: req.body.content,
        articleId: id,
        parentId: req.body.parentId || null,
        authorId: userId
      });
      
      const comment = await storage.createComment(commentData);
      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.post('/api/comments/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      await storage.likeComment(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error liking comment:", error);
      res.status(500).json({ message: "Failed to like comment" });
    }
  });

  app.post('/api/comments/:id/dislike', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      await storage.dislikeComment(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error disliking comment:", error);
      res.status(500).json({ message: "Failed to dislike comment" });
    }
  });

  app.post('/api/comments/:id/report', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      await storage.reportComment(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error reporting comment:", error);
      res.status(500).json({ message: "Failed to report comment" });
    }
  });

  app.patch('/api/comments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const { content } = req.body;
      
      const comment = await storage.updateComment(id, userId, content);
      res.json(comment);
    } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({ message: "Failed to update comment" });
    }
  });

  app.delete('/api/comments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Allow admins/developers to delete any comment
      const isAdmin = user?.role === 'admin' || user?.role === 'developer';
      
      await storage.deleteComment(id, userId, isAdmin);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Search
  app.get('/api/articles/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      const userId = req.user?.claims?.sub;
      
      if (!query) {
        return res.json({
          articles: [],
          hasMore: false,
          total: 0
        });
      }
      
      const results = await storage.searchArticles(query, page, userId);
      res.json(results);
    } catch (error) {
      console.error("Error searching articles:", error);
      res.status(500).json({ message: "Failed to search articles" });
    }
  });

  // User profile and bookmarks
  app.get('/api/user/bookmarks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookmarks = await storage.getUserBookmarks(userId);
      res.json(bookmarks);
    } catch (error) {
      console.error("Error fetching user bookmarks:", error);
      res.status(500).json({ message: "Failed to fetch user bookmarks" });
    }
  });

  app.get('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profile = await storage.getUserProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  app.patch('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { username, bio, profileImageUrl } = req.body;
      
      const profile = await storage.updateUserProfile(userId, {
        username,
        bio,
        profileImageUrl
      });
      
      res.json(profile);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  app.get('/api/user/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  app.post('/api/user/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { newsletter, commentReplies, articleUpdates } = req.body;
      
      await storage.updateUserPreferences(userId, {
        newsletter,
        commentReplies,
        articleUpdates
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ message: "Failed to update user preferences" });
    }
  });

  // Admin routes
  const adminMiddleware = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin' && user?.role !== 'developer') {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }
      
      next();
    } catch (error) {
      console.error("Error in admin middleware:", error);
      res.status(500).json({ message: "Server error" });
    }
  };

  // Admin dashboard metrics
  app.get('/api/admin/metrics', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const metrics = await storage.getAdminMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching admin metrics:", error);
      res.status(500).json({ message: "Failed to fetch admin metrics" });
    }
  });

  // Admin articles management
  app.get('/api/admin/articles', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const search = req.query.search as string || '';
      const category = req.query.category as string || 'all';
      
      const articles = await storage.getAdminArticles(page, search, category);
      res.json(articles);
    } catch (error) {
      console.error("Error fetching admin articles:", error);
      res.status(500).json({ message: "Failed to fetch admin articles" });
    }
  });

  app.get('/api/admin/articles/recent', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const articles = await storage.getRecentArticles();
      res.json(articles);
    } catch (error) {
      console.error("Error fetching recent articles:", error);
      res.status(500).json({ message: "Failed to fetch recent articles" });
    }
  });

  // CRUD for articles
  app.post('/api/articles', isAuthenticated, adminMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const articleData = insertArticleSchema.parse({
        ...req.body,
        authorId: userId
      });
      
      const article = await storage.createArticle(articleData);
      res.json(article);
    } catch (error) {
      console.error("Error creating article:", error);
      res.status(500).json({ message: "Failed to create article" });
    }
  });

  app.patch('/api/articles/:id', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      
      const articleData = {
        title: req.body.title,
        excerpt: req.body.excerpt,
        content: req.body.content,
        image: req.body.image,
        categoryId: req.body.categoryId,
        isBreaking: req.body.isBreaking,
        tags: req.body.tags
      };
      
      const article = await storage.updateArticle(id, articleData);
      res.json(article);
    } catch (error) {
      console.error("Error updating article:", error);
      res.status(500).json({ message: "Failed to update article" });
    }
  });

  app.delete('/api/articles/:id', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteArticle(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting article:", error);
      res.status(500).json({ message: "Failed to delete article" });
    }
  });

  // Admin comment moderation
  app.get('/api/admin/comments/:status', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { status } = req.params;
      const search = req.query.search as string || '';
      
      if (!['pending', 'approved', 'rejected', 'flagged'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const comments = await storage.getCommentsByStatus(status, search);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments by status:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.get('/api/admin/comments/moderation', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const comments = await storage.getCommentsForModeration();
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments for moderation:", error);
      res.status(500).json({ message: "Failed to fetch comments for moderation" });
    }
  });

  app.post('/api/admin/comments/:id/:action', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { id, action } = req.params;
      
      if (!['approve', 'reject', 'flag'].includes(action)) {
        return res.status(400).json({ message: "Invalid action" });
      }
      
      await storage.moderateComment(id, action);
      res.json({ success: true });
    } catch (error) {
      console.error(`Error ${req.params.action}ing comment:`, error);
      res.status(500).json({ message: `Failed to ${req.params.action} comment` });
    }
  });

  // Admin settings
  app.get('/api/admin/settings', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post('/api/admin/settings/:section', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { section } = req.params;
      
      if (!['general', 'users', 'advanced'].includes(section)) {
        return res.status(400).json({ message: "Invalid settings section" });
      }
      
      await storage.updateSettings(section, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Developer-only routes
  const developerMiddleware = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'developer') {
        return res.status(403).json({ message: "Forbidden: Developer access required" });
      }
      
      next();
    } catch (error) {
      console.error("Error in developer middleware:", error);
      res.status(500).json({ message: "Server error" });
    }
  };

  app.post('/api/admin/cache/clear', isAuthenticated, developerMiddleware, async (req, res) => {
    try {
      // This would be a real cache clearing operation in production
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing cache:", error);
      res.status(500).json({ message: "Failed to clear cache" });
    }
  });

  app.post('/api/admin/database/maintenance', isAuthenticated, developerMiddleware, async (req, res) => {
    try {
      // This would be a real database maintenance operation in production
      res.json({ success: true });
    } catch (error) {
      console.error("Error running database maintenance:", error);
      res.status(500).json({ message: "Failed to run database maintenance" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
