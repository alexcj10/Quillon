import React, { useState, useCallback } from 'react';
import { X, Tag, Star, Lock, Clock, Download, ChevronDown, Users, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadNote } from '../utils/downloadUtils';
import { useOutsideClick } from '../hooks/useOutsideClick';
import { useNotes } from '../context/NoteContext';
import { SharedUser, NoteActivity } from '../types';

interface NoteViewerProps {
  note: {
    id: string;
    title: string;
    content: string;
    tags: string[];
    isFavorite: boolean;
    isPrivate: boolean;
    createdAt: string;
    updatedAt: string;
    isShared?: boolean;
  };
  onClose: () => void;
}

export function NoteViewer({ note, onClose }: NoteViewerProps) {
  const { getSharedUsers, getNoteActivity } = useNotes();
  const [showFormatOptions, setShowFormatOptions] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'activity'>('content');
  
  const sharedUsers = getSharedUsers(note.id);
  const activityHistory = getNoteActivity(note.id);

  const handleCloseFormatOptions = useCallback(() => {
    setShowFormatOptions(false);
  }, []);

  const formatOptionsRef = useOutsideClick({
    onOutsideClick: handleCloseFormatOptions,
    isOpen: showFormatOptions
  });

  const handleDownload = async (format: 'txt' | 'pdf') => {
    await downloadNote(note, { format });
    setShowFormatOptions(false);
  };

  const renderActivityItem = (activity: NoteActivity) => {
    const date = new Date(activity.timestamp);
    const timeAgo = new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    );

    return (
      <div className="flex items-start gap-3 py-2">
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300">
          {activity.user.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-700 dark:text-gray-200">
            <span className="font-medium">{activity.user}</span> {activity.action}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo}</p>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex"
          onClick={e => e.stopPropagation()}
        >
          {/* Main Content */}
          <div className="flex-1 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {note.title || 'Untitled Note'}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Created {new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                    {note.isPrivate && (
                      <div className="flex items-center gap-1 text-purple-500 dark:text-purple-400">
                        <Lock className="w-4 h-4" />
                        <span>Private</span>
                      </div>
                    )}
                    {note.isFavorite && (
                      <div className="flex items-center gap-1 text-yellow-500 dark:text-yellow-400">
                        <Star className="w-4 h-4" />
                        <span>Favorite</span>
                      </div>
                    )}
                    {note.isShared && (
                      <div className="flex items-center gap-1 text-blue-500 dark:text-blue-400">
                        <Users className="w-4 h-4" />
                        <span>Shared</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative" ref={formatOptionsRef}>
                    <button
                      onClick={() => setShowFormatOptions(!showFormatOptions)}
                      className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-sm">Download</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {showFormatOptions && (
                      <div 
                        className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-700 rounded-lg shadow-lg overflow-hidden z-50"
                      >
                        <button
                          onClick={() => handleDownload('txt')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          Download TXT
                        </button>
                        <button
                          onClick={() => handleDownload('pdf')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          Download PDF
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('content')}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  activeTab === 'content'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Content
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  activeTab === 'activity'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Activity
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'content' ? (
                <div className="p-6">
                  <div className="prose dark:prose-invert max-w-none dark:text-gray-200">
                    {note.content.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-4 text-gray-700 dark:text-gray-200">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {activityHistory.length > 0 ? (
                    activityHistory.map((activity, index) => (
                      <div key={index}>
                        {renderActivityItem(activity)}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400">
                      No activity yet
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {note.tags.length > 0 && (
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                  <div className="flex flex-wrap gap-2">
                    {note.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Shared Users Sidebar */}
          {note.isShared && (
            <div className="w-64 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Shared with
              </h3>
              <div className="space-y-3">
                {sharedUsers.map((user, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {user.email}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                          {user.permission} access
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 