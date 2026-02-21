import pLimit from "p-limit";
import pRetry from "p-retry";

const limit = pLimit(5);

export class ThreadsService {
  private accessToken: string;
  private apiVersion = "v22.0";
  private baseUrl: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.baseUrl = `https://graph.threads.net/${this.apiVersion}`;
  }

  async getUserThreads(userId: string) {
    return limit(() =>
      pRetry(async () => {
        const res = await fetch(
          `${this.baseUrl}/${userId}/threads?fields=id,text,timestamp,permalink,media_type&access_token=${this.accessToken}`
        );
        if (!res.ok) throw new Error(`Threads API error: ${res.statusText}`);
        return res.json();
      }, { retries: 3 })
    );
  }

  async getThreadReplies(threadId: string) {
    return limit(() =>
      pRetry(async () => {
        const res = await fetch(
          `${this.baseUrl}/${threadId}/replies?fields=id,text,timestamp,username,from&access_token=${this.accessToken}`
        );
        if (!res.ok) throw new Error(`Threads API error: ${res.statusText}`);
        return res.json();
      }, { retries: 3 })
    );
  }

  async replyToThread(threadId: string, message: string) {
    return limit(() =>
      pRetry(async () => {
        const res = await fetch(`${this.baseUrl}/${threadId}/replies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: message, access_token: this.accessToken }),
        });
        if (!res.ok) throw new Error(`Threads API error: ${res.statusText}`);
        return res.json();
      }, { retries: 3 })
    );
  }
}
