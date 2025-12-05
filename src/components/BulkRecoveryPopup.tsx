import { useRef } from 'react';
import { createPortal } from 'react-dom';

interface BulkRecoveryPopupProps {
    isOpen: boolean;
    onClose: () => void;
    selectedCount: number;
    onSelectAll: () => void;
    onRecover: () => void;
    onDeleteForever?: () => void;
    anchorRef: React.RefObject<HTMLElement>;
}

export function BulkRecoveryPopup({
    isOpen,
    onClose,
    selectedCount,
    onSelectAll,
    onRecover,
    onDeleteForever,
    anchorRef,
}: BulkRecoveryPopupProps) {
    const popupRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    // Position centered below search bar - highly visible, doesn't block icons
    const isMobile = window.innerWidth < 768;

    return createPortal(
        <div
            ref={popupRef}
            className="fixed z-[100] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            style={{
                top: isMobile ? '140px' : '160px',
                left: '50%',
                transform: 'translateX(-50%)',
                minWidth: '110px',
                maxWidth: '120px',
            }}
        >
            <div className="flex flex-col">
                <button
                    onClick={onSelectAll}
                    className="px-3 py-1 text-left text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700"
                >
                    Select All
                </button>
                <button
                    onClick={onRecover}
                    disabled={selectedCount === 0}
                    className={`px-3 py-1 text-left text-xs transition-colors ${selectedCount === 0 ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}                >
                    Recover ({selectedCount})
                </button>
                <button
                    onClick={onDeleteForever}
                    disabled={selectedCount === 0}
                    className={`px-3 py-1 text-left text-xs transition-colors border-t border-gray-200 dark:border-gray-700 ${selectedCount === 0 ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                    Delete Forever ({selectedCount})
                </button>
            </div>
        </div>,
        document.body
    );
}
