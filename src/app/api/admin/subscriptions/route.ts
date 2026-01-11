import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const AUTH_COOKIE_NAME = 'admin_auth';
const AUTH_TOKEN = 'admin_authenticated_token_2024';

interface Subscription {
  rank: number;
  handle: string;
  subscribers: number;
  boosts: number;
}

// In-memory storage (will reset on cold starts, but works for serverless)
let memorySubscriptions: Subscription[] | null = null;

function getDefaultSubscriptions(): Subscription[] {
  // Check environment variable first
  if (process.env.SUBSCRIPTIONS_JSON) {
    try {
      return JSON.parse(process.env.SUBSCRIPTIONS_JSON);
    } catch {
      console.error('Failed to parse SUBSCRIPTIONS_JSON env var');
    }
  }
  return [
    { rank: 1, handle: 'ByteEchoC', subscribers: 0, boosts: 0 },
  ];
}

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
  return authCookie?.value === AUTH_TOKEN;
}

function readSubscriptions(): Subscription[] {
  if (memorySubscriptions === null) {
    memorySubscriptions = getDefaultSubscriptions();
  }
  return memorySubscriptions;
}

function writeSubscriptions(subscriptions: Subscription[]) {
  memorySubscriptions = subscriptions;
}

export async function GET() {
  try {
    const subscriptions = readSubscriptions();
    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error('Error reading subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to read subscriptions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { handle } = body;

    if (!handle || typeof handle !== 'string') {
      return NextResponse.json(
        { error: 'Handle is required' },
        { status: 400 }
      );
    }

    const subscriptions = readSubscriptions();

    // Check if already exists
    if (subscriptions.some((s) => s.handle.toLowerCase() === handle.toLowerCase())) {
      return NextResponse.json(
        { error: 'Handle already exists' },
        { status: 400 }
      );
    }

    // Add new subscription
    const newSubscription: Subscription = {
      rank: subscriptions.length + 1,
      handle: handle.replace('@', '').trim(),
      subscribers: 0,
      boosts: 0,
    };

    subscriptions.push(newSubscription);
    writeSubscriptions(subscriptions);

    return NextResponse.json({ success: true, subscription: newSubscription });
  } catch (error) {
    console.error('Error adding subscription:', error);
    return NextResponse.json(
      { error: 'Failed to add subscription' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscriptions } = body;

    if (!Array.isArray(subscriptions)) {
      return NextResponse.json(
        { error: 'Invalid subscriptions data' },
        { status: 400 }
      );
    }

    // Validate and reindex
    const validatedSubscriptions: Subscription[] = subscriptions.map((s, index) => ({
      rank: index + 1,
      handle: String(s.handle).replace('@', '').trim(),
      subscribers: Number(s.subscribers) || 0,
      boosts: Number(s.boosts) || 0,
    }));

    writeSubscriptions(validatedSubscriptions);

    return NextResponse.json({ success: true, subscriptions: validatedSubscriptions });
  } catch (error) {
    console.error('Error updating subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to update subscriptions' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const handle = searchParams.get('handle');

    if (!handle) {
      return NextResponse.json(
        { error: 'Handle is required' },
        { status: 400 }
      );
    }

    const subscriptions = readSubscriptions();
    const filtered = subscriptions.filter(
      (s) => s.handle.toLowerCase() !== handle.toLowerCase()
    );

    // Reindex ranks
    const reindexed = filtered.map((s, index) => ({
      ...s,
      rank: index + 1,
    }));

    writeSubscriptions(reindexed);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 }
    );
  }
}
