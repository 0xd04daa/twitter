import { TopSubscription } from '@/types';

// Default subscriptions - will be overridden by API data
let cachedSubscriptions: TopSubscription[] = [
  { rank: 1, handle: 'ByteEchoC', subscribers: 0, boosts: 0 },
];

// Update cached subscriptions
export function setSubscriptions(subscriptions: TopSubscription[]): void {
  cachedSubscriptions = subscriptions;
}

// Get cached subscriptions
export function getSubscriptions(): TopSubscription[] {
  return cachedSubscriptions;
}

// Helper to check if a handle is in the allowed list
export function isHandleAllowed(handle: string, subscriptions?: TopSubscription[]): boolean {
  const normalizedHandle = handle.toLowerCase().replace('@', '');
  const list = subscriptions || cachedSubscriptions;
  return list.some(
    (sub) => sub.handle.toLowerCase() === normalizedHandle
  );
}

// Get subscription info for a handle
export function getSubscriptionInfo(handle: string, subscriptions?: TopSubscription[]): TopSubscription | undefined {
  const normalizedHandle = handle.toLowerCase().replace('@', '');
  const list = subscriptions || cachedSubscriptions;
  return list.find(
    (sub) => sub.handle.toLowerCase() === normalizedHandle
  );
}

// Fetch subscriptions from API
export async function fetchSubscriptions(): Promise<TopSubscription[]> {
  try {
    const response = await fetch('/api/admin/subscriptions');
    if (response.ok) {
      const data = await response.json();
      cachedSubscriptions = data.subscriptions;
      return data.subscriptions;
    }
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error);
  }
  return cachedSubscriptions;
}
