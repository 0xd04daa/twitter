'use client';

import { useState } from 'react';
import { ListType } from '@/types';
import { useStore } from '@/lib/store';
import { TOP_SUBSCRIPTIONS } from '@/lib/data';

interface CustomizeFeedProps {
  onAddHandle: (handle: string) => void;
}

export function CustomizeFeed({ onAddHandle }: CustomizeFeedProps) {
  const [activeList, setActiveList] = useState<ListType>('myList');
  const [searchQuery, setSearchQuery] = useState('');
  const { myList, boosts, removeHandle, removeAllHandles, toggleTrackTweets, toggleTrackProfileUpdates, toggleTrackFollows } = useStore();

  const filteredTopSubscriptions = TOP_SUBSCRIPTIONS.filter((sub) =>
    sub.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMyList = myList.filter((handle) =>
    handle.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 p-6">
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
          {activeList === 'topSubscriptions' && (
            <span className="text-gray-500 text-sm">Updated recently</span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white" title="Available boosts. You earn 1 boost per 1 SOL traded.">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
            </svg>
            <span>{boosts.toLocaleString()}</span>
          </div>
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
        />
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
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm"></th>
            <th className="text-left px-4 py-3 text-gray-400 font-medium text-sm">Handle</th>
            <th className="text-center px-4 py-3 text-gray-400 font-medium text-sm">Tweets</th>
            <th className="text-center px-4 py-3 text-gray-400 font-medium text-sm">Profile Updates</th>
            <th className="text-center px-4 py-3 text-gray-400 font-medium text-sm">Follows</th>
            <th className="text-right px-4 py-3">
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
                <td className="px-4 py-3 text-gray-500 text-sm">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                    </svg>
                    {index}
                  </div>
                </td>
                <td className="px-4 py-3 text-white">@{handle.handle}</td>
                <td className="text-center px-4 py-3">
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
                </td>
                <td className="text-center px-4 py-3">
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
                </td>
                <td className="text-center px-4 py-3">
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
                </td>
                <td className="text-right px-4 py-3">
                  <button
                    onClick={() => onRemove(handle.handle)}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
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
}

function TopSubscriptionsTable({ subscriptions, myListHandles, onAdd }: TopSubscriptionsTableProps) {
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
          {subscriptions.map((sub) => {
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
                <td className="px-4 py-3 text-white">@{sub.handle}</td>
                <td className="text-right px-4 py-3 text-gray-300">{sub.subscribers.toLocaleString()}</td>
                <td className="text-right px-4 py-3 text-gray-300">{sub.boosts.toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
