import { Document } from '../types/document';
import { StorageError } from './errors.ts';
import { DocumentDB } from './db';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB
const METADATA_KEY = 'documents-metadata';

export class DocumentStorage {
  private db: DocumentDB;

  constructor() {
    this.db = new DocumentDB();
  }

  getTotalSize(documents: Document[]): number {
    return documents.reduce((total, doc) => total + doc.size, 0);
  }

  validateFileSize(size: number): void {
    if (size > MAX_FILE_SIZE) {
      throw new StorageError(`File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }
  }

  validateTotalSize(currentSize: number, newSize: number): void {
    if (currentSize + newSize > MAX_TOTAL_SIZE) {
      throw new StorageError(`Total storage would exceed maximum limit of ${MAX_TOTAL_SIZE / 1024 / 1024}MB`);
    }
  }

  async saveDocuments(documents: Document[]): Promise<void> {
    try {
      // Save metadata to localStorage
      const metadata = documents.map(({ url, ...rest }) => rest);
      const metadataString = JSON.stringify(metadata);
      
      try {
        localStorage.setItem(METADATA_KEY, metadataString);
      } catch (e) {
        if (e.name === 'QuotaExceededError') {
          throw new StorageError('Storage quota exceeded. Please delete some documents to free up space.');
        }
        throw e;
      }
      
      // Save files to IndexedDB
      await Promise.all(
        documents.map(doc => this.db.put(doc.id, doc.url))
      );
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError('Failed to save documents');
    }
  }

  async loadDocuments(): Promise<Document[]> {
    try {
      const metadata = localStorage.getItem(METADATA_KEY);
      if (!metadata) return [];

      const docs = JSON.parse(metadata);
      const fullDocs = await Promise.all(
        docs.map(async (doc: Omit<Document, 'url'>) => {
          try {
            const url = await this.db.get(doc.id);
            return { ...doc, url };
          } catch (error) {
            console.warn(`Failed to load document ${doc.id}, skipping`);
            return null;
          }
        })
      );

      return fullDocs.filter((doc): doc is Document => doc !== null);
    } catch (error) {
      console.error('Failed to load documents:', error);
      return [];
    }
  }

  async deleteDocument(id: string): Promise<void> {
    try {
      await this.db.delete(id);
      
      // Update metadata
      const metadata = localStorage.getItem(METADATA_KEY);
      if (metadata) {
        const docs = JSON.parse(metadata);
        const updatedDocs = docs.filter((doc: Document) => doc.id !== id);
        localStorage.setItem(METADATA_KEY, JSON.stringify(updatedDocs));
      }
    } catch (error) {
      throw new StorageError('Failed to delete document');
    }
  }
}