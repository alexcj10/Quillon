import { useEffect, useRef } from 'react';

interface GroupCommandPopupProps {
    isVisible: boolean;
    currentMode: 'view' | 'drop' | 'remove' | 'neutral';
    onSelect: (command: 'drop' | 'view' | 'remove' | 'back') => void;
    inputRef: React.RefObject<HTMLInputElement>;
}

export function GroupCommandPopup({ isVisible, currentMode, onSelect, inputRef }: GroupCommandPopupProps) {
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                popupRef.current &&
                !popupRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                // Will be handled by parent state
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

    const allCommands = [
        {
            cmd: 'drop' as const,
            label: '/drop',
            description: 'Add available grey tags to group',
            icon: '📥',
            colorClass: 'bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-500/20 dark:text-orange-400 dark:hover:bg-orange-500/30'
        },
        {
            cmd: 'view' as const,
            label: '/view',
            description: 'See all tags in this group',
            icon: '👁️',
            colorClass: 'bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-500/20 dark:text-sky-400 dark:hover:bg-sky-500/30'
        },
        {
            cmd: 'remove' as const,
            label: '/remove',
            description: 'Remove tags from this group',
            icon: '🗑️',
            colorClass: 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/30'
        },
        {
            cmd: 'back' as const,
            label: '/back',
            description: 'Exit group and return to all tags',
            icon: '🔙',
            colorClass: 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-500/20 dark:text-slate-400 dark:hover:bg-slate-500/30'
        }
    ];

    // Filter out the current mode (except for back)
    const filteredCommands = allCommands.filter(c => c.cmd === 'back' || c.cmd !== currentMode);

    return (
        <div
            ref={popupRef}
            className="absolute top-full left-0 mt-2 w-full sm:w-auto sm:min-w-[300px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-[10000] overflow-hidden"
            style={{
                animation: 'popupScale 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
        >
            <style>{`
                @keyframes popupScale {
                    from {
                        opacity: 0;
                        transform: scale(0.95) translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
            `}</style>

            <div className="p-1.5 space-y-1">
                <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500 px-3 py-2">
                    Action Commands
                </div>
                {filteredCommands.map((command) => (
                    <button
                        key={command.cmd}
                        onClick={() => onSelect(command.cmd)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left border border-transparent hover:border-current/10 ${command.colorClass}`}
                    >
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/50 dark:bg-black/20 shadow-sm text-lg">
                            {command.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm tracking-tight">{command.label}</div>
                            <div className="text-[11px] opacity-70 truncate font-medium">{command.description}</div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
