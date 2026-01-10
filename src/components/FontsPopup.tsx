import { AVAILABLE_FONTS, Font } from '../utils/fontService';

interface FontsPopupProps {
    isVisible: boolean;
    onClose: () => void;
    onSelectFont: (font: Font) => void;
    currentFont: Font;
}

export function FontsPopup({ isVisible, onClose, onSelectFont, currentFont }: FontsPopupProps) {
    if (!isVisible) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            />

            {/* Popup */}
            <div className="absolute top-full left-0 right-0 sm:right-auto mt-2 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 w-full sm:w-64">

                {/* Font List */}
                <div className="max-h-48 overflow-y-auto p-1.5 custom-scrollbar">
                    {AVAILABLE_FONTS.map((font) => (
                        <button
                            key={font.index}
                            onClick={() => {
                                onSelectFont(font);
                                onClose();
                            }}
                            className={`w-full px-2 py-2 text-left flex items-center gap-2 rounded-lg transition-all duration-200 group ${currentFont.index === font.index
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-800 dark:text-gray-200'
                                }`}
                        >
                            <span className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold transition-colors flex-shrink-0 ${currentFont.index === font.index
                                ? 'bg-white/20 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:bg-gray-300 dark:group-hover:bg-gray-600'
                                }`}>
                                {font.index}
                            </span>
                            <span
                                className="flex-1 text-sm font-medium"
                                style={{ fontFamily: font.family }}
                            >
                                {font.name}
                            </span>
                            {currentFont.index === font.index && (
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>

                {/* Footer Hint */}
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-[10px] text-center text-gray-500 dark:text-gray-400">
                        <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-[10px] font-mono">@font-d</kbd> to reset
                    </p>
                </div>
            </div>
        </>
    );
}
