import {
  sqliteTable as pgTable,
  text,
  integer,
  primaryKey,
  uniqueIndex as index,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: text("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  username: text("username").unique(),
  bio: text("bio"),
  role: text("role").default("user").notNull(), // user, admin, developer
  createdAt: text("created_at").default("now"),
  updatedAt: text("updated_at").default("now"),
});

export const userRelations = relations(users, ({ many }) => ({
  articles: many(articles),
  comments: many(comments),
  likes: many(articleLikes),
  bookmarks: many(bookmarks),
}));

export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

// Categories
export const categories = pgTable("categories", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: text("created_at").default("now"),
  updatedAt: text("updated_at").default("now"),
});

export const categoryRelations = relations(categories, ({ many }) => ({
  articles: many(articles),
}));

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
export const insertCategorySchema = createInsertSchema(categories);

// Articles
export const articles = pgTable("articles", {
  id: integer("id").primaryKey(),
  title: text("title", { length: 255 }).notNull(),
  slug: text("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  image: text("image").notNull(),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  status: text("status", { length: 50 }).default("published").notNull(), // published, draft, archived
  isBreaking: integer("is_breaking").default(0),
  viewCount: integer("view_count").default(0),
  createdAt: text("created_at").default("now"),
  updatedAt: text("updated_at").default("now"),
});

export const articleRelations = relations(articles, ({ one, many }) => ({
  author: one(users, {
    fields: [articles.authorId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [articles.categoryId],
    references: [categories.id],
  }),
  comments: many(comments),
  likes: many(articleLikes),
  bookmarks: many(bookmarks),
  tags: many(articleTags),
}));

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;
export const articleSchema = z.object({
  id: z.number(),
  title: z.string().min(10, "Title must be at least 10 characters"),
  slug: z.string(),
  excerpt: z.string().min(20, "Excerpt must be at least 20 characters"),
  content: z.string().min(100, "Content must be at least 100 characters"),
  image: z.string().url("Image must be a valid URL"),
  authorId: z.string().min(1, "Author ID is required"),
  categoryId: z.number().int().positive("Category ID is required"),
  status: z.enum(["published", "draft", "archived"]).default("published"),
  isBreaking: z.boolean().default(false),
  viewCount: z.number().int().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  slug: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
});

// Comments - Avoid circular reference issues by not defining the parent FK directly
export const comments = pgTable("comments", {
  id: integer("id").primaryKey(),
  content: text("content").notNull(),
  articleId: integer("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  parentId: integer("parent_id"), // Will add FK constraint with SQL after table is created
  status: text("status", { length: 50 }).default("pending").notNull(), // pending, approved, rejected, flagged
  likes: integer("likes").default(0),
  dislikes: integer("dislikes").default(0),
  createdAt: text("created_at").default("now"),
  updatedAt: text("updated_at").default("now"),
});

// Add FK constraint in SQL after table is created

export const commentRelations = relations(comments, ({ one, many }) => ({
  article: one(articles, {
    fields: [comments.articleId],
    references: [articles.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
  }),
  replies: many(comments, { relationName: "replies" }),
  commentLikes: many(commentLikes),
  commentDislikes: many(commentDislikes),
  commentReports: many(commentReports),
}));

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;
export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  status: true,
  likes: true,
  dislikes: true,
  createdAt: true,
  updatedAt: true,
});

// Article Tags
export const tags = pgTable("tags", {
  id: integer("id").primaryKey(),
  name: text("name", { length: 100 }).notNull().unique(),
  slug: text("slug", { length: 100 }).notNull().unique(),
  createdAt: text("created_at").default("now"),
});

export const tagRelations = relations(tags, ({ many }) => ({
  articleTags: many(articleTags),
}));

export const articleTags = pgTable("article_tags", {
  id: integer("id").primaryKey(),
  articleId: integer("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (table) => {
  return {
    unq: index("article_tags_unique").on(table.articleId, table.tagId),
  };
});

export const articleTagsRelations = relations(articleTags, ({ one }) => ({
  article: one(articles, {
    fields: [articleTags.articleId],
    references: [articles.id],
  }),
  tag: one(tags, {
    fields: [articleTags.tagId],
    references: [tags.id],
  }),
}));

// Article Likes
export const articleLikes = pgTable("article_likes", {
  id: integer("id").primaryKey(),
  articleId: integer("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: text("created_at").default("now"),
}, (table) => {
  return {
    unq: index("article_likes_unique").on(table.articleId, table.userId),
  };
});

export const articleLikesRelations = relations(articleLikes, ({ one }) => ({
  article: one(articles, {
    fields: [articleLikes.articleId],
    references: [articles.id],
  }),
  user: one(users, {
    fields: [articleLikes.userId],
    references: [users.id],
  }),
}));

// Bookmarks
export const bookmarks = pgTable("bookmarks", {
  id: integer("id").primaryKey(),
  articleId: integer("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: text("created_at").default("now"),
}, (table) => {
  return {
    unq: index("bookmarks_unique").on(table.articleId, table.userId),
  };
});

export const bookmarkRelations = relations(bookmarks, ({ one }) => ({
  article: one(articles, {
    fields: [bookmarks.articleId],
    references: [articles.id],
  }),
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
}));

// Comment Likes and Dislikes
export const commentLikes = pgTable("comment_likes", {
  id: integer("id").primaryKey(),
  commentId: integer("comment_id").notNull().references(() => comments.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: text("created_at").default("now"),
}, (table) => {
  return {
    unq: index("comment_likes_unique").on(table.commentId, table.userId),
  };
});

export const commentLikesRelations = relations(commentLikes, ({ one }) => ({
  comment: one(comments, {
    fields: [commentLikes.commentId],
    references: [comments.id],
  }),
  user: one(users, {
    fields: [commentLikes.userId],
    references: [users.id],
  }),
}));

export const commentDislikes = pgTable("comment_dislikes", {
  id: integer("id").primaryKey(),
  commentId: integer("comment_id").notNull().references(() => comments.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: text("created_at").default("now"),
}, (table) => {
  return {
    unq: index("comment_dislikes_unique").on(table.commentId, table.userId),
  };
});

export const commentDislikesRelations = relations(commentDislikes, ({ one }) => ({
  comment: one(comments, {
    fields: [commentDislikes.commentId],
    references: [comments.id],
  }),
  user: one(users, {
    fields: [commentDislikes.userId],
    references: [users.id],
  }),
}));

// Comment Reports
export const commentReports = pgTable("comment_reports", {
  id: integer("id").primaryKey(),
  commentId: integer("comment_id").notNull().references(() => comments.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason"),
  createdAt: text("created_at").default("now"),
}, (table) => {
  return {
    unq: index("comment_reports_unique").on(table.commentId, table.userId),
  };
});

export const commentReportsRelations = relations(commentReports, ({ one }) => ({
  comment: one(comments, {
    fields: [commentReports.commentId],
    references: [comments.id],
  }),
  user: one(users, {
    fields: [commentReports.userId],
    references: [users.id],
  }),
}));

// Article Views
export const articleViews = pgTable("article_views", {
  id: integer("id").primaryKey(),
  articleId: integer("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: text("created_at").default("now"),
});

export const articleViewsRelations = relations(articleViews, ({ one }) => ({
  article: one(articles, {
    fields: [articleViews.articleId],
    references: [articles.id],
  }),
  user: one(users, {
    fields: [articleViews.userId],
    references: [users.id],
  }),
}));

// Settings
export const settings = pgTable("settings", {
  id: integer("id").primaryKey(),
  section: text("section", { length: 50 }).notNull(), // general, users, advanced
  key: text("key", { length: 100 }).notNull(),
  value: text("value"),
  updatedAt: text("updated_at").default("now"),
}, (table) => {
  return {
    unq: index("settings_unique").on(table.section, table.key),
  };
});

// User Preferences
export const userPreferences = pgTable("user_preferences", {
  id: integer("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  newsletter: integer("newsletter").default(1),
  commentReplies: integer("comment_replies").default(1),
  articleUpdates: integer("article_updates").default(1),
  updatedAt: text("updated_at").default("now"),
});

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));
