import { pgTable, text, serial, timestamp, boolean, integer, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export { sessions, users } from "@shared/models/auth";
export type { User, UpsertUser } from "@shared/models/auth";

export const platformConnections = pgTable("platform_connections", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  platform: text("platform").notNull(),
  accountName: text("account_name"),
  accountId: text("account_id"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("platform_connections_user_id_idx").on(table.userId),
  index("platform_connections_platform_idx").on(table.platform),
]);

export const keywordTriggers = pgTable("keyword_triggers", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  keyword: text("keyword").notNull(),
  platforms: jsonb("platforms").notNull().$type<string[]>(),
  isActive: boolean("is_active").default(true),
  sendDm: boolean("send_dm").default(false),
  dmTemplate: text("dm_template"),
  dmVariables: jsonb("dm_variables").$type<Record<string, string>>(),
  sendCommentReply: boolean("send_comment_reply").default(false),
  commentVariations: jsonb("comment_variations").$type<string[]>(),
  useAi: boolean("use_ai").default(true),
  triggeredCount: integer("triggered_count").default(0),
  dmsSentCount: integer("dms_sent_count").default(0),
  repliesSentCount: integer("replies_sent_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("keyword_triggers_user_id_idx").on(table.userId),
  index("keyword_triggers_keyword_idx").on(table.keyword),
]);

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  platform: text("platform").notNull(),
  platformCommentId: text("platform_comment_id").notNull(),
  postId: text("post_id").notNull(),
  postType: text("post_type"),
  postUrl: text("post_url"),
  commentText: text("comment_text").notNull(),
  commenterUsername: text("commenter_username").notNull(),
  commenterUserId: text("commenter_user_id"),
  commenterProfileUrl: text("commenter_profile_url"),
  matchedKeywordId: integer("matched_keyword_id"),
  hasResponded: boolean("has_responded").default(false),
  responseText: text("response_text"),
  respondedAt: timestamp("responded_at"),
  responseMethod: text("response_method"),
  commentedAt: timestamp("commented_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("comments_user_id_idx").on(table.userId),
  index("comments_platform_idx").on(table.platform),
  index("comments_post_id_idx").on(table.postId),
  index("comments_has_responded_idx").on(table.hasResponded),
]);

export const directMessages = pgTable("direct_messages", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  platform: text("platform").notNull(),
  platformMessageId: text("platform_message_id"),
  recipientUsername: text("recipient_username").notNull(),
  recipientUserId: text("recipient_user_id"),
  messageText: text("message_text").notNull(),
  keywordTriggerId: integer("keyword_trigger_id"),
  status: text("status").notNull().default("pending"),
  sentAt: timestamp("sent_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  failureReason: text("failure_reason"),
  relatedCommentId: integer("related_comment_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("direct_messages_user_id_idx").on(table.userId),
  index("direct_messages_platform_idx").on(table.platform),
  index("direct_messages_status_idx").on(table.status),
]);

export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  activityType: text("activity_type").notNull(),
  platform: text("platform"),
  description: text("description").notNull(),
  keywordTriggerId: integer("keyword_trigger_id"),
  commentId: integer("comment_id"),
  dmId: integer("dm_id"),
  metadata: jsonb("metadata"),
  status: text("status"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("activity_log_user_id_idx").on(table.userId),
  index("activity_log_activity_type_idx").on(table.activityType),
  index("activity_log_created_at_idx").on(table.createdAt),
]);

export const engagementMetrics = pgTable("engagement_metrics", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: timestamp("date").notNull(),
  platform: text("platform").notNull(),
  keywordTriggerId: integer("keyword_trigger_id"),
  commentsReceived: integer("comments_received").default(0),
  commentsReplied: integer("comments_replied").default(0),
  dmsSent: integer("dms_sent").default(0),
  dmsOpened: integer("dms_opened").default(0),
  dmsClicked: integer("dms_clicked").default(0),
  responseRate: integer("response_rate").default(0),
  openRate: integer("open_rate").default(0),
  clickThroughRate: integer("click_through_rate").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("engagement_metrics_user_id_idx").on(table.userId),
  index("engagement_metrics_date_idx").on(table.date),
]);

export const apiQuotas = pgTable("api_quotas", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  platform: text("platform").notNull(),
  quotaLimit: integer("quota_limit").notNull(),
  quotaUsed: integer("quota_used").default(0),
  quotaResetAt: timestamp("quota_reset_at").notNull(),
  lastRequestAt: timestamp("last_request_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("api_quotas_user_platform_idx").on(table.userId, table.platform),
]);

export const backgroundJobs = pgTable("background_jobs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  jobType: text("job_type").notNull(),
  platform: text("platform"),
  status: text("status").notNull().default("pending"),
  payload: jsonb("payload"),
  result: jsonb("result"),
  error: text("error"),
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  scheduledFor: timestamp("scheduled_for"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("background_jobs_status_idx").on(table.status),
  index("background_jobs_job_type_idx").on(table.jobType),
]);

export const insertPlatformConnectionSchema = createInsertSchema(platformConnections).omit({
  id: true, createdAt: true, updatedAt: true,
});
export const insertKeywordTriggerSchema = createInsertSchema(keywordTriggers).omit({
  id: true, createdAt: true, updatedAt: true, triggeredCount: true, dmsSentCount: true, repliesSentCount: true,
});
export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true, createdAt: true, updatedAt: true,
});
export const insertDirectMessageSchema = createInsertSchema(directMessages).omit({
  id: true, createdAt: true, updatedAt: true,
});
export const insertActivityLogSchema = createInsertSchema(activityLog).omit({
  id: true, createdAt: true,
});

export type PlatformConnection = typeof platformConnections.$inferSelect;
export type InsertPlatformConnection = z.infer<typeof insertPlatformConnectionSchema>;
export type KeywordTrigger = typeof keywordTriggers.$inferSelect;
export type InsertKeywordTrigger = z.infer<typeof insertKeywordTriggerSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type DirectMessage = typeof directMessages.$inferSelect;
export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;
export type ActivityLogEntry = typeof activityLog.$inferSelect;
export type InsertActivityLogEntry = z.infer<typeof insertActivityLogSchema>;
export type EngagementMetric = typeof engagementMetrics.$inferSelect;
export type ApiQuota = typeof apiQuotas.$inferSelect;
export type BackgroundJob = typeof backgroundJobs.$inferSelect;
