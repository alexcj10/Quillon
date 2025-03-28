import React from 'react';
import { useDocuments } from '../context/DocumentContext';
import { DocumentCard } from './DocumentCard';

export function DocumentList() {
  const { documents } = useDocuments();

  const sortedDocuments = [...documents].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1;
    if (a.isStarred !== b.isStarred) return b.isStarred ? 1 : -1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {sortedDocuments.map(doc => (
        <DocumentCard key={doc.id} document={doc} />
      ))}
      {documents.length === 0 && (
        <div className="col-span-full text-center py-12 text-gray-500">
          No documents yet
        </div>
      )}
    </div>
  );
}