import React from 'react';
import { Search, Star, Lock } from 'lucide-react';
import { useNotes } from '../context/NoteContext';

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

  return (
    <div className="mb-6 space-y-4 w-full max-w-3xl mx-auto px-4 sm:px-6">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${showPrivateNotes ? 'private' : ''} notes...`}
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
      
      {allTags.length > 0 && (
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
              className={`px-4 py-2 rounded-full text-sm transition-colors whitespace-nowrap touch-manipulation ${
                selectedTags.includes(tag)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}