import { NextRequest } from 'next/server';
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

// Helper function to parse media
const parseMedia = (mediaItems?: MediaItem[]) => {
  return mediaItems?.map((m) => {
    let url = m.media_url_https || m.url || '';
    let type: 'photo' | 'video' | 'gif' = 'photo';

    if (m.type === 'video' || m.type === 'animated_gif') {
      type = m.type === 'animated_gif' ? 'gif' : 'video';
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

// Convert API tweet to our Tweet format
function convertTweet(t: TwitterApiTweet): Tweet {
  const isRetweet = !!t.retweeted_tweet;
  const isQuote = !!t.quoted_tweet;
  const isReply = !!t.isReply || !!t.inReplyToId;

  let tweetType: TweetType = 'tweet';
  if (isRetweet) {
    tweetType = 'retweet';
  } else if (isQuote) {
    tweetType = 'quote';
  } else if (isReply) {
    tweetType = 'reply';
  }

  const retweetedTweetData = t.retweeted_tweet;

  return {
    id: t.id,
    tweetType,
    text: isRetweet ? '' : t.text,
    authorHandle: t.author.userName,
    authorName: t.author.name,
    authorAvatar: t.author.profilePicture,
    createdAt: t.createdAt,
    retweetedTweet: isRetweet && retweetedTweetData
      ? {
          id: retweetedTweetData.id,
          text: retweetedTweetData.text,
          tweetType: 'tweet' as TweetType,
          authorHandle: retweetedTweetData.author.userName,
          authorName: retweetedTweetData.author.name,
          authorAvatar: retweetedTweetData.author.profilePicture,
          createdAt: retweetedTweetData.createdAt,
          media: parseMedia(retweetedTweetData.extendedEntities?.media),
          quotedTweet: retweetedTweetData.quoted_tweet
            ? {
                id: retweetedTweetData.quoted_tweet.id,
                text: retweetedTweetData.quoted_tweet.text,
                tweetType: 'tweet' as TweetType,
                authorHandle: retweetedTweetData.quoted_tweet.author?.userName || '',
                authorName: retweetedTweetData.quoted_tweet.author?.name || '',
                authorAvatar: retweetedTweetData.quoted_tweet.author?.profilePicture,
                createdAt: retweetedTweetData.quoted_tweet.createdAt,
              }
            : undefined,
        }
      : undefined,
    inReplyTo: isReply && t.inReplyToId
      ? {
          id: t.inReplyToId,
          authorHandle: t.inReplyToUsername || '',
        }
      : undefined,
    quotedTweet: !isRetweet && t.quoted_tweet
      ? {
          id: t.quoted_tweet.id,
          text: t.quoted_tweet.text,
          tweetType: 'tweet' as TweetType,
          authorHandle: t.quoted_tweet.author?.userName || '',
          authorName: t.quoted_tweet.author?.name || '',
          authorAvatar: t.quoted_tweet.author?.profilePicture,
          createdAt: t.quoted_tweet.createdAt,
          media: parseMedia(t.quoted_tweet.extendedEntities?.media),
        }
      : undefined,
    media: parseMedia(t.extendedEntities?.media),
    metrics: {
      likes: t.likeCount || 0,
      retweets: t.retweetCount || 0,
      replies: t.replyCount || 0,
      views: t.viewCount || 0,
    },
  };
}

async function fetchUserTweets(apiKey: string, userName: string): Promise<Tweet[]> {
  try {
    const url = new URL(`${API_BASE}/user/last_tweets`);
    url.searchParams.set('userName', userName);

    const response = await fetch(url.toString(), {
      headers: {
        'X-API-Key': apiKey,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`Failed to fetch tweets for ${userName}: ${response.status}`);
      return [];
    }

    const data: TwitterApiResponse = await response.json();

    if (!data.data?.tweets || !Array.isArray(data.data.tweets)) {
      return [];
    }

    return data.data.tweets.map(convertTweet);
  } catch (error) {
    console.error(`Error fetching tweets for ${userName}:`, error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.TWITTER_API_KEY;

  if (!apiKey) {
    return new Response('Twitter API key not configured', { status: 500 });
  }

  // Get handles from query params
  const searchParams = request.nextUrl.searchParams;
  const handlesParam = searchParams.get('handles');

  if (!handlesParam) {
    return new Response('No handles provided', { status: 400 });
  }

  const handles = handlesParam.split(',').filter(Boolean);

  if (handles.length === 0) {
    return new Response('No valid handles provided', { status: 400 });
  }

  // Track seen tweet IDs to only send new ones
  const seenTweetIds = new Set<string>();

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

      // Function to fetch and send new tweets
      const fetchAndSendTweets = async () => {
        try {
          const tweetsArrays = await Promise.all(
            handles.map((handle) => fetchUserTweets(apiKey, handle))
          );

          const allTweets = tweetsArrays
            .flat()
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          // Filter to only new tweets
          const newTweets = allTweets.filter((tweet) => !seenTweetIds.has(tweet.id));

          // Mark all current tweets as seen
          allTweets.forEach((tweet) => seenTweetIds.add(tweet.id));

          if (newTweets.length > 0) {
            // Send new tweets
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'tweets', tweets: newTweets })}\n\n`)
            );
          }

          // Send heartbeat
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`));
        } catch (error) {
          console.error('Error fetching tweets:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Failed to fetch tweets' })}\n\n`)
          );
        }
      };

      // Initial fetch
      await fetchAndSendTweets();

      // Poll every 10 seconds for new tweets
      const interval = setInterval(fetchAndSendTweets, 10000);

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
