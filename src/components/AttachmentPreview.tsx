import React from 'react';
import { FileText, Music } from 'lucide-react';
import { Attachment } from '../types';

interface AttachmentPreviewProps {
  attachment: Attachment;
}

export function AttachmentPreview({ attachment }: AttachmentPreviewProps) {
  const renderContent = () => {
    switch (attachment.type) {
      case 'image':
        return (
          <img
            src={attachment.url}
            alt={attachment.name}
            className="max-w-full h-auto rounded-lg"
          />
        );
      case 'video':
        return (
          <video
            src={attachment.url}
            controls
            className="max-w-full rounded-lg"
          />
        );
      case 'audio':
        return (
          <div className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <Music className="h-6 w-6 text-gray-500" />
            <audio src={attachment.url} controls className="w-full" />
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <FileText className="h-6 w-6 text-gray-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {attachment.name}
            </span>
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      {renderContent()}
      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {(attachment.size / 1024 / 1024).toFixed(2)} MB
      </div>
    </div>
  );
}