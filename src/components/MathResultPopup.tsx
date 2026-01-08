import { Calculator, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface MathResultPopupProps {
    input: string;
    result: string | null;
    isVisible: boolean;
}

export function MathResultPopup({ input, result, isVisible }: MathResultPopupProps) {
    const [copied, setCopied] = useState(false);

    // Reset copy state when result changes
    useEffect(() => {
        setCopied(false);
    }, [result]);

    const handleCopy = () => {
        if (result) {
            navigator.clipboard.writeText(result);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!isVisible || result === null) return null;

    // Clean input display and truncate if too long
    const cleanInput = input.startsWith('@c-') ? input.slice(3) : input;
    const displayInput = cleanInput.length > 60 ? cleanInput.slice(0, 60) + '...' : cleanInput;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 mt-2 z-50 w-[calc(100vw-2rem)] sm:w-full"
            >
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">

                    {/* Header / Content Area */}
                    <div className="p-4 flex gap-3 items-start max-h-[200px] overflow-y-auto custom-scrollbar">
                        {/* Icon */}
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0 mt-1">
                            <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                            {/* Input Expression - Subtle, break-all to prevent overflow */}
                            <div className="text-xs font-mono text-gray-500 dark:text-gray-400 break-all leading-relaxed opacity-80">
                                {displayInput} =
                            </div>

                            {/* Result - Prominent, break-all */}
                            <div className="text-xl font-bold font-mono text-gray-900 dark:text-white break-all leading-tight">
                                {result}
                            </div>
                        </div>

                        {/* Copy Button */}
                        <button
                            onClick={handleCopy}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors flex-shrink-0"
                            title="Copy Result"
                        >
                            {copied ? (
                                <Check className="w-4 h-4 text-green-500" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                        </button>
                    </div>

                    {/* Progress Bar / Decorator (Optional aesthetic touch) */}
                    <div className="h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 w-full opacity-20" />
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// Add global styles for the scrollbar if not already present, or use inline style tag
