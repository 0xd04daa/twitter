import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.TWITTER_API_KEY;

  // Test the API
  if (!apiKey) {
    return NextResponse.json({
      status: 'error',
      message: 'TWITTER_API_KEY environment variable is not set',
      hasKey: false,
    });
  }

  try {
    // Test API call to ByteEchoC
    const url = new URL('https://api.twitterapi.io/twitter/user/last_tweets');
    url.searchParams.set('userName', 'ByteEchoC');

    const response = await fetch(url.toString(), {
      headers: {
        'X-API-Key': apiKey,
      },
    });

    const data = await response.json();

    // Find tweets with retweeted_tweet or quoted_tweet to inspect structure
    const tweets = data.data?.tweets || [];
    const retweetExample = tweets.find((t: Record<string, unknown>) => t.retweeted_tweet);
    const quoteExample = tweets.find((t: Record<string, unknown>) => t.quoted_tweet);

    // Show full structure of all tweets for debugging
    const tweetsWithDetails = tweets.slice(0, 10).map((t: Record<string, unknown>) => ({
      id: t.id,
      text: t.text,
      author: t.author,
      hasRetweetedTweet: !!t.retweeted_tweet,
      hasQuotedTweet: !!t.quoted_tweet,
      retweeted_tweet: t.retweeted_tweet || null,
      quoted_tweet: t.quoted_tweet || null,
      isReply: t.isReply,
      inReplyToId: t.inReplyToId,
    }));

    return NextResponse.json({
      status: response.ok ? 'success' : 'api_error',
      hasKey: true,
      keyPrefix: apiKey.substring(0, 8) + '...',
      apiStatus: response.status,
      tweetCount: tweets.length,
      // Show detailed tweet info
      tweetsWithDetails,
      // Show retweet example if found
      retweetExample: retweetExample || 'No retweets found',
      // Show quote example if found
      quoteExample: quoteExample || 'No quotes found',
    });
  } catch (error) {
    return NextResponse.json({
      status: 'fetch_error',
      hasKey: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
