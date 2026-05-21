import React, { useState, useEffect } from 'react';
import { Lock, X, AlertTriangle, Trash2 } from 'lucide-react';
import { useNotes } from '../context/NoteContext';

interface PrivateSpaceDialogProps {
  onClose: () => void;
}

export function PrivateSpaceDialog({ onClose }: PrivateSpaceDialogProps) {
  const {
    privateSpaceExists,
    setupPrivateSpace,
    unlockPrivateSpace,
    deletePrivateSpace,
    showPrivateNotes
  } = useNotes();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Lock body scroll when open
  useEffect(() => {
    document.body.classList.add('no-scroll');
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (privateSpaceExists) {
      if (unlockPrivateSpace(password)) {
        onClose();
      } else {
        setError('Incorrect password');
        setPassword('');
      }
    } else {
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      setupPrivateSpace(password);
      onClose();
    }
  };

  const handleDelete = () => {
    deletePrivateSpace();
    setShowDeleteConfirm(false);
    onClose();
  };

  if (showDeleteConfirm) {
    return (
      <div
        className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
        onClick={() => setShowDeleteConfirm(false)}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-lg w-full mx-4 max-w-sm shadow-xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="text-lg font-bold">Delete Space?</h2>
            </div>

            <p className="text-gray-600 dark:text-gray-300 text-sm mb-5">
              This will permanently delete all private notes and cannot be undone.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full mx-4 max-w-sm shadow-xl relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-full transition-all"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex justify-between items-center mb-4 pr-6">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${showPrivateNotes ? 'bg-purple-500 text-white fill-current' : 'text-purple-500'}`}>
                <Lock className={`h-4 w-4 ${showPrivateNotes ? 'fill-current' : ''}`} />
              </div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {privateSpaceExists ? 'Unlock Private Space' : 'Create Private Space'}
              </h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                {privateSpaceExists ? 'Password' : 'Set Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter password"
                className="w-full p-2.5 text-sm border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:ring-1 focus:ring-purple-500 outline-none"
                required
              />
            </div>

            {!privateSpaceExists && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Confirm password"
                  className="w-full p-2.5 text-sm border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 focus:ring-1 focus:ring-purple-500 outline-none"
                  required
                />
              </div>
            )}

            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}

            <div className="flex justify-between items-center pt-2">
              {privateSpaceExists ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                  title="Delete Private Space"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${showPrivateNotes
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-purple-500 hover:bg-purple-600'
                    } text-white`}
                >
                  {privateSpaceExists ? 'Unlock' : 'Create'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}