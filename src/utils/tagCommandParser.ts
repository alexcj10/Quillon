export interface TagEditCommand {
  tagType: 'blue' | 'green' | 'grey';
  oldName: string;
  newName: string;
}

/**
 * Parses tag edit command in format: @[type]-[old]/edit-[new]
 * Returns parsed command object or null if invalid
 */
export function parseTagEditCommand(input: string): TagEditCommand | null {
  // Check if input starts with @
  if (!input.startsWith('@')) {
    return null;
  }

  // Match pattern: @[type]-[old]/edit-[new]
  const pattern = /^@(blue|green|grey)-(.+?)\/edit-(.+)$/;
  const match = input.match(pattern);

  if (!match) {
    return null;
  }

  const [, tagType, oldName, newName] = match;

  // Validate that names are not empty after trimming
  if (!oldName.trim() || !newName.trim()) {
    return null;
  }

  // Validate new name doesn't contain invalid characters
  // Allow alphanumeric, spaces, hyphens, underscores
  const validNamePattern = /^[a-zA-Z0-9\s\-_]+$/;
  if (!validNamePattern.test(newName.trim())) {
    return null;
  }

  return {
    tagType: tagType as 'blue' | 'green' | 'grey',
    oldName: oldName.trim(),
    newName: newName.trim(),
  };
}

/**
 * Checks if input is potentially a tag edit command (starts with @)
 */
export function isTagEditCommandStart(input: string): boolean {
  return input.startsWith('@');
}

/**
 * Gets the current tag type being typed (if any)
 */
export function getPartialTagType(input: string): string | null {
  if (!input.startsWith('@')) {
    return null;
  }

  const partial = input.slice(1).toLowerCase();
  
  // Check if it matches the start of any tag type
  if ('blue'.startsWith(partial) || 'green'.startsWith(partial) || 'grey'.startsWith(partial)) {
    return partial;
  }

  return null;
}
