import React, { createContext, useContext, useEffect, useState } from 'react';
import { Note, NoteContextType, SharedUser, NoteActivity, ShareProtection, isFileTag, getFileTagDisplayName } from '../types';
import { embedText } from "../utils/embed";  // add this at top
import { initializeEmbeddings } from "../utils/initializeEmbeddings";

const NoteContext = createContext<NoteContextType | undefined>(undefined);

export function NoteProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>(() => {
    const savedNotes = localStorage.getItem('notes');
    return savedNotes ? JSON.parse(savedNotes) : [];
  });
  const [privateSpacePassword, setPrivateSpacePassword] = useState<string>(() => {
    const saved = localStorage.getItem('privateSpacePassword');
    return saved || '';
  });
  const [isPrivateSpaceUnlocked, setIsPrivateSpaceUnlocked] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [showPrivateNotes, setShowPrivateNotes] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Selection state for bulk recovery
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    const { changed, notes: updatedNotes } = initializeEmbeddings(notes);
    if (changed) {
      setNotes(updatedNotes);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('privateSpacePassword', privateSpacePassword);
  }, [privateSpacePassword]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Auto-delete notes that have been in trash for 30 days
  useEffect(() => {
    const checkTrash = () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      setNotes(prev => prev.filter(note => {
        if (note.isDeleted && note.deletedAt) {
          const deleteDate = new Date(note.deletedAt);
          return deleteDate > thirtyDaysAgo;
        }
        return true;
      }));
    };

    // Check on mount and every hour
    checkTrash();
    const interval = setInterval(checkTrash, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, []);

  const addNote = (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Generate text for embedding including decoded file tags
    const tagText = note.tags.map(t => isFileTag(t) ? `${t} ${getFileTagDisplayName(t)}` : t).join(" ");

    const newNote: Note = {
      ...note,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      embedding: embedText(`${note.title} ${note.content} ${tagText}`)
    };
    setNotes(prev => [...prev, newNote]);
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(note => {
      if (note.id === id) {
        // Validate @hide tag restrictions
        if (updates.tags) {
          const hasHideTag = updates.tags.includes('@hide');
          const otherTags = updates.tags.filter(tag => tag !== '@hide');

          // If trying to add @hide with other tags, throw error
          if (hasHideTag && otherTags.length > 0) {
            throw new Error('HIDE_TAG_ERROR: Remove all tags before hiding this note');
          }

          // If trying to add other tags when @hide exists, throw error
          if (!hasHideTag && note.tags.includes('@hide') && otherTags.length > 0) {
            throw new Error('HIDE_TAG_ERROR: Remove @hide tag before adding other tags');
          }
        }

        const updatedNote = {
          ...note,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        // Auto-hide note if @hide tag is added
        if (updates.tags?.includes('@hide')) {
          updatedNote.isHidden = true;
        }
        // Auto-unhide note if @hide tag is removed
        if (note.tags.includes('@hide') && !updates.tags?.includes('@hide')) {
          updatedNote.isHidden = false;
        }

        if (
          updates.title !== undefined ||
          updates.content !== undefined ||
          updates.tags !== undefined
        ) {
          const t = updatedNote.title;
          const c = updatedNote.content;
          const tagStr = updatedNote.tags.map(tg => isFileTag(tg) ? `${tg} ${getFileTagDisplayName(tg)}` : tg).join(" ");
          updatedNote.embedding = embedText(`${t} ${c} ${tagStr}`);
        }

        return updatedNote;
      }
      return note;
    }));
  };

  const moveToTrash = (id: string) => {
    setNotes(prev => prev.map(note =>
      note.id === id
        ? {
          ...note,
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          isPinned: false,
        }
        : note
    ));
  };

  const restoreFromTrash = (id: string) => {
    setNotes(prev => prev.map(note =>
      note.id === id
        ? {
          ...note,
          isDeleted: false,
          deletedAt: undefined,
        }
        : note
    ));
  };

  const permanentlyDelete = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const deleteNote = moveToTrash;

  const hideNote = (id: string) => {
    setNotes(prev => prev.map(note =>
      note.id === id
        ? {
          ...note,
          isHidden: true,
          tags: ['@hide'], // Set only @hide tag
          updatedAt: new Date().toISOString(),
        }
        : note
    ));
  };

  const unhideNote = (id: string) => {
    setNotes(prev => prev.map(note =>
      note.id === id
        ? {
          ...note,
          isHidden: false,
          tags: note.tags.filter(tag => tag !== '@hide'), // Remove @hide tag
          updatedAt: new Date().toISOString(),
        }
        : note
    ));
  };

  const setupPrivateSpace = (password: string) => {
    setPrivateSpacePassword(password);
    setIsPrivateSpaceUnlocked(true);
  };

  const unlockPrivateSpace = (password: string): boolean => {
    if (password === privateSpacePassword) {
      setIsPrivateSpaceUnlocked(true);
      setShowPrivateNotes(true);
      return true;
    }
    return false;
  };

  const lockPrivateSpace = () => {
    setIsPrivateSpaceUnlocked(false);
    setShowPrivateNotes(false);
  };

  const deletePrivateSpace = () => {
    setNotes(prev => prev.filter(note => !note.isPrivate));
    setPrivateSpacePassword('');
    setIsPrivateSpaceUnlocked(false);
    setShowPrivateNotes(false);
  };

  const toggleDarkMode = () => setIsDarkMode((prev: boolean) => !prev);

  const incrementViewCount = (id: string) => {
    setNotes(prev => prev.map(note =>
      note.id === id
        ? {
          ...note,
          viewCount: (note.viewCount || 0) + 1,
        }
        : note
    ));
  };

  const shareNote = (noteId: string, email: string, permission: 'view' | 'edit') => {
    setNotes(prev => prev.map(note => {
      if (note.id === noteId) {
        const newSharedUser: SharedUser = {
          email,
          permission,
          sharedAt: new Date().toISOString(),
        };

        const newActivity: NoteActivity = {
          user: 'You',
          action: `shared with ${email} (${permission} access)`,
          timestamp: new Date().toISOString(),
        };

        return {
          ...note,
          isShared: true,
          sharedWith: [...(note.sharedWith || []), newSharedUser],
          activityHistory: [...(note.activityHistory || []), newActivity],
          updatedAt: new Date().toISOString(),
        };
      }
      return note;
    }));
  };

  const updateSharedNote = (noteId: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(note => {
      if (note.id === noteId) {
        const newActivity: NoteActivity = {
          user: updates.lastCollaborator || 'Unknown',
          action: 'updated the note',
          timestamp: new Date().toISOString(),
        };

        return {
          ...note,
          ...updates,
          activityHistory: [...(note.activityHistory || []), newActivity],
          updatedAt: new Date().toISOString(),
        };
      }
      return note;
    }));
  };

  const removeSharedUser = (noteId: string, email: string) => {
    setNotes(prev => prev.map(note => {
      if (note.id === noteId) {
        const newSharedWith = (note.sharedWith || []).filter(user => user.email !== email);

        const newActivity: NoteActivity = {
          user: 'You',
          action: `removed ${email}'s access`,
          timestamp: new Date().toISOString(),
        };

        return {
          ...note,
          sharedWith: newSharedWith,
          isShared: newSharedWith.length > 0,
          activityHistory: [...(note.activityHistory || []), newActivity],
          updatedAt: new Date().toISOString(),
        };
      }
      return note;
    }));
  };

  const getSharedUsers = (noteId: string): SharedUser[] => {
    const note = notes.find(n => n.id === noteId);
    return note?.sharedWith || [];
  };

  const getNoteActivity = (noteId: string): NoteActivity[] => {
    const note = notes.find(n => n.id === noteId);
    return note?.activityHistory || [];
  };

  const generateShareUrl = (id: string, protection?: ShareProtection): string => {
    const note = notes.find(n => n.id === id);
    if (!note) return '';

    // Generate a unique share token
    const shareToken = Math.random().toString(36).substring(2) + Date.now().toString(36);

    // Create the share URL
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/shared/${shareToken}`;

    // Update the note with share protection and URL
    updateNote(id, {
      shareUrl,
      shareProtection: protection,
    });

    return shareUrl;
  };

  const removeShareUrl = (id: string) => {
    updateNote(id, {
      shareUrl: undefined,
      shareProtection: undefined,
    });
  };

  const checkShareProtection = (id: string, password?: string): boolean => {
    const note = notes.find(n => n.id === id);
    if (!note || !note.shareProtection) return true;

    // Check expiry
    if (note.shareProtection.expiresAt) {
      const expiryDate = new Date(note.shareProtection.expiresAt);
      if (expiryDate < new Date()) {
        removeShareUrl(id);
        return false;
      }
    }

    // Check password
    if (note.shareProtection.password && password !== note.shareProtection.password) {
      return false;
    }

    return true;
  };
  const renameTag = (oldTagName: string, newTagName: string): { success: boolean; error?: string } => {
    // Check if the old tag exists in any note
    const tagExists = notes.some(note => note.tags.includes(oldTagName));

    if (!tagExists) {
      return {
        success: false,
        error: `The tag "${oldTagName}" does not exist.`
      };
    }

    // Check if the new tag name already exists in any note
    const newTagExists = notes.some(note => note.tags.includes(newTagName));

    if (newTagExists) {
      return {
        success: false,
        error: `The tag name "${newTagName}" already exists. Please choose a different name.`
      };
    }

    // Rename the tag in all notes
    setNotes(prev => prev.map(note => {
      if (note.tags.includes(oldTagName)) {
        return {
          ...note,
          tags: note.tags.map(tag => tag === oldTagName ? newTagName : tag),
          updatedAt: new Date().toISOString(),
        };
      }
      return note;
    }));

    return { success: true };
  };

  const deleteTag = (tagName: string, permanentDelete: boolean = false): { success: boolean; error?: string } => {
    // Check if the tag exists in any note
    const tagExists = notes.some(note => note.tags.includes(tagName));

    if (!tagExists) {
      return {
        success: false,
        error: `The tag "${tagName}" does not exist.`
      };
    }

    if (permanentDelete) {
      // PERMANENTLY DELETE all notes with this tag (from trash)
      setNotes(prev => prev.filter(note => !note.tags.includes(tagName)));
    } else {
      // Move ALL notes with this tag to trash (keeping the tag visible in trash)
      setNotes(prev => prev.map(note => {
        if (note.tags.includes(tagName) && !note.isDeleted) {
          return {
            ...note,
            // Keep ALL tags including the deleted one so they're visible in trash
            isDeleted: true,
            deletedAt: new Date().toISOString(),
            isPinned: false,
            isFavorite: false,
          };
        }
        return note;
      }));
    }

    return { success: true };
  };

  // Selection mode functions for bulk recovery
  const toggleNoteSelection = (noteId: string) => {
    setSelectedNoteIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const selectAllNotes = (noteIds?: string[]) => {
    if (noteIds) {
      // Select only the provided note IDs (filtered notes)
      setSelectedNoteIds(new Set(noteIds));
    } else {
      // Select all trash notes (fallback)
      const trashNotes = notes.filter(note => note.isDeleted);
      setSelectedNoteIds(new Set(trashNotes.map(note => note.id)));
    }
  };

  const clearSelection = () => {
    setSelectedNoteIds(new Set());
    setSelectionMode(false);
  };

  const bulkRestoreFromTrash = () => {
    const idsToRestore = Array.from(selectedNoteIds);
    setNotes(prev => prev.map(note =>
      idsToRestore.includes(note.id)
        ? {
          ...note,
          isDeleted: false,
          deletedAt: undefined,
        }
        : note
    ));
    clearSelection();
  };

  const bulkDeleteForever = () => {
    const idsToDelete = Array.from(selectedNoteIds);
    setNotes(prev => prev.filter(note => !idsToDelete.includes(note.id)));
    clearSelection();
  };

  const bulkMoveToTrash = () => {
    const idsToMove = Array.from(selectedNoteIds);
    setNotes(prev => prev.map(note =>
      idsToMove.includes(note.id)
        ? {
          ...note,
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          isPinned: false,
        }
        : note
    ));
    clearSelection();
  };

  return (
    <NoteContext.Provider value={{
      notes,
      addNote,
      updateNote,
      deleteNote,
      moveToTrash,
      restoreFromTrash,
      permanentlyDelete,
      searchTerm,
      setSearchTerm,
      selectedTags,
      setSelectedTags,
      showStarredOnly,
      setShowStarredOnly,
      showPrivateNotes,
      setShowPrivateNotes,
      showTrash,
      setShowTrash,
      showHidden,
      setShowHidden,
      hideNote,
      unhideNote,
      privateSpaceExists: !!privateSpacePassword,
      isPrivateSpaceUnlocked,
      setupPrivateSpace,
      unlockPrivateSpace,
      lockPrivateSpace,
      deletePrivateSpace,
      isDarkMode,
      toggleDarkMode,
      incrementViewCount,
      generateShareUrl,
      removeShareUrl,
      checkShareProtection,
      shareNote,
      updateSharedNote,
      removeSharedUser,
      getSharedUsers,
      getNoteActivity,
      renameTag,
      deleteTag,
      selectionMode,
      setSelectionMode,
      selectedNoteIds,
      toggleNoteSelection,
      selectAllNotes,
      clearSelection,
      bulkRestoreFromTrash,
      bulkDeleteForever,
      bulkMoveToTrash,
    }}>
      {children}
    </NoteContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NoteContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NoteProvider');
  }
  return context;
}

