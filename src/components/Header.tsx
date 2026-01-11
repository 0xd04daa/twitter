'use client';

import { TabType } from '@/types';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onImport: () => void;
  onExport: () => void;
  onAddHandle: () => void;
}

export function Header({ activeTab, onTabChange, onImport, onExport, onAddHandle }: HeaderProps) {
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
      </nav>

      <div className="flex items-center gap-3">
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
