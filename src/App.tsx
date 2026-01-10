import { useState } from 'react';
import { NoteProvider } from './context/NoteContext';
import { useNotes } from './context/NoteContext';
import { NoteCard } from './components/NoteCard';
import { NoteEditor } from './components/NoteEditor';
import { NoteFilters } from './components/NoteFilters';
import { PrivateSpaceDialog } from './components/PrivateSpaceDialog';
import { Plus, Moon, Sun, Lock, Trash2 } from 'lucide-react';
import AIChat from './components/AIChat';
import DocumentationPopup from './components/DocumentationPopup';
import { isFileTag, Note } from './types';
import powninLogo from './assets/pownin.png';
import { NodesProvider } from './context/NodesContext';
import { SoundProvider } from './context/SoundContext';
import { NodesWidget } from './components/NodesWidget';

import helpIcon from './assets/help.png';

function NoteList() {
  const {
    notes,
    searchTerm,
    selectedTags,
    showStarredOnly,
    showPrivateNotes,
    showTrash,
    setShowTrash,
    showHidden,
    setShowPrivateNotes,
    privateSpaceExists,
    isPrivateSpaceUnlocked,
    lockPrivateSpace,
    isDarkMode,
    toggleDarkMode,
    addNote,
    updateNote,
    clearSelection,
    isNotesLoaded,
  } = useNotes();

  const [isEditing, setIsEditing] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | undefined>(undefined);
  const [showPrivateSpaceDialog, setShowPrivateSpaceDialog] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setIsEditing(true);
  };

  const handlePrivateClick = () => {
    clearSelection();
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
      // Filter by hidden status, trash status, and private space independently
      if (!!note.isHidden !== showHidden) return false;
      if (!!note.isDeleted !== showTrash) return false;
      if (note.isPrivate !== showPrivateNotes) return false;
      if (showStarredOnly && !note.isFavorite) return false;

      const hasFileTag = note.tags.some(tag => isFileTag(tag));
      const selectedFileTag = selectedTags.find(tag => isFileTag(tag));
      const normalTags = selectedTags.filter(tag => !isFileTag(tag));

      // Search functionality - applies to both main view and file folders
      const matchesSearch =
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      // Check if note matches selected normal tags
      const matchesNormalTags =
        normalTags.length === 0 ||
        normalTags.every(tag => note.tags.includes(tag));

      // If note has a file tag
      if (hasFileTag) {
        // If a file tag is selected, must match that file tag
        if (selectedFileTag) {
          if (!note.tags.includes(selectedFileTag)) {
            return false;
          }
        } else {
          // No file tag selected.
          // Only show if specific normal tags are selected and match
          if (normalTags.length === 0 || !matchesNormalTags) {
            return false; // Hide from main page
          }
        }
        // Check search and normal tags
        return matchesSearch && matchesNormalTags;
      }

      // If a file tag is selected, don't show regular notes
      if (selectedFileTag) return false;

      // For main view, check normal tags
      return matchesSearch && matchesNormalTags;
    })
    .sort((a, b) => {
      // First sort by pinned status (context-aware)
      const isPinnedA = showStarredOnly ? !!a.isPinnedInFavorite : !!a.isPinned;
      const isPinnedB = showStarredOnly ? !!b.isPinnedInFavorite : !!b.isPinned;

      if (isPinnedA !== isPinnedB) return isPinnedB ? 1 : -1;

      // If in trash, sort by deletion date
      if (showTrash) {
        return new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime();
      }

      // Otherwise sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-[1500px] mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 relative">
        <button
          onClick={() => setIsDocsOpen(true)}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 w-8 h-8 rounded-full hover:opacity-80 transition-opacity z-10"
          title="Documentation"
        >
          <img src={helpIcon} alt="Help" className="w-full h-full object-cover rounded-full" />
        </button>
        <div className="flex flex-col items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white tracking-tight">
            Quillon
          </h1>

          <div className="flex items-center gap-2 w-full justify-center">
            <button
              onClick={() => setShowTrash(!showTrash)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${showTrash
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
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${showPrivateNotes
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
                clearSelection();
                setShowAIChat(true);
              }}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:opacity-80 transition-opacity"
              title="Ask Pownin"
            >
              <img src={powninLogo} alt="Pownin" className="w-full h-full rounded-xl object-cover" />
            </button>
            <button
              onClick={() => {
                clearSelection();
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



        {<NoteFilters displayedNotes={filteredNotes} />}

        {!isNotesLoaded ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading your notes...</p>
          </div>
        ) : (
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
                    ? showHidden ? 'Hidden trash is empty' : 'Trash is empty'
                    : showHidden
                      ? 'No hidden notes found'
                      : showPrivateNotes
                        ? 'No private notes found'
                        : 'No notes found'}
                </p>
              </div>
            )}

          </div>
        )}

        {isEditing && !showTrash && (
          <NoteEditor
            note={editingNote}
            onSave={(note) => {
              if (editingNote) {
                updateNote(editingNote.id, { ...note, updatedAt: new Date().toISOString() });
              } else {
                // Smart hidden note creation: if viewing hidden notes, auto-add @hide and set isHidden
                const isCreatingHidden = showHidden;
                const finalTags = isCreatingHidden && !note.tags?.includes('@hide')
                  ? ['@hide']
                  : (note.tags || []);

                // Ensure required fields have default values for new notes
                const newNote = {
                  ...note,
                  color: note.color || '',
                  title: note.title || 'Untitled',
                  content: note.content || '',
                  tags: finalTags,
                  isPinned: note.isPinned || false,
                  isFavorite: note.isFavorite || false,
                  isPrivate: note.isPrivate || false,
                  isHidden: isCreatingHidden || note.tags?.includes('@hide') || false
                };
                addNote(newNote);
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

        {showAIChat && (
          <AIChat onClose={() => setShowAIChat(false)} />
        )}
      </div>
      <NodesWidget />
      <DocumentationPopup isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
    </div >
  );
}

function App() {
  return (
    <SoundProvider>
      <NoteProvider>
        <NodesProvider>
          <NoteList />
        </NodesProvider>
      </NoteProvider>
    </SoundProvider>
  );
}

export default App;

