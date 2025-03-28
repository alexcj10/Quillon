import { Note } from '../types';

interface DownloadOptions {
  format: 'txt' | 'pdf';
  suggestedName?: string;
}

export async function downloadNote(note: Note, options: DownloadOptions) {
  const { format, suggestedName } = options;
  
  // Create default filename with timestamp
  const timestamp = new Date().getTime();
  const defaultFileName = suggestedName || `note-${timestamp}`;
  const fileName = `${defaultFileName}.${format}`;
  
  // Format content with metadata
  const content = `${note.title}\n\n${note.content}${note.tags.length ? '\n\nTags: ' + note.tags.join(', ') : ''}`;

  if (format === 'txt') {
    // For TXT format, use the native file save dialog
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    
    try {
      // Use the File System Access API if available
      if ('showSaveFilePicker' in window) {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [{
            description: 'Text file',
            accept: { 'text/plain': ['.txt'] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        // Fallback to traditional download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Failed to save file:', err);
        // Fallback to traditional download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    }
  } else {
    // For PDF format, open in a new window with print dialog
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${note.title}</title>
            <style>
              @media print {
                @page {
                  margin: 1in;
                }
              }
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                max-width: 8.5in;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                border-bottom: 1px solid #ccc;
                padding-bottom: 10px;
                margin-bottom: 20px;
              }
              h1 {
                color: #333;
                margin: 0 0 10px 0;
                font-size: 24px;
              }
              .metadata {
                color: #666;
                font-size: 0.9em;
                margin-bottom: 10px;
              }
              .content {
                white-space: pre-wrap;
                margin-bottom: 20px;
              }
              .tags {
                color: #666;
                font-size: 0.9em;
                padding-top: 10px;
                border-top: 1px solid #eee;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${note.title || 'Untitled Note'}</h1>
              <div class="metadata">
                Created: ${new Date(note.createdAt).toLocaleDateString()}
                ${note.updatedAt !== note.createdAt ? ` • Updated: ${new Date(note.updatedAt).toLocaleDateString()}` : ''}
                ${note.isPrivate ? ' • Private' : ''}
                ${note.isFavorite ? ' • Favorite' : ''}
              </div>
            </div>
            <div class="content">${note.content}</div>
            ${note.tags.length ? `<div class="tags">Tags: ${note.tags.join(', ')}</div>` : ''}
            <script>
              window.print();
              window.onafterprint = function() { window.close(); };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }
} 