"""
Instagram API Integration Example
This shows how to connect to Instagram and monitor comments
"""

import requests
import time
from typing import List, Dict

class InstagramAPI:
    def __init__(self, access_token: str, ig_user_id: str):
        """
        Initialize Instagram API client
        
        Args:
            access_token: Your Instagram Graph API access token
            ig_user_id: Your Instagram Business Account ID
        """
        self.access_token = access_token
        self.ig_user_id = ig_user_id
        self.base_url = "https://graph.facebook.com/v19.0"
    
    def get_recent_media(self, limit: int = 25) -> List[Dict]:
        """Get recent posts/reels from your Instagram account"""
        url = f"{self.base_url}/{self.ig_user_id}/media"
        params = {
            'fields': 'id,caption,media_type,media_url,timestamp,permalink',
            'limit': limit,
            'access_token': self.access_token
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json().get('data', [])
    
    def get_media_comments(self, media_id: str) -> List[Dict]:
        """Get comments on a specific post/reel"""
        url = f"{self.base_url}/{media_id}/comments"
        params = {
            'fields': 'id,text,username,timestamp,from',
            'access_token': self.access_token
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json().get('data', [])
    
    def send_dm(self, recipient_id: str, message: str) -> Dict:
        """
        Send a DM to a user
        
        Args:
            recipient_id: Instagram user ID (from comment 'from' field)
            message: Message text to send
        """
        url = f"{self.base_url}/me/messages"
        data = {
            'recipient': {'id': recipient_id},
            'message': {'text': message},
            'access_token': self.access_token
        }
        
        response = requests.post(url, json=data)
        response.raise_for_status()
        return response.json()
    
    def monitor_comments_for_keywords(self, keywords: List[str], check_interval: int = 300):
        """
        Monitor comments and trigger on keywords
        
        Args:
            keywords: List of keywords to match (case-insensitive)
            check_interval: Seconds between checks (default: 5 minutes)
        """
        print(f"Starting to monitor for keywords: {keywords}")
        seen_comments = set()
        
        while True:
            try:
                # Get recent posts
                media_list = self.get_recent_media(limit=10)
                
                for media in media_list:
                    media_id = media['id']
                    
                    # Get comments on this post
                    comments = self.get_media_comments(media_id)
                    
                    for comment in comments:
                        comment_id = comment['id']
                        comment_text = comment['text'].lower()
                        username = comment['username']
                        user_id = comment['from']['id']
                        
                        # Skip if we've already processed this comment
                        if comment_id in seen_comments:
                            continue
                        
                        # Check if comment contains any keyword
                        matched_keyword = None
                        for keyword in keywords:
                            if keyword.lower() in comment_text:
                                matched_keyword = keyword
                                break
                        
                        if matched_keyword:
                            print(f"\n🎯 Keyword '{matched_keyword}' detected!")
                            print(f"   User: @{username}")
                            print(f"   Comment: {comment['text']}")
                            
                            # Send automated DM
                            dm_message = f"Hey {username}! Thanks for your comment. Here's the info you requested..."
                            
                            try:
                                self.send_dm(user_id, dm_message)
                                print(f"   ✅ DM sent to @{username}")
                            except Exception as e:
                                print(f"   ❌ Failed to send DM: {e}")
                            
                            # Mark as seen
                            seen_comments.add(comment_id)
                
                print(f"\nChecked {len(media_list)} posts. Waiting {check_interval}s...")
                time.sleep(check_interval)
                
            except Exception as e:
                print(f"Error during monitoring: {e}")
                time.sleep(60)  # Wait 1 minute on error


# Example Usage
if __name__ == "__main__":
    # Replace with your actual credentials
    ACCESS_TOKEN = "your_instagram_access_token_here"
    IG_USER_ID = "your_instagram_business_user_id_here"
    
    # Keywords to monitor for
    KEYWORDS = ["price", "info", "link", "details"]
    
    # Initialize API
    api = InstagramAPI(ACCESS_TOKEN, IG_USER_ID)
    
    # Start monitoring
    api.monitor_comments_for_keywords(KEYWORDS, check_interval=300)
