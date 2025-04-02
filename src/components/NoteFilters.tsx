import React from 'react';
import { Search, Star, Lock, Folder } from 'lucide-react';
import { useNotes } from '../context/NoteContext';
import { isFileTag, getFileTagDisplayName } from '../types';

export function NoteFilters() {
  const { 
    searchTerm, 
    setSearchTerm, 
    notes, 
    selectedTags, 
    setSelectedTags,
    showStarredOnly,
    setShowStarredOnly,
    showPrivateNotes
  } = useNotes();
  
  const visibleNotes = notes.filter(note => note.isPrivate === showPrivateNotes);
  const allTags = Array.from(new Set(visibleNotes.flatMap(note => note.tags)));
  const selectedFileTag = selectedTags.find(tag => isFileTag(tag));

  return (
    <div className="mb-6 space-y-4 w-full max-w-3xl mx-auto px-4 sm:px-6">      
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={selectedFileTag 
              ? `Search in ${getFileTagDisplayName(selectedFileTag)}...` 
              : 'Search notes...'}
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 text-base"
          />
        </div>
        <button
          onClick={() => setShowStarredOnly(!showStarredOnly)}
          className={`p-3 rounded-lg transition-colors flex items-center gap-2 ${
            showStarredOnly 
              ? 'bg-yellow-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
          title={showStarredOnly ? 'Show all notes' : 'Show starred notes only'}
        >
          <Star className={`h-5 w-5 ${showStarredOnly ? 'fill-current' : ''}`} />
          <span className="hidden sm:inline">Starred</span>
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {allTags.map(tag => (
          <button
            key={tag}
            onClick={() => {
              setSelectedTags(
                selectedTags.includes(tag)
                  ? selectedTags.filter(t => t !== tag)
                  : [...selectedTags, tag]
              );
            }}
            className={`inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm transition-colors whitespace-nowrap touch-manipulation ${
              selectedTags.includes(tag)
                ? isFileTag(tag)
                  ? 'bg-blue-500 text-white'
                  : 'bg-blue-500 text-white'
                : isFileTag(tag)
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-200 dark:hover:bg-blue-800/50'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {isFileTag(tag) && <Folder className="h-4 w-4" />}
            {isFileTag(tag) ? getFileTagDisplayName(tag) : tag}
          </button>
        ))}
      </div>
    </div>
  );
}