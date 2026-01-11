import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://api.twitterapi.io/twitter';

interface UserProfile {
  id: string;
  userName: string;
  name: string;
  profilePicture?: string;
  profileBanner?: string;
  description?: string;
  followersCount: number;
  followingCount: number;
  location?: string;
  createdAt?: string;
  verified?: boolean;
}

async function fetchUserProfile(apiKey: string, userName: string): Promise<UserProfile | null> {
  try {
    const url = new URL(`${API_BASE}/user/info`);
    url.searchParams.set('userName', userName);

    const response = await fetch(url.toString(), {
      headers: {
        'X-API-Key': apiKey,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error(`Failed to fetch profile for ${userName}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return {
      id: data.id || data.rest_id,
      userName: data.userName || data.screen_name,
      name: data.name,
      profilePicture: data.profilePicture || data.profile_image_url_https,
      profileBanner: data.profileBanner || data.profile_banner_url || data.profile_banner_url_https,
      description: data.description,
      followersCount: data.followersCount || data.followers_count || 0,
      followingCount: data.followingCount || data.friends_count || 0,
      location: data.location,
      createdAt: data.createdAt || data.created_at,
      verified: data.verified,
    };
  } catch (error) {
    console.error(`Error fetching profile for ${userName}:`, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.TWITTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Twitter API key not configured' },
        { status: 500 }
      );
    }

    const userName = request.nextUrl.searchParams.get('userName');

    if (!userName) {
      return NextResponse.json(
        { error: 'userName parameter is required' },
        { status: 400 }
      );
    }

    const profile = await fetchUserProfile(apiKey, userName);

    if (!profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error in profile API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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

    // Fetch profiles for all handles in parallel
    const profiles = await Promise.all(
      handles.slice(0, 20).map((handle) => fetchUserProfile(apiKey, handle))
    );

    // Filter out null results and create a map
    const profileMap: Record<string, UserProfile> = {};
    profiles.forEach((profile, index) => {
      if (profile) {
        profileMap[handles[index].toLowerCase()] = profile;
      }
    });

    return NextResponse.json({ profiles: profileMap });
  } catch (error) {
    console.error('Error in profiles API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
