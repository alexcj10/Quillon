import { useState, useRef, useEffect } from 'react';
import { useNodesWidget } from '../context/NodesContext';
import { X, CheckSquare, Square, Trash2, Workflow, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export function NodesWidget() {
    const { nodes, isOpen, setIsOpen, addNode, toggleNode, deleteNode } = useNodesWidget();
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (inputValue.trim()) {
            addNode(inputValue.trim());
            setInputValue('');
            // Scroll to top to see new item
            if (scrollRef.current) scrollRef.current.scrollTop = 0;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
                    />

                    {/* Floating Widget */}
                    <motion.div
                        initial={{ opacity: 0, y: "100%" }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: "100%" }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="fixed z-50 flex flex-col overflow-hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl border border-white/20 dark:border-white/10 transition-all duration-300 ease-out
              bottom-6 left-6 right-6 w-auto h-[70vh] rounded-[2rem]
              sm:left-auto sm:right-6 sm:w-[450px] sm:h-[65vh] sm:rounded-2xl
              lg:h-[80vh]
              animate-slide-up"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/20">
                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
                                <Workflow className="w-5 h-5" />
                                <span>Nodes</span>
                                <span className="text-xs font-normal text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-white/10 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">
                                    {nodes.filter(n => !n.completed).length} active
                                </span>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* List */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 bg-slate-50/50 dark:bg-black/20 custom-scrollbar"
                        >
                            {nodes.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 gap-3">
                                    <div className="p-4 rounded-full bg-gray-100/50 dark:bg-white/5">
                                        <Workflow className="w-8 h-8 opacity-50" />
                                    </div>
                                    <p className="text-sm">No nodes yet. Add one!</p>
                                </div>
                            ) : (
                                nodes.map((node) => (
                                    <motion.div
                                        key={node.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`group flex items-start gap-3 p-3 rounded-xl transition-all duration-200 border border-transparent
                      ${node.completed
                                                ? 'bg-gray-50/50 dark:bg-white/5 opacity-60'
                                                : 'bg-white dark:bg-gray-800 shadow-sm hover:border-gray-200 dark:hover:border-gray-700'
                                            }`}
                                    >
                                        <button
                                            onClick={() => toggleNode(node.id)}
                                            className={`mt-0.5 flex-shrink-0 transition-colors ${node.completed ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'
                                                }`}
                                        >
                                            {node.completed ? (
                                                <CheckSquare className="w-5 h-5" />
                                            ) : (
                                                <Square className="w-5 h-5" />
                                            )}
                                        </button>
                                        <span
                                            className={`flex-1 text-sm leading-relaxed break-words ${node.completed ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-200'
                                                }`}
                                        >
                                            {node.text}
                                        </span>
                                        <button
                                            onClick={() => deleteNode(node.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-500 transition-all transform hover:scale-110"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Input Footer */}
                        <form
                            onSubmit={handleSubmit}
                            className="p-3 md:p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
                        >
                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                                <input
                                    ref={inputRef}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Add a new node..."
                                    className="flex-1 bg-transparent border-none rounded-none pl-2 py-2 text-[15px] focus:ring-0 text-gray-900 dark:text-white placeholder:text-gray-400 min-w-0"
                                />
                                <button
                                    type="submit"
                                    disabled={!inputValue.trim()}
                                    className="flex-shrink-0 p-1.5 rounded-lg bg-blue-600 text-white disabled:opacity-50 disabled:bg-gray-300 dark:disabled:bg-gray-700 transition-all hover:bg-blue-700 hover:scale-105 active:scale-95 shadow-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
            <style>{`
        /* Custom Scrollbar Styling (Apple-like) */
        .custom-scrollbar::-webkit-scrollbar {
            width: 5px; /* Thinner */
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent; /* Fix white background in dark mode */
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(156, 163, 175, 0.4);
            border-radius: 20px; /* Rounder */
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(156, 163, 175, 0.6);
        }

        /* Dark mode scrollbar */
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.15); /* More subtle white */
        }
        
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
        </AnimatePresence>
    );
}
