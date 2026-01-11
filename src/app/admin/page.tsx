'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Subscription {
  rank: number;
  handle: string;
  subscribers: number;
  boosts: number;
}

export default function AdminDashboardPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [newHandle, setNewHandle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/auth');
      if (!response.ok) {
        router.push('/admin/login');
      }
    } catch {
      router.push('/admin/login');
    }
  }, [router]);

  const loadSubscriptions = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/subscriptions');
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions);
      }
    } catch (err) {
      setError('Failed to load subscriptions');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    loadSubscriptions();
  }, [checkAuth, loadSubscriptions]);

  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHandle.trim()) return;

    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const response = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: newHandle }),
      });

      if (response.ok) {
        setNewHandle('');
        setSuccess('Handle added successfully');
        loadSubscriptions();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add handle');
      }
    } catch {
      setError('Network error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubscription = async (handle: string) => {
    if (!confirm(`Are you sure you want to delete @${handle}?`)) return;

    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/subscriptions?handle=${encodeURIComponent(handle)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Handle deleted successfully');
        loadSubscriptions();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete handle');
      }
    } catch {
      setError('Network error');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
      router.push('/admin/login');
    } catch {
      router.push('/admin/login');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <a
            href="/"
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            View Site
          </a>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Add New Handle</h2>
          <form onSubmit={handleAddSubscription} className="flex gap-4">
            <div className="flex-1">
              <div className="flex items-center">
                <span className="text-gray-500 mr-1">@</span>
                <input
                  type="text"
                  value={newHandle}
                  onChange={(e) => setNewHandle(e.target.value.replace('@', ''))}
                  placeholder="username"
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSaving || !newHandle.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Adding...' : 'Add Handle'}
            </button>
          </form>
        </div>

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-600/30 rounded-lg mb-6">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-900/20 border border-green-600/30 rounded-lg mb-6">
            <p className="text-green-500">{success}</p>
          </div>
        )}

        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">
              Top Subscriptions ({subscriptions.length})
            </h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-3 text-gray-400 font-medium text-sm">Rank</th>
                <th className="text-left px-6 py-3 text-gray-400 font-medium text-sm">Handle</th>
                <th className="text-right px-6 py-3 text-gray-400 font-medium text-sm">Subscribers</th>
                <th className="text-right px-6 py-3 text-gray-400 font-medium text-sm">Boosts</th>
                <th className="text-right px-6 py-3 text-gray-400 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No subscriptions yet. Add one above.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.handle} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="px-6 py-4 text-gray-400">{sub.rank}</td>
                    <td className="px-6 py-4 text-white">@{sub.handle}</td>
                    <td className="px-6 py-4 text-gray-300 text-right">{sub.subscribers.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-300 text-right">{sub.boosts.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteSubscription(sub.handle)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
