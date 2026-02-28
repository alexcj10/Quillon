import { X, Info, RotateCcw, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useOutsideClick } from '../hooks/useOutsideClick';

interface TagSyncInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function TagSyncInfoModal({ isOpen, onClose }: TagSyncInfoModalProps) {
    const modalRef = useOutsideClick({
        onOutsideClick: onClose,
        isOpen
    });

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200 backdrop-blur-sm">
            <div
                ref={modalRef}
                className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="relative p-6 border-b border-gray-100 dark:border-gray-700/50 flex items-center gap-4 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-900/10">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm border border-blue-200/50 dark:border-blue-700/50">
                        <Info className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Tag Synchronization Rules
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Essential rules for maintaining tag consistency</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-all active:scale-95"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <div className="space-y-6">
                        {/* Crucial Rule Panel */}
                        <div className="relative p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl shadow-sm overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                                <Info className="h-16 w-16 -mr-4 -mt-4 rotate-12" />
                            </div>
                            <div className="flex gap-3">
                                <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 bg-amber-500 text-white rounded-full text-xs font-bold shadow-sm ring-4 ring-amber-500/10">!</span>
                                <p className="text-[14px] leading-relaxed text-amber-900 dark:text-amber-200/90 font-medium">
                                    <span className="font-bold underline decoration-amber-400/50">Crucial Rule:</span> <span className="font-bold">Removing</span>, <span className="font-bold">Deleting</span>, or <span className="font-bold">Renaming</span> a tag should <span className="italic">always</span> be done using <b>commands</b> from the Tag Modal. If done manually by editing a note, associated <b>Orange Tag Groups</b> will not be updated and may become stale.
                                </p>
                            </div>
                        </div>

                        {/* Workflow Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Rename Workflow */}
                            <div className="group relative p-5 bg-blue-50/30 dark:bg-blue-900/5 border border-blue-100 dark:border-blue-800/30 rounded-2xl transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700/50">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 shadow-sm transition-transform group-hover:scale-110">
                                        <RotateCcw className="w-4 h-4" />
                                    </div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">Rename Workflow</h4>
                                </div>
                                <ol className="space-y-3">
                                    {[
                                        { text: 'Remove from group', icon: '🏷️' },
                                        { text: 'Go to Grey Tags', icon: '🎨' },
                                        { text: 'Edit via Command', icon: '⌨️' },
                                        { text: 'Add back to Group', icon: '📥' }
                                    ].map((step, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                            <span className="flex-shrink-0 w-6 h-6 bg-white dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-700 flex items-center justify-center text-[10px] font-bold shadow-sm">{i + 1}</span>
                                            <span className="flex-grow">{step.text}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>

                            {/* Delete Workflow */}
                            <div className="group relative p-5 bg-red-50/30 dark:bg-red-900/5 border border-red-100 dark:border-red-800/30 rounded-2xl transition-all hover:shadow-md hover:border-red-200 dark:hover:border-red-700/50">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 shadow-sm transition-transform group-hover:scale-110">
                                        <Trash2 className="w-4 h-4" />
                                    </div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">Delete Workflow</h4>
                                </div>
                                <ol className="space-y-3">
                                    {[
                                        { text: 'Remove from group', icon: '🏷️' },
                                        { text: 'Go to Grey Tags', icon: '🎨' },
                                        { text: 'Delete via Command', icon: '🗑️' }
                                    ].map((step, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                            <span className="flex-shrink-0 w-6 h-6 bg-white dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-700 flex items-center justify-center text-[10px] font-bold shadow-sm">{i + 1}</span>
                                            <span className="flex-grow">{step.text}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-700/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gray-900 hover:bg-black dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-gray-900/10 dark:shadow-blue-900/20 active:scale-95 text-sm"
                    >
                        Got it
                    </button>
                </div>
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(156, 163, 175, 0.3);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(156, 163, 175, 0.5);
                }
            `}</style>
        </div>,
        document.body
    );
}
