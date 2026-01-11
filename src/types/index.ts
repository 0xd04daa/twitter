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

// Tweet types for display
export type TweetType = 'tweet' | 'retweet' | 'quote' | 'reply' | 'profile_name' | 'profile_avatar' | 'profile_bio';

export interface Tweet {
  id: string;
  text: string;
  authorHandle: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  // Tweet type for categorization
  tweetType: TweetType;
  // For retweets: who retweeted this tweet
  retweetedBy?: {
    authorHandle: string;
    authorName: string;
    authorAvatar?: string;
  };
  // For replies: what tweet this is replying to
  inReplyTo?: {
    id: string;
    authorHandle: string;
    authorName?: string;
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
  // For profile updates
  profileUpdate?: {
    type: 'name' | 'avatar' | 'bio';
    oldValue?: string;
    newValue?: string;
  };
}

// Stored profile data for change detection
export interface StoredProfile {
  handle: string;
  name: string;
  avatar: string;
  bio: string;
  lastChecked: string;
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
