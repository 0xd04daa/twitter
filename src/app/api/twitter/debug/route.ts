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

    return NextResponse.json({
      status: response.ok ? 'success' : 'api_error',
      hasKey: true,
      keyPrefix: apiKey.substring(0, 8) + '...',
      apiStatus: response.status,
      apiResponse: data,
      tweetCount: data.tweets?.length || 0,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'fetch_error',
      hasKey: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
