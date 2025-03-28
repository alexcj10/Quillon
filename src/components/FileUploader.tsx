import React, { useRef, useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { useDocuments } from '../context/DocumentContext';
import { StorageError } from '../utils/storage';

export function FileUploader() {
  const { addDocument, error } = useDocuments();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploading(true);
    setLocalError(null);
    
    try {
      for (const file of files) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        await addDocument({
          name: file.name,
          type: file.type,
          size: file.size,
          url: base64,
          isPinned: false,
          isStarred: false,
        });
      }
    } catch (error) {
      if (error instanceof StorageError) {
        setLocalError(error.message);
      } else {
        setLocalError('Failed to upload file');
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          uploading
            ? 'border-gray-400 cursor-not-allowed'
            : 'border-gray-300 dark:border-gray-700 cursor-pointer hover:border-blue-500 dark:hover:border-blue-400'
        }`}
      >
        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          PDF, DOC, DOCX, TXT, and other document files (max 5MB)
        </p>
      </div>

      {(error || localError) && (
        <div className="mt-3 flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle className="h-4 w-4" />
          <p>{error || localError}</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.rtf,.csv,.xls,.xlsx"
        disabled={uploading}
      />
    </div>
  );
}