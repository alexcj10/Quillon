import React from 'react';
import { Download, FileText, Image, Video, Music } from 'lucide-react';
import { Attachment } from '../types';

interface AttachmentListProps {
  attachments: Attachment[];
}

const getAttachmentIcon = (type: string) => {
  switch (type) {
    case 'image':
      return <Image className="h-4 w-4" />;
    case 'video':
      return <Video className="h-4 w-4" />;
    case 'audio':
      return <Music className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

export function AttachmentList({ attachments }: AttachmentListProps) {
  const handleDownload = (attachment: Attachment) => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
        >
          <div className="flex items-center gap-2 min-w-0">
            {getAttachmentIcon(attachment.type)}
            <span className="truncate text-sm text-gray-700 dark:text-gray-300">
              {attachment.name}
            </span>
            <span className="text-xs text-gray-500">
              ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          </div>
          <button
            onClick={() => handleDownload(attachment)}
            className="p-1 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
            title="Download file"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}