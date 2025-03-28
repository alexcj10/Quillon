import React, { useState } from 'react';
import { NoteProvider } from './context/NoteContext';
import { useNotes } from './context/NoteContext';
import { NoteCard } from './components/NoteCard';
import { NoteEditor } from './components/NoteEditor';
import { NoteFilters } from './components/NoteFilters';
import { PrivateSpaceDialog } from './components/PrivateSpaceDialog';
import { Plus, Moon, Sun, Lock, Trash2 } from 'lucide-react';

function NoteList() {
  const { 
    notes, 
    searchTerm, 
    selectedTags,
    showStarredOnly,
    showPrivateNotes,
    showTrash,
    setShowTrash,
    setShowPrivateNotes,
    privateSpaceExists,
    isPrivateSpaceUnlocked,
    lockPrivateSpace,
    isDarkMode, 
    toggleDarkMode,
    addNote,
    updateNote 
  } = useNotes();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingNote, setEditingNote] = useState(undefined);
  const [showPrivateSpaceDialog, setShowPrivateSpaceDialog] = useState(false);

  const handleEdit = (note) => {
    setEditingNote(note);
    setIsEditing(true);
  };

  const handlePrivateClick = () => {
    if (showPrivateNotes) {
      lockPrivateSpace();
    } else if (!privateSpaceExists || !isPrivateSpaceUnlocked) {
      setShowPrivateSpaceDialog(true);
    } else {
      setShowPrivateNotes(true);
    }
  };

  const filteredNotes = notes
    .filter(note => {
      if (showTrash !== !!note.isDeleted) return false;
      if (note.isPrivate !== showPrivateNotes) return false;
      if (showStarredOnly && !note.isFavorite) return false;
      
      const matchesSearch = 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesTags = 
        selectedTags.length === 0 ||
        selectedTags.every(tag => note.tags.includes(tag));
      
      return matchesSearch && matchesTags;
    })
    .sort((a, b) => {
      // First sort by pinned status
      if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1;
      
      // If in trash, sort by deletion date
      if (showTrash) {
        return new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime();
      }
      
      // Otherwise sort by creation date (oldest first)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-[1500px] mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6">
        <div className="flex flex-col items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white tracking-tight">
            Quillon
          </h1>
          
          <div className="flex items-center gap-2 w-full justify-center">
            <button
              onClick={() => setShowTrash(!showTrash)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                showTrash 
                  ? 'bg-red-500 text-white fill-current' 
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
              }`}
              aria-label="Trash"
              title="Trash"
            >
              <Trash2 className={`h-5 w-5 ${showTrash ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handlePrivateClick}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                showPrivateNotes 
                  ? 'bg-purple-500 text-white fill-current' 
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
              }`}
              aria-label={showPrivateNotes ? 'Lock private notes' : 'Access private notes'}
              title={showPrivateNotes ? 'Lock private notes' : 'Access private notes'}
            >
              <Lock className={`h-5 w-5 ${showPrivateNotes ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={toggleDarkMode}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => {
                setEditingNote(undefined);
                setIsEditing(true);
              }}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              title="Create new note"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {!showTrash && <NoteFilters />}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredNotes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={handleEdit}
            />
          ))}
          {filteredNotes.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                {showTrash 
                  ? 'Trash is empty' 
                  : showPrivateNotes 
                    ? 'No private notes found' 
                    : 'No notes found'}
              </p>
            </div>
          )}
        </div>

        {isEditing && !showTrash && (
          <NoteEditor
            note={editingNote}
            onSave={(note) => {
              if (editingNote) {
                updateNote(editingNote.id, { ...note, updatedAt: new Date().toISOString() });
              } else {
                addNote(note);
              }
              setIsEditing(false);
            }}
            onClose={() => setIsEditing(false)}
          />
        )}

        {showPrivateSpaceDialog && (
          <PrivateSpaceDialog
            onClose={() => setShowPrivateSpaceDialog(false)}
          />
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <NoteProvider>
      <NoteList />
    </NoteProvider>
  );
}

export default App;