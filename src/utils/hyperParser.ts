
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
        type: 'pai' | 'wiki' | 'summary' | 'elaborate' | 'translate' | 'math';
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

    // 2. Split Title | Content
    let title = 'Untitled Note';
    let body = raw;

    if (raw.includes('|')) {
        const parts = raw.split('|');
        title = parts[0].trim();
        body = parts.slice(1).join('|').trim(); // Join back in case body contains |
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

    // Extract Tags: #tag or #fileTag
    const tagMatches = body.match(/(?:^|\s)#([a-zA-Z0-9\-_]+)/g);
    if (tagMatches) {
        tagMatches.forEach(m => {
            const tag = m.trim().slice(1);
            if (tag) tags.push(tag);
        });
        // Remove from body
        body = body.replace(/(?:^|\s)#([a-zA-Z0-9\-_]+)/g, ' ');
    }

    // Extract @hide
    if (body.toLowerCase().includes('@hide')) {
        tags.push('@hide');
        body = body.replace(/@hide/gi, ' ');
    }

    // Extract Color: c:red or c:pink
    const colorMatch = body.match(/(?:^|\s)c:([a-zA-Z]+)/i);
    if (colorMatch) {
        const c = colorMatch[1].toLowerCase();
        if (VALID_COLORS.includes(c)) {
            color = c;
        }
        body = body.replace(/(?:^|\s)c:([a-zA-Z]+)/i, ' ');
    }

    // Extract Font: f:Caveat
    const fontMatch = body.match(/(?:^|\s)f:([a-zA-Z0-9 ]+)(?:\s|$)/i);
    if (fontMatch) {
        fontFamily = fontMatch[1].trim();
        body = body.replace(/(?:^|\s)f:([a-zA-Z0-9 ]+)(?:\s|$)/i, ' ');
    }

    // Extract Flags
    if (body.includes('*')) {
        isFavorite = true;
        body = body.replace(/\*/g, ' ');
    }
    if (body.includes('^')) {
        isPinned = true;
        body = body.replace(/\^/g, ' ');
    }
    if (body.includes('!')) {
        isPrivate = true;
        body = body.replace(/!/g, ' ');
    }
    if (body.includes('?')) {
        isHidden = true;
        if (!tags.includes('@hide')) tags.push('@hide');
        body = body.replace(/\?/g, ' ');
    }

    // 4. Determine if there is a nested command in the (cleaned) body
    let nestedCommand: HyperParsedData['nestedCommand'];
    const cleanBody = body.trim();

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
