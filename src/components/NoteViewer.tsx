import React, { useState, useCallback } from 'react';
import { X, Tag, Star, Lock, Clock, Download, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadNote } from '../utils/downloadUtils';
import { useOutsideClick } from '../hooks/useOutsideClick';

interface NoteViewerProps {
  note: {
    title: string;
    content: string;
    tags: string[];
    isFavorite: boolean;
    isPrivate: boolean;
    createdAt: string;
    updatedAt: string;
  };
  onClose: () => void;
}

export function NoteViewer({ note, onClose }: NoteViewerProps) {
  const [showFormatOptions, setShowFormatOptions] = useState(false);

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
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
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

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
            <div className="prose dark:prose-invert max-w-none dark:text-gray-200">
              {note.content.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4 text-gray-700 dark:text-gray-200">
                  {paragraph}
                </p>
              ))}
            </div>
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 