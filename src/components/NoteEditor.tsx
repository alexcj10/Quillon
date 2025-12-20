import React, { useEffect, useRef, useState } from 'react';

import {
  X,
  Lock,
  Unlock,
  Pin,
  Star,
  Check,
  Palette,
  MoreHorizontal,
} from 'lucide-react';
import { Note } from '../types';
import { NOTE_COLORS } from '../constants/colors';

interface NoteEditorProps {
  note?: Note;
  onSave: (note: Partial<Note>) => void;
  onClose: () => void;
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

  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const mobileMoreRef = useRef<HTMLDivElement | null>(null);
  const colorPickerRef = useRef<HTMLDivElement | null>(null);

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

    // We need to preserve the scroll position of the PARENT container
    // because shrinking the textarea momentarily can cause the parent to scroll up
    const scrollParent = el.parentElement;
    const currentScroll = scrollParent?.scrollTop;

    el.style.height = '0px';
    el.style.height = `${Math.min(el.scrollHeight + 10, 1800)}px`;

    // Restore scroll position if we have a parent
    if (scrollParent && typeof currentScroll === 'number') {
      scrollParent.scrollTop = currentScroll;
    }
  }, [content]);

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

  const saveNote = () => {
    onSave({
      title,
      content,
      tags,
      color: color || undefined,
      isPinned,
      isFavorite,
      isPrivate,
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
  };

  const addTag = (t: string) => {
    const newTag = t.trim();
    if (!newTag) return;

    if (newTag.length > MAX_TAG_LENGTH)
      return setTagError(`Max ${MAX_TAG_LENGTH} characters allowed`);

    const err = validateFileTag(newTag);
    if (err) return setTagError(err);

    if (!tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setTagInput('');
      setTagError('');
    }
  };

  const handleTagKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      setTags(tags.slice(0, -1));
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
        className={`w-full max-w-4xl h-full sm:h-[75vh] lg:h-[85vh] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col ${selectedColorClass}`}
      >
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
              maxLength={MAX_TITLE_LENGTH}
              placeholder="Note title"
              className="text-xl font-semibold bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 flex-1 min-w-0"
            />
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
          </div>

          <button
            onClick={() => {
              saveNote();
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow transition flex items-center gap-2 flex-shrink-0 whitespace-nowrap"
          >
            <Check className="w-4 h-4" />
            Save
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pt-4 pb-2 note-editor-scrollbar">
          <textarea
            ref={contentRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing your note..."
            className="w-full resize-none bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-lg leading-relaxed min-h-[260px]"
          />
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
              <div className="flex-1 min-w-0">
                <div className="h-10 px-2 rounded-lg bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex items-center gap-2 overflow-x-auto no-scrollbar w-full max-w-full flex-nowrap">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-transparent text-sm text-gray-700 dark:text-gray-200 flex items-center gap-1 shadow-sm dark:shadow-none flex-shrink-0 whitespace-nowrap"
                    >
                      {t}
                      <button onClick={() => setTags(tags.filter((x) => x !== t))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  <input
                    value={tagInput}
                    onChange={handleTagInput}
                    onKeyDown={handleTagKey}
                    placeholder="Add tags (max 50)"
                    className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-500 min-w-[135px]"
                  />
                </div>
                {tagError && (
                  <div className="text-red-400 text-xs mt-1">{tagError}</div>
                )}
              </div>
            </div>

            {/* DESKTOP ICONS — FIXED COLORING */}
            <div className="hidden sm:flex items-center gap-2">

              <button
                onClick={() => setIsPinned((v) => !v)}
                className={`${iconBtn} ${isPinned ? '!bg-yellow-500 !text-white' : ''}`}
              >
                <Pin className="w-5 h-5 stroke-current" />
              </button>

              <button
                onClick={() => setIsFavorite((v) => !v)}
                className={`${iconBtn} ${isFavorite ? '!bg-pink-500 !text-white' : ''}`}
              >
                <Star className="w-5 h-5 stroke-current" />
              </button>

              <button
                onClick={() => setIsPrivate((v) => !v)}
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
                      ? '!bg-yellow-500 !text-white'
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
                      ? '!bg-pink-500 !text-white'
                      : 'text-gray-700 dark:text-gray-200'
                      }`}
                  >
                    <Star className="w-4 h-4 stroke-current" />
                    Favorite
                  </button>

                  {/* PRIVATE */}
                  <button
                    onClick={() => setIsPrivate((v) => !v)}
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
