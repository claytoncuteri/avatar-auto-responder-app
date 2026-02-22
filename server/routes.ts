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
import { setupAuth, isAuthenticated } from "./replit_integrations/auth/replitAuth";
import { registerAuthRoutes } from "./replit_integrations/auth/routes";
import { youtubeService } from "./services/youtube";
import crypto from "crypto";

function createOAuthState(userId: string): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = JSON.stringify({ userId, nonce, ts: Date.now() });
  const secret = process.env.SESSION_SECRET || "fallback";
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(JSON.stringify({ payload, hmac })).toString("base64url");
}

function verifyOAuthState(state: string): { userId: string; nonce: string; ts: number } | null {
  try {
    const { payload, hmac } = JSON.parse(Buffer.from(state, "base64url").toString());
    const secret = process.env.SESSION_SECRET || "fallback";
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))) return null;
    const data = JSON.parse(payload);
    if (Date.now() - data.ts > 10 * 60 * 1000) return null;
    return data;
  } catch {
    return null;
  }
}

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

  await setupAuth(app);
  registerAuthRoutes(app);

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

  app.get("/api/youtube/auth", isAuthenticated, (req, res) => {
    try {
      const userId = getUserId(req);
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const redirectUri = `${protocol}://${req.hostname}/api/youtube/callback`;
      const state = createOAuthState(userId);
      const authUrl = youtubeService.getOAuthUrl(redirectUri, state);
      res.json({ authUrl });
    } catch (error) {
      console.error("YouTube auth error:", error);
      res.status(500).json({ error: "Failed to generate YouTube auth URL" });
    }
  });

  app.get("/api/youtube/callback", async (req, res) => {
    try {
      const { code, state, error: oauthError } = req.query;

      if (oauthError) {
        console.error("YouTube OAuth error:", oauthError);
        return res.redirect("/platforms?error=youtube_auth_denied");
      }

      if (!code || !state) {
        return res.redirect("/platforms?error=youtube_auth_failed");
      }

      const stateData = verifyOAuthState(state as string);
      if (!stateData) {
        console.error("Invalid or expired OAuth state");
        return res.redirect("/platforms?error=youtube_auth_failed");
      }
      const userId = stateData.userId;

      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const redirectUri = `${protocol}://${req.hostname}/api/youtube/callback`;

      const tokens = await youtubeService.exchangeCodeForTokens(code as string, redirectUri);

      const channelInfo = await youtubeService.getChannelInfo(tokens.access_token);
      const channel = channelInfo.items?.[0];

      if (!channel) {
        return res.redirect("/platforms?error=youtube_no_channel");
      }

      const channelTitle = channel.snippet?.title || "YouTube Channel";
      const channelId = channel.id;

      const existing = await db.select().from(platformConnections)
        .where(and(
          eq(platformConnections.userId, userId),
          eq(platformConnections.platform, "youtube"),
          eq(platformConnections.accountId, channelId)
        ));

      if (existing.length > 0) {
        await db.update(platformConnections)
          .set({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || existing[0].refreshToken,
            tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
            accountName: channelTitle,
            isActive: true,
            updatedAt: new Date(),
            metadata: {
              subscriberCount: channel.statistics?.subscriberCount,
              videoCount: channel.statistics?.videoCount,
              thumbnailUrl: channel.snippet?.thumbnails?.default?.url,
            },
          })
          .where(eq(platformConnections.id, existing[0].id));
      } else {
        await db.insert(platformConnections).values({
          userId,
          platform: "youtube",
          accountName: channelTitle,
          accountId: channelId,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || null,
          tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          isActive: true,
          metadata: {
            subscriberCount: channel.statistics?.subscriberCount,
            videoCount: channel.statistics?.videoCount,
            thumbnailUrl: channel.snippet?.thumbnails?.default?.url,
          },
        });
      }

      await db.insert(activityLog).values({
        userId,
        activityType: "platform_connected",
        platform: "youtube",
        description: `Connected YouTube channel: ${channelTitle}`,
        status: "success",
      });

      res.redirect("/platforms?success=youtube_connected");
    } catch (error) {
      console.error("YouTube callback error:", error);
      res.redirect("/platforms?error=youtube_auth_failed");
    }
  });

  app.get("/api/youtube/videos", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const connection = await db.select().from(platformConnections)
        .where(and(
          eq(platformConnections.userId, userId),
          eq(platformConnections.platform, "youtube"),
          eq(platformConnections.isActive, true)
        ))
        .limit(1);

      if (!connection.length) {
        return res.status(404).json({ error: "No YouTube connection found" });
      }

      const channelId = connection[0].accountId;
      if (!channelId) {
        return res.status(400).json({ error: "No channel ID found" });
      }

      const maxResults = parseInt(req.query.maxResults as string) || 25;
      const videos = await youtubeService.getChannelVideos(channelId, maxResults);
      res.json(videos);
    } catch (error) {
      console.error("YouTube videos error:", error);
      res.status(500).json({ error: "Failed to fetch YouTube videos" });
    }
  });

  app.get("/api/youtube/comments/:videoId", isAuthenticated, async (req, res) => {
    try {
      const videoId = req.params.videoId as string;
      const pageToken = req.query.pageToken as string | undefined;
      const result = await youtubeService.getVideoComments(videoId, pageToken);
      res.json(result);
    } catch (error) {
      console.error("YouTube comments error:", error);
      res.status(500).json({ error: "Failed to fetch YouTube comments" });
    }
  });

  app.post("/api/youtube/reply", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { commentId, text } = req.body;

      if (!commentId || !text) {
        return res.status(400).json({ error: "commentId and text are required" });
      }

      const connection = await db.select().from(platformConnections)
        .where(and(
          eq(platformConnections.userId, userId),
          eq(platformConnections.platform, "youtube"),
          eq(platformConnections.isActive, true)
        ))
        .limit(1);

      if (!connection.length || !connection[0].accessToken) {
        return res.status(404).json({ error: "No active YouTube connection found" });
      }

      let accessToken = connection[0].accessToken;

      if (connection[0].tokenExpiresAt && new Date(connection[0].tokenExpiresAt) <= new Date()) {
        if (!connection[0].refreshToken) {
          return res.status(401).json({ error: "YouTube token expired. Please reconnect." });
        }
        const refreshed = await youtubeService.refreshAccessToken(connection[0].refreshToken);
        accessToken = refreshed.access_token;
        await db.update(platformConnections)
          .set({
            accessToken: refreshed.access_token,
            tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
            updatedAt: new Date(),
          })
          .where(eq(platformConnections.id, connection[0].id));
      }

      const result = await youtubeService.replyToComment(commentId, text, accessToken);

      await db.insert(activityLog).values({
        userId,
        activityType: "comment_reply",
        platform: "youtube",
        description: `Replied to YouTube comment`,
        status: "success",
        metadata: { commentId, replyText: text },
      });

      res.json(result);
    } catch (error) {
      console.error("YouTube reply error:", error);
      res.status(500).json({ error: "Failed to reply to comment" });
    }
  });

  app.get("/api/youtube/quota", isAuthenticated, (req, res) => {
    res.json({
      used: youtubeService.getQuotaUsed(),
      remaining: youtubeService.getQuotaRemaining(),
      limit: 10000,
    });
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
