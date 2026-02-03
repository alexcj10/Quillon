import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface MathResultPopupProps {
    input: string;
    result: string | null;
    isVisible: boolean;
}

export function MathResultPopup({ input, result, isVisible }: MathResultPopupProps) {

    // Auto-copy result whenever it changes
    useEffect(() => {
        if (isVisible && result) {
            navigator.clipboard.writeText(result).catch(() => {
                // Silently fail if clipboard access is denied
            });
        }
    }, [result, isVisible]);

    if (!isVisible || result === null) return null;

    // Clean input display and truncate if too long
    const cleanInput = input.startsWith('@c-') ? input.slice(3) : input;
    const displayInput = cleanInput.length > 200 ? cleanInput.slice(0, 200) + '...' : cleanInput;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                // Using w-full to match the parent relative flex-1 container exactly
                className="absolute top-full left-0 mt-2 z-50 w-full"
            >
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">

                    {/* Content Area */}
                    <div className="p-4 flex flex-col gap-1 max-h-[200px] overflow-y-auto custom-scrollbar">
                        {/* Input Expression - Subtle */}
                        <div className="text-xs font-mono text-gray-500 dark:text-gray-400 break-all leading-relaxed opacity-80">
                            {displayInput} =
                        </div>

                        {/* Result - Prominent */}
                        <div className="text-xl font-bold font-mono text-gray-900 dark:text-white break-all leading-tight">
                            {result}
                        </div>
                    </div>

                    {/* Aesthetic Progress Bar */}
                    <div className="h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 w-full opacity-20" />
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
