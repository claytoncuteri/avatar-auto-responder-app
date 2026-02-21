import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import {
  platformConnections,
  keywordTriggers,
  comments,
  directMessages,
  activityLog,
  backgroundJobs,
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { isAuthenticated } from "./replit_integrations/auth/replitAuth";

function getUserId(req: any): string {
  if (req.user?.authMethod === "email") {
    return req.user.userId;
  }
  return req.user?.claims?.sub;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/platforms", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const result = await db.select().from(platformConnections)
        .where(eq(platformConnections.userId, userId))
        .orderBy(desc(platformConnections.createdAt));
      res.json(result);
    } catch (error) {
      console.error("Error fetching platforms:", error);
      res.status(500).json({ error: "Failed to fetch platforms" });
    }
  });

  app.post("/api/platforms", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { platform, accountName, accountId, accessToken, refreshToken, tokenExpiresAt, metadata } = req.body;
      const [created] = await db.insert(platformConnections).values({
        userId, platform, accountName, accountId, accessToken, refreshToken,
        tokenExpiresAt: tokenExpiresAt ? new Date(tokenExpiresAt) : null,
        metadata, isActive: true,
      }).returning();
      res.json(created);
    } catch (error) {
      console.error("Error creating platform:", error);
      res.status(500).json({ error: "Failed to create platform connection" });
    }
  });

  app.patch("/api/platforms/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      const [updated] = await db.update(platformConnections)
        .set({ ...req.body, updatedAt: new Date() })
        .where(and(eq(platformConnections.id, id), eq(platformConnections.userId, userId)))
        .returning();
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating platform:", error);
      res.status(500).json({ error: "Failed to update platform" });
    }
  });

  app.delete("/api/platforms/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      const [deleted] = await db.delete(platformConnections)
        .where(and(eq(platformConnections.id, id), eq(platformConnections.userId, userId)))
        .returning();
      if (!deleted) return res.status(404).json({ error: "Not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting platform:", error);
      res.status(500).json({ error: "Failed to delete platform" });
    }
  });

  app.get("/api/keywords", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const result = await db.select().from(keywordTriggers)
        .where(eq(keywordTriggers.userId, userId))
        .orderBy(desc(keywordTriggers.createdAt));
      res.json(result);
    } catch (error) {
      console.error("Error fetching keywords:", error);
      res.status(500).json({ error: "Failed to fetch keywords" });
    }
  });

  app.post("/api/keywords", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { keyword, platforms, sendDm, dmTemplate, dmVariables, sendCommentReply, commentVariations, useAi } = req.body;
      const [created] = await db.insert(keywordTriggers).values({
        userId, keyword, platforms: platforms || [],
        sendDm: sendDm || false, dmTemplate, dmVariables,
        sendCommentReply: sendCommentReply || false,
        commentVariations: commentVariations || [],
        useAi: useAi !== false, isActive: true,
      }).returning();
      res.json(created);
    } catch (error) {
      console.error("Error creating keyword:", error);
      res.status(500).json({ error: "Failed to create keyword trigger" });
    }
  });

  app.patch("/api/keywords/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      const [updated] = await db.update(keywordTriggers)
        .set({ ...req.body, updatedAt: new Date() })
        .where(and(eq(keywordTriggers.id, id), eq(keywordTriggers.userId, userId)))
        .returning();
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating keyword:", error);
      res.status(500).json({ error: "Failed to update keyword" });
    }
  });

  app.delete("/api/keywords/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      const [deleted] = await db.delete(keywordTriggers)
        .where(and(eq(keywordTriggers.id, id), eq(keywordTriggers.userId, userId)))
        .returning();
      if (!deleted) return res.status(404).json({ error: "Not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting keyword:", error);
      res.status(500).json({ error: "Failed to delete keyword" });
    }
  });

  app.get("/api/comments", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { platform, postId, unresponded, search } = req.query;
      const conditions = [eq(comments.userId, userId)];
      if (platform && platform !== "all") conditions.push(eq(comments.platform, platform as string));
      if (postId) conditions.push(eq(comments.postId, postId as string));
      if (unresponded === "true") conditions.push(eq(comments.hasResponded, false));

      const result = await db.select().from(comments)
        .where(and(...conditions))
        .orderBy(desc(comments.commentedAt))
        .limit(200);
      res.json(result);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.patch("/api/comments/:id/respond", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      const { responseText, responseMethod } = req.body;
      const [updated] = await db.update(comments)
        .set({
          hasResponded: true, responseText,
          responseMethod: responseMethod || "manual",
          respondedAt: new Date(), updatedAt: new Date(),
        })
        .where(and(eq(comments.id, id), eq(comments.userId, userId)))
        .returning();
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error responding:", error);
      res.status(500).json({ error: "Failed to respond to comment" });
    }
  });

  app.get("/api/dms", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { platform, status } = req.query;
      const conditions = [eq(directMessages.userId, userId)];
      if (platform) conditions.push(eq(directMessages.platform, platform as string));
      if (status) conditions.push(eq(directMessages.status, status as string));
      const result = await db.select().from(directMessages)
        .where(and(...conditions))
        .orderBy(desc(directMessages.createdAt))
        .limit(100);
      res.json(result);
    } catch (error) {
      console.error("Error fetching DMs:", error);
      res.status(500).json({ error: "Failed to fetch DMs" });
    }
  });

  app.get("/api/activity", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { activityType, platform } = req.query;
      const conditions = [eq(activityLog.userId, userId)];
      if (activityType) conditions.push(eq(activityLog.activityType, activityType as string));
      if (platform) conditions.push(eq(activityLog.platform, platform as string));
      const result = await db.select().from(activityLog)
        .where(and(...conditions))
        .orderBy(desc(activityLog.createdAt))
        .limit(100);
      res.json(result);
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ error: "Failed to fetch activity log" });
    }
  });

  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const [platformCount] = await db.select({ count: sql<number>`count(*)::int` }).from(platformConnections)
        .where(and(eq(platformConnections.userId, userId), eq(platformConnections.isActive, true)));
      const [keywordCount] = await db.select({ count: sql<number>`count(*)::int` }).from(keywordTriggers)
        .where(and(eq(keywordTriggers.userId, userId), eq(keywordTriggers.isActive, true)));
      const [unrespondedCount] = await db.select({ count: sql<number>`count(*)::int` }).from(comments)
        .where(and(eq(comments.userId, userId), eq(comments.hasResponded, false)));
      const [totalCommentsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(comments)
        .where(eq(comments.userId, userId));
      const [dmsSentCount] = await db.select({ count: sql<number>`count(*)::int` }).from(directMessages)
        .where(and(eq(directMessages.userId, userId), eq(directMessages.status, "sent")));
      const recentActivity = await db.select().from(activityLog)
        .where(eq(activityLog.userId, userId))
        .orderBy(desc(activityLog.createdAt))
        .limit(10);

      res.json({
        connectedPlatforms: platformCount?.count || 0,
        activeKeywords: keywordCount?.count || 0,
        unrespondedComments: unrespondedCount?.count || 0,
        totalComments: totalCommentsCount?.count || 0,
        dmsSent: dmsSentCount?.count || 0,
        recentActivity,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/webhooks/meta", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === process.env.WEBHOOK_VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  });

  app.post("/api/webhooks/meta", async (req, res) => {
    try {
      const body = req.body;
      if (body.object === "instagram" || body.object === "page") {
        for (const entry of body.entry || []) {
          for (const change of entry.changes || []) {
            await db.insert(backgroundJobs).values({
              userId: "system",
              jobType: "webhook_process",
              platform: body.object === "instagram" ? "instagram" : "facebook",
              status: "pending",
              payload: { entry, change },
            });
          }
        }
      }
      res.status(200).send("EVENT_RECEIVED");
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  return httpServer;
}
