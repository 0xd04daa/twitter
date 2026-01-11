'use client';

import { useState, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

export function Modal({ isOpen, onClose, children, title }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose}></div>
      <div className="relative bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: string) => boolean;
}

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleImport = () => {
    setError(null);
    if (!text.trim()) {
      setError('Please paste your exported Twitter list');
      return;
    }

    const success = onImport(text);
    if (success) {
      setText('');
      onClose();
    } else {
      setError('Invalid format. Please paste a valid exported list.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Twitter List">
      <div className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your exported Twitter list here..."
          className="w-full h-40 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 resize-none"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <p className="text-gray-500 text-sm">
          This will overwrite your current settings and boost allocations.
        </p>
        <button
          onClick={handleImport}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium"
        >
          Import
        </button>
      </div>
    </Modal>
  );
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportData: string;
}

export function ExportModal({ isOpen, onClose, exportData }: ExportModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Twitter List">
      <div className="space-y-4">
        <textarea
          value={exportData}
          readOnly
          className="w-full h-40 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 resize-none font-mono text-sm"
        />
        <button
          onClick={handleCopy}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium"
        >
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
      </div>
    </Modal>
  );
}

interface AddHandleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (handle: string) => boolean;
}

export function AddHandleModal({ isOpen, onClose, onAdd }: AddHandleModalProps) {
  const [handle, setHandle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!handle.trim()) {
      setError('Please enter a Twitter handle');
      return;
    }

    const success = onAdd(handle);
    if (success) {
      setHandle('');
      onClose();
    } else {
      setError('Handle is not in the allowed list or already added');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Twitter Handle">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-400 text-sm mb-2">Twitter Handle</label>
          <div className="flex items-center">
            <span className="text-gray-500 mr-1">@</span>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value.replace('@', ''))}
              placeholder="username"
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
              autoFocus
            />
          </div>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <p className="text-gray-500 text-sm">
          Note: Only handles from the Top Subscriptions list can be added.
        </p>
        <button
          type="submit"
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium"
        >
          Add Handle
        </button>
      </form>
    </Modal>
  );
}
