import { useEffect, useRef } from 'react';

interface TagEditPopupProps {
    isVisible: boolean;
    onSelect: (tagType: 'blue' | 'green' | 'grey') => void;
    inputRef: React.RefObject<HTMLInputElement>;
}

export function TagEditPopup({ isVisible, onSelect, inputRef }: TagEditPopupProps) {
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                popupRef.current &&
                !popupRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                // Click outside - popup will be hidden by parent component
            }
        };

        if (isVisible) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isVisible, inputRef]);

    if (!isVisible) return null;

    const tagTypes = [
        {
            type: 'blue' as const,
            label: 'blue',
            description: 'File tags',
            icon: '📁',
            colorClass: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-800/40'
        },
        {
            type: 'green' as const,
            label: 'green',
            description: 'Content tags',
            icon: '🏷️',
            colorClass: 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-200 dark:hover:bg-green-800/40'
        },
        {
            type: 'grey' as const,
            label: 'grey',
            description: 'Other tags',
            icon: '🔖',
            colorClass: 'bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
        }
    ];

    return (
        <div
            ref={popupRef}
            className="absolute top-full left-0 mt-1 w-full sm:w-auto sm:min-w-[280px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
            style={{
                animation: 'fadeIn 0.15s ease-out'
            }}
        >
            <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

            <div className="p-2">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2">
                    Select tag type to edit or delete:
                </div>
                {tagTypes.map((tagType) => (
                    <button
                        key={tagType.type}
                        onClick={() => onSelect(tagType.type)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left ${tagType.colorClass}`}
                    >
                        <span className="text-lg">{tagType.icon}</span>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{tagType.label}</div>
                            <div className="text-xs opacity-75 truncate">{tagType.description}</div>
                        </div>
                    </button>
                ))}
            </div>

            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <div>Edit: <code className="text-xs bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">@[type]-[old]/edit-[new]</code></div>
                    <div>Delete: <code className="text-xs bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">@[type]-[tag]/delete</code></div>
                    <div>Pin: <code className="text-xs bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">@[type]-[tag]/pin</code></div>
                    <div>Star: <code className="text-xs bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">@[type]-[tag]/star</code> or <code className="text-xs bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">@[type]-[tag]/fav</code></div>
                </div>
            </div>
        </div>
    );
}
