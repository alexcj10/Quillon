import React, { useRef } from 'react';

interface GroupTagButtonProps {
    name: string;
    onClick: () => void;
    onContextMenu: (e: React.MouseEvent, name: string) => void;
    onLongPress: (name: string, x: number, y: number) => void;
    isActive?: boolean;
    className?: string;
}

export function GroupTagButton({ name, onClick, onContextMenu, onLongPress, isActive, className = "" }: GroupTagButtonProps) {
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Coral/Amber style
    const baseClasses = "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors cursor-pointer select-none relative group";
    const activeClasses = "bg-amber-500 text-white hover:bg-amber-600";
    const normalClasses = "bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-800/40";

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        timerRef.current = setTimeout(() => {
            onLongPress(name, touch.clientX, touch.clientY);
        }, 500); // 500ms long press
    };

    const handleTouchEnd = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    return (
        <button
            onClick={onClick}
            onContextMenu={(e) => onContextMenu(e, name)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchEnd}
            className={`${baseClasses} ${isActive ? activeClasses : normalClasses} ${className}`}
            title={`Group: ${name} (Right-click for overview)`}
        >
            <span className="flex items-center justify-center h-3.5 w-3.5 text-sm leading-none flex-shrink-0">🍊</span>
            <span className="truncate max-w-[120px] sm:max-w-[160px]">
                {name}
            </span>
        </button>
    );
}
