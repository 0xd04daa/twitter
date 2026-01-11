'use client';

import { useState, useEffect, ReactNode, useCallback } from 'react';
import { ListType, TopSubscription } from '@/types';
import { useStore } from '@/lib/store';
import { setSubscriptions } from '@/lib/data';

function Tooltip({ label, children, onMouseEnter, onMouseLeave }: { label: string; children: ReactNode; onMouseEnter?: () => void; onMouseLeave?: () => void; }) {
  return (
    <div
      className="relative group inline-flex items-center justify-center"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
      <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-3 py-1 text-xs text-white opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition duration-75 shadow-lg border border-gray-700 z-10">
        {label}
      </span>
    </div>
  );
}

interface ProfileData {
  followersCount: number;
  name?: string;
  profilePicture?: string;
}

interface CustomizeFeedProps {
  onAddHandle: (handle: string) => void;
}

interface ProfileDetail {
  id?: string;
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

export function CustomizeFeed({ onAddHandle }: CustomizeFeedProps) {
  const [activeList, setActiveList] = useState<ListType>('myList');
  const [searchQuery, setSearchQuery] = useState('');
  const [subscriptions, setLocalSubscriptions] = useState<TopSubscription[]>([]);
  const [profileData, setProfileData] = useState<Record<string, ProfileData>>({});
  const [profileCache, setProfileCache] = useState<Record<string, ProfileDetail>>({});
  const [hoverCard, setHoverCard] = useState<{ handle: string; data: ProfileDetail | null; position: { x: number; y: number }; loading: boolean; error?: string } | null>(null);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(true);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const { myList, removeHandle, removeAllHandles, toggleTrackTweets, toggleTrackProfileUpdates, toggleTrackFollows } = useStore();

  // Fetch subscriptions from admin API
  useEffect(() => {
    const fetchSubscriptionsData = async () => {
      try {
        const response = await fetch('/api/admin/subscriptions');
        if (response.ok) {
          const data = await response.json();
          setLocalSubscriptions(data.subscriptions);
          // Update the cached subscriptions for isHandleAllowed
          setSubscriptions(data.subscriptions);
        }
      } catch (error) {
        console.error('Failed to fetch subscriptions:', error);
      } finally {
        setIsLoadingSubscriptions(false);
      }
    };

    fetchSubscriptionsData();
  }, []);

  // Fetch profile data for all handles in subscriptions
  useEffect(() => {
    const fetchProfiles = async () => {
      if (subscriptions.length === 0) return;

      const handles = subscriptions.map((sub) => sub.handle);
      setIsLoadingProfiles(true);

      try {
        const response = await fetch('/api/twitter/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ handles }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.profiles) {
            const newProfileData: Record<string, ProfileData> = {};
            Object.entries(data.profiles).forEach(([handle, profile]: [string, unknown]) => {
              const p = profile as { followersCount?: number; name?: string; profilePicture?: string };
              newProfileData[handle.toLowerCase()] = {
                followersCount: p.followersCount || 0,
                name: p.name,
                profilePicture: p.profilePicture,
              };
            });
            setProfileData(newProfileData);
          }
        }
      } catch (error) {
        console.error('Failed to fetch profiles:', error);
      } finally {
        setIsLoadingProfiles(false);
      }
    };

    fetchProfiles();
  }, [subscriptions]);

  const filteredTopSubscriptions = subscriptions.filter((sub) =>
    sub.handle.toLowerCase().includes(searchQuery.toLowerCase())
  ).map((sub) => ({
    ...sub,
    subscribers: profileData[sub.handle.toLowerCase()]?.followersCount ?? sub.subscribers,
  }));

  const filteredMyList = myList.filter((handle) =>
    handle.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLoading = isLoadingSubscriptions || isLoadingProfiles;

  const fetchProfileDetail = useCallback(async (handle: string): Promise<ProfileDetail | null> => {
    const normalized = handle.replace('@', '').toLowerCase();
    if (profileCache[normalized]) return profileCache[normalized];

    try {
      const res = await fetch(`/api/twitter/profile?userName=${encodeURIComponent(normalized)}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.profile) {
        const detail: ProfileDetail = {
          id: data.profile.id,
          userName: data.profile.userName || normalized,
          name: data.profile.name || data.profile.userName || normalized,
          profilePicture: data.profile.profilePicture,
          profileBanner: data.profile.profileBanner,
          description: data.profile.description,
          followersCount: data.profile.followersCount ?? 0,
          followingCount: data.profile.followingCount ?? 0,
          location: data.profile.location,
          createdAt: data.profile.createdAt,
          verified: data.profile.verified,
        };
        setProfileCache((prev) => ({ ...prev, [normalized]: detail }));
        return detail;
      }
    } catch (err) {
      console.error('Failed to fetch profile detail', err);
    }
    return null;
  }, [profileCache]);

  const showHoverCard = useCallback((handle: string, rect: DOMRect) => {
    const normalized = handle.replace('@', '').toLowerCase();
    const cached = profileCache[normalized] ?? null;
    setHoverCard({
      handle: normalized,
      data: cached,
      position: { x: rect.left + rect.width / 2, y: rect.bottom + 8 },
      loading: !cached,
      error: undefined,
    });
    if (!cached) {
      fetchProfileDetail(handle).then((detail) => {
        setHoverCard((prev) => {
          if (!prev || prev.handle !== normalized) return prev;
          if (!detail) {
            return { ...prev, loading: false, error: 'Failed to load profile' };
          }
          return { ...prev, data: detail, loading: false, error: undefined };
        });
      });
    }
  }, [fetchProfileDetail, profileCache]);

  const hideHoverCard = useCallback(() => {
    setHoverCard(null);
  }, []);

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-gray-900 rounded-lg mb-6">
        <div className="w-5 h-5 rounded-full border border-gray-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-gray-400 text-xs">i</span>
        </div>
        <p className="text-gray-400 text-sm">
          Twitter handles you add will only be actively tracked if they appear in the Top Subscriptions list.
          You can add popular handles directly from the Top Subscriptions tab.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveList('myList')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeList === 'myList'
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            My List
          </button>
          <button
            onClick={() => setActiveList('topSubscriptions')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeList === 'topSubscriptions'
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Top Subscriptions
          </button>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search handle"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
          />
        </div>
      </div>

      {/* Content */}
      {activeList === 'myList' ? (
        <MyListTable
          handles={filteredMyList}
          onRemove={removeHandle}
          onRemoveAll={removeAllHandles}
          onToggleTweets={toggleTrackTweets}
          onToggleProfileUpdates={toggleTrackProfileUpdates}
          onToggleFollows={toggleTrackFollows}
        />
      ) : (
        <TopSubscriptionsTable
          subscriptions={filteredTopSubscriptions}
          myListHandles={myList.map((h) => h.handle.toLowerCase())}
          onAdd={onAddHandle}
          isLoading={isLoadingSubscriptions}
          onHandleHover={showHoverCard}
          onHandleLeave={hideHoverCard}
        />
      )}

      {hoverCard && (
        <div
          className="fixed z-50"
          style={{ left: hoverCard.position.x, top: hoverCard.position.y, transform: 'translateX(-50%)' }}
          onMouseEnter={() => hoverCard && setHoverCard(hoverCard)}
          onMouseLeave={hideHoverCard}
        >
          <div className="w-96 rounded-xl bg-gray-900 border border-gray-700 shadow-2xl overflow-hidden">
            {hoverCard.loading ? (
              <div className="flex items-center justify-center py-6 text-gray-400 text-sm">Loading profile...</div>
            ) : hoverCard.error ? (
              <div className="flex items-center justify-center py-6 text-red-400 text-sm">{hoverCard.error}</div>
            ) : hoverCard.data ? (
              <div className="flex flex-col">
                {hoverCard.data.profileBanner && (
                  <div className="h-24 bg-gray-800 overflow-hidden">
                    <img src={hoverCard.data.profileBanner} alt="banner" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center">
                      {hoverCard.data?.profilePicture ? (
                        <img src={hoverCard.data.profilePicture} alt={hoverCard.data?.name || 'avatar'} className="w-12 h-12 object-cover" />
                      ) : (
                        <span className="text-white text-lg font-bold">{hoverCard.data?.name?.charAt(0) || ''}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold truncate">{hoverCard.data.name}</span>
                        {hoverCard.data.verified && (
                          <span className="text-blue-400">✔︎</span>
                        )}
                      </div>
                      <span className="text-gray-400 text-sm truncate">@{hoverCard.data.userName}</span>
                    </div>
                  </div>
                  {hoverCard.data.description && (
                    <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{hoverCard.data.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                    <span><span className="text-white font-semibold">{hoverCard.data.followingCount.toLocaleString()}</span> Following</span>
                    <span><span className="text-white font-semibold">{hoverCard.data.followersCount.toLocaleString()}</span> Followers</span>
                    {hoverCard.data.location && (
                      <span className="flex items-center gap-1">📍 <span>{hoverCard.data.location}</span></span>
                    )}
                    {hoverCard.data.createdAt && (
                      <span className="flex items-center gap-1">📅 <span>Joined {new Date(hoverCard.data.createdAt).toLocaleDateString()}</span></span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-6 text-gray-400 text-sm">No profile data</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface MyListTableProps {
  handles: Array<{
    handle: string;
    trackTweets: boolean;
    trackProfileUpdates: boolean;
    trackFollows: boolean;
  }>;
  onRemove: (handle: string) => void;
  onRemoveAll: () => void;
  onToggleTweets: (handle: string) => void;
  onToggleProfileUpdates: (handle: string) => void;
  onToggleFollows: (handle: string) => void;
}

function MyListTable({ handles, onRemove, onRemoveAll, onToggleTweets, onToggleProfileUpdates, onToggleFollows }: MyListTableProps) {

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      <table className="w-full table-fixed">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-center px-4 py-3 text-gray-400 font-medium text-sm w-16">#</th>
            <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">Handle</th>
            <th className="text-center px-4 py-3 text-gray-400 font-medium text-sm w-32">Tweets</th>
            <th className="text-center px-4 py-3 text-gray-400 font-medium text-sm w-40">Profile Updates</th>
            <th className="text-center px-4 py-3 text-gray-400 font-medium text-sm w-32">Follows</th>
            <th className="text-center px-4 py-3 w-28">
              <button
                onClick={onRemoveAll}
                className="text-red-400 hover:text-red-300 text-sm font-medium"
              >
                Remove All
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {handles.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-8 text-gray-500">
                No handles added yet. Add handles from the Top Subscriptions list.
              </td>
            </tr>
          ) : (
            handles.map((handle, index) => (
              <tr key={handle.handle} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="px-4 py-3 text-gray-500 text-sm text-center w-16">
                  <Tooltip label="助推">
                    <div className="flex items-center justify-center gap-1 cursor-pointer">
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                      </svg>
                      {index}
                    </div>
                  </Tooltip>
                </td>
                <td className="px-4 py-3 text-white">
                  <Tooltip label="在推特中打开">
                    <a
                      href={`https://twitter.com/${handle.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-400 transition-colors"
                    >
                      @{handle.handle}
                    </a>
                  </Tooltip>
                </td>
                <td className="text-center px-4 py-3 w-32">
                  <div className="flex justify-center">
                    <Tooltip label="隐藏推文">
                      <button
                        onClick={() => onToggleTweets(handle.handle)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          handle.trackTweets ? 'bg-blue-600' : 'bg-gray-700'
                        }`}
                      >
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.6 2.5h2.7l-5.9 6.7 6.9 9.2h-5.4l-4.3-5.6-4.9 5.6H.0l6.3-7.2L.3 2.5h5.6l3.9 5.1 4.5-5.1h1.3zm-1 14.2h1.5L5.4 4.1H3.8l8.8 12.6z" />
                        </svg>
                      </button>
                    </Tooltip>
                  </div>
                </td>
                <td className="text-center px-4 py-3 w-40">
                  <div className="flex justify-center">
                    <Tooltip label="隐藏个人资料更新">
                      <button
                        onClick={() => onToggleProfileUpdates(handle.handle)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          handle.trackProfileUpdates ? 'bg-blue-600' : 'bg-gray-700'
                        }`}
                      >
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </Tooltip>
                  </div>
                </td>
                <td className="text-center px-4 py-3 w-32">
                  <div className="flex justify-center">
                    <Tooltip label="隐藏关注">
                      <button
                        onClick={() => onToggleFollows(handle.handle)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          handle.trackFollows ? 'bg-pink-600' : 'bg-gray-700'
                        }`}
                      >
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                        </svg>
                      </button>
                    </Tooltip>
                  </div>
                </td>
                <td className="text-right px-4 py-3 w-28">
                  <Tooltip label="在列表中删除">
                    <button
                      onClick={() => onRemove(handle.handle)}
                      className="text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </Tooltip>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

interface TopSubscriptionsTableProps {
  subscriptions: Array<{
    rank: number;
    handle: string;
    subscribers: number;
    boosts: number;
  }>;
  myListHandles: string[];
  onAdd: (handle: string) => void;
  isLoading?: boolean;
  onHandleHover: (handle: string, rect: DOMRect) => void;
  onHandleLeave: () => void;
}

function TopSubscriptionsTable({ subscriptions, myListHandles, onAdd, isLoading, onHandleHover, onHandleLeave }: TopSubscriptionsTableProps) {
  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-lg p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm w-16"></th>
            <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm"></th>
            <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">Handle</th>
            <th className="text-right px-4 py-3 text-gray-400 font-medium text-sm">Subscribers</th>
            <th className="text-right px-4 py-3 text-gray-400 font-medium text-sm">Boosts</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-8 text-gray-500">
                No subscriptions available.
              </td>
            </tr>
          ) : (
            subscriptions.map((sub) => {
              const isAdded = myListHandles.includes(sub.handle.toLowerCase());
              return (
                <tr key={sub.handle} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-gray-500 text-sm">{sub.rank}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => !isAdded && onAdd(sub.handle)}
                      disabled={isAdded}
                      className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                        isAdded
                          ? 'bg-green-600 cursor-default'
                          : 'bg-gray-700 hover:bg-gray-600 cursor-pointer'
                      }`}
                    >
                      {isAdded ? (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-white">
                    <a
                      href={`https://twitter.com/${sub.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-400 transition-colors"
                      onMouseEnter={(e) => onHandleHover(sub.handle, (e.currentTarget as HTMLElement).getBoundingClientRect())}
                      onMouseLeave={onHandleLeave}
                    >
                      @{sub.handle}
                    </a>
                  </td>
                  <td className="text-right px-4 py-3 text-gray-300">{sub.subscribers.toLocaleString()}</td>
                  <td className="text-right px-4 py-3 text-gray-300">{sub.boosts.toLocaleString()}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
