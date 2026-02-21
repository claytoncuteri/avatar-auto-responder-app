import pLimit from "p-limit";
import pRetry from "p-retry";

const limit = pLimit(5);

export class FacebookService {
  private accessToken: string;
  private apiVersion = "v22.0";
  private baseUrl: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
  }

  async getPagePosts(pageId: string) {
    return limit(() =>
      pRetry(async () => {
        const res = await fetch(
          `${this.baseUrl}/${pageId}/posts?fields=id,message,created_time,permalink_url,attachments&access_token=${this.accessToken}`
        );
        if (!res.ok) throw new Error(`Facebook API error: ${res.statusText}`);
        return res.json();
      }, { retries: 3 })
    );
  }

  async getPostComments(postId: string) {
    return limit(() =>
      pRetry(async () => {
        const res = await fetch(
          `${this.baseUrl}/${postId}/comments?fields=id,message,created_time,from&access_token=${this.accessToken}`
        );
        if (!res.ok) throw new Error(`Facebook API error: ${res.statusText}`);
        return res.json();
      }, { retries: 3 })
    );
  }

  async replyToComment(commentId: string, message: string) {
    return limit(() =>
      pRetry(async () => {
        const res = await fetch(`${this.baseUrl}/${commentId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, access_token: this.accessToken }),
        });
        if (!res.ok) throw new Error(`Facebook API error: ${res.statusText}`);
        return res.json();
      }, { retries: 3 })
    );
  }

  async sendMessage(recipientId: string, message: string) {
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
        if (!res.ok) throw new Error(`Facebook API error: ${res.statusText}`);
        return res.json();
      }, { retries: 3 })
    );
  }
}
