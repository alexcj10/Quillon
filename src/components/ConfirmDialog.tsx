import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    type: 'delete' | 'restore';
    title: string;
    description: React.ReactNode;
    confirmLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    isOpen,
    type,
    title,
    description,
    confirmLabel,
    onConfirm,
    onCancel
}: ConfirmDialogProps) {
    const cancelButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (isOpen) {
            cancelButtonRef.current?.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                e.preventDefault();
                onCancel();
            } else if (e.key === 'Enter') {
                e.preventDefault();

                if (document.activeElement?.getAttribute('data-action') === 'confirm') {
                    onConfirm();
                } else {
                    onCancel();
                }
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onConfirm, onCancel]);

    if (!isOpen) return null;

    const isDelete = type === 'delete';

    const iconBgClass = isDelete
        ? "bg-red-100 dark:bg-red-900/30"
        : "bg-green-100 dark:bg-green-900/30";

    const iconColorClass = isDelete
        ? "text-red-600 dark:text-red-400"
        : "text-green-600 dark:text-green-400";

    const buttonClass = isDelete
        ? "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 focus:ring-red-400 dark:focus:ring-red-500"
        : "bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 focus:ring-green-400 dark:focus:ring-green-500";

    return createPortal(
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999] animate-fadeIn"
            onClick={onCancel}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full mx-4 md:mx-8 max-w-md animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${iconBgClass}`}>
                        {isDelete ? (
                            <AlertTriangle className={`h-4 w-4 ${iconColorClass}`} />
                        ) : (
                            <RotateCcw className={`h-4 w-4 ${iconColorClass}`} />
                        )}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
                </div>

                {/* Content */}
                <div className="p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                        {description}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 px-4 pb-4">
                    <button
                        ref={cancelButtonRef}
                        onClick={onCancel}
                        data-action="cancel"
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        data-action="confirm"
                        className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors focus:outline-none focus:ring-2 ${buttonClass}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
