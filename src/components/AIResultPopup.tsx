import { motion, AnimatePresence } from 'framer-motion';
import { useRef } from 'react';
import { Check, Copy, LucideIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useState } from 'react';

import powninLogo from '../assets/pownin.png';

interface AIResultPopupProps {
    input: string;
    result: string | null;
    isLoading: boolean;
    isVisible: boolean;
    titleLabel?: string;
    logo?: string | LucideIcon;
}

export function AIResultPopup({
    input,
    result,
    isLoading,
    isVisible,
    titleLabel = "Pownin AI Response",
    logo = powninLogo
}: AIResultPopupProps) {
    const [copied, setCopied] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleCopy = () => {
        if (result) {
            navigator.clipboard.writeText(result);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!isVisible) return null;

    let query = input;
    if (input.startsWith('@pai-')) query = input.slice(5);
    else if (input.startsWith('@wiki-')) query = input.slice(6);
    else if (input.startsWith('@def-')) query = input.slice(5);

    const LogoIcon = typeof logo !== 'string' ? logo : null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 mt-2 z-50 w-full"
            >
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[400px]">
                    {/* Header */}
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                        <div className="flex items-center gap-2">
                            {LogoIcon ? (
                                <LogoIcon className="w-5 h-5 text-blue-500 animate-pulse" />
                            ) : (
                                <img src={logo as string} alt={titleLabel} className="w-5 h-5 rounded-md object-cover animate-pulse" />
                            )}
                            <span className="text-[10px] font-bold tracking-widest text-gray-500 dark:text-gray-400 uppercase">{titleLabel}</span>
                        </div>
                        {result && !isLoading && (
                            <button
                                onClick={handleCopy}
                                className="p-1 px-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5 group"
                            >
                                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400 group-hover:text-blue-500" />}
                                <span className="text-[10px] font-bold text-gray-400 group-hover:text-blue-500 uppercase">{copied ? 'Copied' : 'Copy'}</span>
                            </button>
                        )}
                    </div>

                    {/* Content Area */}
                    <div
                        ref={scrollRef}
                        className="p-4 overflow-y-auto custom-scrollbar prose prose-sm dark:prose-invert max-w-none"
                    >
                        {isLoading ? (
                            <div className="flex flex-col gap-3 py-4">
                                <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                                <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
                                <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
                            </div>
                        ) : result ? (
                            <div className="text-gray-800 dark:text-gray-200 leading-relaxed">
                                <ReactMarkdown>{result}</ReactMarkdown>
                            </div>
                        ) : (
                            <div className="text-gray-400 italic text-sm py-4">
                                Waiting for query...
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-1.5 bg-gray-50/30 dark:bg-black/10 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <span className="text-[9px] text-gray-400 truncate max-w-[80%]">Query: {query}</span>
                        <div className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
