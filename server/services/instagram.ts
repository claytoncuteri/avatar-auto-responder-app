import pLimit from "p-limit";
import pRetry from "p-retry";

const limit = pLimit(5);

export class InstagramService {
  private accessToken: string;
  private apiVersion = "v22.0";
  private baseUrl: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
  }

  async getUserMedia(userId: string) {
    return limit(() =>
      pRetry(async () => {
        const res = await fetch(
          `${this.baseUrl}/${userId}/media?fields=id,caption,media_type,media_url,permalink,timestamp&access_token=${this.accessToken}`
        );
        if (!res.ok) throw new Error(`Instagram API error: ${res.statusText}`);
        return res.json();
      }, { retries: 3 })
    );
  }

  async getMediaComments(mediaId: string) {
    return limit(() =>
      pRetry(async () => {
        const res = await fetch(
          `${this.baseUrl}/${mediaId}/comments?fields=id,text,username,timestamp,from&access_token=${this.accessToken}`
        );
        if (!res.ok) throw new Error(`Instagram API error: ${res.statusText}`);
        return res.json();
      }, { retries: 3 })
    );
  }

  async replyToComment(commentId: string, message: string) {
    return limit(() =>
      pRetry(async () => {
        const res = await fetch(
          `${this.baseUrl}/${commentId}/replies?message=${encodeURIComponent(message)}&access_token=${this.accessToken}`,
          { method: "POST" }
        );
        if (!res.ok) throw new Error(`Instagram API error: ${res.statusText}`);
        return res.json();
      }, { retries: 3 })
    );
  }

  async sendDirectMessage(recipientId: string, message: string) {
    return limit(() =>
      pRetry(async () => {
        const res = await fetch(`${this.baseUrl}/me/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: { id: recipientId },
            message: { text: message },
            access_token: this.accessToken,
          }),
        });
        if (!res.ok) throw new Error(`Instagram API error: ${res.statusText}`);
        return res.json();
      }, { retries: 3 })
    );
  }
}
