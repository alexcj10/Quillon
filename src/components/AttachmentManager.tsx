import React, { useState } from 'react';
import { FileUploader } from './FileUploader';
import { Attachment } from '../types';
import { Download, X } from 'lucide-react';
import { getAttachmentIcon, handleAttachmentDownload } from '../utils/attachmentUtils';

export function AttachmentManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>(() => {
    const saved = localStorage.getItem('standalone-attachments');
    return saved ? JSON.parse(saved) : [];
  });

  // Save attachments to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('standalone-attachments', JSON.stringify(attachments));
  }, [attachments]);

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white rounded-full p-4 shadow-lg hover:bg-blue-600 transition-colors"
      >
        Manage Files
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl shadow-xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">File Manager</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <FileUploader
            attachments={attachments}
            onAttachmentsChange={setAttachments}
          />

          <div className="mt-6 space-y-2 max-h-96 overflow-y-auto">
            {attachments.map(attachment => {
              const Icon = getAttachmentIcon(attachment.type);
              return (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {attachment.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(attachment.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAttachmentDownload(attachment)}
                      className="p-2 text-gray-500 hover:text-blue-500 dark:hover:text-blue-400"
                      title="Download file"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveAttachment(attachment.id)}
                      className="p-2 text-gray-500 hover:text-red-500 dark:hover:text-red-400"
                      title="Remove file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            
            {attachments.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                No files uploaded yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}