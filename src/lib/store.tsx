'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TwitterHandle, Tweet, StoredProfile } from '@/types';
import { isHandleAllowed } from './data';

interface StoreContextType {
  myList: TwitterHandle[];
  tweets: Tweet[];
  storedProfiles: Record<string, StoredProfile>;
  isPaused: boolean;
  isHoveringFeed: boolean;
  hasUnreadTweets: boolean;
  boosts: number;
  addHandle: (handle: string) => boolean;
  removeHandle: (handle: string) => void;
  removeAllHandles: () => void;
  toggleTrackTweets: (handle: string) => void;
  toggleTrackProfileUpdates: (handle: string) => void;
  toggleTrackFollows: (handle: string) => void;
  togglePause: () => void;
  setHoveringFeed: (isHovering: boolean) => void;
  markTweetsAsRead: () => void;
  importList: (data: string) => boolean;
  exportList: () => string;
  setTweets: (tweets: Tweet[]) => void;
  addTweets: (tweets: Tweet[]) => void;
  checkProfileChanges: (profiles: Record<string, { name: string; profilePicture?: string; description?: string }>) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEY = 'twitter-monitor-settings';
const PROFILES_STORAGE_KEY = 'twitter-monitor-profiles';

interface StoredData {
  myList: TwitterHandle[];
  isPaused: boolean;
  boosts: number;
}

function loadFromStorage(): StoredData {
  if (typeof window === 'undefined') {
    return { myList: [], isPaused: false, boosts: 652 };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load from storage:', e);
  }

  return { myList: [], isPaused: false, boosts: 652 };
}

function saveToStorage(data: StoredData): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to storage:', e);
  }
}

function loadProfilesFromStorage(): Record<string, StoredProfile> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const stored = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load profiles from storage:', e);
  }

  return {};
}

function saveProfilesToStorage(profiles: Record<string, StoredProfile>): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.error('Failed to save profiles to storage:', e);
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [myList, setMyList] = useState<TwitterHandle[]>([]);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [storedProfiles, setStoredProfiles] = useState<Record<string, StoredProfile>>({});
  const [isPaused, setIsPaused] = useState(false);
  const [isHoveringFeed, setIsHoveringFeed] = useState(false);
  const [hasUnreadTweets, setHasUnreadTweets] = useState(false);
  const [boosts, setBoosts] = useState(652);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    const data = loadFromStorage();
    setMyList(data.myList);
    setIsPaused(data.isPaused);
    setBoosts(data.boosts);
    setStoredProfiles(loadProfilesFromStorage());
    setIsLoaded(true);
  }, []);

  // Save to storage when data changes
  useEffect(() => {
    if (isLoaded) {
      saveToStorage({ myList, isPaused, boosts });
    }
  }, [myList, isPaused, boosts, isLoaded]);

  const addHandle = (handle: string): boolean => {
    const normalizedHandle = handle.replace('@', '').trim();

    // Check if already in list
    if (myList.some((h) => h.handle.toLowerCase() === normalizedHandle.toLowerCase())) {
      return false;
    }

    // Check if handle is in the allowed list
    if (!isHandleAllowed(normalizedHandle)) {
      return false;
    }

    const newHandle: TwitterHandle = {
      handle: normalizedHandle,
      trackTweets: true,
      trackProfileUpdates: true,
      trackFollows: true,
    };

    setMyList((prev) => [...prev, newHandle]);
    return true;
  };

  const removeHandle = (handle: string): void => {
    setMyList((prev) => prev.filter((h) => h.handle.toLowerCase() !== handle.toLowerCase()));
  };

  const removeAllHandles = (): void => {
    setMyList([]);
  };

  const toggleTrackTweets = (handle: string): void => {
    setMyList((prev) =>
      prev.map((h) =>
        h.handle.toLowerCase() === handle.toLowerCase()
          ? { ...h, trackTweets: !h.trackTweets }
          : h
      )
    );
  };

  const toggleTrackProfileUpdates = (handle: string): void => {
    setMyList((prev) =>
      prev.map((h) =>
        h.handle.toLowerCase() === handle.toLowerCase()
          ? { ...h, trackProfileUpdates: !h.trackProfileUpdates }
          : h
      )
    );
  };

  const toggleTrackFollows = (handle: string): void => {
    setMyList((prev) =>
      prev.map((h) =>
        h.handle.toLowerCase() === handle.toLowerCase()
          ? { ...h, trackFollows: !h.trackFollows }
          : h
      )
    );
  };

  const togglePause = (): void => {
    setIsPaused((prev) => !prev);
  };

  const setHoveringFeed = (hovering: boolean): void => {
    setIsHoveringFeed(hovering);
  };

  const markTweetsAsRead = (): void => {
    setHasUnreadTweets(false);
  };

  const importList = (data: string): boolean => {
    try {
      const parsed = JSON.parse(data);

      // Handle both array format and object format with myList
      const listData = Array.isArray(parsed) ? parsed : parsed.myList;
      const boostsData = Array.isArray(parsed) ? undefined : parsed.boosts;

      if (Array.isArray(listData)) {
        const validHandles: TwitterHandle[] = [];
        for (const item of listData) {
          const handle = typeof item === 'string' ? item : item.handle;
          if (handle && isHandleAllowed(handle)) {
            validHandles.push({
              handle: handle.replace('@', '').trim(),
              trackTweets: item.trackTweets ?? true,
              trackProfileUpdates: item.trackProfileUpdates ?? true,
              trackFollows: item.trackFollows ?? true,
            });
          }
        }
        setMyList(validHandles);
        if (boostsData) {
          setBoosts(boostsData);
        }
        return true;
      }
    } catch (e) {
      console.error('Failed to import list:', e);
    }
    return false;
  };

  const exportList = (): string => {
    return JSON.stringify({
      myList,
      boosts,
    }, null, 2);
  };

  const addTweets = (newTweets: Tweet[]): void => {
    setTweets((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const uniqueNewTweets = newTweets.filter((t) => !existingIds.has(t.id));
      if (uniqueNewTweets.length > 0) {
        setHasUnreadTweets(true);
      }
      return [...uniqueNewTweets, ...prev].slice(0, 100); // Keep last 100 tweets
    });
  };

  const checkProfileChanges = (profiles: Record<string, { name: string; profilePicture?: string; description?: string }>): void => {
    const profileUpdates: Tweet[] = [];
    const updatedStoredProfiles = { ...storedProfiles };
    const now = new Date().toISOString();

    Object.entries(profiles).forEach(([handle, profile]) => {
      const handleLower = handle.toLowerCase();
      const stored = storedProfiles[handleLower];

      // Check if user wants profile update tracking
      const userConfig = myList.find((h) => h.handle.toLowerCase() === handleLower);
      if (!userConfig?.trackProfileUpdates) return;

      if (stored) {
        // Check for name change
        if (stored.name !== profile.name) {
          profileUpdates.push({
            id: `profile-name-${handleLower}-${Date.now()}`,
            tweetType: 'profile_name',
            text: `@${handle} 的名称已从 "${stored.name}" 更改为 "${profile.name}"`,
            authorHandle: handle,
            authorName: profile.name,
            authorAvatar: profile.profilePicture,
            createdAt: now,
            profileUpdate: {
              type: 'name',
              oldValue: stored.name,
              newValue: profile.name,
            },
          });
        }

        // Check for avatar change
        if (stored.avatar !== profile.profilePicture && profile.profilePicture) {
          profileUpdates.push({
            id: `profile-avatar-${handleLower}-${Date.now()}`,
            tweetType: 'profile_avatar',
            text: `@${handle} 更换了新头像`,
            authorHandle: handle,
            authorName: profile.name,
            authorAvatar: profile.profilePicture,
            createdAt: now,
            profileUpdate: {
              type: 'avatar',
              oldValue: stored.avatar,
              newValue: profile.profilePicture,
            },
          });
        }

        // Check for bio change
        if (stored.bio !== (profile.description || '')) {
          profileUpdates.push({
            id: `profile-bio-${handleLower}-${Date.now()}`,
            tweetType: 'profile_bio',
            text: profile.description || '(简介已清空)',
            authorHandle: handle,
            authorName: profile.name,
            authorAvatar: profile.profilePicture,
            createdAt: now,
            profileUpdate: {
              type: 'bio',
              oldValue: stored.bio,
              newValue: profile.description || '',
            },
          });
        }
      }

      // Update stored profile
      updatedStoredProfiles[handleLower] = {
        handle,
        name: profile.name,
        avatar: profile.profilePicture || '',
        bio: profile.description || '',
        lastChecked: now,
      };
    });

    // Save updated profiles
    if (Object.keys(updatedStoredProfiles).length > 0) {
      setStoredProfiles(updatedStoredProfiles);
      saveProfilesToStorage(updatedStoredProfiles);
    }

    // Add profile updates to tweets
    if (profileUpdates.length > 0) {
      addTweets(profileUpdates);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        myList,
        tweets,
        storedProfiles,
        isPaused,
        isHoveringFeed,
        hasUnreadTweets,
        boosts,
        addHandle,
        removeHandle,
        removeAllHandles,
        toggleTrackTweets,
        toggleTrackProfileUpdates,
        toggleTrackFollows,
        togglePause,
        setHoveringFeed,
        markTweetsAsRead,
        importList,
        exportList,
        setTweets,
        addTweets,
        checkProfileChanges,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextType {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
