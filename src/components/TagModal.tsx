import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Folder, Tag, Check, AlertCircle } from 'lucide-react';
import { isFileTag, getFileTagDisplayName } from '../types';
import { useNotes } from '../context/NoteContext';
import { parseTagEditCommand, parseTagDeleteCommand, isTagEditCommandStart, extractSearchTermFromCommand, extractTagTypeFromCommand } from '../utils/tagCommandParser';
import { TagEditPopup } from './TagEditPopup';

interface TagModalProps {
    isOpen: boolean;
    onClose: () => void;
    tags: string[];
    selectedTags: string[];
    onToggleTag: (tag: string) => void;
    tagsInFileFolders: Set<string>;
    showTrash: boolean;
}

export function TagModal({
    isOpen,
    onClose,
    tags,
    selectedTags,
    onToggleTag,
    tagsInFileFolders,
    showTrash
}: TagModalProps): JSX.Element | null {
    const [searchTerm, setSearchTerm] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const { renameTag, deleteTag } = useNotes();
    const [validationState, setValidationState] = useState<{ isValid: boolean; message: string } | null>(null);

    useEffect(() => {
        // Check for edit command validation
        if (searchTerm.includes('/edit-')) {
            const parts = searchTerm.split('/edit-');
            if (parts.length === 2) {
                const newTagName = parts[1];
                if (newTagName.length > 0) {
                    const commandInfo = extractSearchTermFromCommand(searchTerm);
                    if (commandInfo) {
                        const { tagType } = commandInfo;
                        let targetName = newTagName;
                        if (tagType === 'blue') {
                            targetName = 'file' + newTagName;
                        }

                        const exists = tags.some(t => t === targetName);

                        if (exists) {
                            setValidationState({
                                isValid: false,
                                message: `The tag name '${newTagName}' already exists. Please choose a different name.`
                            });
                        } else {
                            setValidationState({
                                isValid: true,
                                message: 'This tag name is available'
                            });
                        }
                        return;
                    }
                }
            }
        }

        // Check for delete command validation
        if (searchTerm.includes('/delete')) {
            const parts = searchTerm.split('/delete');
            if (parts.length === 2 && parts[1] === '') {
                // Valid delete command format
                const commandInfo = extractSearchTermFromCommand(searchTerm);
                if (commandInfo) {
                    const { tagType, searchTerm: tagName } = commandInfo;

                    // Check if the tag exists
                    let tagExists = false;
                    if (tagType === 'blue') {
                        tagExists = tags.some(tag =>
                            isFileTag(tag) && getFileTagDisplayName(tag) === tagName
                        );
                    } else if (tagType === 'green') {
                        tagExists = tags.some(tag =>
                            !isFileTag(tag) && tagsInFileFolders.has(tag) && tag === tagName
                        );
                    } else {
                        tagExists = tags.some(tag =>
                            !isFileTag(tag) && !tagsInFileFolders.has(tag) && tag === tagName
                        );
                    }

                    if (tagExists) {
                        setValidationState({
                            isValid: true,
                            message: showTrash
                                ? `Press Enter to permanently delete this tag and all associated notes`
                                : `Press Enter to delete this tag and move all associated notes to trash`
                        });
                    } else {
                        setValidationState({
                            isValid: false,
                            message: `Tag '${tagName}' not found`
                        });
                    }
                    return;
                }
            }
        }

        // Check for typos in command keywords (e.g., /editt, /deletes, etc.)
        if (searchTerm.includes('/') && extractTagTypeFromCommand(searchTerm)) {
            const afterSlash = searchTerm.split('/')[1];
            if (afterSlash) {
                const lowerAfterSlash = afterSlash.toLowerCase();

                // Check if it's a typo of "edit" or "delete"
                const isEditTypo = lowerAfterSlash.startsWith('edit') && !lowerAfterSlash.startsWith('edit-');
                const isDeleteTypo = lowerAfterSlash.startsWith('delet') && lowerAfterSlash !== 'delete';

                if (isEditTypo || isDeleteTypo) {
                    setValidationState({
                        isValid: false,
                        message: `Invalid command. Use "/edit-" for renaming or "/delete" for deletion`
                    });
                    return;
                }

                // Check for other common typos
                if (!lowerAfterSlash.startsWith('edit') && !lowerAfterSlash.startsWith('delete')) {
                    setValidationState({
                        isValid: false,
                        message: `Invalid command. Use "/edit-[newname]" or "/delete"`
                    });
                    return;
                }
            }
        }

        setValidationState(null);
    }, [searchTerm, tags, tagsInFileFolders]);

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
        // Try parsing as edit command first
        const editCommand = parseTagEditCommand(searchTerm);

        if (editCommand) {
            // Handle rename logic (existing code)
            let actualOldTagName = '';

            if (editCommand.tagType === 'blue') {
                const fileTag = tags.find(tag =>
                    isFileTag(tag) && getFileTagDisplayName(tag) === editCommand.oldName
                );
                if (!fileTag) {
                    setErrorMessage(`Blue tag "${editCommand.oldName}" not found.`);
                    return;
                }
                actualOldTagName = fileTag;
            } else if (editCommand.tagType === 'green') {
                const greenTag = tags.find(tag =>
                    !isFileTag(tag) && tagsInFileFolders.has(tag) && tag === editCommand.oldName
                );
                if (!greenTag) {
                    setErrorMessage(`Green tag "${editCommand.oldName}" not found.`);
                    return;
                }
                actualOldTagName = greenTag;
            } else {
                const greyTag = tags.find(tag =>
                    !isFileTag(tag) && !tagsInFileFolders.has(tag) && tag === editCommand.oldName
                );
                if (!greyTag) {
                    setErrorMessage(`Grey tag "${editCommand.oldName}" not found.`);
                    return;
                }
                actualOldTagName = greyTag;
            }

            let actualNewTagName = '';
            if (editCommand.tagType === 'blue') {
                actualNewTagName = 'file' + editCommand.newName;
            } else {
                actualNewTagName = editCommand.newName;
            }

            const result = renameTag(actualOldTagName, actualNewTagName);

            if (result.success) {
                setSearchTerm('');
                setErrorMessage('');
            } else {
                setErrorMessage(result.error || 'Failed to rename tag.');
            }
            return;
        }

        // Try parsing as delete command
        const deleteCommand = parseTagDeleteCommand(searchTerm);

        if (deleteCommand) {
            // Handle delete logic
            let actualTagName = '';

            if (deleteCommand.tagType === 'blue') {
                const fileTag = tags.find(tag =>
                    isFileTag(tag) && getFileTagDisplayName(tag) === deleteCommand.tagName
                );
                if (!fileTag) {
                    setErrorMessage(`Blue tag "${deleteCommand.tagName}" not found.`);
                    return;
                }
                actualTagName = fileTag;
            } else if (deleteCommand.tagType === 'green') {
                const greenTag = tags.find(tag =>
                    !isFileTag(tag) && tagsInFileFolders.has(tag) && tag === deleteCommand.tagName
                );
                if (!greenTag) {
                    setErrorMessage(`Green tag "${deleteCommand.tagName}" not found.`);
                    return;
                }
                actualTagName = greenTag;
            } else {
                const greyTag = tags.find(tag =>
                    !isFileTag(tag) && !tagsInFileFolders.has(tag) && tag === deleteCommand.tagName
                );
                if (!greyTag) {
                    setErrorMessage(`Grey tag "${deleteCommand.tagName}" not found.`);
                    return;
                }
                actualTagName = greyTag;
            }

            const result = deleteTag(actualTagName, showTrash);

            if (result.success) {
                setSearchTerm('');
                setErrorMessage('');
            } else {
                setErrorMessage(result.error || 'Failed to delete tag.');
            }
            return;
        }

        // If neither command matched
        if (isTagEditCommandStart(searchTerm) && searchTerm !== '@') {
            setErrorMessage('Invalid command format. Use: @[type]-[old]/edit-[new] or @[type]-[tag]/delete');
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] transition-all duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full mx-4 md:mx-8 max-w-2xl h-[60vh] sm:h-[450px] flex flex-col transform transition-all scale-100"
                onClick={e => e.stopPropagation()}
            >
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
                            placeholder="Search tags or @ to edit/delete"
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                            autoFocus
                        />
                        <TagEditPopup
                            isVisible={showPopup}
                            onSelect={handleTagTypeSelect}
                            inputRef={inputRef}
                        />
                    </div>
                    {extractTagTypeFromCommand(searchTerm) && !searchTerm.includes('/') && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                💡 Click on a tag below to select it for editing or deleting
                            </p>
                        </div>
                    )}
                    {validationState && (
                        <div className={`mt-2 p-2 border rounded-md flex items-center gap-2 ${validationState.isValid
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                            }`}>
                            {validationState.isValid ? (
                                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                            ) : (
                                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            )}
                            <p className={`text-sm ${validationState.isValid
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                                }`}>
                                {validationState.message}
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
