import pLimit from "p-limit";
import pRetry from "p-retry";

const limit = pLimit(3);

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const YOUTUBE_OAUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const YOUTUBE_TOKEN_URL = "https://oauth2.googleapis.com/token";

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube.force-ssl",
].join(" ");

export class YouTubeService {
  private apiKey: string;
  private quotaUsed = 0;
  private quotaLimit = 10000;

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY || "";
  }

  getOAuthUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: process.env.YOUTUBE_OAUTH_CLIENT_ID || "",
      redirect_uri: redirectUri,
      response_type: "code",
      scope: SCOPES,
      access_type: "offline",
      prompt: "consent",
      state,
    });
    return `${YOUTUBE_OAUTH_BASE}?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, redirectUri: string) {
    const res = await fetch(YOUTUBE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.YOUTUBE_OAUTH_CLIENT_ID || "",
        client_secret: process.env.YOUTUBE_OAUTH_CLIENT_SECRET || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Token exchange failed: ${res.status} ${errorBody}`);
    }
    return res.json() as Promise<{
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      token_type: string;
      scope: string;
    }>;
  }

  async refreshAccessToken(refreshToken: string) {
    const res = await fetch(YOUTUBE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: process.env.YOUTUBE_OAUTH_CLIENT_ID || "",
        client_secret: process.env.YOUTUBE_OAUTH_CLIENT_SECRET || "",
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Token refresh failed: ${res.status} ${errorBody}`);
    }
    return res.json() as Promise<{
      access_token: string;
      expires_in: number;
      token_type: string;
      scope: string;
    }>;
  }

  async getChannelInfo(accessToken: string) {
    this.quotaUsed += 1;
    return limit(() =>
      pRetry(async () => {
        const res = await fetch(
          `${YOUTUBE_API_BASE}/channels?part=snippet,statistics&mine=true`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!res.ok) throw new Error(`YouTube API error: ${res.status} ${res.statusText}`);
        return res.json();
      }, { retries: 2 })
    );
  }

  async getChannelVideos(channelId: string, maxResults = 50) {
    this.quotaUsed += 100;
    return limit(() =>
      pRetry(async () => {
        const res = await fetch(
          `${YOUTUBE_API_BASE}/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=${maxResults}&key=${this.apiKey}`
        );
        if (!res.ok) throw new Error(`YouTube API error: ${res.status} ${res.statusText}`);
        return res.json();
      }, { retries: 3 })
    );
  }

  async getVideoComments(videoId: string, pageToken?: string) {
    this.quotaUsed += 1;
    return limit(() =>
      pRetry(async () => {
        let url = `${YOUTUBE_API_BASE}/commentThreads?part=snippet&videoId=${videoId}&maxResults=100&order=time&key=${this.apiKey}`;
        if (pageToken) url += `&pageToken=${pageToken}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`YouTube API error: ${res.status} ${res.statusText}`);
        return res.json();
      }, { retries: 3 })
    );
  }

  async replyToComment(commentId: string, text: string, accessToken: string) {
    this.quotaUsed += 50;
    return limit(() =>
      pRetry(async () => {
        const res = await fetch(`${YOUTUBE_API_BASE}/comments?part=snippet`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            snippet: { parentId: commentId, textOriginal: text },
          }),
        });
        if (!res.ok) {
          const errorBody = await res.text();
          throw new Error(`YouTube reply error: ${res.status} ${errorBody}`);
        }
        return res.json();
      }, { retries: 2 })
    );
  }

  async getVideoDetails(videoId: string) {
    this.quotaUsed += 1;
    return limit(() =>
      pRetry(async () => {
        const res = await fetch(
          `${YOUTUBE_API_BASE}/videos?part=snippet,statistics&id=${videoId}&key=${this.apiKey}`
        );
        if (!res.ok) throw new Error(`YouTube API error: ${res.status} ${res.statusText}`);
        return res.json();
      }, { retries: 3 })
    );
  }

  getQuotaUsed() { return this.quotaUsed; }
  getQuotaRemaining() { return this.quotaLimit - this.quotaUsed; }
  resetQuota() { this.quotaUsed = 0; }
}

export const youtubeService = new YouTubeService();
