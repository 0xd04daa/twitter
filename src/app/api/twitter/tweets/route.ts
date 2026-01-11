import { NextRequest, NextResponse } from 'next/server';
import { Tweet, TweetType } from '@/types';

const API_BASE = 'https://api.twitterapi.io/twitter';

interface MediaItem {
  type: string;
  media_url_https?: string;
  url?: string;
  video_info?: {
    variants?: Array<{
      url: string;
      content_type: string;
    }>;
  };
}

interface TwitterApiTweet {
  id: string;
  text: string;
  author: {
    userName: string;
    name: string;
    profilePicture?: string;
  };
  createdAt: string;
  isReply?: boolean;
  inReplyToId?: string | null;
  inReplyToUserId?: string | null;
  inReplyToUsername?: string | null;
  retweeted_tweet?: {
    id: string;
    text: string;
    author: {
      userName: string;
      name: string;
      profilePicture?: string;
    };
    createdAt: string;
    quoted_tweet?: {
      id: string;
      text: string;
      author: {
        userName: string;
        name: string;
        profilePicture?: string;
      };
      createdAt: string;
    };
    extendedEntities?: {
      media?: MediaItem[];
    };
  };
  quoted_tweet?: {
    id: string;
    text: string;
    author: {
      userName: string;
      name: string;
      profilePicture?: string;
    };
    createdAt: string;
    extendedEntities?: {
      media?: MediaItem[];
    };
  };
  extendedEntities?: {
    media?: MediaItem[];
  };
  likeCount?: number;
  retweetCount?: number;
  replyCount?: number;
  viewCount?: number;
}

interface TwitterApiResponse {
  status: string;
  code: number;
  msg: string;
  data: {
    pin_tweet: TwitterApiTweet | null;
    tweets: TwitterApiTweet[];
  };
  has_next_page?: boolean;
  next_cursor?: string;
}

async function fetchUserTweets(apiKey: string, userName: string): Promise<Tweet[]> {
  try {
    const url = new URL(`${API_BASE}/user/last_tweets`);
    url.searchParams.set('userName', userName);

    const response = await fetch(url.toString(), {
      headers: {
        'X-API-Key': apiKey,
      },
      next: { revalidate: 30 }, // Cache for 30 seconds
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch tweets for ${userName}: ${response.status} - ${errorText}`);
      return [];
    }

    const data: TwitterApiResponse = await response.json();

    if (!data.data?.tweets || !Array.isArray(data.data.tweets)) {
      console.error(`No tweets array in response for ${userName}:`, data);
      return [];
    }

    return data.data.tweets.map((t) => {
      // For retweets, use the original tweet's content
      const isRetweet = !!t.retweeted_tweet;
      const isQuote = !!t.quoted_tweet;
      const isReply = !!t.isReply || !!t.inReplyToId;
      const sourceTweet = isRetweet ? t.retweeted_tweet! : t;

      // Determine tweet type (priority: retweet > quote > reply > tweet)
      let tweetType: TweetType = 'tweet';
      if (isRetweet) {
        tweetType = 'retweet';
      } else if (isQuote) {
        tweetType = 'quote';
      } else if (isReply) {
        tweetType = 'reply';
      }

      // Helper function to parse media
      const parseMedia = (mediaItems?: MediaItem[]) => {
        return mediaItems?.map((m) => {
          let url = m.media_url_https || m.url || '';
          let type: 'photo' | 'video' | 'gif' = 'photo';

          if (m.type === 'video' || m.type === 'animated_gif') {
            type = m.type === 'animated_gif' ? 'gif' : 'video';
            // Get highest quality video URL
            const variants = m.video_info?.variants?.filter((v) => v.content_type === 'video/mp4');
            if (variants && variants.length > 0) {
              url = variants[variants.length - 1].url;
            }
          }

          return {
            type,
            url,
            previewUrl: m.media_url_https,
          };
        });
      };

      // Get media from the source tweet (for retweets, get from retweeted_tweet)
      const media = parseMedia(t.extendedEntities?.media);

      // Get quoted tweet - for retweets, check both main tweet and retweeted_tweet
      const quotedTweetSource = t.quoted_tweet || (isRetweet ? sourceTweet.quoted_tweet : undefined);

      return {
        id: t.id,
        tweetType,
        // For retweets, show the original tweet's content
        text: sourceTweet.text,
        authorHandle: sourceTweet.author.userName,
        authorName: sourceTweet.author.name,
        authorAvatar: sourceTweet.author.profilePicture,
        createdAt: sourceTweet.createdAt,
        // For retweets, store who retweeted it
        retweetedBy: isRetweet
          ? {
              authorHandle: t.author.userName,
              authorName: t.author.name,
              authorAvatar: t.author.profilePicture,
            }
          : undefined,
        // For replies, store what tweet this is replying to
        inReplyTo: isReply && t.inReplyToId
          ? {
              id: t.inReplyToId,
              authorHandle: t.inReplyToUsername || '',
            }
          : undefined,
        quotedTweet: quotedTweetSource
          ? {
              id: quotedTweetSource.id,
              text: quotedTweetSource.text,
              tweetType: 'tweet' as TweetType,
              authorHandle: quotedTweetSource.author?.userName || '',
              authorName: quotedTweetSource.author?.name || '',
              authorAvatar: quotedTweetSource.author?.profilePicture,
              createdAt: quotedTweetSource.createdAt,
            }
          : undefined,
        media,
        metrics: {
          likes: t.likeCount || 0,
          retweets: t.retweetCount || 0,
          replies: t.replyCount || 0,
          views: t.viewCount || 0,
        },
      };
    });
  } catch (error) {
    console.error(`Error fetching tweets for ${userName}:`, error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.TWITTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Twitter API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { handles } = body as { handles: string[] };

    if (!handles || !Array.isArray(handles) || handles.length === 0) {
      return NextResponse.json(
        { error: 'No handles provided' },
        { status: 400 }
      );
    }

    // Fetch tweets for all handles in parallel
    const tweetsArrays = await Promise.all(
      handles.slice(0, 10).map((handle) => fetchUserTweets(apiKey, handle))
    );

    // Merge and sort by date
    const allTweets = tweetsArrays
      .flat()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ tweets: allTweets });
  } catch (error) {
    console.error('Error in tweets API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
