import React, { useEffect, useRef, useState } from 'react';
import {
    Globe,
    Book,
    Zap,
    Calculator,
    Languages,
    Timer,
    Info,
    Cloud,
    Hash,
    Type,
    Volume2,
    Share2,
    Brain,
    Search,
    CheckCircle2
} from 'lucide-react';

export interface Command {
    id: string;
    label: string;
    description: string;
    icon: React.ElementType;
    template: string;
    color: string;
}

export const AVAILABLE_COMMANDS: Command[] = [
    { id: 'wiki', label: 'Wikipedia', description: 'Instant knowledge lookup', icon: Globe, template: '@wiki-', color: 'text-blue-500' },
    { id: 'def', label: 'Dictionary', description: 'Word definitions & phonetics', icon: Book, template: '@def-', color: 'text-emerald-500' },
    { id: 'summary', label: 'Summarize', description: 'AI-powered concise summary', icon: Zap, template: '@summary', color: 'text-amber-500' },
    { id: 'elaborate', label: 'Elaborate', description: 'AI-powered detailed explanation', icon: Brain, template: '@elaboration', color: 'text-purple-500' },
    { id: 'math', label: 'Calculator', description: 'Dynamic math & equations', icon: Calculator, template: '@c-', color: 'text-pink-500' },
    { id: 'translate', label: 'Translate', description: 'Translate to any language', icon: Languages, template: '@t-', color: 'text-indigo-500' },
    { id: 'pomo', label: 'Pomodoro', description: 'Focus timer (default 25m)', icon: Timer, template: '@pomo', color: 'text-orange-500' },
    { id: 'quiz', label: 'Quiz Mode', description: 'Interactive flashcard study', icon: Info, template: '@quiz', color: 'text-cyan-500' },
    { id: 'weather', label: 'Weather', description: 'Real-time city weather', icon: Cloud, template: '@w-', color: 'text-sky-400' },
    { id: 'currency', label: 'Currency', description: 'Live exchange rates', icon: Share2, template: '@cc-', color: 'text-green-500' },
    { id: 'units', label: 'Units', description: 'Smart unit conversion', icon: Hash, template: '@u-', color: 'text-violet-500' },
    { id: 'fonts', label: 'Fonts', description: 'Change note typeface', icon: Type, template: '@fonts', color: 'text-rose-500' },
    { id: 'sound', label: 'Sound', description: 'Toggle haptic feedback', icon: Volume2, template: '@sound-on', color: 'text-gray-500' },
    { id: 'nodes', label: 'Nodes', description: 'Quick task management', icon: CheckCircle2, template: '@nodes-', color: 'text-blue-600' },
];

interface CommandExplorerProps {
    isVisible: boolean;
    onSelect: (command: Command) => void;
    onClose: () => void;
    searchTerm: string;
}

export const CommandExplorer: React.FC<CommandExplorerProps> = ({
    isVisible,
    onSelect,
    onClose,
    searchTerm
}) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    const filteredCommands = AVAILABLE_COMMANDS.filter(cmd =>
        cmd.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cmd.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        setSelectedIndex(0);
    }, [searchTerm]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isVisible) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    onSelect(filteredCommands[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isVisible, selectedIndex, filteredCommands, onSelect, onClose]);

    useEffect(() => {
        const selectedElement = scrollRef.current?.children[selectedIndex] as HTMLElement;
        if (selectedElement) {
            selectedElement.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex, filteredCommands.length]);

    if (!isVisible || filteredCommands.length === 0) return null;

    return (
        <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-2/3 z-[100] w-72 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
            <div className="p-2 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Command Explorer</span>
            </div>

            <div ref={scrollRef} className="max-h-[300px] overflow-y-auto p-1.5 custom-scrollbar">
                {filteredCommands.map((cmd, index) => (
                    <button
                        key={cmd.id}
                        onClick={() => onSelect(cmd)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 group text-left ${index === selectedIndex
                            ? 'bg-blue-500 text-white shadow-lg scale-[1.02]'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                            }`}
                    >
                        <div className={`p-2 rounded-lg ${index === selectedIndex
                            ? 'bg-white/20 text-white'
                            : `${cmd.color} bg-gray-50 dark:bg-gray-800 group-hover:bg-white dark:group-hover:bg-gray-700`
                            } transition-colors`}>
                            <cmd.icon className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-sm tracking-tight">{cmd.label}</span>
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded opacity-70 ${index === selectedIndex ? 'bg-black/20' : 'bg-gray-100 dark:bg-gray-800'
                                    }`}>
                                    {cmd.template}
                                </span>
                            </div>
                            <p className={`text-[10px] truncate leading-tight mt-0.5 ${index === selectedIndex ? 'text-blue-50' : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                {cmd.description}
                            </p>
                        </div>
                    </button>
                ))}
            </div>

            <div className="p-2 bg-gray-50/50 dark:bg-black/20 border-t border-gray-100 dark:border-gray-800 text-center">
                <p className="text-[10px] text-gray-400 font-medium flex items-center justify-center gap-1.5">
                    <span>↑↓ Navigate</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>Enter Choose</span>
                </p>
            </div>
        </div>
    );
};
