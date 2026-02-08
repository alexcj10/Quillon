import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Star, Folder, MoreHorizontal, Tag, Globe, Book, Pin } from 'lucide-react';
import { useNotes } from '../context/NoteContext';
import { useNodesWidget } from '../context/NodesContext';
import { useSound } from '../context/SoundContext';
import { useFont } from '../context/FontContext';
import { playSuccess } from '../hooks/useClickSound';
import { isFileTag, getFileTagDisplayName, Note } from '../types';
import { TagModal } from './TagModal';
import { BulkRecoveryPopup } from './BulkRecoveryPopup';
import { BulkActionsPopup } from './BulkActionsPopup';
import { ConfirmDialog } from './ConfirmDialog';
import { EnergySphere } from './EnergySphere';
import { GroupTagButton } from './GroupTagButton';
import { GroupOverviewPopup } from './GroupOverviewPopup';
import { evaluateMathCommand, isMathCommand } from '../utils/mathCommandParser';
import { MathResultPopup } from './MathResultPopup';
import { AIResultPopup } from './AIResultPopup';
import { FontsPopup } from './FontsPopup';
import { useOutsideClick } from '../hooks/useOutsideClick';
import { isFontsListCommand, isDefaultFontCommand, parseFontCommand, DEFAULT_FONT } from '../utils/fontService';
import { askPowninAI } from '../utils/aiService';
import { parseHyperCommand } from '../utils/hyperParser';
import { fetchWikiSummary, fetchDefinition } from '../utils/insightService';
import { translateText, extractLangCode } from '../utils/translationService';
import { fetchSummary, fetchElaboration } from '../utils/summaryService';

export function NoteFilters({ displayedNotes, onOpenDocs }: { displayedNotes?: Note[]; onOpenDocs: () => void }) {
  const {
    searchTerm,
    setSearchTerm,
    notes,
    addNote,
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
    pinnedTags,
    starredTags,
    tagGroups,
    exitGroupView,
    activeFilterGroup,
    setActiveFilterGroup,
  } = useNotes();

  const { setIsOpen, addNode } = useNodesWidget();
  const { setSoundEnabled, setVolume } = useSound();
  const { currentFont, setCurrentFont } = useFont();

  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isBulkPopupOpen, setIsBulkPopupOpen] = useState(false);
  const [isMainBulkPopupOpen, setIsMainBulkPopupOpen] = useState(false);
  const [showRecoveryConfirm, setShowRecoveryConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMainDeleteConfirm, setShowMainDeleteConfirm] = useState(false);
  const sphereRef = useRef<HTMLButtonElement>(null);

  // Math Calculator State
  const [mathResult, setMathResult] = useState<string | null>(null);
  const [isMathPopupVisible, setIsMathPopupVisible] = useState(false);

  // Fonts Popup State
  const [isFontsPopupVisible, setIsFontsPopupVisible] = useState(false);

  // AI Result State
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiPopupVisible, setIsAiPopupVisible] = useState(false);
  const [aiPopupType, setAiPopupType] = useState<'ai' | 'wiki' | 'def'>('ai');
  const [overviewGroup, setOverviewGroup] = useState<{ name: string; x: number; y: number } | null>(null);

  const handleGroupContextMenu = (e: React.MouseEvent, name: string) => {
    e.preventDefault();
    setOverviewGroup({ name, x: e.clientX, y: e.clientY });
  };

  const handleGroupLongPress = (name: string, x: number, y: number) => {
    setOverviewGroup({ name, x, y });
  };

  const searchBarRef = useOutsideClick({
    onOutsideClick: () => {
      setSearchTerm('');
      setMathResult(null);
      setIsMathPopupVisible(false);
      setIsFontsPopupVisible(false);
      setAiResult(null);
      setIsAiPopupVisible(false);
    },
    isOpen: isMathPopupVisible || isFontsPopupVisible || isAiPopupVisible
  });

  // Close popups and clear selection whenever view changes (Trash <-> Main)
  useEffect(() => {
    setIsBulkPopupOpen(false);
    setIsMainBulkPopupOpen(false);
    setSelectionMode(false);
    clearSelection();
    setOverviewGroup(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTrash, isTagModalOpen]);

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

  const allTags = useMemo(() => Array.from(new Set([...visibleNotes].reverse().flatMap(note => note.tags.filter(tag => tag !== '@hide')))), [visibleNotes]);

  const tagsInFileFolders = useMemo(() => new Set(
    visibleNotes
      .filter(note => note.tags.some(tag => isFileTag(tag)))
      .flatMap(note => note.tags.filter(tag => !isFileTag(tag)))
  ), [visibleNotes]);

  // Maintain creation order while grouping file tags with their green tags
  // BUT: put pinned tags first!
  const sortedTags = useMemo(() => {
    const result: string[] = [];
    const processedTags = new Set<string>();

    // 1. First, handle pinned tags to ensure they are at the front
    pinnedTags.forEach(tag => {
      if (allTags.includes(tag)) {
        result.push(tag);
        processedTags.add(tag);
      }
    });

    // 2. Then, follow the original grouping logic for the remaining tags

    // Identify tags that are in groups (to hide them)
    const groupedTagsSet = new Set(tagGroups.flatMap(g => g.tags));

    allTags.forEach(tag => {
      // Skip if already processed (meaning it was pinned)
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
        // Normal grey tag - add in its original position ONLY if not in a group
        if (!groupedTagsSet.has(tag)) {
          result.push(tag);
          processedTags.add(tag);
        }
      }
    });

    return result;
  }, [allTags, visibleNotes, pinnedTags, tagGroups]);

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

  // Calculate node content length for character counter
  const getNodeContentLength = () => {
    const term = searchTerm.trim();
    if (term.toLowerCase().startsWith('7@nodes-')) {
      return term.slice(8).trim().length;
    } else if (term.toLowerCase().startsWith('@nodes-')) {
      return term.slice(7).trim().length;
    }
    return null;
  };

  const nodeContentLength = getNodeContentLength();

  // Use displayed notes if provided, otherwise fall back to visible notes
  const notesToSelect = displayedNotes || visibleNotes;
  const filteredNoteIds = notesToSelect.map(note => note.id);

  return (
    <div className="mb-6 space-y-4 w-full max-w-3xl mx-auto px-4 sm:px-6 relative">


      {/* SEARCH + STARRED + ALL TAGS */}
      <div ref={searchBarRef} className="flex gap-2 items-center relative z-20">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              const newValue = e.target.value;
              const term = newValue.trim();

              // Check if typing a node creation command
              let contentLength = 0;
              if (term.toLowerCase().startsWith('7@nodes-')) {
                contentLength = term.slice(8).trim().length;
              } else if (term.toLowerCase().startsWith('@nodes-')) {
                contentLength = term.slice(7).trim().length;
              }

              // Hide AI popup if command is cleared or changed
              const isAICommand = term.startsWith('@pai-') || term.startsWith('@wiki-') || term.startsWith('@def-');
              if (!isAICommand || term === '') {
                setIsAiPopupVisible(false);
              }

              // Evaluate math command dynamically
              if (isMathCommand(term)) {
                setMathResult(evaluateMathCommand(term));
                setIsMathPopupVisible(true);
              } else {
                setMathResult(null);
                setIsMathPopupVisible(false);
              }

              // Only allow input if not a node command OR if content is within limit
              if (contentLength === 0 || contentLength <= 100) {
                setSearchTerm(newValue);
              }
            }}
            onFocus={() => {
              // Show math popup if there is a result
              if (mathResult) {
                setIsMathPopupVisible(true);
              }
              // Show AI popup if there is a result
              if (aiResult) {
                setIsAiPopupVisible(true);
              }
              // Close bulk popups and exit selection mode when user focuses search bar
              setIsBulkPopupOpen(false);
              setIsMainBulkPopupOpen(false);
              clearSelection(); // This also calls setSelectionMode(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const term = searchTerm.trim();
                // If there's a math result, pressing Enter could "commit" it, 
                // but usually user just reads it.
                // We'll leave default behavior (which might be nothing or node creation checks below)

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
                  if (content && content.length <= 100) {
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
                  if (content && content.length <= 100) {
                    addNode(content, false); // Explicitly public
                    // Only show popup if we're in public workspace
                    if (!showPrivateNotes) {
                      setIsOpen(true);
                    }
                    setSearchTerm('');
                  }
                } else if (term.toLowerCase().startsWith('@sound-on')) {
                  let newVol = 1.0; // Default
                  // Matches @sound-on-50, @sound-on 50, @sound-on:50 etc.
                  const volMatch = term.match(/@sound-on[- :]*(\d+)/i);

                  if (volMatch) {
                    const percent = parseInt(volMatch[1], 10);
                    if (!isNaN(percent)) {
                      newVol = Math.min(100, Math.max(0, percent)) / 100;
                      setVolume(newVol);
                      console.log(`[Quillon Sound] Volume set to: ${percent}% (internal gain: ${(newVol * newVol).toFixed(4)})`);
                    }
                  }

                  setSoundEnabled(true);
                  // Apply squared scaling to feedback chime for consistency
                  playSuccess(0.3 * (newVol * newVol));
                  setSearchTerm('');
                } else if (term.toLowerCase() === '@sound-off') {
                  setSoundEnabled(false);
                  setSearchTerm('');
                } else if (isFontsListCommand(term)) {
                  // @fonts - Show fonts popup
                  setIsFontsPopupVisible(true);
                  setSearchTerm('');
                } else if (isDefaultFontCommand(term)) {
                  // @font-d - Reset to default font
                  setCurrentFont(DEFAULT_FONT);
                  setSearchTerm('');
                } else if (term.toLowerCase().startsWith('@font-')) {
                  // @font-[index/name] - Change font
                  const font = parseFontCommand(term);
                  if (font) {
                    setCurrentFont(font);
                    setSearchTerm('');
                  }
                } else if (term.toLowerCase() === '@docs') {
                  onOpenDocs();
                  setSearchTerm('');
                } else if (term.toLowerCase().startsWith('@wiki-')) {
                  // @wiki- - Wikipedia lookup
                  const query = term.slice(6).trim();
                  if (query) {
                    setIsAiPopupVisible(true);
                    setIsAiLoading(true);
                    setAiResult(null);
                    setAiPopupType('wiki');

                    (async () => {
                      try {
                        const response = await fetchWikiSummary(query, 'markdown');
                        setAiResult(response);
                      } catch (err) {
                        setAiResult("Wikipedia Error. Please try again.");
                      } finally {
                        setIsAiLoading(false);
                      }
                    })();
                  }
                } else if (term.toLowerCase().startsWith('@def-')) {
                  // @def- - Dictionary lookup
                  const query = term.slice(5).trim();
                  if (query) {
                    setIsAiPopupVisible(true);
                    setIsAiLoading(true);
                    setAiResult(null);
                    setAiPopupType('def');

                    (async () => {
                      try {
                        const response = await fetchDefinition(query, 'markdown');
                        setAiResult(response);
                      } catch (err) {
                        setAiResult("Dictionary Error. Please try again.");
                      } finally {
                        setIsAiLoading(false);
                      }
                    })();
                  }
                } else if (term.toLowerCase().startsWith('@pai-')) {
                  // @pai- - Ask AI
                  const query = term.slice(5).trim();
                  if (query) {
                    setIsAiPopupVisible(true);
                    setIsAiLoading(true);
                    setAiResult(null);
                    setAiPopupType('ai');

                    (async () => {
                      try {
                        const response = await askPowninAI(query);
                        setAiResult(response);
                      } catch (err) {
                        setAiResult("AI Error. Please try again.");
                      } finally {
                        setIsAiLoading(false);
                      }
                    })();
                  }
                } else if (term.toLowerCase().startsWith('@new-')) {
                  const data = parseHyperCommand(term);
                  (async () => {
                    let finalContent = data.content;
                    if (data.nestedCommand) {
                      const { type, query } = data.nestedCommand;
                      try {
                        switch (type) {
                          case 'pai': finalContent = await askPowninAI(query, 'text'); break;
                          case 'wiki': finalContent = await fetchWikiSummary(query); break;
                          case 'def': finalContent = await fetchDefinition(query); break;
                          case 'math': finalContent = evaluateMathCommand(query) || ''; break;
                          case 'translate':
                            const langCode = extractLangCode(query);
                            const textToTranslate = query.slice(langCode.length).trim();
                            const translated = await translateText(textToTranslate, langCode);
                            finalContent = translated || textToTranslate;
                            break;
                          case 'summary': finalContent = await fetchSummary(finalContent); break;
                          case 'elaborate': finalContent = await fetchElaboration(finalContent); break;
                        }
                      } catch (err) {
                        console.error('Nested command resolution failed:', err);
                      }
                    }

                    addNote({
                      title: data.title,
                      content: finalContent,
                      tags: data.tags,
                      color: data.color || '',
                      isPinned: data.isPinned,
                      isFavorite: data.isFavorite,
                      isPrivate: data.isPrivate,
                      fontFamily: data.fontFamily
                    });
                    setSearchTerm('');
                    playSuccess(0.3);
                  })();
                }
              }
            }}
            placeholder="Search or @"
            className={`w-full pl-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 text-base ${nodeContentLength !== null ? 'pr-16' : 'pr-4'
              }`}
          />
          {/* Character Counter for Node Creation */}
          {nodeContentLength !== null && (
            <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-xs transition-colors pointer-events-none ${nodeContentLength >= 100 ? 'text-red-500 font-medium' : 'text-gray-400 dark:text-gray-500'
              }`}>
              {nodeContentLength}/100
            </div>
          )}

          {/* Math Result Popup attached to Search Bar */}

          {/* Fonts Popup */}
          <FontsPopup
            isVisible={isFontsPopupVisible}
            onClose={() => setIsFontsPopupVisible(false)}
            onSelectFont={(font) => {
              setCurrentFont(font);
            }}
            currentFont={currentFont}
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

        {/* AI Result Popup moved here for full-width display */}
        <AIResultPopup
          input={searchTerm}
          result={aiResult}
          isLoading={isAiLoading}
          isVisible={isAiPopupVisible}
          titleLabel={
            aiPopupType === 'wiki' ? 'Wikipedia Summary' :
              aiPopupType === 'def' ? 'Dictionary Definition' :
                'Pownin AI Response'
          }
          logo={
            aiPopupType === 'wiki' ? Globe :
              aiPopupType === 'def' ? Book :
                undefined // Defaults to Pownin logo
          }
        />

        {/* Math Result Popup moved here for full-width display */}
        <MathResultPopup
          input={searchTerm}
          result={mathResult}
          isVisible={isMathPopupVisible}
        />
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

        {tagGroups.filter(group => group.tags.some(tag => allTags.includes(tag))).map(group => {
          const isActive = activeFilterGroup === group.name;

          return (
            <GroupTagButton
              key={group.id}
              name={group.name}
              isActive={isActive}
              onClick={() => {
                if (isActive) {
                  setActiveFilterGroup(null);
                } else {
                  setActiveFilterGroup(group.name);
                  setSelectedTags([]);
                }
              }}
              onContextMenu={handleGroupContextMenu}
              onLongPress={handleGroupLongPress}
            />
          )
        })}

        {overviewGroup && (
          <GroupOverviewPopup
            groupName={overviewGroup.name}
            tags={tagGroups.find(g => g.name === overviewGroup.name)?.tags || []}
            selectedTags={selectedTags}
            x={overviewGroup.x}
            y={overviewGroup.y}
            onClose={() => setOverviewGroup(null)}
            onTagSelect={(tag) => {
              if (selectedTags.includes(tag)) {
                // If already selected, clear it (return to previous state)
                setSelectedTags([]);
              } else {
                // Single-select: Replace entire selection with this tag
                setSelectedTags([tag]);
              }
              setOverviewGroup(null);
            }}
          />
        )}

        {visibleTags.map(tag => {
          const isFile = isFileTag(tag);
          const isSelected = selectedTags.includes(tag);
          const isInsideFolderTag = !isFile && tagsInFileFolders.has(tag);

          const baseClasses =
            "inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm transition-colors whitespace-nowrap touch-manipulation";
          const selectedFileClasses = "bg-blue-500 text-white";
          const selectedFolderClasses = "bg-green-600 text-white";
          const selectedNormalClasses = "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 hover:bg-black dark:hover:bg-white";

          const unselectedFileClasses =
            "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-200 dark:hover:bg-blue-800/50";
          const unselectedFolderTagClasses =
            "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-200 dark:hover:bg-green-800/50";
          const unselectedNormalClasses =
            "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600";

          const classes = `${baseClasses} ${isSelected
            ? isFile
              ? selectedFileClasses
              : isInsideFolderTag
                ? selectedFolderClasses
                : selectedNormalClasses
            : isFile
              ? unselectedFileClasses
              : isInsideFolderTag
                ? unselectedFolderTagClasses
                : unselectedNormalClasses
            }`;

          const isPinned = pinnedTags.includes(tag);
          const isStarred = starredTags.includes(tag);

          return (
            <button key={tag} onClick={() => toggleTag(tag)} className={classes}>
              {isFile && <Folder className="h-4 w-4 flex-shrink-0" />}
              <span className="truncate max-w-[120px] sm:max-w-[160px]" title={isFile ? getFileTagDisplayName(tag) : tag}>
                {isFile ? getFileTagDisplayName(tag) : tag}
              </span>
              {isPinned && <Pin className="h-3 w-3 ml-1 fill-current opacity-70 flex-shrink-0" />}
              {isStarred && <Star className="h-3 w-3 ml-1 fill-current opacity-70 text-yellow-500 flex-shrink-0" />}
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
        onClose={() => {
          setIsTagModalOpen(false);
          exitGroupView();
        }}
        tags={sortedTags}
        selectedTags={selectedTags}
        onToggleTag={toggleTag}
        tagsInFileFolders={tagsInFileFolders}
        showTrash={showTrash}
        allVisibleTags={allTags}
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
