export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  isPinned: boolean;
  isStarred: boolean;
  createdAt: string;
  updatedAt: string;
}