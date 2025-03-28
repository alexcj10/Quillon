import React, { createContext, useContext, useState, useEffect } from 'react';
import { Document } from '../types/document';
import { DocumentStorage } from '../utils/storage';
import { StorageError } from '../utils/errors';

interface DocumentContextType {
  documents: Document[];
  addDocument: (doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  updateDocument: (id: string, updates: Partial<Document>) => Promise<void>;
  error: string | null;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);
const storage = new DocumentStorage();

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    storage.loadDocuments().then(setDocuments);
  }, []);

  useEffect(() => {
    if (documents.length > 0) {
      storage.saveDocuments(documents).catch(error => {
        if (error instanceof StorageError) {
          setError(error.message);
        }
      });
    }
  }, [documents]);

  const addDocument = async (doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      storage.validateFileSize(doc.size);
      storage.validateTotalSize(storage.getTotalSize(documents), doc.size);

      const newDoc: Document = {
        ...doc,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setDocuments(prev => [newDoc, ...prev]);
      setError(null);
    } catch (error) {
      if (error instanceof StorageError) {
        setError(error.message);
        throw error;
      }
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      await storage.deleteDocument(id);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      setError(null);
    } catch (error) {
      setError('Failed to delete document');
    }
  };

  const updateDocument = async (id: string, updates: Partial<Document>) => {
    setDocuments(prev => prev.map(doc =>
      doc.id === id
        ? { ...doc, ...updates, updatedAt: new Date().toISOString() }
        : doc
    ));
  };

  return (
    <DocumentContext.Provider value={{
      documents,
      addDocument,
      deleteDocument,
      updateDocument,
      error,
    }}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocuments() {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
}