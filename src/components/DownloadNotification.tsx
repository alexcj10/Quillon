import { useEffect } from 'react';
import { CheckCircle, Download } from 'lucide-react';

interface DownloadNotificationProps {
  show: boolean;
  message: string;
  format: 'txt' | 'pdf';
  onHide: () => void;
}

export function DownloadNotification({ show, message, format, onHide }: DownloadNotificationProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onHide();
      }, 3000); // Hide after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  if (!show) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] animate-in slide-in-from-top-2 duration-300">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 min-w-[280px] max-w-[400px]">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Download Complete!
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
            {message} ({format.toUpperCase()})
          </p>
        </div>
        
        <div className="flex-shrink-0">
          <Download className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        </div>
      </div>
    </div>
  );
}
