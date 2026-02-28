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
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200">
            <div
                ref={modalRef}
                onClick={e => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full mx-4 md:mx-8 max-w-2xl h-[60vh] sm:h-[450px] flex flex-col transform transition-all scale-100 animate-in zoom-in-95 duration-200 overflow-hidden"
            >
                {/* Header - Matches TagModal style */}
                <div className="flex items-center justify-between p-2.5 px-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-1.5 rounded-lg border border-blue-100 dark:border-blue-800/50">
                            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                            Tag Synchronization Rules
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        title="Back to All Tags"
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 group"
                    >
                        <X className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    </button>
                </div>

                {/* Content Area - Clean & Professional */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    {/* Crucial Rule */}
                    <section>
                        <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 rounded-xl p-4 shadow-sm">
                            <div className="flex gap-3">
                                <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 bg-amber-500 text-white rounded-full text-[10px] font-bold shadow-sm">!</span>
                                <p className="text-[13px] leading-relaxed text-amber-900 dark:text-amber-200/90 font-medium">
                                    <span className="font-bold underline decoration-amber-400/30">Crucial Rule:</span> <span className="font-bold">Removing</span>, <span className="font-bold">Deleting</span>, or <span className="font-bold">Renaming</span> a tag should <span className="italic">always</span> be done using <b>commands</b> from the Tag Modal. Manual edits can lead to stale <b>Orange Tag Groups</b>.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Workflow Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pb-6">
                        {/* Rename Workflow */}
                        <div className="bg-gray-50/50 dark:bg-gray-900/20 border border-gray-100 dark:border-gray-700/50 rounded-2xl p-5 hover:border-blue-200 dark:hover:border-blue-800 transition-colors group">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/40 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                    <RotateCcw className="w-4 h-4" />
                                </div>
                                <h4 className="font-bold text-sm text-gray-900 dark:text-white">Rename Workflow</h4>
                            </div>
                            <ol className="space-y-3">
                                {[
                                    'Remove from group',
                                    'Go to Grey Tags',
                                    'Edit via Command',
                                    'Add back to Group'
                                ].map((step, i) => (
                                    <li key={i} className="flex items-center gap-3 text-[13px] text-gray-600 dark:text-gray-300 font-medium">
                                        <span className="flex-shrink-0 w-6 h-6 bg-white dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-700 flex items-center justify-center text-[10px] font-bold shadow-sm text-blue-600 dark:text-blue-400">{i + 1}</span>
                                        {step}
                                    </li>
                                ))}
                            </ol>
                        </div>

                        {/* Delete Workflow */}
                        <div className="bg-gray-50/50 dark:bg-gray-900/20 border border-gray-100 dark:border-gray-700/50 rounded-2xl p-5 hover:border-red-200 dark:hover:border-red-800 transition-colors group">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-red-50 dark:bg-red-900/40 rounded-lg text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
                                    <Trash2 className="w-4 h-4" />
                                </div>
                                <h4 className="font-bold text-sm text-gray-900 dark:text-white">Delete Workflow</h4>
                            </div>
                            <ol className="space-y-3">
                                {[
                                    'Remove from group',
                                    'Go to Grey Tags',
                                    'Delete via Command'
                                ].map((step, i) => (
                                    <li key={i} className="flex items-center gap-3 text-[13px] text-gray-600 dark:text-gray-300 font-medium">
                                        <span className="flex-shrink-0 w-6 h-6 bg-white dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-700 flex items-center justify-center text-[10px] font-bold shadow-sm text-red-600 dark:text-red-400">{i + 1}</span>
                                        {step}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
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
                    background-color: rgba(156, 163, 175, 0.2);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(156, 163, 175, 0.4);
                }
            `}</style>
        </div>,
        document.body
    );
}
