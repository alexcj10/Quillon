import React, { useState } from 'react';
import { Lock, X, AlertTriangle } from 'lucide-react';
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md shadow-xl">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4 text-red-500">
              <AlertTriangle className="h-6 w-6" />
              <h2 className="text-xl font-bold">Delete Private Space</h2>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete your private space? This will permanently delete all private notes and cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete Private Space
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md shadow-xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${showPrivateNotes ? 'bg-purple-500 text-white fill-current' : 'text-purple-500'}`}>
                <Lock className={`h-5 w-5 ${showPrivateNotes ? 'fill-current' : ''}`} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                {privateSpaceExists ? 'Unlock Private Space' : 'Create Private Space'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {privateSpaceExists ? 'Enter Password' : 'Set Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter password"
                className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                required
              />
            </div>

            {!privateSpaceExists && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                  required
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <div className="flex justify-between items-center pt-2">
              {privateSpaceExists && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  Delete Private Space
                </button>
              )}
              <div className="flex gap-3 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    showPrivateNotes 
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