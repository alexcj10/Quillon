export interface TagEditCommand {
  tagType: 'blue' | 'green' | 'grey';
  oldName: string;
  newName: string;
}

export interface TagDeleteCommand {
  tagType: 'blue' | 'green' | 'grey';
  tagName: string;
}


export interface TagPinCommand {
  tagType: 'blue' | 'green' | 'grey' | 'orange';
  tagName: string;
}

export interface TagStarCommand {
  tagType: 'blue' | 'green' | 'grey' | 'orange';
  tagName: string;
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
 * Parses tag delete command in format: @[type]-[tagname]/delete
 * Returns parsed command object or null if invalid
 */
export function parseTagDeleteCommand(input: string): TagDeleteCommand | null {
  // Check if input starts with @
  if (!input.startsWith('@')) {
    return null;
  }

  // Match pattern: @[type]-[tagname]/delete
  const pattern = /^@(blue|green|grey)-(.+?)\/delete$/;
  const match = input.match(pattern);

  if (!match) {
    return null;
  }

  const [, tagType, tagName] = match;

  // Validate that tag name is not empty after trimming
  if (!tagName.trim()) {
    return null;
  }

  return {
    tagType: tagType as 'blue' | 'green' | 'grey',
    tagName: tagName.trim(),
  };
}

/**
 * Parses tag pin command in format: @[type]-[tagname]/pin
 * Returns parsed command object or null if invalid
 */
export function parseTagPinCommand(input: string): TagPinCommand | null {
  if (!input.startsWith('@')) return null;

  const pattern = /^@(blue|green|grey|orange)-(.+?)\/pin$/;
  const match = input.match(pattern);

  if (!match) return null;

  const [, tagType, tagName] = match;

  if (!tagName.trim()) return null;

  return {
    tagType: tagType as 'blue' | 'green' | 'grey',
    tagName: tagName.trim(),
  };
}

/**
 * Parses tag star command in format: @[type]-[tagname]/star or /fav
 * Returns parsed command object or null if invalid
 */
export function parseTagStarCommand(input: string): TagStarCommand | null {
  if (!input.startsWith('@')) return null;

  // Support both /star and /fav
  const pattern = /^@(blue|green|grey|orange)-(.+?)\/(star|fav)$/;
  const match = input.match(pattern);

  if (!match) return null;

  const [, tagType, tagName] = match;

  if (!tagName.trim()) return null;

  return {
    tagType: tagType as 'blue' | 'green' | 'grey',
    tagName: tagName.trim(),
  };
}

// Orange Tag (Group) Commands

export interface TagGroupCreateCommand {
  groupName: string;
}

export interface TagGroupDeleteCommand {
  groupName: string;
}

export interface TagGroupEnterCommand {
  groupName: string;
}

export interface TagGroupActionCommand {
  action: 'drop' | 'view' | 'remove' | 'back';
}

export interface TagGroupRenameCommand {
  oldName: string;
  newName: string;
}

/**
 * Parses group create command: @orange-[name]/create
 */
export function parseTagGroupCreateCommand(input: string): TagGroupCreateCommand | null {
  if (!input.startsWith('@')) return null;
  const pattern = /^@orange-(.+?)\/create$/;
  const match = input.match(pattern);
  if (!match) return null;
  const [, groupName] = match;
  if (!groupName.trim()) return null;
  return { groupName: groupName.trim() };
}

/**
 * Parses group delete command: @orange-[name]/delete
 */
export function parseTagGroupDeleteCommand(input: string): TagGroupDeleteCommand | null {
  if (!input.startsWith('@')) return null;
  const pattern = /^@orange-(.+?)\/delete$/;
  const match = input.match(pattern);
  if (!match) return null;
  const [, groupName] = match;
  if (!groupName.trim()) return null;
  return { groupName: groupName.trim() };
}

/**
 * Parses group enter command: @orange-[name]/etots
 */
export function parseTagGroupEnterCommand(input: string): TagGroupEnterCommand | null {
  if (!input.startsWith('@')) return null;
  const pattern = /^@orange-(.+?)\/etots$/; // User requested 'etots' which stands for Enter The Orange Space
  const match = input.match(pattern);
  if (!match) return null;
  const [, groupName] = match;
  if (!groupName.trim()) return null;
  return { groupName: groupName.trim() };
}

/**
 * Parses group action commands (e.g., /view, /edit-new)
 */
export function parseTagGroupActionCommand(input: string): TagGroupActionCommand | null {
  if (!input.startsWith('/')) return null;
  const pattern = /^\/(drop|view|remove|back)$/;
  const match = input.match(pattern);
  if (!match) return null;
  return { action: match[1] as 'drop' | 'view' | 'remove' | 'back' };
}

/**
 * Parses group rename command: @orange-[oldName]/edit-[newName]
 */
export function parseTagGroupRenameCommand(input: string): TagGroupRenameCommand | null {
  if (!input.startsWith('@')) return null;
  const pattern = /^@orange-(.+?)\/edit-(.+)$/;
  const match = input.match(pattern);
  if (!match) return null;
  const [, oldName, newName] = match;
  if (!oldName.trim() || !newName.trim()) return null;
  return { oldName: oldName.trim(), newName: newName.trim() };
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
  if ('blue'.startsWith(partial) || 'green'.startsWith(partial) || 'grey'.startsWith(partial) || 'orange'.startsWith(partial)) {
    return partial;
  }

  return null;
}

/**
 * Extracts search term from a partial tag edit command
 * Return type updated to include 'orange'
 */
export function extractSearchTermFromCommand(input: string): { tagType: 'blue' | 'green' | 'grey' | 'orange'; searchTerm: string } | null {
  if (!input.startsWith('@')) {
    return null;
  }

  // Match pattern: @[type]-[searchTerm] (with optional /edit-[newName])
  const partialPattern = /^@(blue|green|grey|orange)-([^/]+)/;
  const match = input.match(partialPattern);

  if (!match) {
    return null;
  }

  const [, tagType, searchTerm] = match;

  return {
    tagType: tagType as 'blue' | 'green' | 'grey' | 'orange',
    searchTerm: searchTerm.trim(),
  };
}

/**
 * Extracts just the tag type from a command, even without a search term
 * Return type updated to include 'orange'
 */
export function extractTagTypeFromCommand(input: string): 'blue' | 'green' | 'grey' | 'orange' | null {
  if (!input.startsWith('@')) {
    return null;
  }

  // Match pattern: @[type] (with optional dash and anything after)
  const typePattern = /^@(blue|green|grey|orange)/;
  const match = input.match(typePattern);

  if (!match) {
    return null;
  }

  return match[1] as 'blue' | 'green' | 'grey' | 'orange';
}
