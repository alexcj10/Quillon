
import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, History, Plus, MessageSquare, Trash2, Edit2, Check } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { AnimatePresence, motion } from "framer-motion";
import powninLogo from "../assets/pownin.png";
import { useAIChat } from "../hooks/useAIChat";
import { format } from "date-fns";
import { Session } from "../types";

interface AIChatProps {
    onClose: () => void;
}

export default function AIChat({ onClose }: AIChatProps) {
    const {
        messages,
        sendMessage,
        isLoading,
        history,
        startNewChat,
        loadSession,
        deleteSession,
        renameSession,
        currentSessionId
    } = useAIChat();

    const [q, setQ] = useState("");
    const [showHistory, setShowHistory] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Edit/Delete State
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!showHistory) {
            scrollToBottom();
        }
    }, [messages, showHistory]);

    async function send() {
        if (!q.trim() || isLoading) return;
        const text = q;
        setQ("");
        await sendMessage(text);
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    const handleNewChat = () => {
        startNewChat();
        setShowHistory(false);
        setQ("");
        setTimeout(scrollToBottom, 100);
    };

    const handleLoadSession = (sessionId: string) => {
        loadSession(sessionId);
        setShowHistory(false);
        setTimeout(scrollToBottom, 100);
    };

    // Rename Logic
    const startEditing = (e: React.MouseEvent, sessionId: string, currentTitle: string) => {
        e.stopPropagation();
        setEditingSessionId(sessionId);
        setEditTitle(currentTitle);
    };

    const saveTitle = (e: React.MouseEvent | React.FormEvent, sessionId: string) => {
        e.stopPropagation();
        if (editTitle.trim()) {
            renameSession(sessionId, editTitle.trim());
        }
        setEditingSessionId(null);
    };

    // Delete Logic
    const handleDeleteClick = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        setDeletingSessionId(sessionId);
    };

    const confirmDelete = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        deleteSession(sessionId);
        setDeletingSessionId(null);
    };

    const cancelDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDeletingSessionId(null);
    };


    return (
        <>
            {/* Backdrop - click to close */}
            <div
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            {/* AI Chat Panel - Mixed Adaptive Design */}
            <div className="fixed z-50 flex flex-col overflow-hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl border border-white/20 dark:border-white/10 transition-all duration-300 ease-out
                /* Mobile: Increased height (User Request) */
                bottom-6 left-6 right-6 h-[70vh] rounded-[2rem]
                
                /* Tablet/Desktop: Reduced width (User Request) */
                sm:left-auto sm:right-6 sm:bottom-6 sm:rounded-2xl
                sm:w-[450px] sm:h-[75vh]
                md:h-[80vh]
                
                animate-slide-up"
            >
                {/* HEADER */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-900">
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold">
                        <img src={powninLogo} alt="Pownin" className="w-8 h-8 rounded-full object-cover" />
                        <div>
                            <span className="text-base font-bold block leading-tight">Pownin AI</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleNewChat}
                            className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800 text-purple-600 dark:text-purple-400 transition"
                            title="New Chat"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className={`p-2 rounded-lg transition ${showHistory ? 'bg-purple-100 dark:bg-gray-800 text-purple-700 dark:text-purple-300' : 'hover:bg-white/50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                            title="History"
                        >
                            <History className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
                            title="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 overflow-hidden relative flex flex-col bg-slate-50/50 dark:bg-black/20">
                    <AnimatePresence mode="wait">
                        {showHistory ? (
                            <motion.div
                                key="history"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="absolute inset-0 overflow-y-auto ai-chat-history p-2 sm:p-3 bg-white dark:bg-gray-900"
                            >
                                {history.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <History className="w-12 h-12 mb-2 opacity-30" />
                                        <p className="text-sm">No chat history yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {history.map((session: Session) => (
                                            <div
                                                key={session.id}
                                                onClick={() => handleLoadSession(session.id)}
                                                className={`group flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${currentSessionId === session.id
                                                    ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-700'
                                                    }`}
                                            >
                                                <div className={`p-2 rounded-lg ${currentSessionId === session.id ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                                    <MessageSquare className="w-4 h-4" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    {editingSessionId === session.id ? (
                                                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                            <input
                                                                type="text"
                                                                value={editTitle}
                                                                onChange={(e) => setEditTitle(e.target.value)}
                                                                className="flex-1 text-sm px-2 py-1 rounded border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                                                autoFocus
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') saveTitle(e, session.id);
                                                                    if (e.key === 'Escape') setEditingSessionId(null);
                                                                }}
                                                            />
                                                            <button
                                                                onClick={(e) => saveTitle(e, session.id)}
                                                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-200 truncate pr-2" title={session.title}>
                                                                    {session.title}
                                                                </h4>
                                                            </div>
                                                            <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                                                {format(new Date(session.lastUpdated), 'MMM d, h:mm a')}
                                                            </p>
                                                        </>
                                                    )}
                                                </div>

                                                {editingSessionId !== session.id && (
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {deletingSessionId === session.id ? (
                                                            <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 rounded-lg p-0.5" onClick={e => e.stopPropagation()}>
                                                                <button
                                                                    onClick={(e) => confirmDelete(e, session.id)}
                                                                    className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded"
                                                                    title="Confirm"
                                                                >
                                                                    <Check className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={cancelDelete}
                                                                    className="p-1 text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 rounded"
                                                                    title="Cancel"
                                                                >
                                                                    <X className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={(e) => startEditing(e, session.id, session.title)}
                                                                    className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:text-purple-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                                    title="Rename"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => handleDeleteClick(e, session.id)}
                                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            /* MESSAGES */
                            <motion.div
                                key="chat"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex flex-col h-full overflow-hidden"
                            >
                                <div className="ai-chat-messages flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 bg-gray-50 dark:bg-gray-950/50">
                                    {messages.map((msg, i) => (
                                        <div
                                            key={msg.id || i}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[85%] md:max-w-[80%] rounded-2xl px-3 md:px-4 py-2 md:py-2.5 text-[15px] leading-relaxed shadow-sm ${msg.role === 'user'
                                                    ? 'bg-purple-600 text-white rounded-br-none'
                                                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-none'
                                                    }`}
                                            >
                                                {msg.role === 'user' ? (
                                                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                                                ) : (
                                                    <ReactMarkdown
                                                        components={{
                                                            strong: ({ node, ...props }) => <strong className="font-bold text-gray-900 dark:text-gray-100" {...props} />,
                                                            ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-4 space-y-1 my-2" {...props} />,
                                                            ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-4 space-y-1 my-2" {...props} />,
                                                            li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                                            p: ({ node, ...props }) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
                                                            h1: ({ node, ...props }) => <h1 className="text-lg font-bold mt-4 mb-2 first:mt-0" {...props} />,
                                                            h2: ({ node, ...props }) => <h2 className="text-base font-bold mt-3 mb-2" {...props} />,
                                                            h3: ({ node, ...props }) => <h3 className="text-sm font-bold mt-2 mb-1" {...props} />,
                                                            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-purple-500/30 pl-3 italic my-3 text-gray-500 dark:text-gray-400" {...props} />,
                                                            a: ({ node, ...props }) => <a className="text-purple-600 dark:text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                                                            code: ({ node, inline, className, children, ...props }: any) => {
                                                                const match = /language-(\w+)/.exec(className || '');
                                                                return !inline && match ? (
                                                                    <div className="rounded-lg overflow-hidden my-3 shadow-sm border border-gray-200 dark:border-gray-700">
                                                                        <SyntaxHighlighter
                                                                            {...props}
                                                                            style={vscDarkPlus}
                                                                            language={match[1]}
                                                                            PreTag="div"
                                                                            customStyle={{
                                                                                margin: 0,
                                                                                padding: '1rem',
                                                                                fontSize: '0.8rem',
                                                                                lineHeight: '1.5',
                                                                                backgroundColor: '#1e1e1e'
                                                                            }}
                                                                        >
                                                                            {String(children).replace(/\n$/, '')}
                                                                        </SyntaxHighlighter>
                                                                    </div>
                                                                ) : (
                                                                    <code className="bg-gray-100 dark:bg-gray-700/50 px-1.5 py-0.5 rounded text-xs font-mono text-purple-600 dark:text-purple-400 border border-gray-200 dark:border-gray-700" {...props}>
                                                                        {children}
                                                                    </code>
                                                                )
                                                            },
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                                                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* INPUT */}
                                <div className="p-3 md:p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex items-end gap-2 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-500 transition-all">
                                        <textarea
                                            value={q}
                                            onChange={e => setQ(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Ask about your notes..."
                                            className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-24 md:max-h-32 text-[15px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-2"
                                            rows={1}
                                        />
                                        <button
                                            onClick={send}
                                            disabled={!q.trim() || isLoading}
                                            className={`p-2 rounded-lg transition-all ${q.trim() && !isLoading
                                                ? 'bg-purple-600 text-white shadow-md hover:bg-purple-700 hover:scale-105 active:scale-95'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                                }`}
                                        >
                                            <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                        </button>
                                    </div>
                                    <div className="text-center mt-2">
                                        <p className="text-[9px] md:text-[10px] text-gray-400 dark:text-gray-600">
                                            Pownin AI can make mistakes. Check important info.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <style>{`
                @keyframes slide-up {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }

                /* Custom Scrollbar Styling (Apple-like) */
                .ai-chat-messages::-webkit-scrollbar,
                .ai-chat-history::-webkit-scrollbar {
                    width: 5px; /* Thinner */
                }
                
                .ai-chat-messages::-webkit-scrollbar-track,
                .ai-chat-history::-webkit-scrollbar-track {
                    background: transparent; /* Fix white background in dark mode */
                }
                
                .ai-chat-messages::-webkit-scrollbar-thumb,
                .ai-chat-history::-webkit-scrollbar-thumb {
                    background: rgba(156, 163, 175, 0.4);
                    border-radius: 20px; /* Rounder */
                }
                
                .ai-chat-messages::-webkit-scrollbar-thumb:hover,
                .ai-chat-history::-webkit-scrollbar-thumb:hover {
                    background: rgba(156, 163, 175, 0.6);
                }

                /* Dark mode scrollbar */
                .dark .ai-chat-messages::-webkit-scrollbar-thumb,
                .dark .ai-chat-history::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.15); /* More subtle white */
                }
                
                .dark .ai-chat-messages::-webkit-scrollbar-thumb:hover,
                .dark .ai-chat-history::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
            `}</style>
        </>
    );
}
