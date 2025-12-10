import { useState, useRef, useEffect } from "react";
import { ragQuery } from "../utils/rag";
import { X, Send, Loader2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import powninLogo from "../assets/pownin.png";

interface AIChatProps {
    onClose: () => void;
}

interface Message {
    role: 'user' | 'ai';
    content: string;
}

export default function AIChat({ onClose }: AIChatProps) {
    const [q, setQ] = useState("");
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', content: 'Hi! 👋 I\'m Pownin, your AI assistant. I can help you search and understand your notes. What would you like to know?' }
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    async function send() {
        if (!q.trim() || loading) return;

        const question = q;
        setQ("");
        setLoading(true);

        // Add user message immediately
        setMessages(prev => [...prev, { role: 'user', content: question }]);

        try {
            const answer = await ragQuery(question, messages);
            setMessages(prev => [...prev, { role: 'ai', content: answer }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error while searching your notes." }]);
        } finally {
            setLoading(false);
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    return (
        <>
            {/* Backdrop - click to close */}
            <div
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            {/* AI Chat Panel - Responsive positioning */}
            <div className="fixed z-50 
                /* Mobile: Bottom sheet, 70% height, full width with padding */
                bottom-0 left-0 right-0 h-[70vh] mx-4 mb-4 
                /* Tablet: Right side panel, 65% height, wider width */
                sm:bottom-4 sm:right-4 sm:left-auto sm:h-[65vh] sm:w-[500px] sm:mx-0
                /* Desktop: Taller at 75% height */
                md:h-[75vh]
                /* Animation */
                animate-slide-up
                /* Styling */
                bg-white dark:bg-gray-900 rounded-3xl sm:rounded-2xl shadow-2xl 
                flex flex-col overflow-hidden 
                border-2 border-purple-500/20 dark:border-purple-400/20"
            >
                {/* HEADER */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-900">
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold">
                        <img src={powninLogo} alt="Pownin" className="w-6 h-6 rounded-full object-cover" />
                        <span className="text-sm md:text-base">Pownin</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
                            title="Close"
                        >
                            <X className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    </div>
                </div>

                {/* MESSAGES */}
                <div className="ai-chat-messages flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 bg-gray-50 dark:bg-gray-950/50">
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] md:max-w-[80%] rounded-2xl px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm leading-relaxed shadow-sm ${msg.role === 'user'
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
                    {loading && (
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
                            className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-24 md:max-h-32 text-xs md:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-2"
                            rows={1}
                        />
                        <button
                            onClick={send}
                            disabled={!q.trim() || loading}
                            className={`p-2 rounded-lg transition-all ${q.trim() && !loading
                                ? 'bg-purple-600 text-white shadow-md hover:bg-purple-700 hover:scale-105 active:scale-95'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                    </div>
                    <div className="text-center mt-2">
                        <p className="text-[9px] md:text-[10px] text-gray-400 dark:text-gray-600">
                            AI can make mistakes. Check important info.
                        </p>
                    </div>
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

                /* Custom Scrollbar Styling */
                .ai-chat-messages::-webkit-scrollbar {
                    width: 6px;
                }
                
                .ai-chat-messages::-webkit-scrollbar-track {
                    background: white;
                    border-radius: 10px;
                }
                
                .ai-chat-messages::-webkit-scrollbar-thumb {
                    background: rgba(156, 163, 175, 0.4);
                    border-radius: 10px;
                }
                
                .ai-chat-messages::-webkit-scrollbar-thumb:hover {
                    background: rgba(156, 163, 175, 0.6);
                }

                /* Dark mode scrollbar */
                .dark .ai-chat-messages::-webkit-scrollbar-track {
                    background: rgb(3, 7, 18);
                }
                
                .dark .ai-chat-messages::-webkit-scrollbar-thumb {
                    background: rgba(75, 85, 99, 0.5);
                }
                
                .dark .ai-chat-messages::-webkit-scrollbar-thumb:hover {
                    background: rgba(75, 85, 99, 0.7);
                }
            `}</style>
        </>
    );
}
