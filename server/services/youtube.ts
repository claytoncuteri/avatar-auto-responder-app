import pLimit from "p-limit";
import pRetry from "p-retry";

const limit = pLimit(3);

export class YouTubeService {
  private apiKey: string;
  private baseUrl = "https://www.googleapis.com/youtube/v3";
  private quotaUsed = 0;
  private quotaLimit = 10000;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getChannelVideos(channelId: string) {
    this.quotaUsed += 100;
    return limit(() =>
      pRetry(async () => {
        const res = await fetch(
          `${this.baseUrl}/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=50&key=${this.apiKey}`
        );
        if (!res.ok) throw new Error(`YouTube API error: ${res.statusText}`);
        return res.json();
      }, { retries: 3 })
    );
  }

  async getVideoComments(videoId: string) {
    this.quotaUsed += 1;
    return limit(() =>
      pRetry(async () => {
        const res = await fetch(
          `${this.baseUrl}/commentThreads?part=snippet&videoId=${videoId}&maxResults=100&key=${this.apiKey}`
        );
        if (!res.ok) throw new Error(`YouTube API error: ${res.statusText}`);
        return res.json();
      }, { retries: 3 })
    );
  }

  async replyToComment(commentId: string, text: string, accessToken: string) {
    this.quotaUsed += 50;
    return limit(() =>
      pRetry(async () => {
        const res = await fetch(`${this.baseUrl}/comments?part=snippet`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            snippet: { parentId: commentId, textOriginal: text },
          }),
        });
        if (!res.ok) throw new Error(`YouTube API error: ${res.statusText}`);
        return res.json();
      }, { retries: 3 })
    );
  }

  getQuotaUsed() { return this.quotaUsed; }
  getQuotaRemaining() { return this.quotaLimit - this.quotaUsed; }
  resetQuota() { this.quotaUsed = 0; }
}
