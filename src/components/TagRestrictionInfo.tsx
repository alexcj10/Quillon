import { useRef } from 'react';
import { X, Info, ShieldAlert } from 'lucide-react';
import { useOutsideClick } from '../hooks/useOutsideClick';

interface TagRestrictionInfoProps {
    isOpen: boolean;
    onClose: () => void;
    conflictingTagName: string;
}

export function TagRestrictionInfo({ isOpen, onClose, conflictingTagName }: TagRestrictionInfoProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    useOutsideClick({
        onOutsideClick: onClose,
        isOpen
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
                ref={modalRef}
                className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
            >
                <div className="relative p-6">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-2">
                            <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Tag Name Unavailable
                        </h3>

                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            The tag <span className="font-bold text-gray-900 dark:text-white">"{conflictingTagName}"</span> is already used as a <span className="text-green-600 dark:text-green-400 font-medium">Green Tag</span> (folder-associated).
                        </p>

                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 text-sm text-left w-full border border-gray-100 dark:border-gray-700/50">
                            <div className="flex gap-2">
                                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                <span className="font-medium text-gray-700 dark:text-gray-200 mb-1 block">Why this restriction?</span>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 pl-6 leading-relaxed">
                                To keep your workspace organized, a tag cannot be both a standalone tag and a folder name at the same time. Please choose a different name for this tag.
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-2.5 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-medium transition-colors shadow-sm mt-2"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
