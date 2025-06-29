import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getFirestoreArticleById, getFirestoreArticles, getFirestoreArticlesByCategory } from './firestoreArticleService';
import { adminDb } from './firebaseAdmin';
import { getFirestoreUserProfile, updateFirestoreUserProfile } from './firebaseUserService';
// OIDC/Passport auth removed
import { z } from "zod";
import { 
  articleSchema, 
  insertArticleSchema, 
  insertCommentSchema, 
  insertCategorySchema
} from "@shared/schema";

// Extend Express Request type to include 'user'
declare global {
  namespace Express {
    interface User {
      claims?: { sub?: string };
      [key: string]: any;
    }
    interface Request {
      user?: User;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // OIDC/Passport auth removed

  // Auth routes removed

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
      // const userId = req.user?.claims?.sub;
      const userId = undefined;
      const featured = await storage.getFeaturedArticle(userId);
      res.json(featured);
    } catch (error) {
      console.error("Error fetching featured article:", error);
      res.status(500).json({ message: "Failed to fetch featured article" });
    }
  });

  // Hybrid: get trending articles (Firestore first, fallback to SQL)
  app.get('/api/articles/trending', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      // Firestore: sort by viewCount and createdAt (recent & popular)
      const snapshot = await adminDb.collection('articles')
        .orderBy('viewCount', 'desc')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .offset((page - 1) * 10)
        .get();
      const articles = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      if (articles && articles.length > 0) return res.json({ articles, hasMore: false });
      // Fallback to SQL
      const sqlResult = await storage.getTrendingArticles(page, undefined);
      res.json(sqlResult);
    } catch (error) {
      console.error('Error fetching trending articles:', error);
      res.status(500).json({ message: 'Failed to fetch trending articles' });
    }
  });

  // Hybrid: get latest articles (Firestore first, fallback to SQL)
  app.get('/api/articles/latest', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      // Try Firestore first
      const articles = await getFirestoreArticles({ page });
      if (articles && articles.length > 0) return res.json({ articles, hasMore: false });
      // Fallback to SQL
      // const userId = req.user?.claims?.sub;
      const userId = undefined;
      const sqlResult = await storage.getLatestArticles(page, userId);
      res.json(sqlResult);
    } catch (error) {
      console.error("Error fetching latest articles:", error);
      res.status(500).json({ message: "Failed to fetch latest articles" });
    }
  });

  // Hybrid: get most-read articles (Firestore first, fallback to SQL)
  app.get('/api/articles/most-read', async (req, res) => {
    try {
      // Firestore: sort by viewCount (descending)
      const snapshot = await adminDb.collection('articles')
        .orderBy('viewCount', 'desc')
        .limit(10)
        .get();
      const articles = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      if (articles && articles.length > 0) return res.json(articles);
      // Fallback to SQL
      const sqlArticles = await storage.getMostReadArticles();
      res.json(sqlArticles);
    } catch (error) {
      console.error('Error fetching most read articles:', error);
      res.status(500).json({ message: 'Failed to fetch most read articles' });
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

  // Hybrid: get article by id (Firestore first, fallback to SQL)
  app.get('/api/articles/:id', async (req, res) => {
    try {
      const { id } = req.params;
      // Try Firestore first
      const article = await getFirestoreArticleById(id);
      if (article) return res.json(article);
      // Fallback to SQL
      // const userId = req.user?.claims?.sub;
      const userId = undefined;
      const sqlArticle = await storage.getArticleById(id, userId);
      if (!sqlArticle) return res.status(404).json({ message: 'Article not found' });
      res.json(sqlArticle);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  // Hybrid: get articles by category (Firestore first, fallback to SQL)
  app.get('/api/categories/:slug/articles', async (req, res) => {
    try {
      const { slug } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      // Try Firestore first
      const articles = await getFirestoreArticlesByCategory(slug, { page });
      if (articles && articles.length > 0) return res.json({ category: { slug }, articles, hasMore: false });
      // Fallback to SQL
      // const userId = req.user?.claims?.sub;
      const userId = undefined;
      const sqlResult = await storage.getArticlesByCategory(slug, page, userId);
      res.json(sqlResult);
    } catch (error) {
      console.error("Error fetching articles by category:", error);
      res.status(500).json({ message: "Failed to fetch articles by category" });
    }
  });

  // User interactions with article
  // User interactions with article (auth removed)
  // You may want to reimplement this with Firebase auth if needed

  // Article view tracking
  app.post('/api/articles/:id/view', async (req, res) => {
    try {
      const { id } = req.params;
      // const userId = req.user?.claims?.sub;
      const userId = undefined;
      await storage.recordArticleView(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error recording article view:", error);
      res.status(500).json({ message: "Failed to record article view" });
    }
  });

  // Like article
  // Like article (auth removed)

  // Bookmark article
  // Bookmark article (auth removed)

  // Comments
  // Comments endpoint (auth removed)
  app.post('/api/articles/:id/comments', async (req: any, res) => {
    try {
      const { id } = req.params;
      // const userId = req.user.claims.sub;
      const userId = undefined;
      
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

  // Like comment endpoint (auth removed)
  app.post('/api/comments/:id/like', async (req: any, res) => {
    try {
      const { id } = req.params;
      // TODO: Pass a valid userId from Firebase auth or session if needed
      // For now, reject if no userId
      return res.status(401).json({ message: "User authentication required" });
    } catch (error) {
      console.error("Error liking comment:", error);
      res.status(500).json({ message: "Failed to like comment" });
    }
  });

  // Dislike comment endpoint (auth removed)
  app.post('/api/comments/:id/dislike', async (req: any, res) => {
    try {
      const { id } = req.params;
      // TODO: Pass a valid userId from Firebase auth or session if needed
      // For now, reject if no userId
      return res.status(401).json({ message: "User authentication required" });
    } catch (error) {
      console.error("Error disliking comment:", error);
      res.status(500).json({ message: "Failed to dislike comment" });
    }
  });

  // Report comment endpoint (auth removed)
  app.post('/api/comments/:id/report', async (req: any, res) => {
    try {
      const { id } = req.params;
      // TODO: Pass a valid userId from Firebase auth or session if needed
      // For now, reject if no userId
      return res.status(401).json({ message: "User authentication required" });
    } catch (error) {
      console.error("Error reporting comment:", error);
      res.status(500).json({ message: "Failed to report comment" });
    }
  });

  // Patch comment endpoint (auth removed)
  app.patch('/api/comments/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      // TODO: Pass a valid userId from Firebase auth or session if needed
      // For now, reject if no userId
      return res.status(401).json({ message: "User authentication required" });
    } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({ message: "Failed to update comment" });
    }
  });

  app.delete('/api/comments/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      // TODO: Pass a valid userId from Firebase auth or session if needed
      // For now, reject if no userId
      return res.status(401).json({ message: "User authentication required" });
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
  // Bookmarks endpoint (auth removed)
  app.get('/api/user/bookmarks', async (req: any, res) => {
    return res.status(401).json({ message: "User authentication required" });
  });

  // Hybrid: get user profile (Firestore first, fallback to SQL)
  app.get('/api/user/profile', async (req: any, res) => {
    try {
      const userId = req.query.userId || req.body.userId || req.headers['x-user-id'];
      if (!userId) return res.status(400).json({ message: 'User ID required' });
      // Try Firestore first
      const profile = await getFirestoreUserProfile(userId);
      if (profile) return res.json(profile);
      // Fallback to SQL
      const sqlProfile = await storage.getUserProfile(userId);
      if (!sqlProfile) return res.status(404).json({ message: 'User not found' });
      res.json(sqlProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ message: 'Failed to fetch user profile' });
    }
  });

  // Hybrid: update user profile (Firestore first, fallback to SQL)
  app.patch('/api/user/profile', async (req: any, res) => {
    try {
      const userId = req.body.userId || req.query.userId || req.headers['x-user-id'];
      if (!userId) return res.status(400).json({ message: 'User ID required' });
      // Try Firestore first
      const updated = await updateFirestoreUserProfile(userId, req.body);
      return res.json(updated);
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ message: 'Failed to update user profile' });
    }
  });

  // User stats endpoint (auth removed)
  app.get('/api/user/stats', async (req: any, res) => {
    return res.status(401).json({ message: "User authentication required" });
  });

  // User preferences endpoint (auth removed)
  app.post('/api/user/preferences', async (req: any, res) => {
    return res.status(401).json({ message: "User authentication required" });
  });

  // Admin routes
  // Admin middleware (auth removed)
  const adminMiddleware = async (req: any, res: any, next: any) => {
    return res.status(401).json({ message: "Admin authentication required" });
  };

  // Admin dashboard metrics
  app.get('/api/admin/metrics', adminMiddleware, async (req, res) => {
    try {
      const metrics = await storage.getAdminMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching admin metrics:", error);
      res.status(500).json({ message: "Failed to fetch admin metrics" });
    }
  });

  // Admin articles management
  app.get('/api/admin/articles', adminMiddleware, async (req, res) => {
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

  app.get('/api/admin/articles/recent', adminMiddleware, async (req, res) => {
    try {
      const articles = await storage.getRecentArticles();
      res.json(articles);
    } catch (error) {
      console.error("Error fetching recent articles:", error);
      res.status(500).json({ message: "Failed to fetch recent articles" });
    }
  });

  // CRUD for articles
  app.post('/api/articles', adminMiddleware, async (req: any, res) => {
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

  app.patch('/api/articles/:id', adminMiddleware, async (req, res) => {
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

  app.delete('/api/articles/:id', adminMiddleware, async (req, res) => {
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
  app.get('/api/admin/comments/:status', adminMiddleware, async (req, res) => {
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

  app.get('/api/admin/comments/moderation', adminMiddleware, async (req, res) => {
    try {
      const comments = await storage.getCommentsForModeration();
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments for moderation:", error);
      res.status(500).json({ message: "Failed to fetch comments for moderation" });
    }
  });

  app.post('/api/admin/comments/:id/:action', adminMiddleware, async (req, res) => {
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
  app.get('/api/admin/settings', adminMiddleware, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post('/api/admin/settings/:section', adminMiddleware, async (req, res) => {
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
  // Developer middleware (auth removed)
  const developerMiddleware = async (req: any, res: any, next: any) => {
    return res.status(401).json({ message: "Developer authentication required" });
  };

  app.post('/api/admin/cache/clear', developerMiddleware, async (req, res) => {
    try {
      // This would be a real cache clearing operation in production
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing cache:", error);
      res.status(500).json({ message: "Failed to clear cache" });
    }
  });

  app.post('/api/admin/database/maintenance', developerMiddleware, async (req, res) => {
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
