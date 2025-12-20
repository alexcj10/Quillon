import { useState, useCallback } from 'react';
import { Note, isFileTag, getFileTagDisplayName } from '../types';
import { Pin, Star, Trash2, Edit, Copy, Check, Lock, RotateCcw, XCircle, Eye, Download, ChevronDown, Share2, Folder } from 'lucide-react';
import { useNotes } from '../context/NoteContext';
import { NoteViewer } from './NoteViewer';
import { downloadNote } from '../utils/downloadUtils';
import { useOutsideClick } from '../hooks/useOutsideClick';
import { ShareDialog } from './ShareDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { getNoteColorClass } from '../utils/colorUtils';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
}

export function NoteCard({ note, onEdit }: NoteCardProps) {
  const {
    updateNote,
    deleteNote,
    showPrivateNotes,
    restoreFromTrash,
    permanentlyDelete,
    showTrash,
    selectionMode,
    selectedNoteIds,
    toggleNoteSelection,
  } = useNotes();
  const [copied, setCopied] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [showFormatOptions, setShowFormatOptions] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showPermanentDeleteDialog, setShowPermanentDeleteDialog] = useState(false);

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
    try {
      await downloadNote(note, {
        format,
        onSuccess: (message, downloadFormat) => {
          // Trigger notification in parent component
          window.dispatchEvent(new CustomEvent('downloadSuccess', {
            detail: { message, format: downloadFormat }
          }));
        }
      });
      setShowFormatOptions(false);
    } catch (error) {
      console.error('Download failed:', error);
      // Keep the dropdown open so user can try again
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Download failed: ${errorMessage}\n\nPlease try again or check your browser settings.`);
    }
  };

  const isContentVisible = !note.isPrivate || showPrivateNotes;
  const isSelected = selectedNoteIds.has(note.id);

  const handleCloseFormatOptions = useCallback(() => {
    setShowFormatOptions(false);
  }, []);

  const formatOptionsRef = useOutsideClick({
    onOutsideClick: handleCloseFormatOptions,
    isOpen: showFormatOptions
  });

  return (
    <>
      <div className={`relative p-5 rounded-xl shadow-md dark:shadow-[0_4px_6px_-1px_rgba(255,255,255,0.1)] transition-all duration-200 hover:shadow-lg hover:dark:shadow-[0_10px_15px_-3px_rgba(255,255,255,0.1)] h-[200px] flex flex-col ${getNoteColorClass(note.color)} ${isSelected
        ? 'border-2 border-violet-500 dark:border-violet-400 animate-pulse'
        : 'border border-[rgba(0,0,0,0.50)] dark:border-[rgba(255,255,255,0.50)]'
        }`}>

        {/* Checkbox for selection mode */}
        {selectionMode && (
          <div className="absolute top-1.5 left-1.5 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNoteSelection(note.id);
              }}
              className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${isSelected
                ? 'bg-violet-500 border-violet-500'
                : 'bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-500 hover:border-violet-400'
                }`}
            >
              {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
            </button>
          </div>
        )}
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
            <p className="text-gray-600 dark:text-gray-200 text-sm line-clamp-4 break-words">
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
                {note.tags.slice(0, 3).map(tag => {
                  const isFile = isFileTag(tag);
                  const noteHasFileTag = note.tags.some(t => isFileTag(t));
                  const isInsideFolderTag = !isFile && noteHasFileTag;

                  const baseClasses = "inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full";
                  const fileClasses = "bg-blue-100/50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200";
                  const folderTagClasses = "bg-green-100/50 dark:bg-green-900/50 text-green-700 dark:text-green-200";
                  const normalClasses = "bg-gray-200/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200";

                  const classes = `${baseClasses} ${isFile
                    ? fileClasses
                    : isInsideFolderTag
                      ? folderTagClasses
                      : normalClasses
                    }`;

                  return (
                    <span
                      key={tag}
                      className={classes}
                    >
                      {isFile && <Folder className="h-3 w-3" />}
                      {isFile ? getFileTagDisplayName(tag) : tag.length > 15 ? `${tag.substring(0, 15)}...` : tag}
                    </span>
                  );
                })}
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
                    onClick={() => setShowShareDialog(true)}
                    className="p-1 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400"
                    title="Share note"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
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
                        className="absolute right-0 bottom-full mb-1 w-32 bg-white dark:bg-gray-700 rounded-lg shadow-lg overflow-hidden z-[60]"
                        style={{ minWidth: '8rem' }}
                      >
                        <button
                          onClick={() => handleDownload('txt')}
                          className="w-full px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          Download TXT
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
                    onClick={() => setShowRestoreDialog(true)}
                    className="p-1 hover:text-green-500 dark:text-gray-300 dark:hover:text-green-400"
                    title="Restore note"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setShowPermanentDeleteDialog(true)}
                    className="p-1 hover:text-red-500 dark:text-gray-300 dark:hover:text-red-400"
                    title="Delete permanently"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowDeleteDialog(true)}
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

      {showShareDialog && (
        <ShareDialog
          note={note}
          onClose={() => setShowShareDialog(false)}
        />
      )}

      {showDeleteDialog && (
        <ConfirmDialog
          isOpen={showDeleteDialog}
          type="delete"
          title="Delete Note?"
          description={
            <>
              <p className="mb-1">
                Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white" title={note.title}>"{note.title.length > 40 ? `${note.title.substring(0, 40)}...` : note.title}"</span>?
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This note will be moved to trash and can be restored later.
              </p>
            </>
          }
          confirmLabel="Delete"
          onConfirm={() => {
            deleteNote(note.id);
            setShowDeleteDialog(false);
          }}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}

      {showRestoreDialog && (
        <ConfirmDialog
          isOpen={showRestoreDialog}
          type="restore"
          title="Restore Note?"
          description={
            <>
              <p className="mb-1">
                Are you sure you want to restore <span className="font-semibold text-gray-900 dark:text-white" title={note.title}>"{note.title.length > 40 ? `${note.title.substring(0, 40)}...` : note.title}"</span>?
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This note will be moved back to your notes and removed from trash.
              </p>
            </>
          }
          confirmLabel="Restore"
          onConfirm={() => {
            restoreFromTrash(note.id);
            setShowRestoreDialog(false);
          }}
          onCancel={() => setShowRestoreDialog(false)}
        />
      )}

      {showPermanentDeleteDialog && (
        <ConfirmDialog
          isOpen={showPermanentDeleteDialog}
          type="delete"
          title="Permanently Delete Note?"
          description={
            <>
              <p className="mb-1">
                Are you sure you want to permanently delete <span className="font-semibold text-gray-900 dark:text-white" title={note.title}>"{note.title.length > 40 ? `${note.title.substring(0, 40)}...` : note.title}"</span>?
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This action cannot be undone and the note will be lost forever.
              </p>
            </>
          }
          confirmLabel="Delete Forever"
          onConfirm={() => {
            permanentlyDelete(note.id);
            setShowPermanentDeleteDialog(false);
          }}
          onCancel={() => setShowPermanentDeleteDialog(false)}
        />
      )}
    </>
  );
}