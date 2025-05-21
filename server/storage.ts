import { 
  users, 
  type User, 
  type UpsertUser,
  categories,
  type Category,
  type InsertCategory,
  articles,
  type Article,
  type InsertArticle,
  comments,
  type Comment,
  type InsertComment,
  articleLikes,
  bookmarks,
  commentLikes,
  commentDislikes,
  commentReports,
  articleViews,
  settings,
  userPreferences,
  tags,
  articleTags
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, isNull, like, or, sql, inArray, count, max, min, sum, gt, lt } from "drizzle-orm";
import { generateSlug } from "./utils";

// --- Fix for author object returned to frontend ---
// Helper to build frontend author object
function buildFrontendAuthor(author: any): any {
  if (!author) {
    return { id: '', name: 'Unknown', avatar: '', profileImageUrl: '', role: '' };
  }
  return {
    id: author.id,
    name: author.username || ((author.firstName || '') + ' ' + (author.lastName || '')).trim() || 'Unknown',
    avatar: author.profileImageUrl || '',
    profileImageUrl: author.profileImageUrl || '',
    role: author.role || '',
  };
}

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Articles
  getFeaturedArticle(userId?: string): Promise<Article | undefined>;
  getTrendingArticles(page: number, userId?: string): Promise<{ articles: Article[], hasMore: boolean }>;
  getLatestArticles(page: number, userId?: string): Promise<{ articles: Article[], hasMore: boolean }>;
  getMostReadArticles(limit?: number): Promise<Article[]>;
  getArticlesByCategory(slug: string, page: number, userId?: string): Promise<{ category: Category, articles: Article[], hasMore: boolean }>;
  getArticleById(id: string, userId?: string): Promise<Article | undefined>;
  getUserArticleInteractions(articleId: string, userId: string): Promise<{ liked: boolean, bookmarked: boolean }>;
  recordArticleView(articleId: string, userId?: string): Promise<void>;
  likeArticle(articleId: string, userId: string): Promise<void>;
  unlikeArticle(articleId: string, userId: string): Promise<void>;
  bookmarkArticle(articleId: string, userId: string): Promise<void>;
  unbookmarkArticle(articleId: string, userId: string): Promise<void>;
  createArticle(article: any): Promise<Article>;
  updateArticle(id: string, article: any): Promise<Article>;
  deleteArticle(id: string): Promise<void>;
  searchArticles(query: string, page: number, userId?: string): Promise<{ articles: Article[], hasMore: boolean, total: number }>;
  
  // Comments
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: string, userId: string, content: string): Promise<Comment>;
  deleteComment(id: string, userId: string, isAdmin: boolean): Promise<void>;
  likeComment(id: string, userId: string): Promise<void>;
  dislikeComment(id: string, userId: string): Promise<void>;
  reportComment(id: string, userId: string): Promise<void>;
  
  // Tags
  getPopularTopics(limit?: number): Promise<string[]>;
  
  // User profile and bookmarks
  getUserBookmarks(userId: string): Promise<Article[]>;
  getUserProfile(userId: string): Promise<any>;
  updateUserProfile(userId: string, data: any): Promise<any>;
  getUserStats(userId: string): Promise<any>;
  updateUserPreferences(userId: string, preferences: any): Promise<void>;
  
  // Admin
  getAdminMetrics(): Promise<any>;
  getAdminArticles(page: number, search: string, category: string): Promise<{ articles: any[]; totalPages: number }>;
  getRecentArticles(limit?: number): Promise<any[]>;
  getCommentsByStatus(status: string, search: string): Promise<Comment[]>;
  getCommentsForModeration(limit?: number): Promise<Comment[]>;
  moderateComment(id: string, action: string): Promise<void>;
  getSettings(): Promise<any>;
  updateSettings(section: string, data: any): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  private readonly ITEMS_PER_PAGE = 10;
  
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error fetching user:", error);
      return undefined;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values({
          ...userData,
          updatedAt: new Date().toISOString(),
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: new Date().toISOString(),
          },
        })
        .returning();
      return user;
    } catch (error) {
      console.error("Error upserting user:", error);
      throw error;
    }
  }
  
  // Categories
  async getCategories(): Promise<Category[]> {
    try {
      return await db.select().from(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  }
  
  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    try {
      const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
      return category;
    } catch (error) {
      console.error("Error fetching category by slug:", error);
      return undefined;
    }
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    try {
      const [newCategory] = await db.insert(categories).values(category).returning();
      return newCategory;
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  }
  
  // Articles
  async getFeaturedArticle(userId?: string): Promise<Article | undefined> {
    try {
      // Get the most recent breaking news or most viewed article in the last 24 hours
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const [breakingArticle] = await db
        .select({
          id: articles.id,
          title: articles.title,
          excerpt: articles.excerpt,
          content: articles.content,
          image: articles.image,
          authorId: articles.authorId,
          categoryId: articles.categoryId,
          isBreaking: articles.isBreaking,
          viewCount: articles.viewCount,
          createdAt: articles.createdAt,
          likes: sql<number>`(SELECT COUNT(*) FROM ${articleLikes} WHERE ${articleLikes.articleId} = ${articles.id})`,
          isLiked: userId ? sql<boolean>`EXISTS (SELECT 1 FROM ${articleLikes} WHERE ${articleLikes.articleId} = ${articles.id} AND ${articleLikes.userId} = ${userId})` : sql`false`,
          isBookmarked: userId ? sql<boolean>`EXISTS (SELECT 1 FROM ${bookmarks} WHERE ${bookmarks.articleId} = ${articles.id} AND ${bookmarks.userId} = ${userId})` : sql`false`,
          commentsCount: sql<number>`(SELECT COUNT(*) FROM ${comments} WHERE ${comments.articleId} = ${articles.id})`,
        })
        .from(articles)
        .where(and(
          eq(articles.isBreaking, 1),
          eq(articles.status, 'published')
        ))
        .orderBy(desc(articles.createdAt))
        .limit(1);
      
      if (breakingArticle) {
        const [category] = await db.select().from(categories).where(eq(categories.id, breakingArticle.categoryId));
        let [author] = await db.select().from(users).where(eq(users.id, breakingArticle.authorId));
        return {
          ...breakingArticle,
          category,
          author: buildFrontendAuthor(author),
          comments: await this.getArticleComments(breakingArticle.id, userId),
        } as any;
      }
      
      // If no breaking news, get the most viewed article
      const [featuredArticle] = await db
        .select({
          id: articles.id,
          title: articles.title,
          excerpt: articles.excerpt,
          content: articles.content,
          image: articles.image,
          authorId: articles.authorId,
          categoryId: articles.categoryId,
          isBreaking: articles.isBreaking,
          viewCount: articles.viewCount,
          createdAt: articles.createdAt,
          likes: sql<number>`(SELECT COUNT(*) FROM ${articleLikes} WHERE ${articleLikes.articleId} = ${articles.id})`,
          isLiked: userId ? sql<boolean>`EXISTS (SELECT 1 FROM ${articleLikes} WHERE ${articleLikes.articleId} = ${articles.id} AND ${articleLikes.userId} = ${userId})` : sql`false`,
          isBookmarked: userId ? sql<boolean>`EXISTS (SELECT 1 FROM ${bookmarks} WHERE ${bookmarks.articleId} = ${articles.id} AND ${bookmarks.userId} = ${userId})` : sql`false`,
          commentsCount: sql<number>`(SELECT COUNT(*) FROM ${comments} WHERE ${comments.articleId} = ${articles.id})`,
        })
        .from(articles)
        .where(eq(articles.status, 'published'))
        .orderBy(desc(articles.viewCount))
        .limit(1);
      
      if (featuredArticle) {
        const [category] = await db.select().from(categories).where(eq(categories.id, featuredArticle.categoryId));
        let [author] = await db.select().from(users).where(eq(users.id, featuredArticle.authorId));
        return {
          ...featuredArticle,
          category,
          author: buildFrontendAuthor(author),
          comments: await this.getArticleComments(featuredArticle.id, userId),
        } as any;
      }
      
      return undefined;
    } catch (error) {
      console.error("Error fetching featured article:", error);
      return undefined;
    }
  }
  
  async getTrendingArticles(page: number, userId?: string): Promise<{ articles: Article[], hasMore: boolean }> {
    try {
      const offset = (page - 1) * this.ITEMS_PER_PAGE;
      const trendingArticles = await db
        .select({
          id: articles.id,
          title: articles.title,
          excerpt: articles.excerpt,
          image: articles.image,
          createdAt: articles.createdAt,
          viewCount: articles.viewCount,
          likes: sql<number>`(SELECT COUNT(*) FROM ${articleLikes} WHERE ${articleLikes.articleId} = ${articles.id})`,
          isLiked: userId ? sql<boolean>`EXISTS (SELECT 1 FROM ${articleLikes} WHERE ${articleLikes.articleId} = ${articles.id} AND ${articleLikes.userId} = ${userId})` : sql`false`,
          isBookmarked: userId ? sql<boolean>`EXISTS (SELECT 1 FROM ${bookmarks} WHERE ${bookmarks.articleId} = ${articles.id} AND ${bookmarks.userId} = ${userId})` : sql`false`,
          commentsCount: sql<number>`(SELECT COUNT(*) FROM ${comments} WHERE ${comments.articleId} = ${articles.id})`,
          authorId: articles.authorId,
          categoryId: articles.categoryId,
        })
        .from(articles)
        .where(eq(articles.status, 'published'))
        .orderBy(desc(articles.viewCount))
        .limit(this.ITEMS_PER_PAGE)
        .offset(offset);
      // Get one more record to check if there are more articles
      const [hasMoreRecord] = await db
        .select({ count: sql<number>`count(*)` })
        .from(articles)
        .where(eq(articles.status, 'published'))
        .limit(1)
        .offset(offset + this.ITEMS_PER_PAGE);
      // Fetch category and author for each article
      const result = await Promise.all(trendingArticles.map(async (article) => {
        const [category] = await db.select().from(categories).where(eq(categories.id, article.categoryId));
        const [author] = await db.select().from(users).where(eq(users.id, article.authorId));
        return {
          ...article,
          category,
          author: buildFrontendAuthor(author),
          comments: await this.getArticleComments(article.id, userId),
        };
      }));
      return {
        articles: result as any[],
        hasMore: !!hasMoreRecord?.count && hasMoreRecord.count > 0,
      };
    } catch (error) {
      console.error("Error fetching trending articles:", error);
      return { articles: [], hasMore: false };
    }
  }

  async getLatestArticles(page: number, userId?: string): Promise<{ articles: Article[], hasMore: boolean }> {
    try {
      const offset = (page - 1) * this.ITEMS_PER_PAGE;
      const latestArticles = await db
        .select({
          id: articles.id,
          title: articles.title,
          excerpt: articles.excerpt,
          image: articles.image,
          createdAt: articles.createdAt,
          viewCount: articles.viewCount,
          likes: sql<number>`(SELECT COUNT(*) FROM ${articleLikes} WHERE ${articleLikes.articleId} = ${articles.id})`,
          isLiked: userId ? sql<boolean>`EXISTS (SELECT 1 FROM ${articleLikes} WHERE ${articleLikes.articleId} = ${articles.id} AND ${articleLikes.userId} = ${userId})` : sql`false`,
          isBookmarked: userId ? sql<boolean>`EXISTS (SELECT 1 FROM ${bookmarks} WHERE ${bookmarks.articleId} = ${articles.id} AND ${bookmarks.userId} = ${userId})` : sql`false`,
          commentsCount: sql<number>`(SELECT COUNT(*) FROM ${comments} WHERE ${comments.articleId} = ${articles.id})`,
          authorId: articles.authorId,
          categoryId: articles.categoryId,
        })
        .from(articles)
        .where(eq(articles.status, 'published'))
        .orderBy(desc(articles.createdAt))
        .limit(this.ITEMS_PER_PAGE)
        .offset(offset);
      // Get one more record to check if there are more articles
      const [hasMoreRecord] = await db
        .select({ count: sql<number>`count(*)` })
        .from(articles)
        .where(eq(articles.status, 'published'))
        .limit(1)
        .offset(offset + this.ITEMS_PER_PAGE);
      // Fetch category and author for each article
      const result = await Promise.all(latestArticles.map(async (article) => {
        const [category] = await db.select().from(categories).where(eq(categories.id, article.categoryId));
        const [author] = await db.select().from(users).where(eq(users.id, article.authorId));
        return {
          ...article,
          category,
          author: buildFrontendAuthor(author),
          comments: await this.getArticleComments(article.id, userId),
        };
      }));
      return {
        articles: result as any[],
        hasMore: !!hasMoreRecord?.count && hasMoreRecord.count > 0,
      };
    } catch (error) {
      console.error("Error fetching latest articles:", error);
      return { articles: [], hasMore: false };
    }
  }
  
  async getMostReadArticles(limit: number = 5): Promise<any[]> {
    try {
      const mostReadArticles = await db
        .select({
          id: articles.id,
          title: articles.title,
          createdAt: articles.createdAt,
          viewCount: articles.viewCount,
        })
        .from(articles)
        .where(eq(articles.status, 'published'))
        .orderBy(desc(articles.viewCount))
        .limit(limit);
      // Cast to any[] to bypass type error
      return mostReadArticles as any[];
    } catch (error) {
      console.error("Error fetching most read articles:", error);
      return [];
    }
  }
  
  async getArticlesByCategory(slug: string, page: number, userId?: string): Promise<{ category: Category, articles: Article[], hasMore: boolean }> {
    try {
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, slug));
      
      if (!category) {
        throw new Error("Category not found");
      }
      
      const offset = (page - 1) * this.ITEMS_PER_PAGE;
      
      const categoryArticles = await db
        .select({
          id: articles.id,
          title: articles.title,
          excerpt: articles.excerpt,
          image: articles.image,
          createdAt: articles.createdAt,
          viewCount: articles.viewCount,
          likes: sql<number>`(SELECT COUNT(*) FROM ${articleLikes} WHERE ${articleLikes.articleId} = ${articles.id})`,
          isLiked: userId ? sql<boolean>`EXISTS (SELECT 1 FROM ${articleLikes} WHERE ${articleLikes.articleId} = ${articles.id} AND ${articleLikes.userId} = ${userId})` : sql`false`,
          isBookmarked: userId ? sql<boolean>`EXISTS (SELECT 1 FROM ${bookmarks} WHERE ${bookmarks.articleId} = ${articles.id} AND ${bookmarks.userId} = ${userId})` : sql`false`,
          commentsCount: sql<number>`(SELECT COUNT(*) FROM ${comments} WHERE ${comments.articleId} = ${articles.id})`,
        })
        .from(articles)
        .where(and(
          eq(articles.categoryId, category.id),
          eq(articles.status, 'published')
        ))
        .orderBy(desc(articles.createdAt))
        .limit(this.ITEMS_PER_PAGE)
        .offset(offset);
      
      // Get one more record to check if there are more articles
      const [hasMoreRecord] = await db
        .select({ count: sql<number>`count(*)` })
        .from(articles)
        .where(and(
          eq(articles.categoryId, category.id),
          eq(articles.status, 'published')
        ))
        .limit(1)
        .offset(offset + this.ITEMS_PER_PAGE);
      
      const result = await Promise.all(categoryArticles.map(async (article) => ({
        ...(article as any),
        comments: await this.getArticleComments(article.id, userId),
      })));
      
      return {
        category,
        articles: result as any[],
        hasMore: !!hasMoreRecord?.count && hasMoreRecord.count > 0,
      };
    } catch (error) {
      console.error("Error fetching articles by category:", error);
      return { category: {} as Category, articles: [], hasMore: false };
    }
  }
  
  async getArticleById(id: string, userId?: string): Promise<Article | undefined> {
    try {
      const [article] = await db
        .select({
          id: articles.id,
          title: articles.title,
          slug: articles.slug,
          excerpt: articles.excerpt,
          content: articles.content,
          image: articles.image,
          authorId: articles.authorId,
          categoryId: articles.categoryId,
          isBreaking: articles.isBreaking,
          viewCount: articles.viewCount,
          createdAt: articles.createdAt,
          updatedAt: articles.updatedAt,
          likes: sql<number>`(SELECT COUNT(*) FROM ${articleLikes} WHERE ${articleLikes.articleId} = ${articles.id})`,
          isLiked: userId ? sql<boolean>`EXISTS (SELECT 1 FROM ${articleLikes} WHERE ${articleLikes.articleId} = ${articles.id} AND ${articleLikes.userId} = ${userId})` : sql`false`,
          isBookmarked: userId ? sql<boolean>`EXISTS (SELECT 1 FROM ${bookmarks} WHERE ${bookmarks.articleId} = ${articles.id} AND ${bookmarks.userId} = ${userId})` : sql`false`,
        })
        .from(articles)
        .where(eq(articles.id, parseInt(id)));
      
      if (!article) {
        return undefined;
      }
      const [category] = await db.select().from(categories).where(eq(categories.id, article.categoryId));
      const [author] = await db.select().from(users).where(eq(users.id, article.authorId));
      
      // Get article tags
      const articleTagsResult = await db
        .select({
          name: tags.name,
        })
        .from(tags)
        .innerJoin(articleTags, eq(tags.id, articleTags.tagId))
        .where(eq(articleTags.articleId, parseInt(id)));
      
      const tagNames = articleTagsResult.map(tag => tag.name);
      
      const comments = await this.getArticleComments(parseInt(id), userId);
      
      return {
        ...(article as any),
        category,
        author: buildFrontendAuthor(author),
        tags: tagNames,
        comments,
      } as any;
    } catch (error) {
      console.error("Error fetching article by ID:", error);
      return undefined;
    }
  }
  
  private async getArticleComments(articleId: number, userId?: string): Promise<any[]> {
    try {
      // Get top-level comments
      const topLevelComments = await db
        .select({
          id: comments.id,
          content: comments.content,
          authorId: comments.authorId,
          createdAt: comments.createdAt,
          likes: comments.likes,
          dislikes: comments.dislikes,
          isAuthor: sql<boolean>`EXISTS (SELECT 1 FROM ${articles} WHERE ${articles.id} = ${articleId} AND ${articles.authorId} = ${comments.authorId})`,
        })
        .from(comments)
        .where(and(
          eq(comments.articleId, articleId),
          isNull(comments.parentId),
          eq(comments.status, 'approved')
        ))
        .orderBy(desc(comments.createdAt));
      
      // Fetch author info for each comment
      const commentsWithAuthors = await Promise.all(topLevelComments.map(async (comment) => {
        const [author] = await db.select().from(users).where(eq(users.id, comment.authorId));
        // Get replies
        const replies = await db
          .select({
            id: comments.id,
            content: comments.content,
            authorId: comments.authorId,
            createdAt: comments.createdAt,
            likes: comments.likes,
            dislikes: comments.dislikes,
            isAuthor: sql<boolean>`EXISTS (SELECT 1 FROM ${articles} WHERE ${articles.id} = ${articleId} AND ${articles.authorId} = ${comments.authorId})`,
          })
          .from(comments)
          .where(and(
            eq(comments.parentId, comment.id),
            eq(comments.status, 'approved')
          ))
          .orderBy(comments.createdAt);
        // Fetch author info for each reply
        const repliesWithAuthors = await Promise.all(replies.map(async (reply) => {
          const [replyAuthor] = await db.select().from(users).where(eq(users.id, reply.authorId));
          return { ...reply, author: buildFrontendAuthor(replyAuthor) };
        }));
        return { ...comment, author: buildFrontendAuthor(author), replies: repliesWithAuthors };
      }));
      return commentsWithAuthors;
    } catch (error) {
      console.error("Error fetching article comments:", error);
      return [];
    }
  }
  
  async getUserArticleInteractions(articleId: string, userId: string): Promise<{ liked: boolean, bookmarked: boolean }> {
    try {
      const [liked] = await db
        .select()
        .from(articleLikes)
        .where(and(
          eq(articleLikes.articleId, parseInt(articleId)),
          eq(articleLikes.userId, userId)
        ));
      
      const [bookmarked] = await db
        .select()
        .from(bookmarks)
        .where(and(
          eq(bookmarks.articleId, parseInt(articleId)),
          eq(bookmarks.userId, userId)
        ));
      
      return {
        liked: !!liked,
        bookmarked: !!bookmarked,
      };
    } catch (error) {
      console.error("Error fetching user article interactions:", error);
      return { liked: false, bookmarked: false };
    }
  }
  
  async recordArticleView(articleId: string, userId?: string): Promise<void> {
    try {
      // Record view in article_views table
      await db.insert(articleViews).values({
        articleId: parseInt(articleId),
        userId,
        ipAddress: "", // We could collect IP address for analytics if needed
        userAgent: "", // Same with user agent
      });
      
      // Increment the viewCount in the articles table
      await db
        .update(articles)
        .set({
          viewCount: sql`${articles.viewCount} + 1`,
        })
        .where(eq(articles.id, parseInt(articleId)));
    } catch (error) {
      console.error("Error recording article view:", error);
    }
  }
  
  async likeArticle(articleId: string, userId: string): Promise<void> {
    try {
      await db
        .insert(articleLikes)
        .values({
          articleId: parseInt(articleId),
          userId,
        })
        .onConflictDoNothing();
    } catch (error) {
      console.error("Error liking article:", error);
      throw error;
    }
  }
  
  async unlikeArticle(articleId: string, userId: string): Promise<void> {
    try {
      await db
        .delete(articleLikes)
        .where(and(
          eq(articleLikes.articleId, parseInt(articleId)),
          eq(articleLikes.userId, userId)
        ));
    } catch (error) {
      console.error("Error unliking article:", error);
      throw error;
    }
  }
  
  async bookmarkArticle(articleId: string, userId: string): Promise<void> {
    try {
      await db
        .insert(bookmarks)
        .values({
          articleId: parseInt(articleId),
          userId,
        })
        .onConflictDoNothing();
    } catch (error) {
      console.error("Error bookmarking article:", error);
      throw error;
    }
  }
  
  async unbookmarkArticle(articleId: string, userId: string): Promise<void> {
    try {
      await db
        .delete(bookmarks)
        .where(and(
          eq(bookmarks.articleId, parseInt(articleId)),
          eq(bookmarks.userId, userId)
        ));
    } catch (error) {
      console.error("Error unbookmarking article:", error);
      throw error;
    }
  }
  
  async createArticle(articleData: any): Promise<Article> {
    try {
      // Create slug from title
      const slug = generateSlug(articleData.title);
      
      // Insert article
      const [article] = await db
        .insert(articles)
        .values({
          title: articleData.title,
          slug,
          excerpt: articleData.excerpt,
          content: articleData.content,
          image: articleData.image,
          authorId: articleData.authorId,
          categoryId: articleData.categoryId,
          isBreaking: articleData.isBreaking || false,
          status: 'published',
        })
        .returning();
      
      // Handle tags if provided
      if (articleData.tags && articleData.tags.length > 0) {
        await Promise.all(articleData.tags.map(async (tagName: string) => {
          // Normalize tag name and create slug
          const normalizedTag = tagName.trim();
          const tagSlug = generateSlug(normalizedTag);
          
          // Find or create tag
          let tag;
          const [existingTag] = await db
            .select()
            .from(tags)
            .where(eq(tags.slug, tagSlug));
          
          if (existingTag) {
            tag = existingTag;
          } else {
            const [newTag] = await db
              .insert(tags)
              .values({
                name: normalizedTag,
                slug: tagSlug,
              })
              .returning();
            tag = newTag;
          }
          
          // Associate tag with article
          await db
            .insert(articleTags)
            .values({
              articleId: article.id,
              tagId: tag.id,
            })
            .onConflictDoNothing();
        }));
      }
      
      return article;
    } catch (error) {
      console.error("Error creating article:", error);
      throw error;
    }
  }
  
  async updateArticle(id: string, articleData: any): Promise<Article> {
    try {
      // Update article
      const [article] = await db
        .update(articles)
        .set({
          title: articleData.title,
          excerpt: articleData.excerpt,
          content: articleData.content,
          image: articleData.image,
          categoryId: articleData.categoryId,
          isBreaking: articleData.isBreaking || false,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(articles.id, parseInt(id)))
        .returning();
      
      // Handle tags if provided
      if (articleData.tags) {
        // First delete existing tags
        await db
          .delete(articleTags)
          .where(eq(articleTags.articleId, parseInt(id)));
        
        // Then add new tags
        if (articleData.tags.length > 0) {
          await Promise.all(articleData.tags.map(async (tagName: string) => {
            // Normalize tag name and create slug
            const normalizedTag = tagName.trim();
            const tagSlug = generateSlug(normalizedTag);
            
            // Find or create tag
            let tag;
            const [existingTag] = await db
              .select()
              .from(tags)
              .where(eq(tags.slug, tagSlug));
            
            if (existingTag) {
              tag = existingTag;
            } else {
              const [newTag] = await db
                .insert(tags)
                .values({
                  name: normalizedTag,
                  slug: tagSlug,
                })
                .returning();
              tag = newTag;
            }
            
            // Associate tag with article
            await db
              .insert(articleTags)
              .values({
                articleId: parseInt(id),
                tagId: tag.id,
              })
              .onConflictDoNothing();
          }));
        }
      }
      
      return article;
    } catch (error) {
      console.error("Error updating article:", error);
      throw error;
    }
  }
  
  async deleteArticle(id: string): Promise<void> {
    try {
      await db
        .delete(articles)
        .where(eq(articles.id, parseInt(id)));
    } catch (error) {
      console.error("Error deleting article:", error);
      throw error;
    }
  }
  
  async searchArticles(query: string, page: number, userId?: string): Promise<{ articles: Article[], hasMore: boolean, total: number }> {
    try {
      const offset = (page - 1) * this.ITEMS_PER_PAGE;
      
      // Count total results
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(articles)
        .where(and(
          eq(articles.status, 'published'),
          or(
            like(articles.title, `%${query}%`),
            like(articles.excerpt, `%${query}%`),
            like(articles.content, `%${query}%`)
          )
        ));
      
      const total = countResult?.count || 0;
      
      // Get search results
      const searchResults = await db
        .select({
          id: articles.id,
          title: articles.title,
          excerpt: articles.excerpt,
          image: articles.image,
          createdAt: articles.createdAt,
          viewCount: articles.viewCount,
          likes: sql<number>`(SELECT COUNT(*) FROM ${articleLikes} WHERE ${articleLikes.articleId} = ${articles.id})`,
          isLiked: userId ? sql<boolean>`EXISTS (SELECT 1 FROM ${articleLikes} WHERE ${articleLikes.articleId} = ${articles.id} AND ${articleLikes.userId} = ${userId})` : sql`false`,
          isBookmarked: userId ? sql<boolean>`EXISTS (SELECT 1 FROM ${bookmarks} WHERE ${bookmarks.articleId} = ${articles.id} AND ${bookmarks.userId} = ${userId})` : sql`false`,
          commentsCount: sql<number>`(SELECT COUNT(*) FROM ${comments} WHERE ${comments.articleId} = ${articles.id})`,
        })
        .from(articles)
        .where(and(
          eq(articles.status, 'published'),
          or(
            like(articles.title, `%${query}%`),
            like(articles.excerpt, `%${query}%`),
            like(articles.content, `%${query}%`)
          )
        ))
        .orderBy(desc(articles.createdAt))
        .limit(this.ITEMS_PER_PAGE)
        .offset(offset);
      
      const result = await Promise.all(searchResults.map(async (article) => ({
        ...(article as any),
        comments: await this.getArticleComments(article.id, userId),
      })));
      
      return {
        articles: result,
        hasMore: offset + this.ITEMS_PER_PAGE < total,
        total: Number(total),
      };
    } catch (error) {
      console.error("Error searching articles:", error);
      return { articles: [], hasMore: false, total: 0 };
    }
  }
  
  // Comments
  async createComment(commentData: InsertComment): Promise<Comment> {
    try {
      // Check if auto-approval is enabled
      let status = 'pending';
      const [settingsRecord] = await db
        .select()
        .from(settings)
        .where(and(
          eq(settings.section, 'general'),
          eq(settings.key, 'requireModeration')
        ));
      
      if (settingsRecord && settingsRecord.value === "false") {
        status = 'approved';
      }
      
      // Create comment
      const [comment] = await db
        .insert(comments)
        .values({
          ...commentData,
          status,
        })
        .returning();
      
      return comment;
    } catch (error) {
      console.error("Error creating comment:", error);
      throw error;
    }
  }
  
  async updateComment(id: string, userId: string, content: string): Promise<Comment> {
    try {
      // Check if user is the author of the comment
      const [comment] = await db
        .select()
        .from(comments)
        .where(eq(comments.id, parseInt(id)));
      
      if (!comment || comment.authorId !== userId) {
        throw new Error("Unauthorized: You can only edit your own comments");
      }
      
      // Update comment
      const [updatedComment] = await db
        .update(comments)
        .set({
          content,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(comments.id, parseInt(id)))
        .returning();
      
      return updatedComment;
    } catch (error) {
      console.error("Error updating comment:", error);
      throw error;
    }
  }
  
  async deleteComment(id: string, userId: string, isAdmin: boolean): Promise<void> {
    try {
      // Check if user is allowed to delete this comment
      if (!isAdmin) {
        const [comment] = await db
          .select()
          .from(comments)
          .where(eq(comments.id, parseInt(id)));
        
        if (!comment || comment.authorId !== userId) {
          throw new Error("Unauthorized: You can only delete your own comments");
        }
      }
      
      // Delete comment and its replies
      await db
        .delete(comments)
        .where(eq(comments.id, parseInt(id)));
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw error;
    }
  }
  
  async likeComment(id: string, userId: string): Promise<void> {
    try {
      // Check if user already disliked this comment
      const [disliked] = await db
        .select()
        .from(commentDislikes)
        .where(and(
          eq(commentDislikes.commentId, parseInt(id)),
          eq(commentDislikes.userId, userId)
        ));
      
      if (disliked) {
        // Remove dislike
        await db
          .delete(commentDislikes)
          .where(and(
            eq(commentDislikes.commentId, parseInt(id)),
            eq(commentDislikes.userId, userId)
          ));
        
        // Decrease dislikes count
        await db
          .update(comments)
          .set({
            dislikes: sql`${comments.dislikes} - 1`,
          })
          .where(eq(comments.id, parseInt(id)));
      }
      
      // Check if user already liked this comment
      const [liked] = await db
        .select()
        .from(commentLikes)
        .where(and(
          eq(commentLikes.commentId, parseInt(id)),
          eq(commentLikes.userId, userId)
        ));
      
      if (liked) {
        // Remove like
        await db
          .delete(commentLikes)
          .where(and(
            eq(commentLikes.commentId, parseInt(id)),
            eq(commentLikes.userId, userId)
          ));
        
        // Decrease likes count
        await db
          .update(comments)
          .set({
            likes: sql`${comments.likes} - 1`,
          })
          .where(eq(comments.id, parseInt(id)));
      } else {
        // Add like
        await db
          .insert(commentLikes)
          .values({
            commentId: parseInt(id),
            userId,
          })
          .onConflictDoNothing();
        
        // Increase likes count
        await db
          .update(comments)
          .set({
            likes: sql`${comments.likes} + 1`,
          })
          .where(eq(comments.id, parseInt(id)));
      }
    } catch (error) {
      console.error("Error liking comment:", error);
      throw error;
    }
  }
  
  async dislikeComment(id: string, userId: string): Promise<void> {
    try {
      // Check if user already liked this comment
      const [liked] = await db
        .select()
        .from(commentLikes)
        .where(and(
          eq(commentLikes.commentId, parseInt(id)),
          eq(commentLikes.userId, userId)
        ));
      
      if (liked) {
        // Remove like
        await db
          .delete(commentLikes)
          .where(and(
            eq(commentLikes.commentId, parseInt(id)),
            eq(commentLikes.userId, userId)
          ));
        
        // Decrease likes count
        await db
          .update(comments)
          .set({
            likes: sql`${comments.likes} - 1`,
          })
          .where(eq(comments.id, parseInt(id)));
      }
      
      // Check if user already disliked this comment
      const [disliked] = await db
        .select()
        .from(commentDislikes)
        .where(and(
          eq(commentDislikes.commentId, parseInt(id)),
          eq(commentDislikes.userId, userId)
        ));
      
      if (disliked) {
        // Remove dislike
        await db
          .delete(commentDislikes)
          .where(and(
            eq(commentDislikes.commentId, parseInt(id)),
            eq(commentDislikes.userId, userId)
          ));
        
        // Decrease dislikes count
        await db
          .update(comments)
          .set({
            dislikes: sql`${comments.dislikes} - 1`,
          })
          .where(eq(comments.id, parseInt(id)));
      } else {
        // Add dislike
        await db
          .insert(commentDislikes)
          .values({
            commentId: parseInt(id),
            userId,
          })
          .onConflictDoNothing();
        
        // Increase dislikes count
        await db
          .update(comments)
          .set({
            dislikes: sql`${comments.dislikes} + 1`,
          })
          .where(eq(comments.id, parseInt(id)));
      }
    } catch (error) {
      console.error("Error disliking comment:", error);
      throw error;
    }
  }
  
  async reportComment(id: string, userId: string): Promise<void> {
    try {
      // Add report
      await db
        .insert(commentReports)
        .values({
          commentId: parseInt(id),
          userId,
        })
        .onConflictDoNothing();
      
      // Update comment status to flagged if it has multiple reports
      const [reportCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(commentReports)
        .where(eq(commentReports.commentId, parseInt(id)));
      
      if (reportCount && reportCount.count >= 3) {
        await db
          .update(comments)
          .set({
            status: 'flagged',
          })
          .where(eq(comments.id, parseInt(id)));
      }
    } catch (error) {
      console.error("Error reporting comment:", error);
      throw error;
    }
  }
  
  // Tags and Topics
  async getPopularTopics(limit: number = 10): Promise<string[]> {
    try {
      const popularTags = await db
        .select({
          name: tags.name,
          count: sql<number>`count(${articleTags.articleId})`,
        })
        .from(tags)
        .innerJoin(articleTags, eq(tags.id, articleTags.tagId))
        .groupBy(tags.id)
        .orderBy(desc(sql<number>`count(${articleTags.articleId})`))
        .limit(limit);
      
      return popularTags.map(tag => `#${tag.name}`);
    } catch (error) {
      console.error("Error fetching popular topics:", error);
      return [];
    }
  }
  
  // User profile and bookmarks
  async getUserBookmarks(userId: string): Promise<Article[]> {
    try {
      const bookmarkedArticles = await db
        .select({
          id: articles.id,
          title: articles.title,
          excerpt: articles.excerpt,
          image: articles.image,
          createdAt: articles.createdAt,
          viewCount: articles.viewCount,
          likes: sql<number>`(SELECT COUNT(*) FROM ${articleLikes} WHERE ${articleLikes.articleId} = ${articles.id})`,
          isLiked: sql<boolean>`EXISTS (SELECT 1 FROM ${articleLikes} WHERE ${articleLikes.articleId} = ${articles.id} AND ${articleLikes.userId} = ${userId})`,
          isBookmarked: sql<boolean>`true`,
          commentsCount: sql<number>`(SELECT COUNT(*) FROM ${comments} WHERE ${comments.articleId} = ${articles.id})`,
        })
        .from(articles)
        .innerJoin(bookmarks, eq(articles.id, bookmarks.articleId))
        .where(and(
          eq(bookmarks.userId, userId),
          eq(articles.status, 'published')
        ))
        .orderBy(desc(bookmarks.createdAt));
      
      const result = await Promise.all(bookmarkedArticles.map(async (article) => ({
        ...(article as any),
        comments: await this.getArticleComments(article.id, userId),
      })));
      
      return result;
    } catch (error) {
      console.error("Error fetching user bookmarks:", error);
      return [];
    }
  }
  
  async getUserProfile(userId: string): Promise<any> {
    try {
      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
          bio: users.bio,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, userId));
      
      if (!user) {
        throw new Error("User not found");
      }
      
      // Get user preferences
      const [preferences] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId));
      
      return {
        ...user,
        preferences: preferences || {
          newsletter: true,
          commentReplies: true,
          articleUpdates: true,
        },
      };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  }
  
  async updateUserProfile(userId: string, data: any): Promise<any> {
    try {
      const [user] = await db
        .update(users)
        .set({
          username: data.username,
          bio: data.bio,
          profileImageUrl: data.profileImageUrl,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, userId))
        .returning();
      
      return user;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }
  
  async getUserStats(userId: string): Promise<any> {
    try {
      // Count comments, likes, bookmarks
      const [commentCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(comments)
        .where(eq(comments.authorId, userId));
      
      const [likeCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(articleLikes)
        .where(eq(articleLikes.userId, userId));
      
      const [bookmarkCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(bookmarks)
        .where(eq(bookmarks.userId, userId));
      
      const [viewCount] = await db
        .select({ count: sql<number>`count(distinct ${articleViews.articleId})` })
        .from(articleViews)
        .where(eq(articleViews.userId, userId));
      
      // Get recent comments
      const recentComments = await db
        .select({
          id: comments.id,
          content: comments.content,
          articleId: comments.articleId,
          createdAt: comments.createdAt,
          articleTitle: sql<string>`(SELECT title FROM ${articles} WHERE id = ${comments.articleId})`,
        })
        .from(comments)
        .where(eq(comments.authorId, userId))
        .orderBy(desc(comments.createdAt))
        .limit(5);
      
      return {
        comments: commentCount?.count || 0,
        likes: likeCount?.count || 0,
        bookmarks: bookmarkCount?.count || 0,
        articlesRead: viewCount?.count || 0,
        recentComments,
      };
    } catch (error) {
      console.error("Error fetching user stats:", error);
      return {
        comments: 0,
        likes: 0,
        bookmarks: 0,
        articlesRead: 0,
        recentComments: [],
      };
    }
  }
  
  async updateUserPreferences(userId: string, preferences: any): Promise<void> {
    try {
      const [existingPreferences] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId));
      
      if (existingPreferences) {
        await db
          .update(userPreferences)
          .set({            newsletter: preferences.newsletter,
            commentReplies: preferences.commentReplies,
            articleUpdates: preferences.articleUpdates,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(userPreferences.userId, userId));
      } else {
        await db
          .insert(userPreferences)
          .values({
            userId,
            newsletter: preferences.newsletter,
            commentReplies: preferences.commentReplies,
            articleUpdates: preferences.articleUpdates,
          });
      }
    } catch (error) {
      console.error("Error updating user preferences:", error);
      throw error;
    }
  }
  
  // Admin
  async getAdminMetrics(): Promise<any> {
    try {
      // Get article count and growth
      const [articleCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(articles);
      
      const oneMonthAgo = new Date();
oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
const oneMonthAgoIso = oneMonthAgo.toISOString();
      
      const [newArticleCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(articles)
        .where(gt(articles.createdAt, oneMonthAgoIso));
      
      // Get comment count and growth
      const [commentCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(comments);
      
      const [newCommentCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(comments)
        .where(gt(comments.createdAt, oneMonthAgoIso));
      
      // Get user count and growth
      const [userCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users);
      
      const [newUserCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(gt(users.createdAt, oneMonthAgoIso));
      
      // Get page views and growth
      const [viewCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(articleViews);
      
      const [newViewCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(articleViews)
        .where(gt(articleViews.createdAt, oneMonthAgoIso));
      
      // Calculate growth percentages
      const prevArticleCount = articleCount.count - newArticleCount.count;
      const articleGrowth = prevArticleCount > 0 
        ? Math.round((newArticleCount.count / prevArticleCount) * 100) 
        : 100;
      
      const prevCommentCount = commentCount.count - newCommentCount.count;
      const commentGrowth = prevCommentCount > 0 
        ? Math.round((newCommentCount.count / prevCommentCount) * 100) 
        : 100;
      
      const prevUserCount = userCount.count - newUserCount.count;
      const userGrowth = prevUserCount > 0 
        ? Math.round((newUserCount.count / prevUserCount) * 100) 
        : 100;
      
      const prevViewCount = viewCount.count - newViewCount.count;
      const viewsGrowth = prevViewCount > 0 
        ? Math.round((newViewCount.count / prevViewCount) * 100) 
        : 100;
      
      return {
        articleCount: articleCount.count,
        articleGrowth,
        commentCount: commentCount.count,
        commentGrowth,
        userCount: userCount.count,
        userGrowth,
        pageViews: viewCount.count,
        viewsGrowth,
      };
    } catch (error) {
      console.error("Error fetching admin metrics:", error);
      return {
        articleCount: 0,
        articleGrowth: 0,
        commentCount: 0,
        commentGrowth: 0,
        userCount: 0,
        userGrowth: 0,
        pageViews: 0,
        viewsGrowth: 0,
      };
    }
  }
  
  async getAdminArticles(page: number, search: string, category: string): Promise<{ articles: any[]; totalPages: number }> {
    try {
      const offset = (page - 1) * this.ITEMS_PER_PAGE;
      
      // Build where clause
      let whereClause = and();
      
      if (search) {
        whereClause = and(
          whereClause,
          or(
            like(articles.title, `%${search}%`),
            like(articles.excerpt, `%${search}%`)
          )
        );
      }
      
      if (category && category !== 'all') {
        whereClause = and(
          whereClause,
          eq(articles.categoryId, parseInt(category))
        );
      }
      
      // Count total articles
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(articles)
        .where(whereClause);
      
      const totalCount = countResult?.count || 0;
      const totalPages = Math.ceil(totalCount / this.ITEMS_PER_PAGE);
      
      // Get articles
      const adminArticlesRaw = await db
        .select({
          id: articles.id,
          title: articles.title,
          createdAt: articles.createdAt,
          viewCount: articles.viewCount,
          commentCount: sql<number>`(SELECT COUNT(*) FROM ${comments} WHERE ${comments.articleId} = ${articles.id})`,
          categoryId: articles.categoryId,
          authorId: articles.authorId,
        })
        .from(articles)
        .where(whereClause)
        .orderBy(desc(articles.createdAt))
        .limit(this.ITEMS_PER_PAGE)
        .offset(offset);

      // Build nested objects in JS
      const adminArticles = await Promise.all(adminArticlesRaw.map(async (article) => {
        const [category] = await db.select().from(categories).where(eq(categories.id, article.categoryId));
        const [author] = await db.select().from(users).where(eq(users.id, article.authorId));
        return {
          ...article,
          category,
          author: buildFrontendAuthor(author),
        };
      }));

      return {
        articles: adminArticles as any[],
        totalPages,
      };
    } catch (error) {
      console.error("Error fetching admin articles:", error);
      return { articles: [], totalPages: 0 };
    }
  }
  
  async getRecentArticles(limit: number = 3): Promise<any[]> {
    try {
      // Get recent articles as flat rows
      const recentArticlesRaw = await db
        .select({
          id: articles.id,
          title: articles.title,
          createdAt: articles.createdAt,
          viewCount: articles.viewCount,
          categoryId: articles.categoryId,
          authorId: articles.authorId,
        })
        .from(articles)
        .orderBy(desc(articles.createdAt))
        .limit(limit);

      // Build nested objects in JS
      const recentArticles = await Promise.all(recentArticlesRaw.map(async (article) => {
        const [category] = await db.select().from(categories).where(eq(categories.id, article.categoryId));
        const [author] = await db.select().from(users).where(eq(users.id, article.authorId));
        return {
          ...article,
          category,
          author: buildFrontendAuthor(author),
        };
      }));

      return recentArticles as any[];
    } catch (error) {
      console.error("Error fetching recent articles:", error);
      return [];
    }
  }
  
  async getCommentsByStatus(status: string, search: string): Promise<Comment[]> {
    try {
      let whereClause: any = eq(comments.status, status);
      
      if (search) {
        whereClause = and(
          whereClause,
          like(comments.content, `%${search}%`)
        );
      }
      
      // Get filtered comments as flat rows
      const filteredCommentsRaw = await db
        .select({
          id: comments.id,
          content: comments.content,
          status: comments.status,
          createdAt: comments.createdAt,
          authorId: comments.authorId,
          articleId: comments.articleId,
        })
        .from(comments)
        .where(whereClause)
        .orderBy(desc(comments.createdAt));

      // Build nested objects in JS
      const filteredComments = await Promise.all(filteredCommentsRaw.map(async (comment) => {
        const [author] = await db.select().from(users).where(eq(users.id, comment.authorId));
        const [article] = await db.select().from(articles).where(eq(articles.id, comment.articleId));
        return {
          ...comment,
          author: buildFrontendAuthor(author),
          article: article ? { id: article.id, title: article.title } : undefined,
        };
      }));

      return filteredComments as any[];
    } catch (error) {
      console.error("Error fetching comments by status:", error);
      return [];
    }
  }
  
  async getCommentsForModeration(limit: number = 5): Promise<Comment[]> {
    try {
      // Get pending comments as flat rows
      const pendingCommentsRaw = await db
        .select({
          id: comments.id,
          content: comments.content,
          createdAt: comments.createdAt,
          authorId: comments.authorId,
          articleId: comments.articleId,
        })
        .from(comments)
        .where(eq(comments.status, 'pending'))
        .orderBy(comments.createdAt)
        .limit(limit);

      // Build nested objects in JS
      const pendingComments = await Promise.all(pendingCommentsRaw.map(async (comment) => {
        const [author] = await db.select().from(users).where(eq(users.id, comment.authorId));
        const [article] = await db.select().from(articles).where(eq(articles.id, comment.articleId));
        return {
          ...comment,
          author: buildFrontendAuthor(author),
          article: article ? { id: article.id, title: article.title } : undefined,
        };
      }));

      return pendingComments as any[];
    } catch (error) {
      console.error("Error fetching comments for moderation:", error);
      return [];
    }
  }
  
  async moderateComment(id: string, action: string): Promise<void> {
    try {
      let status;
      
      switch (action) {
        case 'approve':
          status = 'approved';
          break;
        case 'reject':
          status = 'rejected';
          break;
        case 'flag':
          status = 'flagged';
          break;
        default:
          throw new Error("Invalid moderation action");
      }
      
      await db
        .update(comments)
        .set({
          status,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(comments.id, parseInt(id)));
      
      // If rejecting, also reject all replies
      if (action === 'reject') {
        await db
          .update(comments)
          .set({
            status: 'rejected',
            updatedAt: new Date().toISOString(),
          })
          .where(eq(comments.parentId, parseInt(id)));
      }
    } catch (error) {
      console.error("Error moderating comment:", error);
      throw error;
    }
  }
  
  async getSettings(): Promise<any> {
    try {
      const settingsRecords = await db
        .select()
        .from(settings);
      
      // Group settings by section
      const result: any = {};
      
      settingsRecords.forEach(record => {
        if (!result[record.section]) {
          result[record.section] = {};
        }
        result[record.section][record.key] = record.value;
      });
      
      return result;
    } catch (error) {
      console.error("Error fetching settings:", error);
      return {};
    }
  }
  
  async updateSettings(section: string, data: any): Promise<void> {
    try {
      // For each key in data, update or insert the setting
      await Promise.all(Object.entries(data).map(async ([key, value]) => {
        const [existing] = await db
          .select()
          .from(settings)
          .where(and(
            eq(settings.section, section),
            eq(settings.key, key)
          ));
        
        if (existing) {
          await db
            .update(settings)
            .set({
              value: typeof value === "string" ? value : JSON.stringify(value),
              updatedAt: new Date().toISOString(),
            })
            .where(and(
              eq(settings.section, section),
              eq(settings.key, key)
            ));
        } else {
          await db
            .insert(settings)
            .values({
              section,
              key,
              value: typeof value === "string" ? value : JSON.stringify(value),
            });
        }
      }));
    } catch (error) {
      console.error("Error updating settings:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
