import { X } from 'lucide-react';
import { useOutsideClick } from '../hooks/useOutsideClick';

interface TagRestrictionInfoProps {
    isOpen: boolean;
    onClose: () => void;
    conflictingTagName: string;
}

export function TagRestrictionInfo({ isOpen, onClose, conflictingTagName }: TagRestrictionInfoProps) {
    const modalRef = useOutsideClick({
        onOutsideClick: onClose,
        isOpen
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
            <div
                ref={modalRef}
                className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
            >
                <div className="relative p-5 text-center">
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1.5 mt-1">
                        Tag Name Unavailable
                    </h3>

                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-5 px-4">
                        The tag <span className="font-medium text-gray-900 dark:text-white">"{conflictingTagName}"</span> is already reserved as a folder tag. To prevent conflicts, please choose a different name.
                    </p>

                    <button
                        onClick={onClose}
                        className="w-full py-2 bg-gray-900 hover:bg-black dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm shadow-sm"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
}
