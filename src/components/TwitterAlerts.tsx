'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Tweet } from '@/types';
import { useStore } from '@/lib/store';

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return `${diffSecs}s`;
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

function renderTextWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[\w.-]+(?:\/[\w\-._~:/?#\[\]@!$&'()*+,;=%]*)?)/gi;
  const parts = text.split(urlRegex);
  return parts.map((part, idx) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={`link-${idx}-${part}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline break-words"
        >
          {part}
        </a>
      );
    }
    return <span key={`txt-${idx}`}>{part}</span>;
  });
}

export function TwitterAlerts() {
  const { myList, tweets, addTweets, isHoveringFeed, setHoveringFeed, checkProfileChanges } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // SSE connection for real-time tweets
  useEffect(() => {
    const handlesToFetch = myList.filter((h) => h.trackTweets).map((h) => h.handle);

    if (handlesToFetch.length === 0) {
      // Close existing connection if no handles
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Close existing connection before creating new one
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setIsLoading(true);
    setError(null);

    // Create SSE connection
    const handlesParam = handlesToFetch.join(',');
    const eventSource = new EventSource(`/api/twitter/stream?handles=${encodeURIComponent(handlesParam)}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('SSE connected');
      setIsConnected(true);
      setIsLoading(false);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'connected') {
          console.log('Stream connected');
          setIsConnected(true);
          setIsLoading(false);
        } else if (data.type === 'tweets' && data.tweets) {
          // Add new tweets
          addTweets(data.tweets);
        } else if (data.type === 'error') {
          setError(data.message || 'Stream error');
        }
        // Ignore heartbeat messages
      } catch (err) {
        console.error('Error parsing SSE message:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
      setIsConnected(false);
      setError('Connection lost. Reconnecting...');

      // Close and attempt reconnect
      eventSource.close();
      eventSourceRef.current = null;

      // Reconnect after 3 seconds
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        // This will trigger the useEffect again due to dependency change
        setError(null);
      }, 3000);
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [myList, addTweets]);

  // Fetch profiles for change detection (separate from SSE)
  useEffect(() => {
    const handlesForProfiles = myList.filter((h) => h.trackProfileUpdates).map((h) => h.handle);

    if (handlesForProfiles.length === 0) return;

    const fetchProfiles = async () => {
      try {
        const response = await fetch('/api/twitter/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ handles: handlesForProfiles }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.profiles) {
            checkProfileChanges(data.profiles);
          }
        }
      } catch (err) {
        console.error('Error fetching profiles:', err);
      }
    };

    // Initial fetch
    fetchProfiles();

    // Poll profiles every 60 seconds (profile changes are less frequent)
    const interval = setInterval(fetchProfiles, 60000);

    return () => clearInterval(interval);
  }, [myList, checkProfileChanges]);

  return (
    <div
      className="flex-1 p-6 overflow-y-auto relative"
      onMouseEnter={() => setHoveringFeed(true)}
      onMouseLeave={() => setHoveringFeed(false)}
    >
      <div className="max-w-[640px] mx-auto w-full">
        {/* Connection status indicator */}
        <div className="flex items-center justify-end mb-4">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className={isConnected ? 'text-green-500' : 'text-gray-500'}>
              {isConnected ? 'Live' : isLoading ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-900/20 border border-red-600/30 rounded-lg mb-4">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-red-500">{error}</span>
          </div>
        )}

        {isLoading && tweets.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {!isLoading && tweets.length === 0 && myList.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No handles added yet.</p>
            <p className="text-sm mt-2">Add handles from the Customize Feed tab to start receiving alerts.</p>
          </div>
        )}

        {!isLoading && tweets.length === 0 && myList.length > 0 && isConnected && (
          <div className="text-center py-12 text-gray-500">
            <p>Waiting for new tweets...</p>
            <p className="text-sm mt-2">Tweets will appear here in real-time.</p>
          </div>
        )}

        <div className="space-y-4">
          {tweets
            .filter((tweet) => {
              // Only show tweets from users in myList
              const monitoredHandles = myList.map((h) => h.handle.toLowerCase());
              // All tweets now have the monitored user as the main author
              return monitoredHandles.includes(tweet.authorHandle.toLowerCase());
            })
            .map((tweet) => (
              <TweetCard key={tweet.id} tweet={tweet} />
            ))}
        </div>
      </div>
    </div>
  );
}

interface TweetCardProps {
  tweet: Tweet;
}

function TweetCard({ tweet }: TweetCardProps) {
  // Twitter official style icons for each tweet type
  const getTweetTypeConfig = () => {
    switch (tweet.tweetType) {
      case 'retweet':
        return {
          name: 'retweet',
          label: '转推',
          icon: (
            <div className="w-7 h-7 rounded-lg bg-[#00ba7c]/10 flex items-center justify-center">
              {/* Twitter Retweet Icon */}
              <svg className="w-4 h-4 text-[#00ba7c]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z" />
              </svg>
            </div>
          ),
        };
      case 'quote':
        return {
          name: 'quote',
          label: '引用',
          icon: (
            <div className="w-7 h-7 rounded-lg bg-[#1d9bf0]/10 flex items-center justify-center">
              {/* Twitter Quote Icon */}
              <svg className="w-4 h-4 text-[#1d9bf0]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.23 2.854c.98-.977 2.56-.977 3.54 0l3.38 3.378c.97.977.97 2.559 0 3.536L9.91 21H3v-6.914L14.23 2.854zm2.12 1.414c-.19-.195-.51-.195-.7 0L5 14.914V19h4.09L19.73 8.354c.2-.196.2-.512 0-.708l-3.38-3.378zM14.75 19l-2 2H21v-2h-6.25z" />
              </svg>
            </div>
          ),
        };
      case 'reply':
        return {
          name: 'reply',
          label: '回复',
          icon: (
            <div className="w-7 h-7 rounded-lg bg-[#1d9bf0]/10 flex items-center justify-center">
              {/* Twitter Reply Icon */}
              <svg className="w-4 h-4 text-[#1d9bf0]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z" />
              </svg>
            </div>
          ),
        };
      case 'profile_name':
        return {
          name: 'profile_name',
          label: '改名',
          icon: (
            <div className="w-7 h-7 rounded-lg bg-[#f91880]/10 flex items-center justify-center">
              {/* Profile/User Icon */}
              <svg className="w-4 h-4 text-[#f91880]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.651 19h12.698c-.337-1.8-1.023-3.21-1.945-4.19C15.318 13.65 13.838 13 12 13s-3.317.65-4.404 1.81c-.922.98-1.608 2.39-1.945 4.19zm.486-5.56C7.627 11.85 9.648 11 12 11s4.373.85 5.863 2.44c1.477 1.58 2.366 3.8 2.632 6.46l.11 1.1H3.395l.11-1.1c.266-2.66 1.155-4.88 2.632-6.46zM12 4c-1.105 0-2 .9-2 2s.895 2 2 2 2-.9 2-2-.895-2-2-2zM8 6c0-2.21 1.791-4 4-4s4 1.79 4 4-1.791 4-4 4-4-1.79-4-4z" />
              </svg>
            </div>
          ),
        };
      case 'profile_avatar':
        return {
          name: 'profile_avatar',
          label: '改头像',
          icon: (
            <div className="w-7 h-7 rounded-lg bg-[#794bc4]/10 flex items-center justify-center">
              {/* Camera/Image Icon */}
              <svg className="w-4 h-4 text-[#794bc4]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 5.5C3 4.119 4.12 3 5.5 3h13C19.88 3 21 4.119 21 5.5v13c0 1.381-1.12 2.5-2.5 2.5h-13C4.12 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13zM19 15.414l-3-3-5 5-3-3-3 3V18.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-3.086zM9.75 7C8.784 7 8 7.784 8 8.75s.784 1.75 1.75 1.75 1.75-.784 1.75-1.75S10.716 7 9.75 7z" />
              </svg>
            </div>
          ),
        };
      case 'profile_bio':
        return {
          name: 'profile_bio',
          label: '简介更新',
          icon: (
            <div className="w-7 h-7 rounded-lg bg-[#ffd400]/10 flex items-center justify-center">
              {/* Edit/Pen Icon */}
              <svg className="w-4 h-4 text-[#ffd400]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
              </svg>
            </div>
          ),
        };
      default:
        return {
          name: 'tweet',
          label: '推文',
          icon: (
            <div className="w-7 h-7 rounded-lg bg-[#1d9bf0]/10 flex items-center justify-center">
              {/* Twitter Logo / Tweet Icon */}
              <svg className="w-4 h-4 text-[#1d9bf0]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>
          ),
        };
    }
  };

  const typeConfig = getTweetTypeConfig();

  return (
    <div className="relative bg-gray-900 rounded-lg p-4 max-w-[600px] w-full mx-auto">
      <div className="absolute top-3 right-3" title={typeConfig.label}>
        {typeConfig.icon}
      </div>
      {/* Retweet indicator */}
      {tweet.tweetType === 'retweet' && (
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z" />
          </svg>
          <span>转推了</span>
        </div>
      )}
      {/* Reply indicator */}
      {tweet.inReplyTo && (
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z" />
          </svg>
          <span>回复 @{tweet.inReplyTo.authorHandle}</span>
        </div>
      )}
      {/* Profile update indicator */}
      {tweet.profileUpdate && (
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5.651 19h12.698c-.337-1.8-1.023-3.21-1.945-4.19C15.318 13.65 13.838 13 12 13s-3.317.65-4.404 1.81c-.922.98-1.608 2.39-1.945 4.19zm.486-5.56C7.627 11.85 9.648 11 12 11s4.373.85 5.863 2.44c1.477 1.58 2.366 3.8 2.632 6.46l.11 1.1H3.395l.11-1.1c.266-2.66 1.155-4.88 2.632-6.46zM12 4c-1.105 0-2 .9-2 2s.895 2 2 2 2-.9 2-2-.895-2-2-2zM8 6c0-2.21 1.791-4 4-4s4 1.79 4 4-1.791 4-4 4-4-1.79-4-4z" />
          </svg>
          <span>
            {tweet.profileUpdate.type === 'name' && '更改了名称'}
            {tweet.profileUpdate.type === 'avatar' && '更改了头像'}
            {tweet.profileUpdate.type === 'bio' && '更新了简介'}
          </span>
        </div>
      )}

      {/* Author info */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
          {tweet.authorAvatar ? (
            <img
              src={tweet.authorAvatar}
              alt={tweet.authorName}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <span className="text-gray-400 text-lg font-bold">
              {tweet.authorName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{tweet.authorName}</span>
            <span className="text-gray-500">@{tweet.authorHandle}</span>
            <span className="text-gray-500">·</span>
            <span className="text-gray-500">{formatTimeAgo(tweet.createdAt)}</span>
          </div>

          {/* Tweet text (for non-retweets) */}
          {tweet.text && (
            <p className="text-white mt-1 whitespace-pre-wrap break-words">{renderTextWithLinks(tweet.text)}</p>
          )}

          {/* Retweeted tweet (nested) */}
          {tweet.retweetedTweet && (
            <div className="mt-3 border border-gray-700 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-700 flex-shrink-0">
                  {tweet.retweetedTweet.authorAvatar ? (
                    <img
                      src={tweet.retweetedTweet.authorAvatar}
                      alt={tweet.retweetedTweet.authorName}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <span className="text-gray-400 text-xs font-bold flex items-center justify-center h-full">
                      {tweet.retweetedTweet.authorName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-white text-sm">{tweet.retweetedTweet.authorName}</span>
                    <span className="text-gray-500 text-sm">@{tweet.retweetedTweet.authorHandle}</span>
                  </div>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap break-words mt-1">{renderTextWithLinks(tweet.retweetedTweet.text)}</p>
                  {/* Media in retweeted tweet */}
                  {tweet.retweetedTweet.media && tweet.retweetedTweet.media.length > 0 && (
                    <div className="mt-2 grid gap-2 grid-cols-1">
                      {tweet.retweetedTweet.media.map((m, i) => (
                        <div key={i} className="rounded-lg overflow-hidden">
                          {m.type === 'photo' && (
                            <img src={m.url} alt="Tweet media" className="w-full h-auto max-h-64 object-cover" />
                          )}
                          {m.type === 'video' && (
                            <video src={m.url} poster={m.previewUrl} controls className="w-full h-auto max-h-64" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Quoted tweet within retweeted tweet */}
                  {tweet.retweetedTweet.quotedTweet && (
                    <div className="mt-2 border border-gray-600 rounded-lg p-2">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-white text-xs">{tweet.retweetedTweet.quotedTweet.authorName}</span>
                        <span className="text-gray-500 text-xs">@{tweet.retweetedTweet.quotedTweet.authorHandle}</span>
                      </div>
                      <p className="text-gray-400 text-xs whitespace-pre-wrap break-words mt-1">{renderTextWithLinks(tweet.retweetedTweet.quotedTweet.text)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quoted tweet */}
          {tweet.quotedTweet && (
            <div className="mt-3 border border-gray-700 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-700 flex-shrink-0">
                  {tweet.quotedTweet.authorAvatar ? (
                    <img
                      src={tweet.quotedTweet.authorAvatar}
                      alt={tweet.quotedTweet.authorName}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <span className="text-gray-400 text-xs font-bold flex items-center justify-center h-full">
                      {tweet.quotedTweet.authorName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-white text-sm">{tweet.quotedTweet.authorName}</span>
                    <span className="text-gray-500 text-sm">@{tweet.quotedTweet.authorHandle}</span>
                  </div>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap break-words mt-1">{renderTextWithLinks(tweet.quotedTweet.text)}</p>
                  {/* Media in quoted tweet */}
                  {tweet.quotedTweet.media && tweet.quotedTweet.media.length > 0 && (
                    <div className="mt-2 grid gap-2 grid-cols-1">
                      {tweet.quotedTweet.media.map((m, i) => (
                        <div key={i} className="rounded-lg overflow-hidden">
                          {m.type === 'photo' && (
                            <img src={m.url} alt="Tweet media" className="w-full h-auto max-h-64 object-cover" />
                          )}
                          {m.type === 'video' && (
                            <video src={m.url} poster={m.previewUrl} controls className="w-full h-auto max-h-64" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Media */}
          {tweet.media && tweet.media.length > 0 && (
            <div className="mt-3 grid gap-2 grid-cols-1">
              {tweet.media.map((m, i) => (
                <div key={i} className="rounded-lg overflow-hidden">
                  {m.type === 'photo' && (
                    <img
                      src={m.url}
                      alt="Tweet media"
                      className="w-full h-auto max-h-96 object-cover"
                    />
                  )}
                  {m.type === 'video' && (
                    <video
                      src={m.url}
                      poster={m.previewUrl}
                      controls
                      className="w-full h-auto max-h-96"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Metrics */}
          {tweet.metrics && (
            <div className="flex items-center gap-6 mt-3 text-gray-500 text-sm">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                {tweet.metrics.replies.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                {tweet.metrics.retweets.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                {tweet.metrics.likes.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                {tweet.metrics.views.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Add to list button */}
        <button className="text-gray-500 hover:text-blue-400 transition-colors">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
