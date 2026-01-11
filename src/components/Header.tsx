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
  const { isPaused, togglePause } = useStore();

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
      <nav className="flex items-center gap-6">
        <button
          onClick={() => onTabChange('customize')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'customize'
              ? 'bg-gray-800 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Customize Feed
        </button>
        <button
          onClick={() => onTabChange('alerts')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
            activeTab === 'alerts'
              ? 'bg-gray-800 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Twitter Alerts
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-500 rounded-full"></span>
        </button>
        <button
          onClick={() => onTabChange('socials')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
            activeTab === 'socials'
              ? 'bg-gray-800 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Socials
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-500 rounded-full"></span>
        </button>
      </nav>

      <div className="flex items-center gap-3">
        {activeTab === 'alerts' && (
          <button
            onClick={togglePause}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            {isPaused ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Resume
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Paused
              </>
            )}
          </button>
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
