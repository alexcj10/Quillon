import React, { createContext, useContext, useEffect, useState } from 'react';
import { Note, NoteContextType, SharedUser, NoteActivity, ShareProtection, isFileTag, getFileTagDisplayName, TagGroup } from '../types';
import { embedText } from "../utils/embed";  // add this at top
import { initializeEmbeddings } from "../utils/initializeEmbeddings";

const NoteContext = createContext<NoteContextType | undefined>(undefined);

import { DocumentDB } from '../utils/db';

const db = new DocumentDB();

export function NoteProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isNotesLoaded, setIsNotesLoaded] = useState(false);
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

  // Pinned and Starred Tags State (Persisted in localStorage)
  const [pinnedTags, setPinnedTags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pinnedTags');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [starredTags, setStarredTags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('starredTags');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Orange Tag (Group) State
  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);
  const [orangeMode, setOrangeMode] = useState<{ isActive: boolean; groupName: string | null }>({
    isActive: false,
    groupName: null
  });
  // Active filter group for the main note list (Orange Tag Filter)
  const [activeFilterGroup, setActiveFilterGroup] = useState<string | null>(null);

  // ... other state definitions ...

  // Load notes from IndexedDB on mount
  useEffect(() => {
    const loadNotes = async () => {
      try {
        // First check if we need to migrate from localStorage
        const localNotes = localStorage.getItem('notes');
        if (localNotes) {
          const parsedNotes = JSON.parse(localNotes);
          if (parsedNotes.length > 0) {
            // Check if IndexedDB is empty
            const dbNotes = await db.getAllNotes();
            if (dbNotes.length === 0) {
              await db.saveNotesBulk(parsedNotes);
              console.log('Migrated notes to IndexedDB');
              // Only clear localStorage if we actually migrated data to an empty DB
              localStorage.removeItem('notes');
            } else {
              console.log('DB already populated. Skipping migration to preserve DB integrity, but keeping LocalStorage backup just in case.');
            }
          }
        }

        const savedNotes = await db.getAllNotes();
        setNotes(savedNotes);
      } catch (error) {
        console.error('Failed to load notes:', error);
      } finally {
        setIsNotesLoaded(true);
      }
    };

    const loadTagGroups = async () => {
      try {
        const savedGroups = await db.getAllTagGroups();
        setTagGroups(savedGroups);
      } catch (error) {
        console.error('Failed to load tag groups:', error);
      }
    };

    loadNotes();
    loadTagGroups();
  }, []);

  // Save changes to IndexedDB
  useEffect(() => {
    if (!isNotesLoaded) return;

    // We save individual note updates in the action functions for better performance
    // This effect acts as a backup/sync for bulk operations if needed, 
    // but for now we'll rely on specific operations to keep DB in sync
    // to avoid writing the entire array on every small change
  }, [notes, isNotesLoaded]);

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

  // Persist Pinned/Starred Tags
  useEffect(() => {
    localStorage.setItem('pinnedTags', JSON.stringify(pinnedTags));
  }, [pinnedTags]);

  useEffect(() => {
    localStorage.setItem('starredTags', JSON.stringify(starredTags));
  }, [starredTags]);

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
      isHidden: note.tags.includes('@hide'),
      isPinnedInFavorite: note.isPinnedInFavorite || false,
      pinnedAt: note.isPinned || note.isPinnedInFavorite ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      embedding: embedText(`${note.title} ${note.content} ${tagText}`)
    };
    db.saveNote(newNote); // Save to IndexedDB
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

        // Auto-update isHidden only if tags are explicitly being changed
        if (updates.tags !== undefined) {
          updatedNote.isHidden = updates.tags.includes('@hide');
        }

        // Data Consistency: Un-pin from Starred view if un-favorited
        if (updates.isFavorite === false) {
          updatedNote.isPinnedInFavorite = false;
        }

        // Handle pinnedAt timestamp for LIFO sorting
        const isTurningOnPin = (updates.isPinned === true && !note.isPinned);
        const isTurningOnFavPin = (updates.isPinnedInFavorite === true && !note.isPinnedInFavorite);

        if (isTurningOnPin || isTurningOnFavPin) {
          updatedNote.pinnedAt = new Date().toISOString();
        }

        const currentlyPinned = updates.isPinned !== undefined ? updates.isPinned : note.isPinned;
        const currentlyFavPinned = updates.isPinnedInFavorite !== undefined ? updates.isPinnedInFavorite : note.isPinnedInFavorite;

        if (!currentlyPinned && !currentlyFavPinned) {
          updatedNote.pinnedAt = undefined;
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

        db.saveNote(updatedNote); // Save to IndexedDB
        return updatedNote;
      }
      return note;
    }));
  };

  const moveToTrash = (id: string) => {
    setNotes(prev => prev.map(note => {
      if (note.id === id) {
        const updatedNote = {
          ...note,
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          isPinned: false,
          isPinnedInFavorite: false,
        };
        db.saveNote(updatedNote);
        return updatedNote;
      }
      return note;
    }));
  };

  const restoreFromTrash = (id: string) => {
    setNotes(prev => prev.map(note => {
      if (note.id === id) {
        const updatedNote = {
          ...note,
          isDeleted: false,
          deletedAt: undefined,
        };
        db.saveNote(updatedNote);
        return updatedNote;
      }
      return note;
    }));
  };

  const permanentlyDelete = async (id: string) => {
    await db.deleteNote(id);
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const deleteNote = moveToTrash;

  const hideNote = (id: string) => {
    setNotes(prev => prev.map(note => {
      if (note.id === id) {
        const updatedNote = {
          ...note,
          isHidden: true,
          tags: ['@hide'], // Set only @hide tag
          updatedAt: new Date().toISOString(),
        };
        db.saveNote(updatedNote);
        return updatedNote;
      }
      return note;
    }));
  };

  const unhideNote = (id: string) => {
    setNotes(prev => prev.map(note => {
      if (note.id === id) {
        const updatedNote = {
          ...note,
          isHidden: false,
          tags: note.tags.filter(tag => tag !== '@hide'), // Remove @hide tag
          updatedAt: new Date().toISOString(),
        };
        db.saveNote(updatedNote);
        return updatedNote;
      }
      return note;
    }));
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
    setNotes(prev => prev.map(note => {
      if (note.id === id) {
        const updatedNote = {
          ...note,
          viewCount: (note.viewCount || 0) + 1,
        };
        db.saveNote(updatedNote);
        return updatedNote;
      }
      return note;
    }));
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
        const updatedTags = note.tags.map(tag => tag === oldTagName ? newTagName : tag);

        // Update embedding
        const tagStr = updatedTags.map(tg => isFileTag(tg) ? `${tg} ${getFileTagDisplayName(tg)}` : tg).join(" ");
        const embedding = embedText(`${note.title} ${note.content} ${tagStr}`);

        const updatedNote = {
          ...note,
          tags: updatedTags,
          updatedAt: new Date().toISOString(),
          embedding
        };
        db.saveNote(updatedNote);
        return updatedNote;
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
      setNotes(prev => {
        const notesToDelete = prev.filter(note => note.tags.includes(tagName));
        notesToDelete.forEach(note => db.deleteNote(note.id));
        return prev.filter(note => !note.tags.includes(tagName));
      });
    } else {
      // Move ALL notes with this tag to trash (keeping the tag visible in trash)
      setNotes(prev => prev.map(note => {
        if (note.tags.includes(tagName) && !note.isDeleted) {
          const updatedNote = {
            ...note,
            // Keep ALL tags including the deleted one so they're visible in trash
            isDeleted: true,
            deletedAt: new Date().toISOString(),
            isPinned: false,
            isFavorite: false,
          };
          db.saveNote(updatedNote);
          return updatedNote;
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
    setNotes(prev => prev.map(note => {
      if (idsToRestore.includes(note.id)) {
        const updatedNote = {
          ...note,
          isDeleted: false,
          deletedAt: undefined,
        };
        db.saveNote(updatedNote);
        return updatedNote;
      }
      return note;
    }));
    clearSelection();
  };

  const bulkDeleteForever = () => {
    const idsToDelete = Array.from(selectedNoteIds);
    idsToDelete.forEach(id => db.deleteNote(id));
    setNotes(prev => prev.filter(note => !idsToDelete.includes(note.id)));
    clearSelection();
  };

  const bulkMoveToTrash = () => {
    const idsToMove = Array.from(selectedNoteIds);
    setNotes(prev => prev.map(note => {
      if (idsToMove.includes(note.id)) {
        const updatedNote = {
          ...note,
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          isPinned: false,
          isPinnedInFavorite: false,
        };
        db.saveNote(updatedNote);
        return updatedNote;
      }
      return note;
    }));
    clearSelection();
  };

  const togglePinTag = (tag: string) => {
    setPinnedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [tag, ...prev]
    );
  };

  const toggleStarTag = (tag: string) => {
    setStarredTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [tag, ...prev]
    );
  };

  // Orange Tag (Group) Functions
  const createTagGroup = (name: string): { success: boolean; error?: string } => {
    // Check if group already exists
    if (tagGroups.some(g => g.name === name)) {
      return { success: false, error: `Group "${name}" already exists.` };
    }

    // Check if name conflicts with existing tags (optional, but good practice)
    // Actually, group names are separate from tag names in our design, 
    // but to avoid confusion maybe check? User didn't specify. 
    // Let's allow same name for now as they are distinct entities (TagGroup vs Tag string).

    const newGroup: TagGroup = {
      id: crypto.randomUUID(),
      name,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTagGroups(prev => [...prev, newGroup]);
    db.saveTagGroup(newGroup);
    return { success: true };
  };

  const deleteTagGroup = (name: string): { success: boolean; error?: string } => {
    const group = tagGroups.find(g => g.name === name);
    if (!group) {
      return { success: false, error: `Group "${name}" not found.` };
    }

    setTagGroups(prev => prev.filter(g => g.name !== name));
    db.deleteTagGroup(group.id);

    // If we were in this group, exit
    if (orangeMode.isActive && orangeMode.groupName === name) {
      exitGroupView();
    }

    return { success: true };
  };

  const addTagToGroup = (groupName: string, tagName: string): { success: boolean; error?: string } => {
    const group = tagGroups.find(g => g.name === groupName);
    if (!group) return { success: false, error: `Group "${groupName}" not found.` };

    if (group.tags.includes(tagName)) {
      return { success: false, error: `Tag "${tagName}" is already in group "${groupName}".` };
    }

    // Check if tag is already in another group? 
    // User said "if user have multiple grey tags which sometimes could of same topic... put it in main ui and tag which is grey tag".
    // Usually one tag belongs to one group to avoid confusion, but technically it could be in multiple.
    // However, for "management" and hiding from main view, it implies exclusive membership.
    // Let's enforce exclusive membership for now to keep things clean.
    const existingGroup = tagGroups.find(g => g.tags.includes(tagName));
    if (existingGroup) {
      return { success: false, error: `Tag "${tagName}" is already in group "${existingGroup.name}".` };
    }

    const updatedGroup = {
      ...group,
      tags: [...group.tags, tagName],
      updatedAt: new Date().toISOString()
    };

    setTagGroups(prev => prev.map(g => g.name === groupName ? updatedGroup : g));
    db.saveTagGroup(updatedGroup);
    return { success: true };
  };

  const removeTagFromGroup = (groupName: string, tagName: string) => {
    const group = tagGroups.find(g => g.name === groupName);
    if (!group) return;

    const updatedGroup = {
      ...group,
      tags: group.tags.filter(t => t !== tagName),
      updatedAt: new Date().toISOString()
    };

    setTagGroups(prev => prev.map(g => g.name === groupName ? updatedGroup : g));
    db.saveTagGroup(updatedGroup);
  };

  const enterGroupView = (groupName: string) => {
    if (tagGroups.some(g => g.name === groupName)) {
      setOrangeMode({ isActive: true, groupName });
    }
  };

  const exitGroupView = () => {
    setOrangeMode({ isActive: false, groupName: null });
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
      isNotesLoaded,
      pinnedTags,
      starredTags,
      togglePinTag,
      toggleStarTag,
      tagGroups,
      createTagGroup,
      deleteTagGroup,
      addTagToGroup,
      removeTagFromGroup,
      enterGroupView,
      exitGroupView,
      orangeMode,
      activeFilterGroup,
      setActiveFilterGroup,
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

