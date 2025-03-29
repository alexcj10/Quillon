import React, { createContext, useContext, useEffect, useState } from 'react';
import { Note, NoteContextType, SharedUser, NoteActivity, ShareProtection } from '../types';

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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes));
  }, [notes]);

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
    const newNote: Note = {
      ...note,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes(prev => [...prev, newNote]);
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(note => 
      note.id === id 
        ? {
            ...note,
            ...updates,
            updatedAt: new Date().toISOString(),
          }
        : note
    ));
  };

  const moveToTrash = (id: string) => {
    setNotes(prev => prev.map(note =>
      note.id === id
        ? {
            ...note,
            isDeleted: true,
            deletedAt: new Date().toISOString(),
            isPinned: false,
            isFavorite: false,
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

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

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