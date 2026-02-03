
/**
 * Utility for parsing the high-power @new- command.
 * Syntax: @new-Title | Content/Command #tag1 #tag2 c:color f:font * ^ !
 */

export interface HyperParsedData {
    title: string;
    content: string;
    tags: string[];
    color: string;
    isPinned: boolean;
    isFavorite: boolean;
    isPrivate: boolean;
    isHidden: boolean;
    fontFamily?: string;
    nestedCommand?: {
        type: 'pai' | 'wiki' | 'summary' | 'elaborate' | 'translate' | 'math' | 'def';
        query: string;
    };
}

const VALID_COLORS = ['pink', 'purple', 'blue', 'green', 'yellow', 'orange'];

export function parseHyperCommand(input: string): HyperParsedData {
    // 1. Remove @new- prefix
    let raw = input.trim();
    if (raw.toLowerCase().startsWith('@new-')) {
        raw = raw.slice(5).trim();
    }

    // 2. Split Title || Content
    // Rules for Title Splitting:
    // - Skip if it starts with @ (Direct Command)
    // - Skip if it looks like a URL (starts with http, www, or contains ://)
    // - Use || (double pipe) as the delimiter to avoid clashes with dates, paths, etc.
    let title = 'Untitled Note';
    let body = raw;

    const isURL = /^(https?:\/\/|www\.)/i.test(raw) || raw.includes('://');
    const isDirectCommand = raw.startsWith('@');

    if (!isDirectCommand && !isURL && raw.includes('||')) {
        const firstDelimiterIndex = raw.indexOf('||');
        title = raw.substring(0, firstDelimiterIndex).trim();
        body = raw.substring(firstDelimiterIndex + 2).trim(); // +2 to skip ||
    }

    // 3. Extract Meta-Flags and clean the body
    // We search the entire body for flags, then remove them for the final content result

    const tags: string[] = [];
    let color = '';
    let isPinned = false;
    let isFavorite = false;
    let isPrivate = false;
    let isHidden = false;
    let fontFamily = '';

    // Extract Tags: ##tag or ##fileTag
    // Refinement: Enforce tags to start with a letter or underscore to avoid hex codes (##fff) or numbers (##1)
    const tagMatches = body.match(/(?:^|\s|\|\|)##([a-zA-Z_][a-zA-Z0-9\-_]*)/g);
    if (tagMatches) {
        tagMatches.forEach(m => {
            // Remove the possible leading separator (space or ||)
            // Then remove the two ## characters
            const tag = m.trim().replace(/^\|\|/, '').trim();
            // tag is now "##tagName" or "##tagName"
            if (tag.startsWith('##')) {
                tags.push(tag.slice(2));
            }
        });
        // Remove from body
        body = body.replace(/(?:^|\s|\|\|)##([a-zA-Z_][a-zA-Z0-9\-_]*)/g, ' ');
    }


    // Extract Color: c:red or c:pink
    const colorMatch = body.match(/(?:^|\s|\|\|)c:([a-zA-Z]+)/i);
    if (colorMatch) {
        const c = colorMatch[1].toLowerCase();
        if (VALID_COLORS.includes(c)) {
            color = c;
        }
        body = body.replace(/(?:^|\s|\|\|)c:([a-zA-Z]+)/i, ' ');
    }

    // Extract Font: f:Caveat
    const fontMatch = body.match(/(?:^|\s|\|\|)f:([a-zA-Z0-9 ]+)(?:\s|\|\||$)/i);
    if (fontMatch) {
        fontFamily = fontMatch[1].trim();
        body = body.replace(/(?:^|\s|\|\|)f:([a-zA-Z0-9 ]+)(?:\s|\|\||$)/i, ' ');
    }

    // Extract Flags (is:fav, is:pin, etc)
    const FLAG_PATTERNS = [
        { key: 'isFavorite', pattern: /(?:^|\s|\|\|)is:(?:fav|star)\b/gi },
        { key: 'isPinned', pattern: /(?:^|\s|\|\|)is:pin\b/gi },
        { key: 'isPrivate', pattern: /(?:^|\s|\|\|)is:(?:vault|private)\b/gi },
        { key: 'isHidden', pattern: /(?:^|\s|\|\|)is:hide\b/gi }
    ];

    FLAG_PATTERNS.forEach(({ key, pattern }) => {
        if (pattern.test(body)) {
            if (key === 'isFavorite') isFavorite = true;
            if (key === 'isPinned') isPinned = true;
            if (key === 'isPrivate') isPrivate = true;
            if (key === 'isHidden') isHidden = true;

            body = body.replace(pattern, ' ');
            if (key === 'isHidden' && !tags.includes('@hide')) tags.push('@hide');
        }
    });

    // 4. Determine if there is a nested command in the (cleaned) body
    let cleanBody = body.trim();

    // Cleanup: Remove stray || delimiters
    // 1. Remove || at the end
    while (cleanBody.endsWith('||')) {
        cleanBody = cleanBody.slice(0, -2).trim();
    }
    // 2. Remove || that are followed by spaces or at end
    cleanBody = cleanBody.replace(/\|\|(\s+|$)/g, '$1').trim();

    // 3. Final cleanup for multiple spaces
    cleanBody = cleanBody.replace(/\s+/g, ' ').trim();

    let nestedCommand: HyperParsedData['nestedCommand'];

    const lowerBody = cleanBody.toLowerCase();
    if (lowerBody.startsWith('@pai-')) {
        nestedCommand = { type: 'pai', query: cleanBody.slice(5).trim() };
    } else if (lowerBody.startsWith('@wiki-')) {
        nestedCommand = { type: 'wiki', query: cleanBody.slice(6).trim() };
    } else if (lowerBody.startsWith('@t-')) {
        nestedCommand = { type: 'translate', query: cleanBody.slice(3).trim() };
    } else if (lowerBody === '@summary') {
        nestedCommand = { type: 'summary', query: '' };
    } else if (lowerBody === '@elaboration') {
        nestedCommand = { type: 'elaborate', query: '' };
    } else if (lowerBody.startsWith('@def-')) {
        nestedCommand = { type: 'def', query: cleanBody.slice(5).trim() };
    } else if (lowerBody.startsWith('@c-')) {
        nestedCommand = { type: 'math', query: cleanBody.slice(3).trim() };
    }

    return {
        title: title || 'Untitled Note',
        content: cleanBody,
        tags,
        color,
        isPinned,
        isFavorite,
        isPrivate,
        isHidden,
        fontFamily,
        nestedCommand
    };
}
