import React from 'react';
import { Download, Pin, Star, Trash2, FileText } from 'lucide-react';
import { Document } from '../types/document';
import { useDocuments } from '../context/DocumentContext';

interface DocumentCardProps {
  document: Document;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const { updateDocument, deleteDocument } = useDocuments();
  
  const formattedDate = new Date(document.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = document.url;
    link.download = document.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h3 className="font-medium text-gray-800 dark:text-gray-200 truncate">
            {document.name}
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => updateDocument(document.id, { isPinned: !document.isPinned })}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Pin className={`h-4 w-4 ${document.isPinned ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={() => updateDocument(document.id, { isStarred: !document.isStarred })}
            className="text-gray-500 hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-400"
          >
            <Star className={`h-4 w-4 ${document.isStarred ? 'fill-current text-yellow-500' : ''}`} />
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        {(document.size / 1024 / 1024).toFixed(2)} MB
      </div>

      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
        <span>{formattedDate}</span>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="p-1 hover:text-blue-500 dark:hover:text-blue-400"
            title="Download file"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => deleteDocument(document.id)}
            className="p-1 hover:text-red-500 dark:hover:text-red-400"
            title="Delete file"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}