import { TopSubscription } from '@/types';

// Fixed list of top Twitter accounts that users can subscribe to
// This is the predefined list - users can only monitor accounts from this list
export const TOP_SUBSCRIPTIONS: TopSubscription[] = [
  { rank: 1, handle: 'awkchan45', subscribers: 4883, boosts: 1415296 },
  { rank: 2, handle: 'alohquant', subscribers: 28671, boosts: 1161890 },
  { rank: 3, handle: 's1mple_s1mple', subscribers: 8093, boosts: 994144 },
  { rank: 4, handle: 'morphosisfnf', subscribers: 16740, boosts: 716457 },
  { rank: 5, handle: 'aimbotfnf', subscribers: 19967, boosts: 498070 },
  { rank: 6, handle: 'ohzarke', subscribers: 41193, boosts: 384383 },
  { rank: 7, handle: 's1cksicks1ck', subscribers: 33647, boosts: 323202 },
  { rank: 8, handle: 'verdxtrade', subscribers: 82, boosts: 310428 },
  { rank: 9, handle: 'kingcarlos27', subscribers: 8429, boosts: 305521 },
  { rank: 10, handle: 'bajumvfx', subscribers: 15217, boosts: 285038 },
  { rank: 11, handle: 'veinvariance', subscribers: 3576, boosts: 283611 },
  { rank: 12, handle: 'retardkevinnn', subscribers: 2809, boosts: 280925 },
  { rank: 13, handle: 'thraxs0l', subscribers: 9181, boosts: 250101 },
  { rank: 14, handle: 'iconxbt', subscribers: 4593, boosts: 246623 },
  { rank: 15, handle: 'cz_binance', subscribers: 50000, boosts: 500000 },
  { rank: 16, handle: 'elonmusk', subscribers: 100000, boosts: 2000000 },
  { rank: 17, handle: 'VitalikButerin', subscribers: 45000, boosts: 800000 },
  { rank: 18, handle: 'SBF_FTX', subscribers: 12000, boosts: 150000 },
  { rank: 19, handle: 'aantonop', subscribers: 8000, boosts: 120000 },
  { rank: 20, handle: 'naval', subscribers: 35000, boosts: 450000 },
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
