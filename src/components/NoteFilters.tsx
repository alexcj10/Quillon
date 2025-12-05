import { useState, useRef, useEffect } from 'react';
import { Search, Star, Folder, MoreHorizontal, Tag } from 'lucide-react';
import { useNotes } from '../context/NoteContext';
import { isFileTag, getFileTagDisplayName, Note } from '../types';
import { TagModal } from './TagModal';
import { BulkRecoveryPopup } from './BulkRecoveryPopup';
import { ConfirmDialog } from './ConfirmDialog';

export function NoteFilters({ displayedNotes }: { displayedNotes?: Note[] }) {
  const {
    searchTerm,
    setSearchTerm,
    notes,
    selectedTags,
    setSelectedTags,
    showStarredOnly,
    setShowStarredOnly,
    showPrivateNotes,
    showTrash,
    selectionMode,
    setSelectionMode,
    clearSelection,
    selectAllNotes,
    bulkRestoreFromTrash,
    bulkDeleteForever,
    selectedNoteIds,
  } = useNotes();

  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isBulkPopupOpen, setIsBulkPopupOpen] = useState(false);
  const [showRecoveryConfirm, setShowRecoveryConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const hologramRef = useRef<HTMLButtonElement>(null);

  // Close popup and clear selection when leaving trash view
  useEffect(() => {
    if (!showTrash) {
      setIsBulkPopupOpen(false);
      setSelectionMode(false);
      clearSelection();
    }
  }, [showTrash, setSelectionMode, clearSelection]);

  const visibleNotes = notes.filter(note =>
    note.isPrivate === showPrivateNotes &&
    (note.isDeleted || false) === (showTrash || false)
  );

  const allTags = Array.from(new Set(visibleNotes.flatMap(note => note.tags)));

  const tagsInFileFolders = new Set(
    visibleNotes
      .filter(note => note.tags.some(tag => isFileTag(tag)))
      .flatMap(note => note.tags.filter(tag => !isFileTag(tag)))
  );

  const sortedTags = allTags;

  const VISIBLE_TAGS_LIMIT = 20;
  const visibleTags = sortedTags.slice(0, VISIBLE_TAGS_LIMIT);
  const hasMoreTags = sortedTags.length > VISIBLE_TAGS_LIMIT;

  const toggleTag = (tag: string) => {
    setSelectedTags(
      selectedTags.includes(tag)
        ? selectedTags.filter(t => t !== tag)
        : [...selectedTags, tag]
    );
  };

  // Use displayed notes if provided, otherwise fall back to visible notes
  const notesToSelect = displayedNotes || visibleNotes;
  const filteredNoteIds = notesToSelect.map(note => note.id);

  return (
    <div className="mb-6 space-y-4 w-full max-w-3xl mx-auto px-4 sm:px-6">


      {/* SEARCH + STARRED + ALL TAGS */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 text-base"
          />
        </div>

        <button
          onClick={() => setShowStarredOnly(!showStarredOnly)}
          className={`p-3 rounded-lg transition-colors flex items-center gap-2 ${showStarredOnly
            ? 'bg-yellow-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
        >
          <Star className={`h-5 w-5 ${showStarredOnly ? 'fill-current' : ''}`} />
          <span className="hidden sm:inline">Starred</span>
        </button>

        <button
          onClick={() => setIsTagModalOpen(true)}
          className="p-3 rounded-lg transition-colors flex items-center gap-2 bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          <Tag className="h-5 w-5" />
          <span className="hidden sm:inline">All Tags</span>
        </button>
      </div>


      {/* TAG FILTER BAR */}
      <div className="flex flex-wrap gap-2 items-center overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">

        {/* 🌈 HOLOGRAM GRADIENT SPINNER (Trash Only) */}
        {showTrash && (
          <button
            ref={hologramRef}
            onClick={() => {
              if (selectionMode) {
                // If already in selection mode, turn it off and clear selections
                setSelectionMode(false);
                setIsBulkPopupOpen(false);
                clearSelection();
              } else {
                // Enable selection mode and show popup
                setSelectionMode(true);
                setIsBulkPopupOpen(true);
              }
            }}
            className="p-0 border-0 bg-transparent cursor-pointer hover:opacity-80 transition-opacity"
            title={selectionMode ? "Exit selection mode" : "Bulk recovery options"}
          >
            <svg
              className="hologram-spinner"
              width="22"
              height="22"
              viewBox="0 0 50 50"
              style={{
                display: "inline-block",
                verticalAlign: "middle"
              }}
            >
              <defs>
                <linearGradient id="holoGradient">
                  <stop offset="0%" stopColor="#FF7AB8" />
                  <stop offset="50%" stopColor="#FF4DA6" />
                  <stop offset="100%" stopColor="#FF1E8E" />
                </linearGradient>
              </defs>

              <circle
                cx="25"
                cy="25"
                r="20"
                stroke="url(#holoGradient)"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="110"
                strokeDashoffset="40"
              />
            </svg>
          </button>
        )}

        {/* TAG BUTTONS */}
        {visibleTags.map(tag => {
          const isFile = isFileTag(tag);
          const isSelected = selectedTags.includes(tag);
          const isInsideFolderTag = !isFile && tagsInFileFolders.has(tag);

          const baseClasses =
            "inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm transition-colors whitespace-nowrap touch-manipulation";
          const selectedClasses = "bg-blue-500 text-white";
          const unselectedFileClasses =
            "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-200 dark:hover:bg-blue-800/50";
          const unselectedFolderTagClasses =
            "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-200 dark:hover:bg-green-800/50";
          const unselectedNormalClasses =
            "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600";

          const classes = `${baseClasses} ${isSelected
            ? selectedClasses
            : isFile
              ? unselectedFileClasses
              : isInsideFolderTag
                ? unselectedFolderTagClasses
                : unselectedNormalClasses
            }`;

          return (
            <button key={tag} onClick={() => toggleTag(tag)} className={classes}>
              {isFile && <Folder className="h-4 w-4" />}
              {isFile ? getFileTagDisplayName(tag) : tag}
            </button>
          );
        })}

        {/* + MORE TAGS */}
        {hasMoreTags && (
          <button
            onClick={() => setIsTagModalOpen(true)}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm transition-colors whitespace-nowrap touch-manipulation bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span>+{sortedTags.length - VISIBLE_TAGS_LIMIT} more</span>
          </button>
        )}
      </div>

      <TagModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        tags={sortedTags}
        selectedTags={selectedTags}
        onToggleTag={toggleTag}
        tagsInFileFolders={tagsInFileFolders}
        showTrash={showTrash}
      />

      <BulkRecoveryPopup
        isOpen={isBulkPopupOpen}
        onClose={() => {
          // Only close popup, keep selection mode active
          setIsBulkPopupOpen(false);
        }}
        selectedCount={selectedNoteIds.size}
        onSelectAll={() => {
          // Check if all filtered notes are already selected
          const allSelected = filteredNoteIds.every(id => selectedNoteIds.has(id));

          if (allSelected) {
            // If all are selected, deselect all (but keep selection mode active)
            selectAllNotes([]);  // Pass empty array to deselect all
          } else {
            // Otherwise, select all
            selectAllNotes(filteredNoteIds);
          }
        }}
        onRecover={() => {
          setShowRecoveryConfirm(true);
        }}
        onDeleteForever={() => {
          setShowDeleteConfirm(true);
        }}
        anchorRef={hologramRef}
      />

      <ConfirmDialog
        isOpen={showRecoveryConfirm}
        type="restore"
        onCancel={() => setShowRecoveryConfirm(false)}
        onConfirm={() => {
          bulkRestoreFromTrash();
          setShowRecoveryConfirm(false);
          setIsBulkPopupOpen(false);
        }}
        title={`Recover ${selectedNoteIds.size} Note${selectedNoteIds.size === 1 ? '' : 's'}?`}
        description={
          <>
            {selectedNoteIds.size === 1
              ? 'This note will be moved back to your notes and removed from trash.'
              : `These ${selectedNoteIds.size} notes will be moved back to your notes and removed from trash.`
            }
          </>
        }
        confirmLabel="Recover"
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        type="delete"
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          bulkDeleteForever();
          setShowDeleteConfirm(false);
          setIsBulkPopupOpen(false);
        }}
        title={`Permanently Delete ${selectedNoteIds.size} Note${selectedNoteIds.size === 1 ? '' : 's'}?`}
        description={
          <>
            {selectedNoteIds.size === 1
              ? 'This note will be permanently deleted and cannot be recovered.'
              : `These ${selectedNoteIds.size} notes will be permanently deleted and cannot be recovered.`
            }
          </>
        }
        confirmLabel="Delete Forever"
      />
    </div>
  );
}
