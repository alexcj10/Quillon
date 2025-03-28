import React, { useState } from 'react';
import { Note } from '../types';
import { Lock, X } from 'lucide-react';
import { useNotes } from '../context/NoteContext';

interface PrivateNoteAccessProps {
  note: Note;
  onSuccess: () => void;
  onClose: () => void;
}

export function PrivateNoteAccess({ note, onSuccess, onClose }: PrivateNoteAccessProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { validateNotePassword } = useNotes();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateNotePassword(note.id, password)) {
      onSuccess();
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md shadow-xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-purple-500" />
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                Private Note Access
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
                Enter Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Note password"
                className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
                required
              />
              {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                Access Note
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}