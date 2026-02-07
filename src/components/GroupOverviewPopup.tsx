import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';

interface GroupOverviewPopupProps {
    groupName: string;
    tags: string[];
    selectedTags: string[];
    x: number;
    y: number;
    onClose: () => void;
    onTagSelect: (tag: string) => void;
}

export function GroupOverviewPopup({ groupName, tags, selectedTags, x, y, onClose, onTagSelect }: GroupOverviewPopupProps) {
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

    return createPortal(
        <div
            ref={popupRef}
            className="fixed z-[10000] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 min-w-[220px] max-w-[280px] max-h-[300px] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-100"
            style={{
                left: Math.min(x, window.innerWidth - 300),
                top: Math.min(y, window.innerHeight - 320)
            }}
        >
            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-amber-50/50 dark:bg-amber-900/20 flex items-center justify-between shrink-0">
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-1 truncate mr-2">
                    <span>🍊</span> {groupName}
                </span>
                <span className="text-[10px] text-gray-400 shrink-0">{tags.length} tags</span>
            </div>
            <div className="overflow-y-auto custom-tag-scrollbar flex-1 p-2 space-y-1">
                {tags.length === 0 ? (
                    <div className="text-[10px] text-gray-400 italic text-center py-4">No tags in group</div>
                ) : (
                    tags.map(tag => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                            <button
                                key={tag}
                                onClick={() => {
                                    onTagSelect(tag);
                                    // Removed onClose() to allow multi-select
                                }}
                                className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-between group ${isSelected
                                    ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${isSelected
                                        ? 'bg-gray-400 dark:bg-gray-500'
                                        : 'bg-gray-400 group-hover:bg-amber-500'}`} />
                                    <span className="truncate" title={tag}>{tag}</span>
                                </div>
                                {isSelected && <Check className="h-3 w-3 shrink-0 ml-2" />}
                            </button>
                        );
                    })
                )}
            </div>
            <style>{`
                .custom-tag-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-tag-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-tag-scrollbar::-webkit-scrollbar-thumb {
                    background-image: linear-gradient(to bottom, rgba(156, 163, 175, 0.1), rgba(156, 163, 175, 0.2));
                    border-radius: 10px;
                }
            `}</style>
        </div>,
        document.body
    );
}
