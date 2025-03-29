import React, { useState } from 'react';
import { Share2, Users, Clock } from 'lucide-react';

interface SharedNoteDialogProps {
  noteId: string;
  onClose: () => void;
}

export function SharedNoteDialog({ noteId, onClose }: SharedNoteDialogProps) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [sharedUsers, setSharedUsers] = useState<Array<{ email: string; permission: string }>>([]);
  const [activityHistory, setActivityHistory] = useState<Array<{ user: string; action: string; timestamp: Date }>>([]);

  const handleShare = () => {
    if (!email) return;
    
    setSharedUsers(prev => [...prev, { email, permission }]);
    setEmail('');
    // Here we would typically make an API call to share the note
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
          <Share2 className="w-5 h-5" />
          Share Note
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Share with email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
              />
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
              >
                <option value="view">Can view</option>
                <option value="edit">Can edit</option>
              </select>
            </div>
            <button
              onClick={handleShare}
              className="mt-2 w-full bg-blue-500 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              Share
            </button>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
              <Users className="w-4 h-4" />
              People with access
            </h3>
            <div className="space-y-2">
              {sharedUsers.map((user, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{user.email}</span>
                  <span className="text-gray-500 dark:text-gray-500">{user.permission}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4" />
              Activity
            </h3>
            <div className="space-y-2">
              {activityHistory.map((activity, index) => (
                <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                  {activity.user} {activity.action} • {activity.timestamp.toLocaleString()}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 