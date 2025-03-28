import React, { useState, useCallback } from 'react';
import { Note } from '../types';
import { Pin, Star, Trash2, Edit, Copy, Check, Lock, RotateCcw, XCircle, Eye, Download, ChevronDown } from 'lucide-react';
import { useNotes } from '../context/NoteContext';
import { NoteViewer } from './NoteViewer';
import { downloadNote } from '../utils/downloadUtils';
import { useOutsideClick } from '../hooks/useOutsideClick';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
}

export function NoteCard({ note, onEdit }: NoteCardProps) {
  const { updateNote, deleteNote, showPrivateNotes, restoreFromTrash, permanentlyDelete, showTrash } = useNotes();
  const [copied, setCopied] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [showFormatOptions, setShowFormatOptions] = useState(false);
  
  const formattedDate = new Date(note.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleCopy = async () => {
    try {
      if (!note.isPrivate || showPrivateNotes) {
        await navigator.clipboard.writeText(note.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleDownload = async (format: 'txt' | 'pdf') => {
    await downloadNote(note, { format });
    setShowFormatOptions(false);
  };

  const isContentVisible = !note.isPrivate || showPrivateNotes;

  const handleCloseFormatOptions = useCallback(() => {
    setShowFormatOptions(false);
  }, []);

  const formatOptionsRef = useOutsideClick({
    onOutsideClick: handleCloseFormatOptions,
    isOpen: showFormatOptions
  });

  return (
    <>
      <div className={`relative p-5 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg border h-[200px] flex flex-col ${
        note.color ? `bg-note-${note.color}-light dark:bg-note-${note.color}-dark` : 'bg-white dark:bg-gray-800'
      } border-gray-200 dark:border-gray-700`}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white truncate">
              {note.title}
            </h3>
            {note.isPrivate && (
              <Lock className="h-4 w-4 shrink-0 text-purple-500 dark:text-purple-400" />
            )}
          </div>
          {!showTrash && (
            <div className="flex gap-2 ml-2">
              <button
                onClick={() => updateNote(note.id, { isPinned: !note.isPinned })}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white p-1"
              >
                <Pin className={`h-4 w-4 ${note.isPinned ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={() => updateNote(note.id, { isFavorite: !note.isFavorite })}
                className="text-gray-500 hover:text-yellow-500 dark:text-gray-300 dark:hover:text-yellow-400 p-1"
              >
                <Star className={`h-4 w-4 ${note.isFavorite ? 'fill-current text-yellow-500 dark:text-yellow-400' : ''}`} />
              </button>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-h-0 overflow-hidden mb-3">
          {isContentVisible ? (
            <p className="text-gray-600 dark:text-gray-200 text-sm line-clamp-4">
              {note.content}
            </p>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-300">
              <Lock className="h-5 w-5 mr-2" />
              <span>Private note content</span>
            </div>
          )}
        </div>

        <div className="mt-auto">
          {note.tags.length > 0 && (
            <div className="mb-2">
              <div className="flex flex-wrap gap-1">
                {note.tags.slice(0, 3).map(tag => (
                  <span 
                    key={tag}
                    className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-200/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200"
                  >
                    {tag.length > 15 ? `${tag.substring(0, 15)}...` : tag}
                  </span>
                ))}
                {note.tags.length > 3 && (
                  <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-200/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200">
                    +{note.tags.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-300">
            <span>
              {note.isDeleted ? (
                <>Deleted {new Date(note.deletedAt!).toLocaleDateString()}</>
              ) : (
                formattedDate
              )}
            </span>
            <div className="flex gap-2">
              {!showTrash && isContentVisible && (
                <>
                  <button
                    onClick={handleCopy}
                    className="p-1 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400"
                    title={copied ? 'Content copied!' : 'Copy note content'}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <div className="relative" ref={formatOptionsRef}>
                    <button
                      onClick={() => setShowFormatOptions(!showFormatOptions)}
                      className="p-1 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 flex items-center gap-0.5"
                      title="Download note"
                    >
                      <Download className="h-4 w-4" />
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    {showFormatOptions && (
                      <div 
                        className="absolute right-0 bottom-full mb-1 w-32 bg-white dark:bg-gray-700 rounded-lg shadow-lg overflow-hidden z-50"
                      >
                        <button
                          onClick={() => handleDownload('txt')}
                          className="w-full px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          Download TXT
                        </button>
                        <button
                          onClick={() => handleDownload('pdf')}
                          className="w-full px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          Download PDF
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setIsViewing(true)}
                    className="p-1 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400"
                    title="View note"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </>
              )}
              {!showTrash && (
                <button
                  onClick={() => onEdit(note)}
                  className="p-1 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400"
                >
                  <Edit className="h-4 w-4" />
                </button>
              )}
              {showTrash ? (
                <>
                  <button
                    onClick={() => restoreFromTrash(note.id)}
                    className="p-1 hover:text-green-500 dark:text-gray-300 dark:hover:text-green-400"
                    title="Restore note"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => permanentlyDelete(note.id)}
                    className="p-1 hover:text-red-500 dark:text-gray-300 dark:hover:text-red-400"
                    title="Delete permanently"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => deleteNote(note.id)}
                  className="p-1 hover:text-red-500 dark:text-gray-300 dark:hover:text-red-400"
                  title="Move to trash"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {isViewing && (
        <NoteViewer
          note={note}
          onClose={() => setIsViewing(false)}
        />
      )}
    </>
  );
}