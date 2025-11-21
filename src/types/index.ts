export interface SharedUser {
  email: string;
  permission: 'view' | 'edit';
  sharedAt: string;
}

export interface NoteActivity {
  user: string;
  action: string;
  timestamp: string;
}

export interface ShareProtection {
  password?: string;
  expiresAt?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  color: string;
  isPinned: boolean;
  isFavorite: boolean;
  isPrivate: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  viewCount?: number;
  sharedWith?: SharedUser[];
  activityHistory?: NoteActivity[];
  lastCollaborator?: string;
  isShared?: boolean;
  shareProtection?: ShareProtection;
  shareUrl?: string;
}

// Helper function to identify file tags
export const isFileTag = (tag: string): boolean => {
  return tag.startsWith('file') && tag.length > 4 && /^file[a-zA-Z0-9\-_]+$/.test(tag);
};

// Helper function to get the display name for a file tag
export const getFileTagDisplayName = (tag: string): string => {
  return isFileTag(tag) ? tag.slice(4) : tag;
};

export interface NoteContextType {
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  moveToTrash: (id: string) => void;
  restoreFromTrash: (id: string) => void;
  permanentlyDelete: (id: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  showStarredOnly: boolean;
  setShowStarredOnly: (show: boolean) => void;
  showPrivateNotes: boolean;
  setShowPrivateNotes: (show: boolean) => void;
  showTrash: boolean;
  setShowTrash: (show: boolean) => void;
  privateSpaceExists: boolean;
  isPrivateSpaceUnlocked: boolean;
  setupPrivateSpace: (password: string) => void;
  unlockPrivateSpace: (password: string) => boolean;
  lockPrivateSpace: () => void;
  deletePrivateSpace: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  incrementViewCount: (id: string) => void;
  shareNote: (noteId: string, email: string, permission: 'view' | 'edit') => void;
  updateSharedNote: (noteId: string, updates: Partial<Note>) => void;
  removeSharedUser: (noteId: string, email: string) => void;
  getSharedUsers: (noteId: string) => SharedUser[];
  getNoteActivity: (noteId: string) => NoteActivity[];
  generateShareUrl: (id: string, protection?: ShareProtection) => string;
  removeShareUrl: (id: string) => void;
}