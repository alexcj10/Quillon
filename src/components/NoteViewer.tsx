import React, { useState, useCallback, useEffect } from 'react';
import { X, Star, Lock, Clock, Download, ChevronDown, Users, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadNote } from '../utils/downloadUtils';
import { useOutsideClick } from '../hooks/useOutsideClick';

import { Note } from '../types';

interface NoteViewerProps {
  note: Note;
  onClose: () => void;
}

export function NoteViewer({ note, onClose }: NoteViewerProps) {
  const [showFormatOptions, setShowFormatOptions] = useState(false);
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Lock body scroll when maximized
  useEffect(() => {
    if (isMaximized) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [isMaximized]);

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

  const toggleTitleExpansion = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTitleExpanded(!isTitleExpanded);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center ${isMaximized ? '' : 'p-4'}`}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`shadow-xl w-full overflow-hidden flex ${isMaximized
            ? 'fixed inset-0'
            : 'rounded-2xl mx-4 md:mx-8 max-w-4xl max-h-[70vh]'
            } ${note.color ? `bg-note-${note.color}-light dark:bg-note-${note.color}-dark` : 'bg-white dark:bg-gray-800'
            }`}
          onClick={e => e.stopPropagation()}
        >
          {/* Main Content */}
          <div className={`flex-1 flex flex-col overflow-hidden ${isMaximized ? 'h-full' : 'max-h-[70vh]'}`}>
            {/* Header */}
            <div className={`px-4 py-3 sm:p-6 border-b ${note.color ? `border-note-${note.color}-dark/20 dark:border-note-${note.color}-light/20` : 'border-gray-200 dark:border-gray-700'
              }`}>
              <div className="flex items-start justify-between gap-2 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h2
                    onClick={toggleTitleExpansion}
                    className={`text-base sm:text-lg md:text-xl font-bold mb-2 break-words text-gray-900 dark:text-white cursor-pointer ${isTitleExpanded ? '' : 'line-clamp-2'
                      } transition-all duration-200`}
                  >
                    {note.title || 'Untitled Note'}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>Created {new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                    {note.isPrivate && (
                      <div className="flex items-center gap-1 text-purple-500 dark:text-purple-400">
                        <Lock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>Private</span>
                      </div>
                    )}
                    {note.isFavorite && (
                      <div className="flex items-center gap-1 text-yellow-500 dark:text-yellow-400">
                        <Star className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>Favorite</span>
                      </div>
                    )}
                    {note.isShared && (
                      <div className="flex items-center gap-1 text-blue-500 dark:text-blue-400">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>Shared</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="relative" ref={formatOptionsRef}>
                    <button
                      onClick={() => setShowFormatOptions(!showFormatOptions)}
                      className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline text-sm">Download</span>
                      <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    {showFormatOptions && (
                      <div
                        className={`absolute right-0 mt-2 w-28 sm:w-32 rounded-lg shadow-lg overflow-hidden z-50 ${note.color ? `bg-note-${note.color}-light dark:bg-note-${note.color}-dark` : 'bg-white dark:bg-gray-700'
                          }`}
                        style={{ top: '100%' }}
                      >
                        <button
                          onClick={() => handleDownload('txt')}
                          className={`w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${note.color ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'
                            }`}
                        >
                          Download TXT
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    title={isMaximized ? 'Minimize' : 'Maximize'}
                  >
                    {isMaximized ? (
                      <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-300" />
                    ) : (
                      <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-300" />
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-300" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background-color: rgba(0, 0, 0, 0.2);
                  border-radius: 10px;
                  transition: background-color 0.2s;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background-color: rgba(0, 0, 0, 0.4);
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                  background-color: rgba(255, 255, 255, 0.2);
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background-color: rgba(255, 255, 255, 0.4);
                }
              `}</style>
              <div className="px-4 py-3 sm:p-6">
                <div className={`prose prose-sm sm:prose dark:prose-invert max-w-none ${note.color ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'
                  }`}>
                  {note.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 