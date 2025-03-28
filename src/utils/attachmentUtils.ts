import { Attachment } from '../types';
import { FileText, Image, Video, Music } from 'lucide-react';

export const getAttachmentIcon = (type: string) => {
  switch (type) {
    case 'image':
      return Image;
    case 'video':
      return Video;
    case 'audio':
      return Music;
    default:
      return FileText;
  }
};

export const handleAttachmentDownload = (attachment: Attachment) => {
  const link = document.createElement('a');
  link.href = attachment.url;
  link.download = attachment.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getAttachmentType = (mimeType: string): Attachment['type'] => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
};