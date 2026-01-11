import { TopSubscription } from '@/types';

// Fixed list of top Twitter accounts that users can subscribe to
// This is the predefined list - users can only monitor accounts from this list
export const TOP_SUBSCRIPTIONS: TopSubscription[] = [
  { rank: 1, handle: 'ByteEchoC', subscribers: 0, boosts: 0 },
];

// Helper to check if a handle is in the allowed list
export function isHandleAllowed(handle: string): boolean {
  const normalizedHandle = handle.toLowerCase().replace('@', '');
  return TOP_SUBSCRIPTIONS.some(
    (sub) => sub.handle.toLowerCase() === normalizedHandle
  );
}

// Get subscription info for a handle
export function getSubscriptionInfo(handle: string): TopSubscription | undefined {
  const normalizedHandle = handle.toLowerCase().replace('@', '');
  return TOP_SUBSCRIPTIONS.find(
    (sub) => sub.handle.toLowerCase() === normalizedHandle
  );
}
