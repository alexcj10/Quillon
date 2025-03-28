import { Search } from 'lucide-react';
import { useNotes } from '../context/NoteContext';

export function SearchBar() {
  const { searchTerm, setSearchTerm, notes, selectedTags, setSelectedTags } = useNotes();
  
  const allTags = Array.from(new Set(notes.flatMap(note => note.tags)));

  return (
    <div className="mb-6 space-y-4 w-full max-w-3xl mx-auto px-4 sm:px-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search notes..."
          className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 
            text-black dark:text-white
            placeholder:text-gray-500 dark:placeholder:text-gray-400
            bg-white dark:bg-gray-800
            border-gray-300 dark:border-gray-700"
        />
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
                  : 'bg-gray-200 text-black hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
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