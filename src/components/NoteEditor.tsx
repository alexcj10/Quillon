import React, { useEffect, useRef, useState, useMemo } from 'react';

import {
  X,
  Lock,
  Unlock,
  Pin,
  Star,
  Check,
  Palette,
  MoreHorizontal,
  EyeOff,
  Globe,
  Trash2,
  Timer,
} from 'lucide-react';
import { CommandExplorer, Command } from './CommandExplorer';
import { Note, isFileTag } from '../types';
import { NOTE_COLORS } from '../constants/colors';
import { useNotes } from '../context/NoteContext';
import { useFont } from '../context/FontContext';
import { useSound } from '../context/SoundContext';
import { playSuccess } from '../hooks/useClickSound';
import { evaluateMathCommand } from '../utils/mathCommandParser';
import { translateText, extractLangCode } from '../utils/translationService';
import { fetchWikiSummary, fetchDefinition, parseInsightCommand } from '../utils/insightService';
import { askPowninAI } from '../utils/aiService';
import { fetchWeather, fetchCurrencyExchange, convertUnits, parseUtilityCommand, parsePomoTime } from '../utils/utilityService';
import { isFontsListCommand, isDefaultFontCommand, parseFontCommand, getFontsListText, DEFAULT_FONT, getFontByName, parseFontsListFromContent } from '../utils/fontService';
import { getTextareaCursorXY } from '../utils/cursorUtils';

interface NoteEditorProps {
  note?: Note;
  onSave: (note: Partial<Note>) => void;
  onClose: () => void;
}

// Interface for file tag suggestions with space/trash metadata
interface TagSuggestion {
  tag: string;
  space: 'private' | 'public';
  isInTrash: boolean;
}

const MAX_TAG_LENGTH = 50;
const MAX_TITLE_LENGTH = 100;
const FILE_TAG_REGEX = /^file[a-zA-Z0-9\-_]+$/;

export function NoteEditor({ note, onSave, onClose }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [tagError, setTagError] = useState('');
  const [color, setColor] = useState(note?.color || '');
  const [isPinned, setIsPinned] = useState(note?.isPinned || false);
  const [isFavorite, setIsFavorite] = useState(note?.isFavorite || false);
  const [isPrivate, setIsPrivate] = useState(note?.isPrivate || false);

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupMessage, setLookupMessage] = useState('');

  // Pomodoro state
  const [pomodoroTime, setPomodoroTime] = useState(0);
  const [pomodoroTotalTime, setPomodoroTotalTime] = useState(0);
  const [isPomodoroActive, setIsPomodoroActive] = useState(false);

  // Quiz mode state
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [isQuizShuffled, setIsQuizShuffled] = useState(false);
  const [revealedQuizItems, setRevealedQuizItems] = useState<number[]>([]);
  const [quizUserAnswers, setQuizUserAnswers] = useState<Record<number, string>>({});

  // Command Explorer State
  const [showExplorer, setShowExplorer] = useState(false);
  const [explorerQuery, setExplorerQuery] = useState('');
  const [atIndex, setAtIndex] = useState(-1);
  const [explorerPosition, setExplorerPosition] = useState({ top: 0, left: 0 });

  // Tag suggestion state
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

  // Track the intended space (public/private) for each tag in this session
  // This ensures that if a user selects a "Public" tag that has the same name as a "Private" tag,
  // we remember they wanted the Public version.
  const [fileTagSpaces, setFileTagSpaces] = useState<Record<string, 'public' | 'private'>>(() => {
    const initial: Record<string, 'public' | 'private'> = {};
    note?.tags?.forEach((t) => {
      if (isFileTag(t)) {
        initial[t] = note.isPrivate ? 'private' : 'public';
      }
    });
    return initial;
  });

  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const mobileMoreRef = useRef<HTMLDivElement | null>(null);
  const colorPickerRef = useRef<HTMLDivElement | null>(null);
  const tagSuggestionsRef = useRef<HTMLDivElement | null>(null);
  const tagInputRef = useRef<HTMLInputElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Get all notes to extract file tag history
  const { notes: allNotes } = useNotes();
  const { currentFont: globalFont, setCurrentFont } = useFont();
  const { setSoundEnabled, setVolume } = useSound();

  // Local state for the current note's font, initialized from note or global preference
  const [noteFont, setNoteFont] = useState(() => {
    if (note?.fontFamily) {
      return getFontByName(note.fontFamily) || DEFAULT_FONT;
    }
    // If it's a new note, use the font selected in the search bar (globalFont)
    return globalFont || DEFAULT_FONT;
  });

  // Reset global font selection to default after one note session (on unmount)
  useEffect(() => {
    return () => {
      setCurrentFont(DEFAULT_FONT);
    };
  }, [setCurrentFont]);

  // Update local font state if note prop changes
  useEffect(() => {
    if (note?.fontFamily) {
      const font = getFontByName(note.fontFamily);
      if (font) setNoteFont(font);
    }
  }, [note]);

  // Helper to get font by name for initialization (REMOVED)

  // Compute all file tags from user's notes with space/trash metadata
  const allFileTagSuggestions = useMemo(() => {
    const tagMap = new Map<string, TagSuggestion>();

    allNotes.forEach((n) => {
      n.tags.forEach((t) => {
        if (isFileTag(t)) {
          // Create a unique key for each tag+space+trash combination
          const key = `${t}-${n.isPrivate ? 'private' : 'public'}-${n.isDeleted ? 'trash' : 'active'}`;
          if (!tagMap.has(key)) {
            tagMap.set(key, {
              tag: t,
              space: n.isPrivate ? 'private' : 'public',
              isInTrash: !!n.isDeleted,
            });
          }
        }
      });
    });

    return Array.from(tagMap.values());
  }, [allNotes]);

  // Filter suggestions based on current input
  const filteredSuggestions = useMemo(() => {
    // Strict check: must start with lowercase 'file'
    if (!tagInput.startsWith('file') || tagInput.length < 4) {
      return [];
    }
    const lowerInput = tagInput.toLowerCase();

    // Base filter by name
    let matches = allFileTagSuggestions.filter(
      (s) => s.tag.toLowerCase().startsWith(lowerInput) && !tags.includes(s.tag)
    );

    // Context-Aware Filtering:
    // If we already have file tags, restrict suggestions to the current space
    // to prevent mixing Public/Private file tags accidentally.
    const hasFileTags = tags.some(isFileTag);
    if (hasFileTags) {
      matches = matches.filter((s) => s.space === (isPrivate ? 'private' : 'public'));
    }

    return matches;
  }, [tagInput, allFileTagSuggestions, tags, isPrivate]);

  // Prevent page scroll while editing
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (!contentRef.current) return;
    const el = contentRef.current;

    // We need to preserve the scroll position of the ACTUAL SCROLLING container
    // Because shrinking the textarea momentarily can cause the parent to scroll up.
    // The immediate parent is just a relative wrapper; the real scroller has class 'note-editor-scrollbar'
    const scrollParent = el.closest('.note-editor-scrollbar');
    const currentScroll = scrollParent?.scrollTop;

    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;

    // Restore scroll position
    if (scrollParent && typeof currentScroll === 'number') {
      scrollParent.scrollTop = currentScroll;
    }
  }, [content, isQuizMode, noteFont]); // Re-adjust height when font changes

  useEffect(() => {
    const listener = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        mobileMoreOpen &&
        mobileMoreRef.current &&
        !mobileMoreRef.current.contains(e.target as Node)
      ) {
        setMobileMoreOpen(false);
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [mobileMoreOpen]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        showColorPicker &&
        colorPickerRef.current &&
        !colorPickerRef.current.contains(e.target as Node)
      ) {
        setShowColorPicker(false);
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [showColorPicker]);

  // Pomodoro Timer Effect
  useEffect(() => {
    let interval: any;
    if (isPomodoroActive && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime((prev) => prev - 1);
      }, 1000);
    } else if (pomodoroTime === 0) {
      setIsPomodoroActive(false);
    }
    return () => clearInterval(interval);
  }, [isPomodoroActive, pomodoroTime]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Auto-scroll to show Command Explorer when it opens near the bottom
  useEffect(() => {
    if (showExplorer && contentRef.current && scrollContainerRef.current) {
      setTimeout(() => {
        if (!contentRef.current || !scrollContainerRef.current) return;

        const container = scrollContainerRef.current;

        // The explorerPosition.top is relative to the textarea's content (not viewport)
        // We need to find where this is within the scrollable container
        const cursorY = explorerPosition.top;
        const explorerHeight = 350;

        // The bottom of the explorer relative to the container's scrollable content
        const explorerBottom = cursorY + explorerHeight;

        // Current visible area within the container
        const containerHeight = container.clientHeight;
        const currentScroll = container.scrollTop;
        const visibleBottom = currentScroll + containerHeight;

        // If the explorer bottom is below the visible area, scroll to show it
        if (explorerBottom > visibleBottom) {
          const neededScroll = explorerBottom - containerHeight + 40; // 40px padding
          container.scrollTo({
            top: neededScroll,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [showExplorer, explorerPosition]);

  // Toggle privacy manually and sync all current tags to that state
  const togglePrivacy = () => {
    const newState = !isPrivate;
    setIsPrivate(newState);

    // If user manually toggles lock, assume all current file tags belong to that new state
    setFileTagSpaces((prev) => {
      const next = { ...prev };
      tags.forEach((t) => {
        if (isFileTag(t)) {
          next[t] = newState ? 'private' : 'public';
        }
      });
      return next;
    });
  };

  const saveNote = () => {
    onSave({
      title: title.trim().slice(0, MAX_TITLE_LENGTH),
      content,
      tags,
      color: color || undefined,
      isPinned,
      isFavorite,
      isPrivate,
      fontFamily: noteFont.name, // Save the font name
    });
  };

  const validateFileTag = (t: string) => {
    if (t.startsWith('file')) {
      if (t.length <= 4) return 'file tags must include a name after "file"';
      if (!FILE_TAG_REGEX.test(t)) return 'Use only letters, numbers, - and _';
    }
    return null;
  };

  const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setTagInput(v);

    if (v.length > MAX_TAG_LENGTH)
      return setTagError(`Max ${MAX_TAG_LENGTH} characters allowed`);

    const err = validateFileTag(v);
    setTagError(err || '');

    // Show/hide tag suggestions based on input - strict 'file' prefix
    const shouldShowSuggestions = v.startsWith('file') && v.length >= 4;
    setShowTagSuggestions(shouldShowSuggestions);
    setSelectedSuggestionIndex(0); // Reset selection when input changes
  };

  const addTag = (t: string) => {
    const newTag = t.trim();
    if (!newTag) return;

    if (newTag.length > MAX_TAG_LENGTH)
      return setTagError(`Max ${MAX_TAG_LENGTH} characters allowed`);

    const err = validateFileTag(newTag);
    if (err) return setTagError(err);

    // @hide tag validation
    if (newTag === '@hide' && tags.length > 0) {
      return setTagError('Clear all tags to enable hiding for this note.');
    }
    if (newTag !== '@hide' && tags.includes('@hide')) {
      return setTagError('Other tags are not allowed on hidden notes. Remove @hide first.');
    }

    if (!tags.includes(newTag)) {
      setTags([...tags, newTag]);

      // If adding manually, assume matches current privacy state
      if (isFileTag(newTag)) {
        setFileTagSpaces((prev) => ({
          ...prev,
          [newTag]: isPrivate ? 'private' : 'public',
        }));
      }

      setTagInput('');
      setTagError('');
      setShowTagSuggestions(false);
    }
  };

  // Handle selection of a suggested file tag
  const handleSelectSuggestion = (suggestion: TagSuggestion) => {
    const newTag = suggestion.tag;

    // @hide tag validation
    if (newTag === '@hide' && tags.length > 0) {
      setTagError('Clear all tags to enable hiding for this note.');
      return;
    }
    if (newTag !== '@hide' && tags.includes('@hide')) {
      setTagError('Other tags are not allowed on hidden notes. Remove @hide first.');
      return;
    }

    // Update the intent map with the specific suggestion's space
    const newSpaces = { ...fileTagSpaces, [newTag]: suggestion.space };
    setFileTagSpaces(newSpaces);

    // Add tag if needed
    if (!tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }

    setTagInput('');
    setTagError('');
    setShowTagSuggestions(false);

    // Smart Context Switching logic:
    // If ANY current tag (including the new one) is marked 'private' in our session intent,
    // the note must be private.
    const allExpectedTags = tags.includes(newTag) ? tags : [...tags, newTag];

    // Check if any file tag is intended to be private
    const hasPrivateFileTags = allExpectedTags.some((t) =>
      isFileTag(t) && newSpaces[t] === 'private'
    );

    if (hasPrivateFileTags) {
      if (!isPrivate) setIsPrivate(true);
    } else {
      // If no file tags are private, we can be public
      // BUT only switch to public if the user explicitly selected a Public tag or was already public
      // If we are currently private, and we select a Public tag, and NO other tags are private, we switch to Public.
      if (isPrivate && suggestion.space === 'public') {
        setIsPrivate(false);
      }
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter((t) => t !== tagToRemove);
    setTags(newTags);

    // We don't remove from fileTagSpaces map so we remember intent if added back, 
    // but calculating privacy relies on newTags.

    // Check if we should auto-unlock
    // If the note is private, covering:
    // 1. We removed the last "Private" intended tag.
    // 2. Remaining tags are all "Public" intended.
    if (isPrivate) {
      const hasRemainingPrivateFileTags = newTags.some((t) =>
        isFileTag(t) && fileTagSpaces[t] === 'private'
      );

      if (!hasRemainingPrivateFileTags) {
        setIsPrivate(false);
      }
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursor = e.target.selectionStart;
    setContent(val);

    // Find the last @ symbol before the cursor
    const lastAt = val.lastIndexOf('@', cursor - 1);

    // Check if we're in a valid @ command context
    if (lastAt !== -1 && (lastAt === 0 || val[lastAt - 1] === ' ' || val[lastAt - 1] === '\n')) {
      // Extract the text between @ and cursor
      const query = val.substring(lastAt + 1, cursor);

      // Keep explorer open as long as there's no space or newline in the query
      if (!query.includes(' ') && !query.includes('\n')) {
        // Only calculate position when first opening (when @ is typed)
        const isFirstOpen = !showExplorer || atIndex !== lastAt;

        setShowExplorer(true);
        setExplorerQuery(query);
        setAtIndex(lastAt);

        // Calculate position only on first open to keep it anchored
        if (isFirstOpen && contentRef.current) {
          const pos = getTextareaCursorXY(contentRef.current, lastAt);
          const explorerWidth = 260; // Width of the explorer panel (w-64 = 16rem = 256px, rounded to 260)
          const textareaWidth = contentRef.current.clientWidth;

          // Smart horizontal positioning: check if there's space on the right
          let leftPosition;
          const spaceOnRight = textareaWidth - pos.left;

          if (spaceOnRight >= explorerWidth + 40) {
            // Enough space on the right, position to the right of cursor
            leftPosition = pos.left + 10; // Reduced from 35 to 10 for closer positioning
          } else {
            // Not enough space on right, position to the left of cursor
            leftPosition = Math.max(10, pos.left - explorerWidth + 20); // Adjusted to be closer
          }

          setExplorerPosition({
            top: pos.top + pos.lineHeight + 2, // Reduced from -4 to +2 for closer vertical positioning
            left: leftPosition
          });
        }
        return;
      }
    }

    // Close explorer if we're no longer in a valid @ command context
    setShowExplorer(false);
  };

  const handleCommandSelect = (cmd: Command) => {
    if (!contentRef.current) return;
    const cursor = contentRef.current.selectionStart;
    const before = content.substring(0, atIndex);
    const after = content.substring(cursor);

    const newContent = before + cmd.template + after;
    setContent(newContent);
    setShowExplorer(false);

    // Restore focus and position cursor
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.focus();
        const newPos = atIndex + cmd.template.length;
        contentRef.current.selectionStart = newPos;
        contentRef.current.selectionEnd = newPos;
      }
    }, 0);
  };

  const handleTagKey = (e: React.KeyboardEvent) => {
    // Handle keyboard navigation in suggestions
    if (showTagSuggestions && filteredSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSelectSuggestion(filteredSuggestions[selectedSuggestionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowTagSuggestions(false);
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      handleRemoveTag(tags[tags.length - 1]);
    }
  };

  const selectedColorClass =
    NOTE_COLORS.find((c) => c.id === color)?.previewClass ||
    'bg-white dark:bg-gray-900';

  const iconBtn = `w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800/60 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700/60 transition`;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center sm:p-8 md:p-12">
      <div
        ref={modalRef}
        className={`w-full max-w-4xl h-full sm:h-[75vh] lg:h-[85vh] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col relative ${selectedColorClass}`}
      >
        {(isTranslating || isLookingUp) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[100]">
            <div className="flex flex-col items-center gap-2">
              {!lookupMessage.includes('Retry') && !lookupMessage.includes('Error') && (
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              )}
              <span className={`text-sm font-medium ${lookupMessage.includes('Retry') ? 'text-red-500' : 'text-blue-500 dark:text-blue-400 animate-pulse'}`}>
                {isTranslating ? 'Translating...' : lookupMessage}
              </span>
            </div>
          </div>
        )}
        {/* TOP BAR */}
        <div className="flex items-center justify-between px-5 py-4 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            <X className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </button>

          <div className="flex-1 flex items-center mx-3 sm:mx-6 min-w-0">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={() => setIsTitleFocused(true)}
              onBlur={() => setIsTitleFocused(false)}
              readOnly={isQuizMode}
              maxLength={MAX_TITLE_LENGTH}
              placeholder="Note title"
              style={{ fontFamily: noteFont.family }}
              className={`text-xl font-semibold bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 flex-1 min-w-0 ${isQuizMode ? 'cursor-default' : ''}`}
            />
            {!isQuizMode && (
              <span
                className={`text-xs ml-2 transition-opacity duration-200 ${isTitleFocused || title.length > MAX_TITLE_LENGTH * 0.8
                  ? 'opacity-100'
                  : 'opacity-0'
                  } ${title.length >= MAX_TITLE_LENGTH
                    ? 'text-red-500 font-medium'
                    : 'text-gray-400'
                  }`}
              >
                {title.length}/{MAX_TITLE_LENGTH}
              </span>
            )}
          </div>

          <button
            onClick={() => {
              if (isQuizMode) {
                setIsQuizMode(false);
                setRevealedQuizItems([]);
                setQuizUserAnswers({});
              } else {
                saveNote();
                onClose();
              }
            }}
            className={isQuizMode
              ? "px-4 py-2 text-xs font-bold tracking-widest text-gray-500 hover:text-red-500 transition-colors uppercase border border-gray-200 dark:border-gray-800 rounded-full bg-white dark:bg-black/20"
              : "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow transition flex items-center gap-2 flex-shrink-0 whitespace-nowrap"
            }
          >
            {isQuizMode ? 'Exit Quiz' : (
              <>
                <Check className="w-4 h-4" />
                Save
              </>
            )}
          </button>
        </div>

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden px-6 pt-4 pb-2 note-editor-scrollbar">
          {/* Pomodoro Timer Bar (Always on top if active) */}
          {isPomodoroActive && (
            <div className="sticky top-0 left-0 right-0 h-1 bg-gray-100 dark:bg-gray-800 z-50 mb-6">
              <div
                className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
                style={{ width: `${(pomodoroTime / pomodoroTotalTime) * 100}%` }}
              />
              <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-2">
                <Timer className="w-3 h-3" />
                {formatTime(pomodoroTime)}
              </div>
            </div>
          )}

          {!isQuizMode && (
            <div className="relative">
              {/* Styled overlay for fonts list preview */}
              {(() => {
                const fontMap = parseFontsListFromContent(content);
                if (!fontMap) return null;

                const lines = content.split('\n');
                return (
                  <div
                    className="absolute inset-0 pointer-events-none whitespace-pre-wrap break-words text-lg leading-relaxed"
                    style={{
                      color: 'inherit',
                      padding: '0',
                      margin: '0',
                    }}
                  >
                    {lines.map((line, idx) => {
                      const font = fontMap.get(idx);
                      return (
                        <div
                          key={idx}
                          style={{
                            fontFamily: font ? font.family : noteFont.family,
                            lineHeight: '1.75rem', // Match textarea leading-relaxed
                          }}
                        >
                          {line || '\u00A0'} {/* Non-breaking space for empty lines */}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              <textarea
                ref={contentRef}
                value={content}
                onChange={handleContentChange}
                onKeyDown={(e) => {
                  // Check for commands on Enter press
                  // We do this BEFORE the explorer check so exact manual matches work even if explorer is filtered out
                  if (e.key === 'Enter') {
                    const textarea = e.currentTarget;
                    const cursorStart = textarea.selectionStart;
                    const textBeforeCursor = content.substring(0, cursorStart);

                    // Handle Math Command: @c- + Enter
                    const lastAtSignIndexMath = textBeforeCursor.lastIndexOf('@c-');
                    if (lastAtSignIndexMath !== -1) {
                      const potentialCommand = textBeforeCursor.substring(lastAtSignIndexMath);
                      if (!potentialCommand.includes('\n') && potentialCommand.length > 3) {
                        const result = evaluateMathCommand(potentialCommand);
                        if (result !== null) {
                          e.preventDefault();
                          setShowExplorer(false);
                          const textAfterCursor = content.substring(cursorStart);
                          const newContent = content.substring(0, lastAtSignIndexMath) + result + textAfterCursor;
                          setContent(newContent);
                          setTimeout(() => {
                            if (contentRef.current) {
                              const newCursorPos = lastAtSignIndexMath + result.length;
                              contentRef.current.selectionStart = newCursorPos;
                              contentRef.current.selectionEnd = newCursorPos;
                            }
                          }, 0);
                          return; // Exit after math command handled
                        }
                      }
                    }

                    // Handle Translation Command: @t-[lang] + Enter
                    const lastAtSignIndexTrans = textBeforeCursor.lastIndexOf('@t-');
                    if (lastAtSignIndexTrans !== -1) {
                      const potentialCommand = textBeforeCursor.substring(lastAtSignIndexTrans);
                      if (!potentialCommand.includes('\n') && potentialCommand.length > 3) {
                        const langCode = extractLangCode(potentialCommand);
                        if (langCode) {
                          e.preventDefault();
                          setShowExplorer(false);
                          const contentToTranslate = (content.substring(0, lastAtSignIndexTrans) + content.substring(cursorStart)).trim();
                          if (contentToTranslate) {
                            setIsTranslating(true);

                            // Translate both title and content
                            const titleToTranslate = title.trim();

                            // Execute in sequence to avoid hitting rate limits or fetch errors on long notes
                            (async () => {
                              try {
                                const translatedContent = await translateText(contentToTranslate, langCode);
                                if (translatedContent) setContent(translatedContent);

                                if (titleToTranslate) {
                                  const translatedTitle = await translateText(titleToTranslate, langCode);
                                  if (translatedTitle) setTitle(translatedTitle.slice(0, MAX_TITLE_LENGTH));
                                }
                              } catch (err) {
                                console.error('Note translation failed:', err);
                              } finally {
                                setIsTranslating(false);
                              }
                            })();
                          }
                          return; // Exit after translation command handled
                        }
                      }
                    }

                    // Handle Insight Commands: @wiki- or @def- + Enter
                    const lastAtSignIndexInsight = textBeforeCursor.lastIndexOf('@');
                    if (lastAtSignIndexInsight !== -1) {
                      const potentialCommand = textBeforeCursor.substring(lastAtSignIndexInsight);
                      if (!potentialCommand.includes('\n') && potentialCommand.length > 5) {
                        const insightData = parseInsightCommand(potentialCommand);
                        if (insightData) {
                          e.preventDefault();
                          setShowExplorer(false);
                          setIsLookingUp(true);
                          setLookupMessage(`Searching ${insightData.type === 'wiki' ? 'Wikipedia' : 'Dictionary'}...`);

                          (async () => {
                            try {
                              const result = insightData.type === 'wiki'
                                ? await fetchWikiSummary(insightData.query)
                                : await fetchDefinition(insightData.query);

                              const textAfterCursor = content.substring(cursorStart);
                              const newContent = content.substring(0, lastAtSignIndexInsight) + result + textAfterCursor;
                              setContent(newContent);

                              setTimeout(() => {
                                if (contentRef.current) {
                                  const newCursorPos = lastAtSignIndexInsight + result.length;
                                  contentRef.current.selectionStart = newCursorPos;
                                  contentRef.current.selectionEnd = newCursorPos;
                                }
                              }, 0);
                            } catch (err) {
                              console.error('Insight lookup failed:', err);
                              setLookupMessage('Lookup failed. Check connection.');
                              setTimeout(() => setLookupMessage(''), 3000);
                            } finally {
                              setIsLookingUp(false);
                            }
                          })();
                          return;
                        }
                      }
                    }

                    // Handle Pownin AI Command: @pai- + Enter
                    const lastAtSignIndexPAI = textBeforeCursor.lastIndexOf('@pai-');
                    if (lastAtSignIndexPAI !== -1) {
                      const potentialCommand = textBeforeCursor.substring(lastAtSignIndexPAI);
                      if (!potentialCommand.includes('\n') && potentialCommand.length > 5) {
                        const query = potentialCommand.slice(5).trim();
                        if (query) {
                          e.preventDefault();
                          setShowExplorer(false);
                          setIsLookingUp(true);
                          setLookupMessage('Thinking...');

                          (async () => {
                            try {
                              const result = await askPowninAI(query);
                              const textAfterCursor = content.substring(cursorStart);
                              const newContent = content.substring(0, lastAtSignIndexPAI) + result + textAfterCursor;
                              setContent(newContent);

                              setTimeout(() => {
                                if (contentRef.current) {
                                  const newCursorPos = lastAtSignIndexPAI + result.length;
                                  contentRef.current.selectionStart = newCursorPos;
                                  contentRef.current.selectionEnd = newCursorPos;
                                }
                              }, 0);
                            } catch (err) {
                              console.error('Pownin AI failed:', err);
                              setLookupMessage('AI error. Check API key.');
                              setTimeout(() => setLookupMessage(''), 3000);
                            } finally {
                              setIsLookingUp(false);
                            }
                          })();
                          return;
                        }
                      }
                    }

                    // Handle Utility Commands: @w-, @cc-, @u- + Enter
                    const lastAtSignIndexUtil = textBeforeCursor.lastIndexOf('@');
                    if (lastAtSignIndexUtil !== -1) {
                      const potentialCommand = textBeforeCursor.substring(lastAtSignIndexUtil);
                      if (!potentialCommand.includes('\n') && potentialCommand.length > 3) {
                        const utilCmd = parseUtilityCommand(potentialCommand);
                        if (utilCmd) {
                          e.preventDefault();
                          setShowExplorer(false);
                          setIsLookingUp(true);
                          setLookupMessage('Processing command...');

                          (async () => {
                            try {
                              let result = '';
                              if (utilCmd.type === 'weather') {
                                result = await fetchWeather(utilCmd.city);
                              } else if (utilCmd.type === 'currency') {
                                result = await fetchCurrencyExchange(utilCmd.amount, utilCmd.from, utilCmd.to);
                              } else if (utilCmd.type === 'unit') {
                                result = convertUnits(utilCmd.value, utilCmd.from, utilCmd.to);
                              }

                              if (result) {
                                const textAfterCursor = content.substring(cursorStart);
                                const newContent = content.substring(0, lastAtSignIndexUtil) + result + textAfterCursor;
                                setContent(newContent);
                                setTimeout(() => {
                                  if (contentRef.current) {
                                    const newCursorPos = lastAtSignIndexUtil + result.length;
                                    contentRef.current.selectionStart = newCursorPos;
                                    contentRef.current.selectionEnd = newCursorPos;
                                  }
                                }, 0);
                              }
                            } catch (err) {
                              console.error('Utility command failed:', err);
                            } finally {
                              setIsLookingUp(false);
                            }
                          })();
                          return;
                        }
                      }
                    }

                    // Handle Pomodoro Command: @pomo or @pomo-[time] + Enter
                    const lastAtSignIndexPomo = textBeforeCursor.lastIndexOf('@pomo');
                    if (lastAtSignIndexPomo !== -1) {
                      const potentialCommand = textBeforeCursor.substring(lastAtSignIndexPomo);
                      if (!potentialCommand.includes('\n')) {
                        e.preventDefault();
                        setShowExplorer(false);
                        let timeStr = '';
                        if (potentialCommand.startsWith('@pomo-')) {
                          timeStr = potentialCommand.slice(6).trim();
                        }

                        const seconds = parsePomoTime(timeStr);
                        const textAfterCursor = content.substring(cursorStart);
                        setContent(content.substring(0, lastAtSignIndexPomo) + textAfterCursor);
                        setPomodoroTime(seconds);
                        setPomodoroTotalTime(seconds);
                        setIsPomodoroActive(true);
                        return;
                      }
                    }

                    // Handle Quiz Mode Command: @quiz or @quiz-s + Enter
                    if (textBeforeCursor.endsWith('@quiz') || textBeforeCursor.endsWith('@quiz-s')) {
                      e.preventDefault();
                      setShowExplorer(false);
                      const isShuffle = textBeforeCursor.endsWith('@quiz-s');
                      const lastIndex = textBeforeCursor.lastIndexOf(isShuffle ? '@quiz-s' : '@quiz');
                      const textAfterCursor = content.substring(cursorStart);

                      setContent(content.substring(0, lastIndex) + textAfterCursor);
                      setIsQuizShuffled(isShuffle);
                      setIsQuizMode(true);
                      setRevealedQuizItems([]);
                      setQuizUserAnswers({});
                      return;
                    }

                    // Handle Font Commands: @fonts, @font-d, @font-[index/name] + Enter
                    const lastAtSignIndexFont = textBeforeCursor.lastIndexOf('@font');
                    if (lastAtSignIndexFont !== -1) {
                      const potentialCommand = textBeforeCursor.substring(lastAtSignIndexFont);
                      if (!potentialCommand.includes('\n')) {
                        // @fonts - Insert font list as text
                        if (isFontsListCommand(potentialCommand)) {
                          e.preventDefault();
                          setShowExplorer(false);
                          const fontsList = getFontsListText();
                          const textAfterCursor = content.substring(cursorStart);
                          const newContent = content.substring(0, lastAtSignIndexFont) + fontsList + textAfterCursor;
                          setContent(newContent);
                          setTimeout(() => {
                            if (contentRef.current) {
                              const newCursorPos = lastAtSignIndexFont + fontsList.length;
                              contentRef.current.selectionStart = newCursorPos;
                              contentRef.current.selectionEnd = newCursorPos;
                            }
                          }, 0);
                          return;
                        }

                        // @font-d - Reset to default font
                        if (isDefaultFontCommand(potentialCommand)) {
                          e.preventDefault();
                          setShowExplorer(false);
                          setNoteFont(DEFAULT_FONT); // Update local note font state
                          const textAfterCursor = content.substring(cursorStart);
                          setContent(content.substring(0, lastAtSignIndexFont) + textAfterCursor);
                          return;
                        }

                        // @font-[index/name] - Change font
                        const font = parseFontCommand(potentialCommand);
                        if (font) {
                          e.preventDefault();
                          setShowExplorer(false);
                          setNoteFont(font); // Update local note font state
                          const textAfterCursor = content.substring(cursorStart);
                          setContent(content.substring(0, lastAtSignIndexFont) + textAfterCursor);
                          return;
                        }
                      }
                    }

                    // Handle Summary Command: @summary + Enter
                    const lastAtSignIndexSummary = textBeforeCursor.lastIndexOf('@summary');
                    if (lastAtSignIndexSummary !== -1) {
                      const potentialCommand = textBeforeCursor.substring(lastAtSignIndexSummary);
                      if (!potentialCommand.includes('\n') && potentialCommand.trim() === '@summary') {
                        e.preventDefault();
                        setShowExplorer(false);
                        setIsLookingUp(true);
                        setLookupMessage('Rewriting with summary...');

                        const textToSummarize = content.substring(0, lastAtSignIndexSummary) + content.substring(cursorStart);

                        if (!textToSummarize.trim()) {
                          setIsLookingUp(false);
                          return;
                        }

                        import('../utils/summaryService').then(async ({ fetchSummary }) => {
                          try {
                            const summary = await fetchSummary(textToSummarize);
                            if (summary) {
                              if (summary.startsWith("ERROR:")) {
                                setLookupMessage("Busy. Retry soon.");
                                setTimeout(() => setIsLookingUp(false), 3000);
                                return;
                              }
                              // REPLACE entire content with the summary, prefixed with label
                              const finalContent = `SUMMARY:\n${summary}`;
                              setContent(finalContent);
                              setTimeout(() => {
                                if (contentRef.current) {
                                  contentRef.current.selectionStart = finalContent.length;
                                  contentRef.current.selectionEnd = finalContent.length;
                                }
                              }, 0);
                            }
                          } catch (err) {
                            console.error('Summary failed:', err);
                          } finally {
                            // Clear if not showing an error
                            if (!lookupMessage.includes("Retry") && !lookupMessage.includes("Error")) {
                              setIsLookingUp(false);
                            }
                          }
                        });
                        return;
                      }
                    }

                    // Handle Elaboration Command: @elaboration + Enter
                    const lastAtSignIndexElaborate = textBeforeCursor.lastIndexOf('@elaboration');
                    if (lastAtSignIndexElaborate !== -1) {
                      const potentialCommand = textBeforeCursor.substring(lastAtSignIndexElaborate);
                      if (!potentialCommand.includes('\n') && potentialCommand.trim() === '@elaboration') {
                        e.preventDefault();
                        setShowExplorer(false);
                        setIsLookingUp(true);
                        setLookupMessage('Rewriting in simple words...');

                        const textToElaborate = content.substring(0, lastAtSignIndexElaborate) + content.substring(cursorStart);

                        if (!textToElaborate.trim()) {
                          setIsLookingUp(false);
                          return;
                        }

                        import('../utils/summaryService').then(async ({ fetchElaboration }) => {
                          try {
                            const elaboration = await fetchElaboration(textToElaborate);
                            if (elaboration) {
                              if (elaboration.startsWith("ERROR:")) {
                                setLookupMessage("Busy. Retry soon.");
                                setTimeout(() => setIsLookingUp(false), 3000);
                                return;
                              }
                              // REPLACE entire content with the elaboration, prefixed with label
                              const finalContent = `ELABORATION:\n${elaboration}`;
                              setContent(finalContent);
                              setTimeout(() => {
                                if (contentRef.current) {
                                  contentRef.current.selectionStart = finalContent.length;
                                  contentRef.current.selectionEnd = finalContent.length;
                                }
                              }, 0);
                            }
                          } catch (err) {
                            console.error('Elaboration failed:', err);
                          } finally {
                            if (!lookupMessage.includes("Retry") && !lookupMessage.includes("Error")) {
                              setIsLookingUp(false);
                            }
                          }
                        });
                        return;
                      }
                    }

                    // Handle Sound Commands: @sound-on, @sound-on-[PERCENT], @sound-off
                    const lastAtSignIndexSound = textBeforeCursor.lastIndexOf('@sound');
                    if (lastAtSignIndexSound !== -1) {
                      const potentialCommand = textBeforeCursor.substring(lastAtSignIndexSound).trim();
                      if (!potentialCommand.includes('\n')) {
                        const lowerCmd = potentialCommand.toLowerCase();
                        if (lowerCmd.startsWith('@sound-on')) {
                          e.preventDefault();
                          setShowExplorer(false);
                          let newVol = 1.0;
                          const volMatch = potentialCommand.match(/@sound-on[- :]*(\d+)/i);
                          if (volMatch) {
                            const percent = parseInt(volMatch[1], 10);
                            if (!isNaN(percent)) {
                              newVol = Math.min(100, Math.max(0, percent)) / 100;
                              setVolume(newVol);
                            }
                          }
                          setSoundEnabled(true);
                          playSuccess(0.3 * (newVol * newVol));
                          const textAfterCursor = content.substring(cursorStart);
                          const newContent = content.substring(0, lastAtSignIndexSound) + textAfterCursor;
                          setContent(newContent);
                          setTimeout(() => {
                            if (contentRef.current) {
                              contentRef.current.selectionStart = lastAtSignIndexSound;
                              contentRef.current.selectionEnd = lastAtSignIndexSound;
                            }
                          }, 0);
                          return;
                        } else if (lowerCmd === '@sound-off') {
                          e.preventDefault();
                          setShowExplorer(false);
                          setSoundEnabled(false);
                          const textAfterCursor = content.substring(cursorStart);
                          const newContent = content.substring(0, lastAtSignIndexSound) + textAfterCursor;
                          setContent(newContent);
                          setTimeout(() => {
                            if (contentRef.current) {
                              contentRef.current.selectionStart = lastAtSignIndexSound;
                              contentRef.current.selectionEnd = lastAtSignIndexSound;
                            }
                          }, 0);
                          return;
                        }
                      }
                    }

                    // If NO command matched above, but explorer is open, let explorer handle selection
                    if (showExplorer) {
                      if (e.key === 'Enter') {
                        // We actually don't want to prevent default if NO command matched
                        // UNLESS the explorer has a filtered match.
                        // But that logic is complex here. Let's just return if it's a key the explorer cares about.
                        return;
                      }
                    }
                  }

                  // Handle explorer navigation if no Enter command matched
                  if (showExplorer && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Escape')) {
                    e.preventDefault();
                  }
                }}
                placeholder="Start writing your note..."
                style={{
                  fontFamily: noteFont.family,
                  color: parseFontsListFromContent(content) ? 'transparent' : 'inherit',
                  caretColor: 'auto',
                }}
                className={`w-full resize-none overflow-hidden bg-transparent outline-none placeholder-gray-500 dark:placeholder-gray-400 text-lg leading-relaxed min-h-[260px] transition-opacity duration-300 ${isTranslating ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
              />
              <CommandExplorer
                isVisible={showExplorer}
                searchTerm={explorerQuery}
                onSelect={handleCommandSelect}
                onClose={() => setShowExplorer(false)}
                position={explorerPosition}
              />
            </div>
          )}

          {isQuizMode && (
            <div className="relative max-w-3xl mx-auto pt-0 pb-12 animate-in fade-in duration-300">
              <div className="space-y-6">
                {(() => {
                  const lines = content.split('\n').filter(l => l.trim());
                  const items: { question: string, answer: string | null, originalIdx: number }[] = [];

                  lines.forEach((line, idx) => {
                    const isAnswer = line.trim().toLowerCase().startsWith('a:');
                    if (!isAnswer) {
                      items.push({ question: line, answer: null, originalIdx: idx });
                    } else {
                      // If it's an answer: 
                      // 1. Attach to previous question if it doesn't have an answer yet
                      // 2. Otherwise, create a new item with an empty question
                      if (items.length > 0 && items[items.length - 1].answer === null) {
                        items[items.length - 1].answer = line;
                      } else {
                        items.push({ question: '', answer: line, originalIdx: idx });
                      }
                    }
                  });

                  // SHUFFLE LOGIC
                  if (isQuizShuffled) {
                    for (let i = items.length - 1; i > 0; i--) {
                      const j = Math.floor(Math.random() * (i + 1));
                      [items[i], items[j]] = [items[j], items[i]];
                    }
                  }

                  return items.map((item, idx) => {
                    const correctAnswer = item.answer ? item.answer.replace(/^a:\s*/i, '').trim() : '';
                    const userAnswer = quizUserAnswers[item.originalIdx] || '';
                    const isRevealed = revealedQuizItems.includes(item.originalIdx);
                    const isCorrect = isRevealed && userAnswer.trim().toLowerCase() === correctAnswer.toLowerCase();

                    return (
                      <div key={idx} className="animate-in fade-in duration-300">
                        {/* Question */}
                        <p className="text-lg text-gray-900 dark:text-gray-100 leading-relaxed mb-2">
                          {idx + 1}. {item.question.replace(/^(?:q|que|question|task)\s*(?:\d+\s*)?[\.\:\)]\s*|^\d+[\.\:\)]\s*/i, '')}
                        </p>

                        {/* Answer Area (Tightly coupled to question) */}
                        {item.answer && (
                          <div className="ml-0 sm:ml-4">
                            {!isRevealed ? (
                              <div className="flex flex-col gap-2">
                                <input
                                  type="text"
                                  value={userAnswer}
                                  onChange={(e) => setQuizUserAnswers({ ...quizUserAnswers, [item.originalIdx]: e.target.value })}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      setRevealedQuizItems([...revealedQuizItems, item.originalIdx]);
                                    }
                                  }}
                                  placeholder="Answer..."
                                  className="bg-transparent border-b border-gray-200 dark:border-gray-800 py-1 text-lg outline-none focus:border-blue-400 transition-colors dark:text-gray-300 w-full max-w-md"
                                />
                                <div className="flex gap-4">
                                  <button
                                    onClick={() => setRevealedQuizItems([...revealedQuizItems, item.originalIdx])}
                                    className="text-[10px] uppercase font-bold text-blue-500 hover:underline"
                                  >
                                    Check
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRevealedQuizItems([...revealedQuizItems, item.originalIdx]);
                                    }}
                                    className="text-[10px] uppercase font-bold text-gray-400 hover:underline"
                                  >
                                    Reveal
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="pt-1">
                                <p className={`text-lg italic ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                  {isCorrect ? '✓ ' : '→ '}{correctAnswer}
                                </p>
                                {!isCorrect && userAnswer.trim() && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    (You wrote: {userAnswer})
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>

        <style>{`
            .note-editor-scrollbar::-webkit-scrollbar {
                width: 6px;
            }
            .note-editor-scrollbar::-webkit-scrollbar-track {
                background: transparent;
            }
            .note-editor-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(0, 0, 0, 0.1);
                border-radius: 10px;
            }
            .note-editor-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(0, 0, 0, 0.2);
            }
            .dark .note-editor-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.1);
            }
            .dark .note-editor-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.2);
            }
        `}</style>

        {/* BOTTOM TOOLBAR */}
        <div className="px-5 pb-4 pt-4 border-t border-black/5 dark:border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between w-full gap-4">

            {/* LEFT SIDE — COLOR + TAG INPUT */}
            <div className="flex items-center gap-3 flex-1 min-w-0">

              {/* Color button */}
              <div className="relative flex-shrink-0" ref={colorPickerRef}>
                <button
                  onClick={() => {
                    setShowColorPicker((v) => !v);
                    setMobileMoreOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/60 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700/60 transition"
                >
                  <Palette className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Color</span>
                </button>

                {/* Color picker */}
                {showColorPicker && (
                  <div className="absolute bottom-full left-0 mb-2 p-1.5 bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-700 rounded-lg flex gap-1">
                    {NOTE_COLORS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setColor(c.id);
                          setShowColorPicker(false);
                        }}
                        className={`w-6 h-6 rounded-md ${c.class}`}
                      />
                    ))}
                    <button
                      onClick={() => {
                        setColor('');
                        setShowColorPicker(false);
                      }}
                      className="w-6 h-6 rounded-md bg-gray-100 dark:bg-white text-gray-600 flex items-center justify-center border border-gray-200 dark:border-transparent"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="flex-1 min-w-0 relative">
                <div className="h-10 px-2 rounded-lg bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex items-center gap-2 overflow-x-auto no-scrollbar w-full max-w-full flex-nowrap">
                  {tags.map((t) => {
                    const isHideTag = t === '@hide';
                    const hideClasses = "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50";
                    const normalClasses = "bg-white dark:bg-gray-700 border border-gray-200 dark:border-transparent text-sm text-gray-700 dark:text-gray-200";

                    return (
                      <span
                        key={t}
                        className={`px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm dark:shadow-none flex-shrink-0 whitespace-nowrap ${isHideTag ? hideClasses : normalClasses}`}
                      >
                        {isHideTag && <EyeOff className="w-3.5 h-3.5" />}
                        {t}
                        <button onClick={() => handleRemoveTag(t)}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}

                  <input
                    ref={tagInputRef}
                    value={tagInput}
                    onChange={handleTagInput}
                    onKeyDown={handleTagKey}
                    onFocus={() => {
                      if (tagInput.startsWith('file') && tagInput.length >= 4) {
                        setShowTagSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay hiding to allow click on suggestion
                      setTimeout(() => setShowTagSuggestions(false), 150);
                    }}
                    placeholder="Add tags (max 50)"
                    className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-500 min-w-[135px]"
                  />
                </div>
                {tagError && (
                  <div className="text-red-400 text-xs mt-1">{tagError}</div>
                )}

                {/* File tag suggestions popup */}
                {showTagSuggestions && filteredSuggestions.length > 0 && (
                  <div
                    ref={tagSuggestionsRef}
                    className="absolute bottom-full left-0 mb-1 w-full max-w-[250px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden z-50"
                  >
                    <style>{`
                      .tag-suggestions-scrollbar::-webkit-scrollbar {
                        width: 6px;
                      }
                      .tag-suggestions-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                      }
                      .tag-suggestions-scrollbar::-webkit-scrollbar-thumb {
                        background-color: rgba(156, 163, 175, 0.5);
                        border-radius: 10px;
                      }
                      .tag-suggestions-scrollbar::-webkit-scrollbar-thumb:hover {
                        background-color: rgba(156, 163, 175, 0.8);
                      }
                      .dark .tag-suggestions-scrollbar::-webkit-scrollbar-track {
                        background: rgb(31, 41, 55);
                      }
                      .dark .tag-suggestions-scrollbar::-webkit-scrollbar-thumb {
                        background-color: rgba(156, 163, 175, 0.3);
                      }
                      .dark .tag-suggestions-scrollbar::-webkit-scrollbar-thumb:hover {
                        background-color: rgba(156, 163, 175, 0.5);
                      }
                    `}</style>
                    <div className="max-h-48 overflow-y-auto tag-suggestions-scrollbar">
                      {filteredSuggestions.map((suggestion, index) => (
                        <button
                          key={`${suggestion.tag}-${suggestion.space}-${suggestion.isInTrash}`}
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent blur from hiding popup
                            e.stopPropagation(); // Prevent modal close listener
                            handleSelectSuggestion(suggestion);
                          }}
                          className={`w-full min-w-0 overflow-hidden px-3 py-2 flex items-center gap-2 text-left text-sm transition-colors ${index === selectedSuggestionIndex
                            ? 'bg-blue-50 dark:bg-blue-900/30'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                        >
                          {/* Space icon */}
                          {suggestion.space === 'private' ? (
                            <Lock className="w-4 h-4 text-purple-500 flex-shrink-0" />
                          ) : (
                            <Globe className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          )}

                          {/* Tag name */}
                          <span className="flex-1 text-gray-900 dark:text-gray-100 truncate">
                            {suggestion.tag}
                          </span>

                          {/* Trash indicator */}
                          {suggestion.isInTrash && (
                            <Trash2 className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* DESKTOP ICONS — FIXED COLORING */}
            <div className="hidden sm:flex items-center gap-2">

              <button
                onClick={() => setIsPinned((v) => !v)}
                className={`${iconBtn} ${isPinned ? '!bg-pink-500 !text-white' : ''}`}
              >
                <Pin className="w-5 h-5 stroke-current" />
              </button>

              <button
                onClick={() => setIsFavorite((v) => !v)}
                className={`${iconBtn} ${isFavorite ? '!bg-yellow-500 !text-white' : ''}`}
              >
                <Star className="w-5 h-5 stroke-current" />
              </button>

              <button
                onClick={togglePrivacy}
                className={`${iconBtn} ${isPrivate ? '!bg-purple-600 !text-white' : ''}`}
              >
                {isPrivate ? (
                  <Lock className="w-5 h-5 stroke-current" />
                ) : (
                  <Unlock className="w-5 h-5 stroke-current" />
                )}
              </button>
            </div>

            {/* MOBILE MORE MENU */}
            <div className="sm:hidden relative flex-shrink-0" ref={mobileMoreRef}>
              <button
                onClick={() => {
                  setMobileMoreOpen((v) => !v);
                  setShowColorPicker(false);
                }}
                className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-800/60 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700/60 transition"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {mobileMoreOpen && (
                <div className="absolute right-0 bottom-full mb-2 bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-700 rounded-lg p-1.5 flex flex-col gap-1 w-36">

                  {/* PIN */}
                  <button
                    onClick={() => setIsPinned((v) => !v)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-sm font-medium ${isPinned
                      ? '!bg-pink-500 !text-white'
                      : 'text-gray-700 dark:text-gray-200'
                      }`}
                  >
                    <Pin className="w-4 h-4 stroke-current" />
                    Pin
                  </button>

                  {/* FAVORITE */}
                  <button
                    onClick={() => setIsFavorite((v) => !v)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-sm font-medium ${isFavorite
                      ? '!bg-yellow-500 !text-white'
                      : 'text-gray-700 dark:text-gray-200'
                      }`}
                  >
                    <Star className="w-4 h-4 stroke-current" />
                    Favorite
                  </button>

                  {/* PRIVATE */}
                  <button
                    onClick={togglePrivacy}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-sm font-medium ${isPrivate
                      ? '!bg-purple-600 !text-white'
                      : 'text-gray-700 dark:text-gray-200'
                      }`}
                  >
                    {isPrivate ? (
                      <Lock className="w-4 h-4 stroke-current" />
                    ) : (
                      <Unlock className="w-4 h-4 stroke-current" />
                    )}
                    Private
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
