'use client';

import { TabType } from '@/types';
import { useStore } from '@/lib/store';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onImport: () => void;
  onExport: () => void;
  onAddHandle: () => void;
}

export function Header({ activeTab, onTabChange, onImport, onExport, onAddHandle }: HeaderProps) {
  const { isHoveringFeed, hasUnreadTweets, markTweetsAsRead } = useStore();

  const handleTabChange = (tab: TabType) => {
    if (tab === 'alerts') {
      markTweetsAsRead();
    }
    onTabChange(tab);
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
      <nav className="flex items-center gap-6">
        <button
          onClick={() => handleTabChange('customize')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'customize'
              ? 'bg-gray-800 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Customize Feed
        </button>
        <button
          onClick={() => handleTabChange('alerts')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
            activeTab === 'alerts'
              ? 'bg-gray-800 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Twitter Alerts
          {hasUnreadTweets && activeTab !== 'alerts' && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-500 rounded-full"></span>
          )}
        </button>
      </nav>

      <div className="flex items-center gap-3">
        {isHoveringFeed && (
          <div className="flex items-center gap-2 px-3 py-2 bg-yellow-900/50 border border-yellow-600/30 rounded-lg">
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-yellow-500 text-sm">Paused</span>
          </div>
        )}
        <button
          onClick={onImport}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Import
        </button>
        <button
          onClick={onExport}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Export
        </button>
        <button
          onClick={onAddHandle}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
        >
          Add Handle
        </button>
      </div>
    </header>
  );
}
