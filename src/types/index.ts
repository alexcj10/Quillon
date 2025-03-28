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
}

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
}