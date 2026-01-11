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
  const { myList, tweets, addTweets, isHoveringFeed, setHoveringFeed } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTweets = useCallback(async () => {
    if (myList.length === 0) return;

    const handlesToFetch = myList.filter((h) => h.trackTweets).map((h) => h.handle);
    if (handlesToFetch.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/twitter/tweets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handles: handlesToFetch }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tweets');
      }

      if (data.tweets && data.tweets.length > 0) {
        addTweets(data.tweets);
      }
      setHasFetchedOnce(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tweets');
    } finally {
      setIsLoading(false);
    }
  }, [myList, addTweets]);

  // Initial fetch - always runs once
  useEffect(() => {
    if (!hasFetchedOnce && myList.length > 0) {
      fetchTweets();
    }
  }, [fetchTweets, hasFetchedOnce, myList.length]);

  // Polling - only when not hovering
  useEffect(() => {
    if (isHoveringFeed) {
      // Clear interval when hovering
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      // Start polling when not hovering
      intervalRef.current = setInterval(fetchTweets, 30000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isHoveringFeed, fetchTweets]);

  return (
    <div
      className="flex-1 p-6 overflow-y-auto relative"
      onMouseEnter={() => setHoveringFeed(true)}
      onMouseLeave={() => setHoveringFeed(false)}
    >
      <div className="max-w-[640px] mx-auto w-full">
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

        {!isLoading && tweets.length === 0 && myList.length > 0 && hasFetchedOnce && (
          <div className="text-center py-12 text-gray-500">
            <p>No tweets yet.</p>
            <p className="text-sm mt-2">Tweets will appear here once they are fetched.</p>
          </div>
        )}

        <div className="space-y-4">
          {tweets.map((tweet) => (
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
  const tweetType = tweet.retweet
    ? { name: 'retweet', icon: (
        <div className="w-7 h-7 rounded-lg bg-[#0f2621] flex items-center justify-center text-[#20e0a3]">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </div>
      ) }
    : tweet.quotedTweet
      ? { name: 'quote', icon: (
          <div className="w-7 h-7 rounded-lg bg-[#0f1330] flex items-center justify-center text-[#5b68ff]">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7.17 6.17A4.001 4.001 0 001 10v4a1 1 0 001 1h4a1 1 0 001-1v-4a1 1 0 00-1-1H4a2 2 0 012-2 1 1 0 001-1V6a1 1 0 00-1-1H5a3 3 0 00-2.83 2.17zM17 6h-4a1 1 0 00-1 1v1a1 1 0 001 1h2a2 2 0 00-2 2v4a1 1 0 001 1h4a1 1 0 001-1v-4a4 4 0 00-4-4 1 1 0 010-2z" />
            </svg>
          </div>
        ) }
      : (!tweet.media || tweet.media.length === 0)
        ? { name: 'text', icon: (
            <div className="w-7 h-7 rounded-lg bg-[#0f1330] flex items-center justify-center text-[#7b6bff]">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a1 1 0 011-1h8a1 1 0 110 2h-3v10a1 1 0 11-2 0V5H6a1 1 0 01-1-1z" />
              </svg>
            </div>
          ) }
        : { name: 'tweet', icon: (
            <div className="w-7 h-7 rounded-lg bg-[#0d1625] flex items-center justify-center text-[#58a8ff]">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a1 1 0 011-1h8a1 1 0 010 2H6a1 1 0 01-1-1zM4 9a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zm2 4a1 1 0 000 2h8a1 1 0 100-2H6z" />
              </svg>
            </div>
          ) };

  return (
    <div className="relative bg-gray-900 rounded-lg p-4 max-w-[600px] w-full mx-auto">
      <div className="absolute top-3 right-3" aria-label={tweetType.name}>
        {tweetType.icon}
      </div>
      {/* Retweet indicator */}
      {tweet.retweet && (
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          <span>{tweet.authorName} retweeted</span>
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

          {/* Tweet text */}
          <p className="text-white mt-1 whitespace-pre-wrap break-words">{renderTextWithLinks(tweet.text)}</p>

          {/* Quoted tweet */}
          {tweet.quotedTweet && (
            <div className="mt-3 border border-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-white text-sm">{tweet.quotedTweet.authorName}</span>
                <span className="text-gray-500 text-sm">@{tweet.quotedTweet.authorHandle}</span>
              </div>
              <p className="text-gray-300 text-sm whitespace-pre-wrap break-words">{renderTextWithLinks(tweet.quotedTweet.text)}</p>
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
