import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Folder, Tag } from 'lucide-react';
import { isFileTag, getFileTagDisplayName } from '../types';
import { useNotes } from '../context/NoteContext';
import { parseTagEditCommand, isTagEditCommandStart, extractSearchTermFromCommand, extractTagTypeFromCommand } from '../utils/tagCommandParser';
import { TagEditPopup } from './TagEditPopup';

interface TagModalProps {
    isOpen: boolean;
    onClose: () => void;
    tags: string[];
    selectedTags: string[];
    onToggleTag: (tag: string) => void;
    tagsInFileFolders: Set<string>;
}

export function TagModal({
    isOpen,
    onClose,
    tags,
    selectedTags,
    onToggleTag,
    tagsInFileFolders
}: TagModalProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const { renameTag } = useNotes();

    const filteredTags = useMemo(() => {
        // If no search term, return all tags
        if (!searchTerm.trim()) return tags;

        // Check if this is an edit command with search term
        const commandInfo = extractSearchTermFromCommand(searchTerm);

        if (commandInfo) {
            // Filter by tag type and search term
            const { tagType, searchTerm: extractedSearchTerm } = commandInfo;
            const lowerTerm = extractedSearchTerm.toLowerCase();

            return tags.filter(tag => {
                // First filter by tag type
                const isFile = isFileTag(tag);
                const isInFolder = tagsInFileFolders.has(tag);

                let matchesType = false;
                if (tagType === 'blue' && isFile) {
                    matchesType = true;
                } else if (tagType === 'green' && isInFolder && !isFile) {
                    matchesType = true;
                } else if (tagType === 'grey' && !isFile && !isInFolder) {
                    matchesType = true;
                }

                if (!matchesType) return false;

                // Then filter by search term
                if (isFile) {
                    return getFileTagDisplayName(tag).toLowerCase().includes(lowerTerm);
                } else {
                    return tag.toLowerCase().includes(lowerTerm);
                }
            });
        }

        // Check if user typed just @[type]- without search term (e.g., "@green-")
        const tagType = extractTagTypeFromCommand(searchTerm);
        if (tagType) {
            // Filter by tag type only
            return tags.filter(tag => {
                const isFile = isFileTag(tag);
                const isInFolder = tagsInFileFolders.has(tag);

                if (tagType === 'blue' && isFile) {
                    return true;
                } else if (tagType === 'green' && isInFolder && !isFile) {
                    return true;
                } else if (tagType === 'grey' && !isFile && !isInFolder) {
                    return true;
                }
                return false;
            });
        }

        // Regular search (not an edit command)
        if (isTagEditCommandStart(searchTerm)) {
            // User typed @ but hasn't completed the command yet
            return tags;
        }

        // Normal filtering
        const lowerTerm = searchTerm.toLowerCase();
        return tags.filter(tag =>
            tag.toLowerCase().includes(lowerTerm) ||
            (isFileTag(tag) && getFileTagDisplayName(tag).toLowerCase().includes(lowerTerm))
        );
    }, [tags, searchTerm, tagsInFileFolders]);



    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setSearchTerm(''); // Clear search when modal closes
            setErrorMessage(''); // Clear error when modal closes
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        // Show popup when user types @ and hide when they type more
        if (searchTerm === '@') {
            setShowPopup(true);
            setErrorMessage('');
        } else {
            setShowPopup(false);
        }
    }, [searchTerm]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setErrorMessage(''); // Clear error on input change
    };

    const handleTagTypeSelect = (tagType: 'blue' | 'green' | 'grey') => {
        setSearchTerm(`@${tagType}-`);
        setShowPopup(false);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleTagEdit();
        } else if (e.key === 'Escape') {
            setSearchTerm('');
            setErrorMessage('');
            setShowPopup(false);
        }
    };

    const handleTagEdit = () => {
        const command = parseTagEditCommand(searchTerm);

        if (!command) {
            if (isTagEditCommandStart(searchTerm) && searchTerm !== '@') {
                setErrorMessage('Invalid command format. Use: @[type]-[old]/edit-[new]');
            }
            return;
        }

        // Find the actual tag name based on tag type
        let actualOldTagName = '';

        if (command.tagType === 'blue') {
            // For blue tags, we need to find the file tag
            const fileTag = tags.find(tag =>
                isFileTag(tag) && getFileTagDisplayName(tag).toLowerCase() === command.oldName.toLowerCase()
            );
            if (!fileTag) {
                setErrorMessage(`File tag "${command.oldName}" not found.`);
                return;
            }
            actualOldTagName = fileTag;
        } else if (command.tagType === 'green') {
            // For green tags, find the tag in tagsInFileFolders
            const greenTag = tags.find(tag =>
                tagsInFileFolders.has(tag) && tag.toLowerCase() === command.oldName.toLowerCase()
            );
            if (!greenTag) {
                setErrorMessage(`Content tag "${command.oldName}" not found.`);
                return;
            }
            actualOldTagName = greenTag;
        } else {
            // For grey tags, find regular tags
            const greyTag = tags.find(tag =>
                !isFileTag(tag) && !tagsInFileFolders.has(tag) && tag.toLowerCase() === command.oldName.toLowerCase()
            );
            if (!greyTag) {
                setErrorMessage(`Tag "${command.oldName}" not found.`);
                return;
            }
            actualOldTagName = greyTag;
        }

        // Determine the new tag name based on tag type
        let actualNewTagName = '';
        if (command.tagType === 'blue') {
            // For file tags, add the 'file' prefix
            actualNewTagName = 'file' + command.newName;
        } else {
            actualNewTagName = command.newName;
        }

        // Execute the rename
        const result = renameTag(actualOldTagName, actualNewTagName);

        if (result.success) {
            setSearchTerm('');
            setErrorMessage('');
            // Tag renamed successfully - could add success message state here if desired
        } else {

            setErrorMessage(result.error || 'Failed to rename tag.');
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] transition-all duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full mx-4 md:mx-8 max-w-2xl h-[60vh] sm:h-[450px] flex flex-col transform transition-all scale-100">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">All Tags</h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                            ({tags.length})
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Search tags or type @ to edit..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                            autoFocus
                        />
                        <TagEditPopup
                            isVisible={showPopup}
                            onSelect={handleTagTypeSelect}
                            inputRef={inputRef}
                        />
                    </div>
                    {extractTagTypeFromCommand(searchTerm) && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                💡 Click on a tag below to select it for editing
                            </p>
                        </div>
                    )}
                    {errorMessage && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                            <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                        </div>
                    )}
                </div>

                <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                    <style>{`
                        .custom-scrollbar::-webkit-scrollbar {
                            width: 8px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb {
                            background-color: rgba(156, 163, 175, 0.5);
                            border-radius: 20px;
                            border: 3px solid transparent;
                            background-clip: content-box;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                            background-color: rgba(156, 163, 175, 0.8);
                        }
                        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                            background-color: rgba(156, 163, 175, 0.3);
                        }
                        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                            background-color: rgba(156, 163, 175, 0.5);
                        }
                    `}</style>

                    {filteredTags.length === 0 ? (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                            No tags found matching "{searchTerm}"
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {filteredTags.map(tag => {
                                const isFile = isFileTag(tag);
                                const isSelected = selectedTags.includes(tag);
                                const isInsideFolderTag = !isFile && tagsInFileFolders.has(tag);

                                // Check if we're in edit mode
                                const tagType = extractTagTypeFromCommand(searchTerm);
                                const isEditMode = tagType !== null;

                                const baseClasses = "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors cursor-pointer select-none";
                                const selectedClasses = "bg-blue-500 text-white hover:bg-blue-600";
                                const unselectedFileClasses = "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-800/40";
                                const unselectedFolderTagClasses = "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-200 dark:hover:bg-green-800/40";
                                const unselectedNormalClasses = "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600";

                                const classes = `${baseClasses} ${isSelected
                                    ? selectedClasses
                                    : isFile
                                        ? unselectedFileClasses
                                        : isInsideFolderTag
                                            ? unselectedFolderTagClasses
                                            : unselectedNormalClasses
                                    }`;

                                // Handle tag click based on mode
                                const handleTagClick = () => {
                                    if (isEditMode && tagType) {
                                        // In edit mode: populate search field with the EXACT tag name
                                        const tagName = isFile ? getFileTagDisplayName(tag) : tag;
                                        // Preserve all characters including spaces, special symbols, etc.
                                        setSearchTerm(`@${tagType}-${tagName}`);
                                        setErrorMessage('');
                                    } else {
                                        // Normal mode: toggle tag selection
                                        onToggleTag(tag);
                                    }
                                };

                                return (
                                    <button
                                        key={tag}
                                        onClick={handleTagClick}
                                        className={classes}
                                    >
                                        {isFile && <Folder className="h-3.5 w-3.5" />}
                                        {isFile ? getFileTagDisplayName(tag) : tag}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedTags.length} selected
                    </span>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
