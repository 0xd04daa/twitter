export interface TwitterHandle {
  handle: string;
  displayName?: string;
  avatar?: string;
  subscribers?: number;
  boosts?: number;
  trackTweets: boolean;
  trackProfileUpdates: boolean;
  trackFollows: boolean;
}

export interface Tweet {
  id: string;
  text: string;
  authorHandle: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  // For retweets: who retweeted this tweet
  retweetedBy?: {
    authorHandle: string;
    authorName: string;
    authorAvatar?: string;
  };
  quotedTweet?: Tweet;
  media?: {
    type: 'photo' | 'video' | 'gif';
    url: string;
    previewUrl?: string;
  }[];
  metrics?: {
    likes: number;
    retweets: number;
    replies: number;
    views: number;
  };
}

export interface TopSubscription {
  rank: number;
  handle: string;
  displayName?: string;
  avatar?: string;
  subscribers: number;
  boosts: number;
}

export interface UserSettings {
  myList: TwitterHandle[];
  isPaused: boolean;
}

export type TabType = 'customize' | 'alerts';
export type ListType = 'myList' | 'topSubscriptions';
