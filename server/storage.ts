import { db } from "./db";
import {
  platformConnections, keywordTriggers, comments, directMessages, activityLog,
  type PlatformConnection, type InsertPlatformConnection,
  type KeywordTrigger, type InsertKeywordTrigger,
  type Comment, type InsertComment,
  type DirectMessage, type InsertDirectMessage,
  type ActivityLogEntry, type InsertActivityLogEntry,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getPlatformConnections(userId: string): Promise<PlatformConnection[]>;
  createPlatformConnection(data: InsertPlatformConnection): Promise<PlatformConnection>;
  getKeywordTriggers(userId: string): Promise<KeywordTrigger[]>;
  createKeywordTrigger(data: InsertKeywordTrigger): Promise<KeywordTrigger>;
  getComments(userId: string): Promise<Comment[]>;
  createComment(data: InsertComment): Promise<Comment>;
  getDMs(userId: string): Promise<DirectMessage[]>;
  createDM(data: InsertDirectMessage): Promise<DirectMessage>;
  getActivityLog(userId: string): Promise<ActivityLogEntry[]>;
  createActivityLog(data: InsertActivityLogEntry): Promise<ActivityLogEntry>;
}

export class DatabaseStorage implements IStorage {
  async getPlatformConnections(userId: string) {
    return db.select().from(platformConnections)
      .where(eq(platformConnections.userId, userId))
      .orderBy(desc(platformConnections.createdAt));
  }
  async createPlatformConnection(data: InsertPlatformConnection) {
    const [result] = await db.insert(platformConnections).values(data).returning();
    return result;
  }
  async getKeywordTriggers(userId: string) {
    return db.select().from(keywordTriggers)
      .where(eq(keywordTriggers.userId, userId))
      .orderBy(desc(keywordTriggers.createdAt));
  }
  async createKeywordTrigger(data: InsertKeywordTrigger) {
    const [result] = await db.insert(keywordTriggers).values(data).returning();
    return result;
  }
  async getComments(userId: string) {
    return db.select().from(comments)
      .where(eq(comments.userId, userId))
      .orderBy(desc(comments.commentedAt));
  }
  async createComment(data: InsertComment) {
    const [result] = await db.insert(comments).values(data).returning();
    return result;
  }
  async getDMs(userId: string) {
    return db.select().from(directMessages)
      .where(eq(directMessages.userId, userId))
      .orderBy(desc(directMessages.createdAt));
  }
  async createDM(data: InsertDirectMessage) {
    const [result] = await db.insert(directMessages).values(data).returning();
    return result;
  }
  async getActivityLog(userId: string) {
    return db.select().from(activityLog)
      .where(eq(activityLog.userId, userId))
      .orderBy(desc(activityLog.createdAt));
  }
  async createActivityLog(data: InsertActivityLogEntry) {
    const [result] = await db.insert(activityLog).values(data).returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
