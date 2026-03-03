import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TagNoteCountPopupProps {
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
        document.addEventListener('mousedown', handleClickOutside, true);
        return () => document.removeEventListener('mousedown', handleClickOutside, true);
    }, [onClose]);

    useEffect(() => {
        const handleScroll = () => onClose();
        window.addEventListener('scroll', handleScroll, true);
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [onClose]);

    // Very compact positioning
    const safeX = Math.max(8, Math.min(x, window.innerWidth - 180));
    const safeY = Math.max(8, Math.min(y, window.innerHeight - 60));

    return createPortal(
        <AnimatePresence>
            <motion.div
                ref={popupRef}
                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="fixed z-[10001] bg-gray-900/95 dark:bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-white/10 dark:border-black/5 px-4 py-2 flex items-center gap-3 select-none pointer-events-none"
                style={{
                    left: safeX,
                    top: safeY
                }}
            >
                <div className="flex items-center gap-2 border-r border-white/20 dark:border-black/10 pr-3">
                    <FileText className="h-3.5 w-3.5 text-blue-400 dark:text-blue-600" />
                    <span className="text-xs font-bold text-white dark:text-gray-900 tabular-nums">
                        {count} {count === 1 ? 'Note' : 'Notes'}
                    </span>
                </div>
                <span className="text-xs font-medium text-gray-300 dark:text-gray-500 truncate max-w-[120px]">
                    {displayName}
                </span>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}
