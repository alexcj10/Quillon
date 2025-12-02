export interface TagEditCommand {
  tagType: 'blue' | 'green' | 'grey';
  oldName: string;
  newName: string;
}

export interface TagDeleteCommand {
  tagType: 'blue' | 'green' | 'grey';
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

/**
 * Extracts search term from a partial tag edit command
 * Examples:
 * - "@blue-A" => { tagType: 'blue', searchTerm: 'A' }
 * - "@green-Java" => { tagType: 'green', searchTerm: 'Java' }
 * - "@grey-s" => { tagType: 'grey', searchTerm: 's' }
 * - "@blue-Alex/edit-" => { tagType: 'blue', searchTerm: 'Alex' }
 * Returns null if not a valid partial command
 */
export function extractSearchTermFromCommand(input: string): { tagType: 'blue' | 'green' | 'grey'; searchTerm: string } | null {
  if (!input.startsWith('@')) {
    return null;
  }

  // Match pattern: @[type]-[searchTerm] (with optional /edit-[newName])
  const partialPattern = /^@(blue|green|grey)-([^/]+)/;
  const match = input.match(partialPattern);

  if (!match) {
    return null;
  }

  const [, tagType, searchTerm] = match;

  return {
    tagType: tagType as 'blue' | 'green' | 'grey',
    searchTerm: searchTerm.trim(),
  };
}

/**
 * Extracts just the tag type from a command, even without a search term
 * Examples:
 * - "@blue-" => 'blue'
 * - "@green-" => 'green'
 * - "@grey-Code" => 'grey'
 * Returns null if not a valid command start
 */
export function extractTagTypeFromCommand(input: string): 'blue' | 'green' | 'grey' | null {
  if (!input.startsWith('@')) {
    return null;
  }

  // Match pattern: @[type] (with optional dash and anything after)
  const typePattern = /^@(blue|green|grey)/;
  const match = input.match(typePattern);

  if (!match) {
    return null;
  }

  return match[1] as 'blue' | 'green' | 'grey';
}
