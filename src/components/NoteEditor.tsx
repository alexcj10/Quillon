import React, { useState } from 'react';
import { Note } from '../types';
import { X, Lock, Unlock, AlertCircle } from 'lucide-react';
import { NOTE_COLORS } from '../constants/colors';

interface NoteEditorProps {
  note?: Note;
  onSave: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

const MAX_TAG_LENGTH = 50; // Maximum characters allowed for a tag

export function NoteEditor({ note, onSave, onClose }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [tags, setTags] = useState(note?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [tagError, setTagError] = useState('');
  const [color, setColor] = useState(note?.color || '');
  const [isPinned, setIsPinned] = useState(note?.isPinned || false);
  const [isFavorite, setIsFavorite] = useState(note?.isFavorite || false);
  const [isPrivate, setIsPrivate] = useState(note?.isPrivate || false);

  const selectedColorClass = color ? NOTE_COLORS.find(c => c.id === color)?.previewClass : '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      content,
      tags,
      color,
      isPinned,
      isFavorite,
      isPrivate,
    });
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      
      if (newTag.length > MAX_TAG_LENGTH) {
        setTagError(`Tags cannot be longer than ${MAX_TAG_LENGTH} characters`);
        return;
      }

      // Prevent duplicate tags
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
        setTagError('');
      }
      setTagInput('');
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      e.preventDefault();
      setTags(tags.slice(0, -1));
      setTagError('');
    }
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);
    
    if (value.length > MAX_TAG_LENGTH) {
      setTagError(`Tags cannot be longer than ${MAX_TAG_LENGTH} characters`);
    } else {
      setTagError('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
    setTagError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className={`${selectedColorClass} rounded-lg w-full max-w-2xl shadow-xl transition-colors duration-200`}>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              {note ? 'Edit Note' : 'New Note'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title"
              className="w-full p-3 border rounded-lg bg-white/90 dark:bg-gray-700/90 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
              required
            />

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Note content"
              className="w-full p-3 border rounded-lg h-32 bg-white/90 dark:bg-gray-700/90 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200"
              required
            />

            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex gap-1">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    title={c.label}
                    className={`w-6 h-6 rounded-lg ${c.class} transition-all ${
                      color === c.id ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                    }`}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setColor('')}
                  title="Clear color"
                  className={`w-6 h-6 rounded-lg bg-white border border-gray-300 dark:border-gray-600 transition-all hover:scale-105 ${
                    !color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                  }`}
                >
                  <X className="h-4 w-4 m-auto text-gray-400" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 ml-auto">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="form-checkbox"
                  />
                  Pin
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isFavorite}
                    onChange={(e) => setIsFavorite(e.target.checked)}
                    className="form-checkbox"
                  />
                  Favorite
                </label>
                <button
                  type="button"
                  onClick={() => setIsPrivate(!isPrivate)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                    isPrivate
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {isPrivate ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  <span className="text-sm">Private</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 p-2 bg-white/90 dark:bg-gray-700/90 border border-gray-300 dark:border-gray-600 rounded-lg min-h-[2.5rem] overflow-x-auto">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full text-sm max-w-full"
                  >
                    <span className="truncate max-w-[300px]">{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="shrink-0 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyDown={handleTagKeyDown}
                  placeholder={tags.length === 0 ? `Add tags (max ${MAX_TAG_LENGTH} chars)` : ""}
                  className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-gray-800 dark:text-gray-200 text-sm placeholder-gray-400"
                />
              </div>
              {tagError && (
                <div className="flex items-center gap-1 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{tagError}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}