import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Star, Folder, MoreHorizontal, Tag } from 'lucide-react';
import { useNotes } from '../context/NoteContext';
import { useNodesWidget } from '../context/NodesContext';
import { isFileTag, getFileTagDisplayName, Note } from '../types';
import { TagModal } from './TagModal';
import { BulkRecoveryPopup } from './BulkRecoveryPopup';
import { BulkActionsPopup } from './BulkActionsPopup';
import { ConfirmDialog } from './ConfirmDialog';
import { EnergySphere } from './EnergySphere';

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
    setShowTrash,
    showHidden,
    setShowHidden,
    selectionMode,
    setSelectionMode,
    clearSelection,
    selectAllNotes,
    bulkRestoreFromTrash,
    bulkDeleteForever,
    bulkMoveToTrash,
    selectedNoteIds,
  } = useNotes();

  const { setIsOpen, addNode } = useNodesWidget();

  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isBulkPopupOpen, setIsBulkPopupOpen] = useState(false);
  const [isMainBulkPopupOpen, setIsMainBulkPopupOpen] = useState(false);
  const [showRecoveryConfirm, setShowRecoveryConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMainDeleteConfirm, setShowMainDeleteConfirm] = useState(false);
  const sphereRef = useRef<HTMLButtonElement>(null);

  // Close popups and clear selection whenever view changes (Trash <-> Main)
  useEffect(() => {
    setIsBulkPopupOpen(false);
    setIsMainBulkPopupOpen(false);
    setSelectionMode(false);
    clearSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTrash]);

  // Auto-close popups when selection mode is deactivated globally
  useEffect(() => {
    if (!selectionMode) {
      setIsBulkPopupOpen(false);
      setIsMainBulkPopupOpen(false);
    }
  }, [selectionMode]);

  const visibleNotes = useMemo(() => notes.filter(note =>
    note.isPrivate === showPrivateNotes &&
    (note.isDeleted || false) === (showTrash || false) &&
    (note.isHidden || false) === showHidden
  ), [notes, showPrivateNotes, showTrash, showHidden]);

  const allTags = useMemo(() => Array.from(new Set(visibleNotes.flatMap(note => note.tags.filter(tag => tag !== '@hide')))), [visibleNotes]);

  const tagsInFileFolders = useMemo(() => new Set(
    visibleNotes
      .filter(note => note.tags.some(tag => isFileTag(tag)))
      .flatMap(note => note.tags.filter(tag => !isFileTag(tag)))
  ), [visibleNotes]);

  // Maintain creation order while grouping file tags with their green tags
  const sortedTags = useMemo(() => {
    const result: string[] = [];
    const processedTags = new Set<string>();

    allTags.forEach(tag => {
      // Skip if already processed
      if (processedTags.has(tag)) return;

      if (isFileTag(tag)) {
        // Add the file tag
        result.push(tag);
        processedTags.add(tag);

        // Find and add all green tags associated with this file tag
        const associatedTags = visibleNotes
          .filter(note => note.tags.includes(tag))
          .flatMap(note => note.tags.filter(t => !isFileTag(t)));

        const uniqueAssociatedTags = Array.from(new Set(associatedTags));
        uniqueAssociatedTags.forEach(greenTag => {
          if (!processedTags.has(greenTag)) {
            result.push(greenTag);
            processedTags.add(greenTag);
          }
        });
      } else {
        // Normal grey tag - add in its original position
        result.push(tag);
        processedTags.add(tag);
      }
    });

    return result;
  }, [allTags, visibleNotes]);

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
            onFocus={() => {
              // Close bulk popups and exit selection mode when user focuses search bar
              setIsBulkPopupOpen(false);
              setIsMainBulkPopupOpen(false);
              clearSelection(); // This also calls setSelectionMode(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const term = searchTerm.trim();
                if (term.toLowerCase() === '@nodes') {
                  setIsOpen(true);
                  setSearchTerm('');
                } else if (term.toLowerCase() === '@show') {
                  // Only enter hidden view if NOT already in it
                  if (!showHidden) {
                    setShowHidden(true);
                    setShowTrash(false);
                  }
                  setSearchTerm('');
                } else if (term.toLowerCase() === '@show-return') {
                  // Only exit hidden view if currently IN it
                  if (showHidden) {
                    setShowHidden(false);
                  }
                  setSearchTerm('');
                } else if (term.toLowerCase().startsWith('7@nodes-')) {
                  // 7@nodes- creates PRIVATE node (7 = length of "private")
                  const content = term.slice(8).trim(); // Remove "7@nodes-"
                  if (content) {
                    addNode(content, true); // Explicitly private
                    // Only show popup if we're in private workspace
                    if (showPrivateNotes) {
                      setIsOpen(true);
                    }
                    setSearchTerm('');
                  }
                } else if (term.toLowerCase().startsWith('@nodes-')) {
                  // @nodes- creates PUBLIC node (always)
                  const content = term.slice(7).trim(); // Remove "@nodes-"
                  if (content) {
                    addNode(content, false); // Explicitly public
                    // Only show popup if we're in public workspace
                    if (!showPrivateNotes) {
                      setIsOpen(true);
                    }
                    setSearchTerm('');
                  }
                }
              }
            }}
            placeholder="Search... (@nodes)"
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 text-base"
          />
        </div>

        <button
          onClick={() => {
            clearSelection();
            setShowStarredOnly(!showStarredOnly);
          }}
          className={`p-3 rounded-lg transition-colors flex items-center gap-2 ${showStarredOnly
            ? 'bg-yellow-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
        >
          <Star className={`h-5 w-5 ${showStarredOnly ? 'fill-current' : ''}`} />
          <span className="hidden sm:inline">Starred</span>
        </button>

        <button
          onClick={() => {
            clearSelection();
            setIsTagModalOpen(true);
          }}
          className="p-3 rounded-lg transition-colors flex items-center gap-2 bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          <Tag className="h-5 w-5" />
          <span className="hidden sm:inline">All Tags</span>
        </button>
      </div>


      {/* TAG FILTER BAR */}
      <div className="flex flex-wrap gap-2 items-center overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">

        {/* 🌸 ENERGY SPHERE (Consolidated) */}
        <button
          ref={sphereRef}
          onClick={() => {
            if (selectionMode) {
              setSelectionMode(false);
              setIsMainBulkPopupOpen(false);
              setIsBulkPopupOpen(false);
              clearSelection();
            } else {
              setSelectionMode(true);
              if (showTrash) {
                setIsBulkPopupOpen(true);
              } else {
                setIsMainBulkPopupOpen(true);
              }
            }
          }}
          className="p-0 border-0 bg-transparent cursor-pointer hover:opacity-80 transition-opacity"
          title={selectionMode ? "Exit selection mode" : (showTrash ? "Bulk recovery options" : "Bulk actions")}
        >
          <EnergySphere />
        </button>

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
        anchorRef={sphereRef}
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

      <BulkActionsPopup
        isOpen={isMainBulkPopupOpen}
        onClose={() => {
          setIsMainBulkPopupOpen(false);
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
        onDeleteAll={() => {
          setShowMainDeleteConfirm(true);
        }}
        anchorRef={sphereRef}
      />

      <ConfirmDialog
        isOpen={showMainDeleteConfirm}
        type="delete"
        onCancel={() => setShowMainDeleteConfirm(false)}
        onConfirm={() => {
          bulkMoveToTrash();
          setShowMainDeleteConfirm(false);
          setIsMainBulkPopupOpen(false);
        }}
        title={`Delete ${selectedNoteIds.size} Note${selectedNoteIds.size === 1 ? '' : 's'}?`}
        description={
          <>
            {selectedNoteIds.size === 1
              ? 'This note will be moved to trash and can be restored later.'
              : `These ${selectedNoteIds.size} notes will be moved to trash and can be restored later.`
            }
          </>
        }
        confirmLabel="Delete"
      />
    </div>
  );
}
