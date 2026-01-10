import { Document } from '../types/document';
import { StorageError } from './errors.ts';
import { DocumentDB } from './db';

const METADATA_KEY = 'documents-metadata';

export class DocumentStorage {
  private db: DocumentDB;

  constructor() {
    this.db = new DocumentDB();
  }

  getTotalSize(documents: Document[]): number {
    return documents.reduce((total, doc) => total + doc.size, 0);
  }

  validateFileSize(_size: number): void {
    // No limit
  }

  validateTotalSize(_currentSize: number, _newSize: number): void {
    // No limit
  }

  async saveDocuments(documents: Document[]): Promise<void> {
    try {
      // Save metadata to IndexedDB
      const metadata = documents.map(({ url, ...rest }) => rest);
      await this.db.saveMetadataBulk(metadata);

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
      // Migration Logic: Check localStorage first
      const localMetadata = localStorage.getItem(METADATA_KEY);
      if (localMetadata) {
        try {
          const parsedMetadata = JSON.parse(localMetadata);
          if (Array.isArray(parsedMetadata) && parsedMetadata.length > 0) {
            // Check if DB is empty to avoid overwriting newer data
            const dbMetadata = await this.db.getAllMetadata();
            if (dbMetadata.length === 0) {
              await this.db.saveMetadataBulk(parsedMetadata);
              console.log('Migrated document metadata to IndexedDB');
              localStorage.removeItem(METADATA_KEY);
            }
          }
        } catch (e) {
          console.error('Failed to parse local metadata during migration', e);
        }
      }

      // Load metadata from IndexedDB
      const docs = await this.db.getAllMetadata();

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
      await this.db.delete(id); // Delete content
      await this.db.deleteMetadata(id); // Delete metadata
    } catch (error) {
      throw new StorageError('Failed to delete document');
    }
  }
}


