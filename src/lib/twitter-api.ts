import { Tweet, TweetType } from '@/types';

const API_BASE = 'https://api.twitterapi.io/twitter';

export class TwitterAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${API_BASE}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        'X-API-Key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`);
    }

    return response.json();
  }

  async getUserTweets(userName: string, cursor?: string): Promise<{
    tweets: Tweet[];
    next_cursor?: string;
  }> {
    const params: Record<string, string> = { userName };
    if (cursor) {
      params.cursor = cursor;
    }

    const data = await this.fetch<{
      tweets: Array<{
        id: string;
        text: string;
        author: {
          userName: string;
          name: string;
          profilePicture?: string;
        };
        createdAt: string;
        isReply?: boolean;
        inReplyToId?: string;
        inReplyToUsername?: string;
        retweetedTweet?: {
          author: {
            userName: string;
            name: string;
            profilePicture?: string;
          };
        };
        quotedTweet?: {
          id: string;
          text: string;
          author: {
            userName: string;
            name: string;
            profilePicture?: string;
          };
          createdAt: string;
        };
        media?: Array<{
          type: string;
          url: string;
          preview_image_url?: string;
        }>;
        likeCount?: number;
        retweetCount?: number;
        replyCount?: number;
        viewCount?: number;
      }>;
      next_cursor?: string;
    }>('/user/last_tweets', params);

    return {
      tweets: data.tweets.map((t) => {
        const isRetweet = !!t.retweetedTweet;
        const isQuote = !!t.quotedTweet;
        const isReply = !!t.isReply || !!t.inReplyToId;

        let tweetType: TweetType = 'tweet';
        if (isRetweet) tweetType = 'retweet';
        else if (isQuote) tweetType = 'quote';
        else if (isReply) tweetType = 'reply';

        return {
          id: t.id,
          text: t.text,
          tweetType,
          authorHandle: t.author.userName,
          authorName: t.author.name,
          authorAvatar: t.author.profilePicture,
          createdAt: t.createdAt,
          retweetedBy: t.retweetedTweet ? {
            authorHandle: t.retweetedTweet.author.userName,
            authorName: t.retweetedTweet.author.name,
            authorAvatar: t.retweetedTweet.author.profilePicture,
          } : undefined,
          inReplyTo: isReply && t.inReplyToId ? {
            id: t.inReplyToId,
            authorHandle: t.inReplyToUsername || '',
          } : undefined,
          quotedTweet: t.quotedTweet ? {
            id: t.quotedTweet.id,
            text: t.quotedTweet.text,
            tweetType: 'tweet' as TweetType,
            authorHandle: t.quotedTweet.author.userName,
            authorName: t.quotedTweet.author.name,
            authorAvatar: t.quotedTweet.author.profilePicture,
            createdAt: t.quotedTweet.createdAt,
          } : undefined,
          media: t.media?.map((m) => ({
            type: m.type as 'photo' | 'video' | 'gif',
            url: m.url,
            previewUrl: m.preview_image_url,
          })),
          metrics: {
            likes: t.likeCount || 0,
            retweets: t.retweetCount || 0,
            replies: t.replyCount || 0,
            views: t.viewCount || 0,
          },
        };
      }),
      next_cursor: data.next_cursor,
    };
  }

  async getUserProfile(userName: string): Promise<{
    id: string;
    userName: string;
    name: string;
    profilePicture?: string;
    description?: string;
    followersCount: number;
    followingCount: number;
  }> {
    return this.fetch('/user/info', { userName });
  }
}

// Create singleton instance
let twitterAPI: TwitterAPI | null = null;

export function getTwitterAPI(): TwitterAPI {
  if (!twitterAPI) {
    const apiKey = process.env.TWITTER_API_KEY;
    if (!apiKey) {
      throw new Error('TWITTER_API_KEY environment variable is not set');
    }
    twitterAPI = new TwitterAPI(apiKey);
  }
  return twitterAPI;
}
