import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText } from 'lucide-react';

interface TagNoteCountPopupProps {
    tagName: string;
    displayName: string;
    count: number;
    x: number;
    y: number;
    onClose: () => void;
}

export function TagNoteCountPopup({ displayName, count, x, y, onClose }: TagNoteCountPopupProps) {
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Close on scroll to prevent floating away
    useEffect(() => {
        const handleScroll = () => onClose();
        window.addEventListener('scroll', handleScroll, true);
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [onClose]);

    return createPortal(
        <div
            ref={popupRef}
            className="fixed z-[10001] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-blue-200 dark:border-blue-900/50 min-w-[180px] overflow-hidden animate-in fade-in zoom-in duration-150 backdrop-blur-md bg-white/90 dark:bg-gray-800/90"
            style={{
                left: Math.min(x, window.innerWidth - 200),
                top: Math.min(y, window.innerHeight - 100)
            }}
        >
            <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center gap-3">
                <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                    <FileText className="h-4 w-4 text-white" />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-medium text-blue-100 uppercase tracking-wider">File Tag</span>
                    <span className="text-sm font-bold text-white truncate" title={displayName}>
                        {displayName}
                    </span>
                </div>
            </div>

            <div className="px-4 py-3 flex items-center justify-between group cursor-default">
                <div className="flex flex-col">
                    <span className="text-2xl font-black text-gray-900 dark:text-white leading-none">
                        {count}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase mt-1">
                        {count === 1 ? 'Note' : 'Notes'} Found
                    </span>
                </div>

                <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-800/40">
                    <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">
                        {Math.round((count / 100) * 100)}%
                    </span>
                </div>
            </div>

            <div className="h-1 w-full bg-gray-100 dark:bg-gray-700">
                <div
                    className="h-full bg-blue-500 transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(100, (count / 20) * 100)}%` }}
                />
            </div>
        </div>,
        document.body
    );
}
