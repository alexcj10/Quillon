import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Folder, Tag, Check, AlertCircle, Pin, Star, ArrowLeft, Info } from 'lucide-react';
import { isFileTag, getFileTagDisplayName } from '../types';
import { useNotes } from '../context/NoteContext';
import {
    parseTagEditCommand, parseTagDeleteCommand, parseTagPinCommand, parseTagStarCommand,
    parseTagGroupCreateCommand, parseTagGroupDeleteCommand, parseTagGroupEnterCommand, parseTagGroupActionCommand,
    parseTagGroupRenameCommand,
    isTagEditCommandStart, extractSearchTermFromCommand, extractTagTypeFromCommand
} from '../utils/tagCommandParser';
import { TagEditPopup } from './TagEditPopup';
import { GroupCommandPopup } from './GroupCommandPopup';
import { GroupTagButton } from './GroupTagButton';
import { GroupOverviewPopup } from './GroupOverviewPopup';
import { TagRestrictionInfo } from './TagRestrictionInfo';

interface TagModalProps {
    isOpen: boolean;
    onClose: () => void;
    tags: string[];
    selectedTags: string[];
    onToggleTag: (tag: string) => void;
    tagsInFileFolders: Set<string>;
    showTrash: boolean;
    allVisibleTags: string[]; // helper for Orange Tag visibility
}
// ...



interface TagButtonProps {
    tag: string;
    isFile: boolean;
    isSelected: boolean;
    isInsideFolderTag: boolean;
    onClick: () => void;
    displayName: string;
    isPinned: boolean;
    isStarred: boolean;
}

function TagButton({ tag, isFile, isSelected, isInsideFolderTag, onClick, displayName, isPinned, isStarred }: TagButtonProps) {
    const baseClasses = "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors cursor-pointer select-none relative group";
    const selectedFileClasses = "bg-blue-500 text-white hover:bg-blue-600";
    const selectedFolderClasses = "bg-green-600 text-white hover:bg-green-700";
    const selectedNormalClasses = "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 hover:bg-black dark:hover:bg-white";

    const unselectedFileClasses = "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-800/40";
    const unselectedFolderTagClasses = "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-200 dark:hover:bg-green-800/40";
    const unselectedNormalClasses = "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600";

    const classes = `${baseClasses} ${isSelected
        ? isFile
            ? selectedFileClasses
            : isInsideFolderTag
                ? selectedFolderClasses
                : selectedNormalClasses
        : isFile
            ? unselectedFileClasses
            : isInsideFolderTag
                ? unselectedFolderTagClasses
                : unselectedNormalClasses
        }`;

    return (
        <button
            onClick={onClick}
            className={`${classes} min-w-0`}
            title={tag}
        >
            {isFile && <Folder className="h-3.5 w-3.5 flex-shrink-0" />}
            <span className="truncate max-w-[140px] sm:max-w-[180px]">
                {displayName}
            </span>
            {isPinned && <Pin className="h-3 w-3 ml-1 fill-current opacity-70 flex-shrink-0" />}
            {isStarred && <Star className="h-3 w-3 ml-1 fill-current opacity-70 text-yellow-500 flex-shrink-0" />}
        </button>
    );
}


export function TagModal({
    isOpen,
    onClose,
    tags,
    selectedTags,
    onToggleTag,
    tagsInFileFolders,
    showTrash,
    allVisibleTags = []
}: TagModalProps): JSX.Element | null {
    const [searchTerm, setSearchTerm] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [overviewGroup, setOverviewGroup] = useState<{ name: string; x: number; y: number } | null>(null);

    const handleGroupContextMenu = (e: React.MouseEvent, name: string) => {
        e.preventDefault();
        setOverviewGroup({ name, x: e.clientX, y: e.clientY });
    };

    const handleGroupLongPress = (name: string, x: number, y: number) => {
        setOverviewGroup({ name, x, y });
    };

    const inputRef = useRef<HTMLInputElement>(null);
    const {
        notes: allNotes, renameTag, deleteTag, pinnedTags, starredTags, togglePinTag, toggleStarTag,
        tagGroups, createTagGroup, deleteTagGroup, renameTagGroup, addTagToGroup, removeTagFromGroup,
        enterGroupView, exitGroupView, orangeMode, showHidden, setSelectedTags, showPrivateNotes
    } = useNotes();

    // Filter tagGroups by current space for display purposes
    const spaceFilteredTagGroups = useMemo(() =>
        tagGroups.filter(g => (g.isPrivate || false) === showPrivateNotes)
        , [tagGroups, showPrivateNotes]);

    // Calculate set of tags that are used exclusively as standard Grey Tags
    // (Notes that do NOT have any file tags)
    const tagsUsedAsGrey = useMemo(() => {
        const set = new Set<string>();
        allNotes.forEach(note => {
            const hasFileTags = note.tags.some(t => isFileTag(t));
            if (!hasFileTags) {
                note.tags.forEach(t => {
                    if (!isFileTag(t)) {
                        set.add(t);
                    }
                });
            }
        });
        return set;
    }, [allNotes]);
    const [validationState, setValidationState] = useState<{ isValid: boolean; message: string } | null>(null);

    const [isSpaceMode, setIsSpaceMode] = useState(false);
    const [groupViewMode, setGroupViewMode] = useState<'view' | 'drop' | 'remove' | 'neutral'>('neutral');
    const [showGroupPopup, setShowGroupPopup] = useState(false);

    // Tag Restriction Info State
    const [showTagRestrictionInfo, setShowTagRestrictionInfo] = useState(false);
    const [conflictingTagName, setConflictingTagName] = useState('');
    const [restrictionReason, setRestrictionReason] = useState<'green' | 'grey'>('green');
    const [showSyncInfo, setShowSyncInfo] = useState(false);

    // Effect to clear search and reset sub-mode when changing modes
    useEffect(() => {
        setSearchTerm('');
        setErrorMessage('');
        setValidationState(null);
        setGroupViewMode('neutral');
        setShowGroupPopup(false);
    }, [orangeMode.isActive, orangeMode.groupName]);

    // Reset state when modal is closed
    useEffect(() => {
        if (!isOpen) {
            setGroupViewMode('neutral');
            setSearchTerm('');
            setIsSpaceMode(false);
            setValidationState(null);
            setShowGroupPopup(false);
            setOverviewGroup(null);
            setShowSyncInfo(false);
        }
    }, [isOpen]);

    useEffect(() => {
        // Check for @space command validation
        if (searchTerm.toLowerCase() === '@space' && !isSpaceMode && !orangeMode.isActive) {
            setValidationState({
                isValid: true,
                message: 'Press Enter to open your Pinned & Favorite space'
            });
            return;
        }

        if (searchTerm.toLowerCase() === '@space-return' && isSpaceMode) {
            setValidationState({
                isValid: true,
                message: 'Press Enter to return to all tags'
            });
            return;
        }



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

                        const exists = tagType === 'orange'
                            ? tagGroups.some(g => g.name === newTagName)
                            : tags.some(t => t === targetName);

                        if (newTagName.length > 50) {
                            setValidationState({
                                isValid: false,
                                message: 'Max 50 characters allowed'
                            });
                        } else if (exists) {
                            const truncatedNewName = newTagName.length > 30 ? newTagName.substring(0, 27) + "..." : newTagName;
                            setValidationState({
                                isValid: false,
                                message: tagType === 'orange'
                                    ? `A group named '${truncatedNewName}' already exists.`
                                    : `The tag name '${truncatedNewName}' already exists. Please choose a different name.`
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
                    } else if (tagType === 'orange') {
                        tagExists = tagGroups.some(g => g.name === tagName);
                    } else {
                        tagExists = tags.some(tag =>
                            !isFileTag(tag) && !tagsInFileFolders.has(tag) && tag === tagName
                        );
                    }

                    if (tagExists) {
                        const truncatedTagName = tagName.length > 30 ? tagName.substring(0, 27) + "..." : tagName;
                        setValidationState({
                            isValid: true,
                            message: tagType === 'orange'
                                ? `Press Enter to delete group "${truncatedTagName}"`
                                : showTrash
                                    ? `Press Enter to permanently delete this tag and all associated notes`
                                    : `Press Enter to delete this tag and move all associated notes to trash`
                        });
                    } else {
                        const truncatedTagName = tagName.length > 30 ? tagName.substring(0, 27) + "..." : tagName;
                        setValidationState({
                            isValid: false,
                            message: tagType === 'orange'
                                ? `Group "${truncatedTagName}" not found`
                                : `Tag '${truncatedTagName}' not found`
                        });
                    }
                    return;
                }
            }
        }

        // Check for pin command validation
        if (searchTerm.includes('/pin')) {
            const parts = searchTerm.split('/pin');
            if (parts.length === 2 && parts[1] === '') {
                const commandInfo = extractSearchTermFromCommand(searchTerm);
                if (commandInfo) {
                    const { tagType, searchTerm: tagName } = commandInfo;
                    let actualTag = '';
                    if (tagType === 'orange') {
                        const group = tagGroups.find(g => g.name.toLowerCase() === tagName.toLowerCase());
                        actualTag = group?.name || '';
                    } else if (tagType === 'blue') {
                        actualTag = tags.find(tag => isFileTag(tag) && getFileTagDisplayName(tag) === tagName) || '';
                    } else if (tagType === 'green') {
                        actualTag = tags.find(tag => !isFileTag(tag) && tagsInFileFolders.has(tag) && tag === tagName) || '';
                    } else {
                        actualTag = tags.find(tag => !isFileTag(tag) && !tagsInFileFolders.has(tag) && tag === tagName) || '';
                    }

                    if (actualTag) {
                        const isPinned = pinnedTags.includes(actualTag);
                        setValidationState({
                            isValid: true,
                            message: `Press Enter to ${isPinned ? 'unpin' : 'pin'} this ${tagType === 'orange' ? 'group' : 'tag'}`
                        });
                    } else {
                        const truncatedTagName = tagName.length > 30 ? tagName.substring(0, 27) + "..." : tagName;
                        setValidationState({
                            isValid: false,
                            message: `${tagType === 'orange' ? 'Group' : 'Tag'} '${truncatedTagName}' not found`
                        });
                    }
                    return;
                }
            }
        }

        // Check for star command validation
        if (searchTerm.includes('/star') || searchTerm.includes('/fav')) {
            const separator = searchTerm.includes('/star') ? '/star' : '/fav';
            const parts = searchTerm.split(separator);
            if (parts.length === 2 && parts[1] === '') {
                const commandInfo = extractSearchTermFromCommand(searchTerm);
                if (commandInfo) {
                    const { tagType, searchTerm: tagName } = commandInfo;
                    let actualTag = '';
                    if (tagType === 'orange') {
                        const group = tagGroups.find(g => g.name.toLowerCase() === tagName.toLowerCase());
                        actualTag = group?.name || '';
                    } else if (tagType === 'blue') {
                        actualTag = tags.find(tag => isFileTag(tag) && getFileTagDisplayName(tag) === tagName) || '';
                    } else if (tagType === 'green') {
                        actualTag = tags.find(tag => !isFileTag(tag) && tagsInFileFolders.has(tag) && tag === tagName) || '';
                    } else {
                        actualTag = tags.find(tag => !isFileTag(tag) && !tagsInFileFolders.has(tag) && tag === tagName) || '';
                    }

                    if (actualTag) {
                        const isStarred = starredTags.includes(actualTag);
                        setValidationState({
                            isValid: true,
                            message: `Press Enter to ${isStarred ? 'remove from favorites' : 'add to favorites'} this ${tagType === 'orange' ? 'group' : 'tag'}`
                        });
                    } else {
                        const truncatedTagName = tagName.length > 30 ? tagName.substring(0, 27) + "..." : tagName;
                        setValidationState({
                            isValid: false,
                            message: `${tagType === 'orange' ? 'Group' : 'Tag'} '${truncatedTagName}' not found`
                        });
                    }
                    return;
                }
            }
        }

        // Check for create command validation (Orange Tags only)
        if (searchTerm.includes('/create')) {
            const parts = searchTerm.split('/create');
            if (parts.length === 2 && parts[1] === '') {
                const commandInfo = extractSearchTermFromCommand(searchTerm);
                if (commandInfo && commandInfo.tagType === 'orange') {
                    const groupName = commandInfo.searchTerm;
                    const exists = tagGroups.some(g => g.name === groupName);

                    if (groupName.length > 50) {
                        setValidationState({
                            isValid: false,
                            message: `Max 50 characters allowed`
                        });
                    } else if (exists) {
                        const truncatedGroupName = groupName.length > 30 ? groupName.substring(0, 27) + "..." : groupName;
                        setValidationState({
                            isValid: false,
                            message: `Group "${truncatedGroupName}" already exists.`
                        });
                    } else {
                        const truncatedGroupName = groupName.length > 30 ? groupName.substring(0, 27) + "..." : groupName;
                        setValidationState({
                            isValid: true,
                            message: `Press Enter to create group "${truncatedGroupName}"`
                        });
                    }
                    return;
                }
            }
        }

        // Check for etots (Enter The Orange Space) command validation (Orange Tags only)
        if (searchTerm.includes('/etots')) {
            const parts = searchTerm.split('/etots');
            if (parts.length === 2 && parts[1] === '') {
                const commandInfo = extractSearchTermFromCommand(searchTerm);
                if (commandInfo && commandInfo.tagType === 'orange') {
                    const groupName = commandInfo.searchTerm;
                    const exists = tagGroups.some(g => g.name === groupName);

                    if (exists) {
                        const truncatedGroupName = groupName.length > 30 ? groupName.substring(0, 27) + "..." : groupName;
                        setValidationState({
                            isValid: true,
                            message: `Press Enter to enter group "${truncatedGroupName}"`
                        });
                    } else {
                        const truncatedGroupName = groupName.length > 30 ? groupName.substring(0, 27) + "..." : groupName;
                        setValidationState({
                            isValid: false,
                            message: `Group "${truncatedGroupName}" not found.`
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
                        message: `Invalid command. Use "/edit-", "/delete", "/pin", or "/star"`
                    });
                    return;
                }

                // Check for other common typos or invalid commands
                const tagType = extractTagTypeFromCommand(searchTerm);
                let isValidCommand = false;

                if (tagType === 'orange') {
                    isValidCommand =
                        lowerAfterSlash.startsWith('edit') ||
                        lowerAfterSlash.startsWith('delete') ||
                        lowerAfterSlash.startsWith('create') ||
                        lowerAfterSlash.startsWith('etots') ||
                        lowerAfterSlash.startsWith('pin') ||
                        lowerAfterSlash.startsWith('star') ||
                        lowerAfterSlash.startsWith('fav');
                } else {
                    isValidCommand =
                        lowerAfterSlash.startsWith('edit') ||
                        lowerAfterSlash.startsWith('delete') ||
                        lowerAfterSlash.startsWith('pin') ||
                        lowerAfterSlash.startsWith('star') ||
                        lowerAfterSlash.startsWith('fav');
                }

                if (!isValidCommand) {
                    setValidationState({
                        isValid: false,
                        message: tagType === 'orange'
                            ? `Invalid command. Use "/edit-", "/delete", "/create", "/etots", "/pin", "/star", or "/fav"`
                            : `Invalid command. Use "/edit-", "/delete", "/pin", "/star", or "/fav"`
                    });
                    return;
                }
            }
        }

        setValidationState(null);
    }, [searchTerm, tags, tagsInFileFolders]);

    const filteredTags = useMemo(() => {
        // 1. Handle Orange Tag Mode
        if (orangeMode.isActive && orangeMode.groupName) {
            const currentGroup = tagGroups.find(g => g.name === orangeMode.groupName);
            if (!currentGroup) return [];

            if (groupViewMode === 'view' || groupViewMode === 'remove') {
                return currentGroup.tags;
            } else if (groupViewMode === 'drop' || groupViewMode === 'neutral') {
                // Show grey tags that are NOT in ANY group
                // Also exclude tags that are already in this group (redundant check if logic above is correct, but safe)
                const allGroupedTags = new Set(tagGroups.flatMap(g => g.tags));

                return tags.filter(tag => {
                    // Filter for Grey Tags only
                    const isFile = isFileTag(tag);
                    const isInFolder = tagsInFileFolders.has(tag);
                    const isGrey = !isFile && !isInFolder;

                    if (!isGrey) return false;

                    // Filter out already grouped tags
                    return !allGroupedTags.has(tag);
                });
            }
            return [];
        }

        // If no search term, return all tags (excluding grouped grey tags from main view)
        // Grouped grey tags are hidden from main list to reduce clutter
        const allGroupedTags = new Set(tagGroups.flatMap(g => g.tags));

        const visibleTags = tags.filter(tag => !allGroupedTags.has(tag));

        if (!searchTerm.trim()) return visibleTags;

        // Check if this is an edit command with search term
        const commandInfo = extractSearchTermFromCommand(searchTerm);

        if (commandInfo) {
            // Filter by tag type and search term
            const { tagType, searchTerm: extractedSearchTerm } = commandInfo;
            const lowerTerm = extractedSearchTerm.toLowerCase();

            // Special handling for Orange Tags search
            if (tagType === 'orange') {
                return []; // Orange Tags are handled in their own section in the renderer
            }

            return visibleTags.filter(tag => {
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
                // 'orange' handled above (mostly) logic separation needed

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
            if (tagType === 'orange') {
                // Return nothing from regular tags, handled in renderer
                return [];
            }

            // Filter by tag type only
            return visibleTags.filter(tag => {
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
            return visibleTags;
        }

        // Normal filtering
        const lowerTerm = searchTerm.toLowerCase();
        return visibleTags.filter(tag =>
            tag.toLowerCase().includes(lowerTerm) ||
            (isFileTag(tag) && getFileTagDisplayName(tag).toLowerCase().includes(lowerTerm))
        );
    }, [tags, searchTerm, tagsInFileFolders, orangeMode, groupViewMode, tagGroups]);

    const displayedTags = useMemo(() => {
        if (isSpaceMode) {
            // Return empty here, we will handle rendering separately for space mode
            return [];
        }
        return filteredTags;
    }, [isSpaceMode, filteredTags]);



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
        // Show tag type selection popup (@) only when exactly @ is typed and NOT in an orange tag
        if (searchTerm === '@' && !orangeMode.isActive) {
            setShowPopup(true);
            setErrorMessage('');
        } else {
            setShowPopup(false);
        }

        // Show group command popup when user types / inside an orange tag
        if (orangeMode.isActive && searchTerm === '/') {
            setShowGroupPopup(true);
            setErrorMessage('');
        } else {
            setShowGroupPopup(false);
        }
    }, [searchTerm, orangeMode.isActive]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        setErrorMessage(''); // Clear error on input change
    };

    const handleTagTypeSelect = (tagType: 'blue' | 'green' | 'grey' | 'orange') => {
        setSearchTerm(`@${tagType}-`);
        setShowPopup(false);
        inputRef.current?.focus();
    };

    const handleGroupCommandSelect = (command: 'drop' | 'view' | 'remove' | 'back') => {
        if (command === 'back') {
            exitGroupView();
        } else {
            setGroupViewMode(command);
        }
        setSearchTerm('');
        setShowGroupPopup(false);
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
        // 1. Handle Orange Tag Group Commands (Highest Priority)

        // Create Group: @orange-[name]/create
        const groupCreateCmd = parseTagGroupCreateCommand(searchTerm);
        if (groupCreateCmd) {
            if (groupCreateCmd.groupName.length > 50) {
                setErrorMessage("Group name cannot exceed 50 characters.");
                return;
            }
            const result = createTagGroup(groupCreateCmd.groupName);
            if (result.success) {
                setSearchTerm('');
                setErrorMessage('');
            } else {
                setErrorMessage(result.error || 'Failed to create group');
            }
            return;
        }

        // Delete Group: @orange-[name]/delete
        const groupDeleteCmd = parseTagGroupDeleteCommand(searchTerm);
        if (groupDeleteCmd) {
            const result = deleteTagGroup(groupDeleteCmd.groupName);
            if (result.success) {
                setSearchTerm('');
                setErrorMessage('');
            } else {
                setErrorMessage(result.error || 'Failed to delete group');
            }
            return;
        }

        // Enter Group: @orange-[name]/etots (Enter The Orange Space)
        const groupEnterCmd = parseTagGroupEnterCommand(searchTerm);
        if (groupEnterCmd) {
            enterGroupView(groupEnterCmd.groupName);
            setSearchTerm('');
            setErrorMessage('');
            return;
        }

        // Group Sub-commands: /drop, /view, /remove, /back
        const groupActionCmd = parseTagGroupActionCommand(searchTerm);
        if (orangeMode.isActive) {
            if (groupActionCmd) {
                if (groupActionCmd.action === 'back') {
                    exitGroupView();
                } else {
                    setGroupViewMode(groupActionCmd.action);
                }
                setSearchTerm('');
                setErrorMessage('');
                return;
            }

            // If user typed @ in orange mode and pressed Enter
            if (searchTerm.includes('@')) {
                setErrorMessage("Use / commands (like /drop, /view) while in an Orange Tag group.");
                return;
            }
        }

        // Administrative Orange Commands (Rename)
        const orangeRenameCmd = parseTagGroupRenameCommand(searchTerm);
        if (orangeRenameCmd) {
            if (orangeRenameCmd.newName.length > 50) {
                setErrorMessage("Group name cannot exceed 50 characters.");
                return;
            }
            const result = renameTagGroup(orangeRenameCmd.oldName, orangeRenameCmd.newName);
            if (result.success) {
                setSearchTerm('');
                setErrorMessage('');
            } else {
                setErrorMessage(result.error || "Failed to rename group.");
            }
            return;
        }

        // ... existing edit command logic ...
        // Try parsing as edit command first
        const editCommand = parseTagEditCommand(searchTerm);

        if (editCommand) {
            if (editCommand.newName.length > 50) {
                setErrorMessage("Tag name cannot exceed 50 characters.");
                return;
            }
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

            // Check for Renaming Conflict (Green/Grey Restriction)
            const isTargetFileTag = isFileTag(actualNewTagName);
            if (!isTargetFileTag) {
                const isTargetGreen = tagsInFileFolders.has(actualNewTagName);
                const isTargetGrey = tagsUsedAsGrey.has(actualNewTagName);
                const isCurrentGreen = tagsInFileFolders.has(actualOldTagName);

                // Case 1: Renaming a Grey tag to an existing Green tag name
                if (!isCurrentGreen && isTargetGreen) {
                    setErrorMessage(`"${actualNewTagName}" is reserved as a folder tag.`);
                    setConflictingTagName(actualNewTagName);
                    setRestrictionReason('green');
                    setShowTagRestrictionInfo(true);
                    return;
                }

                // Case 2: Renaming a Green tag to an existing Grey tag name
                if (isCurrentGreen && isTargetGrey) {
                    setErrorMessage(`"${actualNewTagName}" is already used as a standard tag.`);
                    setConflictingTagName(actualNewTagName);
                    setRestrictionReason('grey');
                    setShowTagRestrictionInfo(true);
                    return;
                }
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


        // Try parsing as pin command
        const pinCommand = parseTagPinCommand(searchTerm);
        if (pinCommand) {
            let actualTagName = '';
            // Resolve tag name logic (similar to delete)
            if (pinCommand.tagType === 'orange') {
                const group = tagGroups.find(g => g.name.toLowerCase() === pinCommand.tagName.toLowerCase());
                if (!group) { setErrorMessage(`Group "${pinCommand.tagName}" not found.`); return; }
                actualTagName = group.name;
            }
            else if (pinCommand.tagType === 'blue') {
                const fileTag = tags.find(tag => isFileTag(tag) && getFileTagDisplayName(tag) === pinCommand.tagName);
                if (!fileTag) { setErrorMessage(`Blue tag "${pinCommand.tagName}" not found.`); return; }
                actualTagName = fileTag;
            } else if (pinCommand.tagType === 'green') {
                const greenTag = tags.find(tag => !isFileTag(tag) && tagsInFileFolders.has(tag) && tag === pinCommand.tagName);
                if (!greenTag) { setErrorMessage(`Green tag "${pinCommand.tagName}" not found.`); return; }
                actualTagName = greenTag;
            } else {
                const greyTag = tags.find(tag => !isFileTag(tag) && !tagsInFileFolders.has(tag) && tag === pinCommand.tagName);
                if (!greyTag) { setErrorMessage(`Grey tag "${pinCommand.tagName}" not found.`); return; }
                actualTagName = greyTag;
            }
            togglePinTag(actualTagName);
            setSearchTerm('');
            setErrorMessage('');
            return;
        }

        // Try parsing as star command
        const starCommand = parseTagStarCommand(searchTerm);
        if (starCommand) {
            let actualTagName = '';
            // Resolve tag name logic
            if (starCommand.tagType === 'orange') {
                const group = tagGroups.find(g => g.name.toLowerCase() === starCommand.tagName.toLowerCase());
                if (!group) { setErrorMessage(`Group "${starCommand.tagName}" not found.`); return; }
                actualTagName = group.name;
            }
            else if (starCommand.tagType === 'blue') {
                const fileTag = tags.find(tag => isFileTag(tag) && getFileTagDisplayName(tag) === starCommand.tagName);
                if (!fileTag) { setErrorMessage(`Blue tag "${starCommand.tagName}" not found.`); return; }
                actualTagName = fileTag;
            } else if (starCommand.tagType === 'green') {
                const greenTag = tags.find(tag => !isFileTag(tag) && tagsInFileFolders.has(tag) && tag === starCommand.tagName);
                if (!greenTag) { setErrorMessage(`Green tag "${starCommand.tagName}" not found.`); return; }
                actualTagName = greenTag;
            } else {
                const greyTag = tags.find(tag => !isFileTag(tag) && !tagsInFileFolders.has(tag) && tag === starCommand.tagName);
                if (!greyTag) { setErrorMessage(`Grey tag "${starCommand.tagName}" not found.`); return; }
                actualTagName = greyTag;
            }
            toggleStarTag(actualTagName);
            setSearchTerm('');
            setErrorMessage('');
            return;
        }

        // Special Space Commands
        if (searchTerm.trim().toLowerCase() === '@space') {
            setIsSpaceMode(true);
            setSearchTerm('');
            setErrorMessage('');
            return;
        }

        if (searchTerm.trim().toLowerCase() === '@space-return') {
            setIsSpaceMode(false);
            setSearchTerm('');
            setErrorMessage('');
            return;
        }

        // If neither command matched
        if (isTagEditCommandStart(searchTerm) && searchTerm !== '@') {
            const tagType = extractTagTypeFromCommand(searchTerm);
            setErrorMessage(tagType === 'orange'
                ? 'Invalid command format. Use: @orange-[name]/create, .../delete, .../etots, .../pin, .../star, or .../edit-[new]'
                : 'Invalid command format. Use: .../edit-[new], .../delete, .../pin, or .../star');
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] transition-all duration-200"
            onClick={onClose}
        >
            <TagRestrictionInfo
                isOpen={showTagRestrictionInfo}
                onClose={() => setShowTagRestrictionInfo(false)}
                conflictingTagName={conflictingTagName}
                reason={restrictionReason}
            />
            <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full mx-4 md:mx-8 max-w-2xl h-[60vh] sm:h-[450px] flex flex-col transform transition-all scale-100"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 min-h-[65px]">
                    <div className="flex items-center gap-2">
                        {orangeMode.isActive ? (
                            <div className="flex items-center gap-3 min-w-0">
                                <button
                                    onClick={exitGroupView}
                                    className="p-1.5 -ml-1 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-full transition-colors flex items-center justify-center focus:outline-none flex-shrink-0"
                                    title="Back to all tags"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="flex items-center justify-center h-5 w-5 text-lg leading-none flex-shrink-0">🍊</span>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white capitalize truncate max-w-[120px] sm:max-w-[300px]" title={orangeMode.groupName || undefined}>
                                        {orangeMode.groupName}
                                    </h2>
                                    <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full text-amber-800 dark:text-amber-200 capitalize font-medium tracking-tight no-underline border border-amber-200 dark:border-amber-800/50 flex-shrink-0">
                                        {groupViewMode}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Tag className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">All Tags</h2>
                                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                    ({tags.length})
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            onClick={() => setShowSyncInfo(!showSyncInfo)}
                            className={`p-1.5 transition-all duration-200 rounded-lg flex items-center justify-center hover:scale-110 active:scale-95 ${showSyncInfo
                                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                                : 'text-gray-400 hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400'
                                }`}
                            title="Synchronization Guide"
                        >
                            <Info className="h-5 w-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Sync Info Popup */}
                {showSyncInfo && (
                    <div className="mx-4 mt-2 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/50 dark:border-blue-800/50 rounded-xl shadow-inner animate-in fade-in slide-in-from-top-2 duration-300 relative overflow-hidden group/info">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover/info:opacity-10 transition-opacity">
                            <Info className="h-24 w-24 -mr-8 -mt-8 rotate-12" />
                        </div>
                        <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                            <span className="flex items-center justify-center h-5 w-5 bg-blue-500 text-white rounded-full text-[10px] shadow-sm">!</span>
                            Tag Synchronization Rules
                        </h3>
                        <div className="space-y-4 text-[12px] leading-relaxed text-blue-700 dark:text-blue-200/80 h-[230px] overflow-y-auto scrollbar-hide pr-1 px-1">
                            <p className="bg-blue-100/40 dark:bg-blue-900/40 p-3 rounded-xl border border-blue-200/30 dark:border-blue-800/20 shadow-sm leading-snug">
                                <span className="font-bold text-blue-900 dark:text-blue-100 underline decoration-blue-400/30 text-[13px]">Crucial Rule:</span> <span className="font-bold">Removing</span>, <span className="font-bold">Deleting</span>, or <span className="font-bold">Renaming</span> a tag should <span className="italic">always</span> be done using <b>commands</b> from this modal. If done manually by editing a note, associated <b>Orange Tag Groups</b> will not be updated and may become stale.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-10">
                                <div className="p-3.5 bg-white/60 dark:bg-black/30 rounded-xl border border-blue-100 dark:border-blue-800/40 shadow-sm flex flex-col min-h-[150px]">
                                    <p className="font-bold text-blue-900 dark:text-blue-100 mb-2.5 flex items-center gap-2 text-[13px]">
                                        <span className="flex items-center justify-center p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg shadow-sm">🔄</span>
                                        Rename Workflow
                                    </p>
                                    <ol className="list-decimal ml-5 space-y-1.5 opacity-90 font-medium text-blue-800 dark:text-blue-200">
                                        <li>Remove from <b>Group</b></li>
                                        <li>Go to <b>Grey Tags</b></li>
                                        <li>Edit via <b>Command</b></li>
                                        <li>Add back to <b>Group</b></li>
                                    </ol>
                                </div>
                                <div className="p-3.5 bg-white/60 dark:bg-black/30 rounded-xl border border-blue-100 dark:border-blue-800/40 shadow-sm flex flex-col min-h-[150px]">
                                    <p className="font-bold text-blue-900 dark:text-blue-100 mb-2.5 flex items-center gap-2 text-[13px]">
                                        <span className="flex items-center justify-center p-1.5 bg-red-100 dark:bg-red-900/40 rounded-lg shadow-sm">🗑️</span>
                                        Delete Workflow
                                    </p>
                                    <ol className="list-decimal ml-5 space-y-1.5 opacity-90 font-medium text-blue-800 dark:text-blue-200">
                                        <li>Remove from <b>Group</b></li>
                                        <li>Go to <b>Grey Tags</b></li>
                                        <li>Delete via <b>Command</b></li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowSyncInfo(false)}
                            className="absolute top-2 right-2 p-1 text-blue-400 hover:text-blue-600 dark:text-blue-700 dark:hover:text-blue-500 transition-colors"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                )}

                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onKeyDown={handleKeyDown}
                            placeholder={orangeMode.isActive ? "Search or /" : "Search or @"}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                            autoFocus
                        />
                        <TagEditPopup
                            isVisible={showPopup}
                            onSelect={handleTagTypeSelect}
                            inputRef={inputRef}
                        />
                        <GroupCommandPopup
                            isVisible={showGroupPopup}
                            currentMode={groupViewMode}
                            onSelect={handleGroupCommandSelect}
                            inputRef={inputRef}
                        />
                    </div>
                    {extractTagTypeFromCommand(searchTerm) && !searchTerm.includes('/') && (
                        <div className={`mt-2 p-2 rounded-md border ${extractTagTypeFromCommand(searchTerm) === 'orange'
                            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                            }`}>
                            <p className={`text-sm ${extractTagTypeFromCommand(searchTerm) === 'orange'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-blue-600 dark:text-blue-400'
                                }`}>
                                {extractTagTypeFromCommand(searchTerm) === 'orange'
                                    ? "💡 Click on an orange tag below to select it for renaming, deleting, or entering the group"
                                    : "💡 Click on a tag below to select it for editing, deleting, pinning, or starring"}
                            </p>
                        </div>
                    )}
                    {orangeMode.isActive && (
                        <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                                {groupViewMode === 'drop' ? "💡 Click on a tag below to drop it into this group" :
                                    groupViewMode === 'remove' ? "💡 Click on a tag below to remove it from this group" :
                                        "💡 Click on a tag below to filter notes by this specific tag"}
                            </p>
                        </div>
                    )}
                    {validationState && (
                        <div className={`mt-2 p-2 border rounded-md flex items-center gap-2 overflow-hidden ${validationState.isValid
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                            }`}>
                            {validationState.isValid ? (
                                <Check className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                            ) : (
                                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                            )}
                            <p className={`text-sm break-words min-w-0 ${validationState.isValid
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                                }`}>
                                {validationState.message}
                            </p>
                        </div>
                    )}
                    {errorMessage && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md overflow-hidden">
                            <p className="text-sm text-red-600 dark:text-red-400 break-words">{errorMessage}</p>
                        </div>
                    )}
                </div>

                <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                    {/* ... styles ... */}
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
                        .scrollbar-hide::-webkit-scrollbar {
                            display: none;
                        }
                        .scrollbar-hide {
                            -ms-overflow-style: none; /* IE and Edge */
                            scrollbar-width: none; /* Firefox */
                        }
                    `}</style>


                    {isSpaceMode ? (
                        <div className="space-y-6">
                            {/* Pinned Section */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                                    <span className="text-lg">📌</span> Pinned
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {tags.filter(tag => pinnedTags.includes(tag)).map(tag => (
                                        <TagButton
                                            key={tag}
                                            tag={tag}
                                            isFile={isFileTag(tag)}
                                            isSelected={selectedTags.includes(tag)}
                                            isInsideFolderTag={!isFileTag(tag) && tagsInFileFolders.has(tag)}
                                            onClick={() => {
                                                onToggleTag(tag);
                                            }}
                                            displayName={isFileTag(tag) ? getFileTagDisplayName(tag) : tag}
                                            isPinned={true}
                                            isStarred={starredTags.includes(tag)}
                                        />
                                    ))}
                                    {tags.filter(tag => pinnedTags.includes(tag)).length === 0 && (
                                        <div className="text-sm text-gray-400 italic">No pinned tags yet.</div>
                                    )}
                                </div>
                            </div>

                            {/* Starred Section */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                                    <span className="text-lg">⭐</span> Favorites
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {tags.filter(tag => starredTags.includes(tag) && !pinnedTags.includes(tag)).map(tag => (
                                        <TagButton
                                            key={tag}
                                            tag={tag}
                                            isFile={isFileTag(tag)}
                                            isSelected={selectedTags.includes(tag)}
                                            isInsideFolderTag={!isFileTag(tag) && tagsInFileFolders.has(tag)}
                                            onClick={() => onToggleTag(tag)}
                                            displayName={isFileTag(tag) ? getFileTagDisplayName(tag) : tag}
                                            isPinned={false}
                                            isStarred={true}
                                        />
                                    ))}
                                    {tags.filter(tag => starredTags.includes(tag) && !pinnedTags.includes(tag)).length === 0 && (
                                        <div className="text-sm text-gray-400 italic">No starred tags yet.</div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-8 text-center">
                                <p className="text-xs text-gray-400">Type <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">@space-return</code> to go back</p>
                            </div>
                        </div>
                    ) : orangeMode.isActive ? (
                        <div className="flex flex-col h-full -mt-2">
                            {/* Tags List within Group View */}
                            <div className="flex-1 overflow-y-auto relative p-4">
                                <div className="flex flex-wrap gap-2">
                                    {displayedTags.map(tag => {
                                        // Logic for clicking inside Group Mode
                                        const handleClick = () => {
                                            if (groupViewMode === 'drop') {
                                                addTagToGroup(orangeMode.groupName!, tag);
                                            } else if (groupViewMode === 'remove') {
                                                removeTagFromGroup(orangeMode.groupName!, tag);
                                            } else {
                                                // View or Neutral mode: Filter notes
                                                onToggleTag(tag);
                                            }
                                        };

                                        return (
                                            <div key={tag} className="relative group">
                                                <TagButton
                                                    tag={tag}
                                                    isFile={false} // Only grey tags in groups
                                                    isSelected={selectedTags.includes(tag)}
                                                    isInsideFolderTag={false}
                                                    onClick={handleClick}
                                                    displayName={tag}
                                                    isPinned={false}
                                                    isStarred={false}
                                                />
                                                {groupViewMode === 'remove' && (
                                                    <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                                        ×
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                {displayedTags.length === 0 && (
                                    <div className="absolute inset-0 flex items-center justify-center p-4">
                                        <div className="text-sm text-gray-400 italic text-center">
                                            {groupViewMode === 'neutral' ? 'No available grey tags to drop.' :
                                                groupViewMode === 'drop' ? 'No available grey tags to drop.' :
                                                    groupViewMode === 'view' ? 'No tags in this group yet. Use /drop to add.' :
                                                        'No tags to remove.'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div>
                            {/* Orange Groups Section (Visible in Main View) */}
                            {(!searchTerm || searchTerm.startsWith('@') || searchTerm.toLowerCase().includes('orange')) && spaceFilteredTagGroups.length > 0 && (
                                <div className="mb-4">
                                    <div className="flex flex-wrap gap-2">
                                        {[...spaceFilteredTagGroups]
                                            .sort((a, b) => {
                                                const aPinned = pinnedTags.includes(a.name);
                                                const bPinned = pinnedTags.includes(b.name);
                                                if (aPinned && !bPinned) return -1;
                                                if (!aPinned && bPinned) return 1;
                                                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                                            })
                                            .filter(g => {
                                                if (showHidden) {
                                                    return g.tags?.some(tag => (allVisibleTags || []).includes(tag));
                                                }
                                                return true;
                                            }) // Visibility filter only for Hidden mode
                                            .filter(g => !searchTerm || (searchTerm.startsWith('@') && !searchTerm.toLowerCase().startsWith('@orange-')) || g.name.toLowerCase().includes(searchTerm.toLowerCase().replace('@orange-', '')))
                                            .map(group => {
                                                const tagType = extractTagTypeFromCommand(searchTerm);
                                                const handleGroupClick = () => {
                                                    if (tagType === 'orange') {
                                                        setSearchTerm(`@orange-${group.name}`);
                                                        setErrorMessage('');
                                                    } else {
                                                        enterGroupView(group.name);
                                                    }
                                                };
                                                return (
                                                    <GroupTagButton
                                                        key={group.id}
                                                        name={group.name}
                                                        isPinned={pinnedTags.includes(group.name)}
                                                        isStarred={starredTags.includes(group.name)}
                                                        onClick={handleGroupClick}
                                                        onContextMenu={handleGroupContextMenu}
                                                        onLongPress={handleGroupLongPress}
                                                    />
                                                );
                                            })}
                                    </div>
                                </div>
                            )}

                            {overviewGroup && (
                                <GroupOverviewPopup
                                    groupName={overviewGroup.name}
                                    tags={tagGroups.find(g => g.name === overviewGroup.name)?.tags || []}
                                    selectedTags={selectedTags}
                                    x={overviewGroup.x}
                                    y={overviewGroup.y}
                                    onClose={() => setOverviewGroup(null)}
                                    onTagSelect={(tag) => {
                                        if (selectedTags.includes(tag)) {
                                            // If already selected, clear it
                                            setSelectedTags([]);
                                        } else {
                                            // Single-select: Replace entire selection with this tag
                                            setSelectedTags([tag]);
                                        }
                                        setOverviewGroup(null);
                                        // Auto-close EVERYTHING
                                        onClose();
                                    }}
                                />
                            )}

                            {extractTagTypeFromCommand(searchTerm) === 'orange' && spaceFilteredTagGroups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase().replace('@orange-', ''))).length === 0 && (
                                <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                                    <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                                        <p className="font-semibold mb-1">Orange Tag Commands:</p>
                                        <div>Create: <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">@orange-[name]/create</code></div>
                                        <div>Delete: <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">@orange-[name]/delete</code></div>
                                        <div>Enter: <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">@orange-[name]/etots</code></div>
                                        <div>Rename: <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">@orange-[old]/edit-[new]</code></div>
                                        <div>Pin: <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">@orange-[name]/pin</code></div>
                                        <div>Star: <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">@orange-[name]/star</code></div>
                                        <div>Fav: <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">@orange-[name]/fav</code></div>
                                    </div>
                                </div>
                            )}

                            {displayedTags.length === 0 && spaceFilteredTagGroups.length === 0 ? (
                                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    No tags found matching "{searchTerm}"
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {displayedTags.map(tag => {
                                        const isFile = isFileTag(tag);
                                        const isSelected = selectedTags.includes(tag);
                                        const isInsideFolderTag = !isFile && tagsInFileFolders.has(tag);

                                        // Check if we're in edit mode
                                        const tagType = extractTagTypeFromCommand(searchTerm);
                                        const isEditMode = tagType !== null;

                                        // Handle tag click based on mode
                                        const handleTagClick = () => {
                                            if (isEditMode && tagType && tagType !== 'orange') {
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
                                            <TagButton
                                                key={tag}
                                                tag={tag}
                                                isFile={isFile}
                                                isSelected={isSelected}
                                                isInsideFolderTag={isInsideFolderTag}
                                                onClick={handleTagClick}
                                                displayName={isFile ? getFileTagDisplayName(tag) : tag}
                                                isPinned={pinnedTags.includes(tag)}
                                                isStarred={starredTags.includes(tag)}
                                            />
                                        );
                                    })}
                                </div>
                            )}
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
