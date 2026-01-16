import { Note } from '../types/index';

/**
 * Positional Query Handler - Fixes RAG for ordinal/numbered item queries
 * 
 * Handles queries like:
 * - "3rd method of Knowledge Representation"
 * - "Step 5 of Building a small language model"  
 * - "What is the 2nd point?"
 */

export interface PositionalQueryResult {
    isPositional: boolean;
    position: number | null;
    topic: string | null;
    extractedItem: string | null;
    sourceNote: string | null;
    fullListContext: string | null;
}

export interface ParsedListItem {
    position: number;
    content: string;
    rawLine: string;
}

export interface ParsedList {
    items: ParsedListItem[];
    listType: 'numbered' | 'step' | 'bullet';
    topic?: string;
}

// Ordinal word to number mapping
const ORDINAL_WORDS: Record<string, number> = {
    'first': 1, '1st': 1,
    'second': 2, '2nd': 2,
    'third': 3, '3rd': 3,
    'fourth': 4, '4th': 4,
    'fifth': 5, '5th': 5,
    'sixth': 6, '6th': 6,
    'seventh': 7, '7th': 7,
    'eighth': 8, '8th': 8,
    'ninth': 9, '9th': 9,
    'tenth': 10, '10th': 10,
    'eleventh': 11, '11th': 11,
    'twelfth': 12, '12th': 12
};

/**
 * Detect if a query is asking for a specific numbered/positioned item
 */
export function detectPositionalQuery(question: string): { isPositional: boolean; position: number | null; topic: string | null } {
    const q = question.toLowerCase().trim();

    // Pattern 1: "3rd method of X", "5th step of Y"
    const ordinalMatch = q.match(/(\d+)(?:st|nd|rd|th)\s+(?:method|step|point|item|way|technique|rule|principle|type|kind|example|part|section|chapter|element|component|feature|tip|trick|hack|strategy|approach|phase|stage)(?:\s+(?:of|in|from|for))?\s*(.+)?/i);
    if (ordinalMatch) {
        return {
            isPositional: true,
            position: parseInt(ordinalMatch[1]),
            topic: ordinalMatch[2]?.trim() || null
        };
    }

    // Pattern 2: "step 5 of X", "method 3"
    const stepMatch = q.match(/(?:step|method|point|item|way|technique|rule|principle|type|kind|example|part|section|chapter|phase|stage)\s*#?\s*(\d+)(?:\s+(?:of|in|from|for))?\s*(.+)?/i);
    if (stepMatch) {
        return {
            isPositional: true,
            position: parseInt(stepMatch[1]),
            topic: stepMatch[2]?.trim() || null
        };
    }

    // Pattern 3: Ordinal words "first method", "third step"
    for (const [word, num] of Object.entries(ORDINAL_WORDS)) {
        const wordPattern = new RegExp(`\\b${word}\\s+(?:method|step|point|item|way|technique|rule|principle|type|kind|example|part|section|chapter|phase|stage)(?:\\s+(?:of|in|from|for))?\\s*(.+)?`, 'i');
        const match = q.match(wordPattern);
        if (match) {
            return {
                isPositional: true,
                position: num,
                topic: match[1]?.trim() || null
            };
        }
    }

    // Pattern 4: "give me 3rd" / "what is the 5th"
    const giveMatch = q.match(/(?:give|show|tell|what(?:'s|\s+is)?|get)\s+(?:me\s+)?(?:the\s+)?(\d+)(?:st|nd|rd|th)(?:\s+(?:one|item|method|step|point))?(?:\s+(?:of|in|from|for))?\s*(.+)?/i);
    if (giveMatch) {
        return {
            isPositional: true,
            position: parseInt(giveMatch[1]),
            topic: giveMatch[2]?.trim() || null
        };
    }

    // Pattern 5: Ordinal words with "give me"
    for (const [word, num] of Object.entries(ORDINAL_WORDS)) {
        const giveWordPattern = new RegExp(`(?:give|show|tell|what(?:'s|\\s+is)?|get)\\s+(?:me\\s+)?(?:the\\s+)?${word}(?:\\s+(?:one|item|method|step|point))?(?:\\s+(?:of|in|from|for))?\\s*(.+)?`, 'i');
        const match = q.match(giveWordPattern);
        if (match) {
            return {
                isPositional: true,
                position: num,
                topic: match[1]?.trim() || null
            };
        }
    }

    return { isPositional: false, position: null, topic: null };
}

/**
 * Parse numbered/bulleted lists from note content
 */
export function parseNumberedLists(content: string): ParsedList[] {
    const lists: ParsedList[] = [];
    const lines = content.split(/\r?\n/);

    let currentList: ParsedListItem[] = [];
    let currentType: 'numbered' | 'step' | 'bullet' = 'numbered';
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
            // Empty line might end a list
            if (currentList.length >= 2) {
                lists.push({ items: [...currentList], listType: currentType });
            }
            currentList = [];
            inList = false;
            continue;
        }

        // Pattern: "1. Item" or "1) Item" or "1: Item"
        const numberedMatch = line.match(/^(\d+)[.):]\s*(.+)/);
        if (numberedMatch) {
            const pos = parseInt(numberedMatch[1]);
            currentList.push({
                position: pos,
                content: numberedMatch[2].trim(),
                rawLine: line
            });
            inList = true;
            currentType = 'numbered';
            continue;
        }

        // Pattern: "Step 1 - Item" or "STEP 1 — Item" or "Step 1: Item"
        const stepMatch = line.match(/^(?:step|STEP)\s*(\d+)\s*[-—:]\s*(.+)/i);
        if (stepMatch) {
            const pos = parseInt(stepMatch[1]);
            currentList.push({
                position: pos,
                content: stepMatch[2].trim(),
                rawLine: line
            });
            inList = true;
            currentType = 'step';
            continue;
        }

        // Pattern: "- Item" or "* Item" or "• Item" (bullet list - use index)
        const bulletMatch = line.match(/^[-*•]\s+(.+)/);
        if (bulletMatch && !inList) {
            // Start a new bullet list
            currentList.push({
                position: currentList.length + 1,
                content: bulletMatch[1].trim(),
                rawLine: line
            });
            currentType = 'bullet';
            inList = true;
            continue;
        } else if (bulletMatch && inList && currentType === 'bullet') {
            // Continue bullet list
            currentList.push({
                position: currentList.length + 1,
                content: bulletMatch[1].trim(),
                rawLine: line
            });
            continue;
        }

        // If we're in a list and get a non-list line, check if it's a continuation
        if (inList && line.length > 0 && !line.match(/^[\d\-*•]/)) {
            // Might be a multi-line list item continuation
            if (currentList.length > 0) {
                // Append to previous item
                currentList[currentList.length - 1].content += ' ' + line;
            }
        }
    }

    // Don't forget the last list
    if (currentList.length >= 2) {
        lists.push({ items: [...currentList], listType: currentType });
    }

    return lists;
}

/**
 * Extract specific item at position from parsed lists
 */
export function extractPositionalItem(lists: ParsedList[], position: number): ParsedListItem | null {
    for (const list of lists) {
        const item = list.items.find(i => i.position === position);
        if (item) {
            return item;
        }
    }
    return null;
}

/**
 * Generate full list context for AI
 */
function generateListContext(lists: ParsedList[]): string {
    if (lists.length === 0) return '';

    let context = '';
    for (const list of lists) {
        context += `[${list.listType.toUpperCase()} LIST - ${list.items.length} items]\n`;
        for (const item of list.items) {
            context += `  ${item.position}. ${item.content}\n`;
        }
        context += '\n';
    }
    return context;
}

/**
 * Main handler - Process a positional query against relevant notes
 */
export function handlePositionalQuery(
    question: string,
    relevantNotes: Note[]
): PositionalQueryResult {
    // Step 1: Detect if query is positional
    const detection = detectPositionalQuery(question);

    if (!detection.isPositional || detection.position === null) {
        return {
            isPositional: false,
            position: null,
            topic: null,
            extractedItem: null,
            sourceNote: null,
            fullListContext: null
        };
    }

    // Step 2: Find notes with lists that match the topic
    let bestMatch: { note: Note; item: ParsedListItem; lists: ParsedList[] } | null = null;
    let bestScore = 0;

    for (const note of relevantNotes) {
        const lists = parseNumberedLists(note.content);
        if (lists.length === 0) continue;

        const item = extractPositionalItem(lists, detection.position);
        if (!item) continue;

        // Score based on topic match
        let score = 1;
        const noteText = `${note.title} ${note.content}`.toLowerCase();

        if (detection.topic) {
            const topicWords = detection.topic.toLowerCase().split(/\s+/);
            for (const word of topicWords) {
                if (word.length > 2 && noteText.includes(word)) {
                    score += 2;
                }
            }
        }

        // Prefer longer lists (more likely to be the "real" list)
        score += lists.reduce((sum, l) => sum + l.items.length, 0) * 0.1;

        if (score > bestScore) {
            bestScore = score;
            bestMatch = { note, item, lists };
        }
    }

    if (!bestMatch) {
        return {
            isPositional: true,
            position: detection.position,
            topic: detection.topic,
            extractedItem: null,
            sourceNote: null,
            fullListContext: null
        };
    }

    return {
        isPositional: true,
        position: detection.position,
        topic: detection.topic,
        extractedItem: bestMatch.item.content,
        sourceNote: bestMatch.note.title,
        fullListContext: generateListContext(bestMatch.lists)
    };
}

/**
 * Generate priority context for RAG system prompt
 */
export function generatePositionalContext(result: PositionalQueryResult): string {
    if (!result.isPositional || !result.extractedItem) {
        return '';
    }

    return `
*** POSITIONAL DATA (CRITICAL - USE THIS EXACT ANSWER!) ***
User is asking for: Item #${result.position}
EXACT ANSWER FROM NOTE: "${result.extractedItem}"
SOURCE NOTE: "${result.sourceNote}"

FULL LIST FOR CONTEXT:
${result.fullListContext}
*** YOU MUST USE THE ABOVE EXACT ANSWER. DO NOT PICK A DIFFERENT ITEM! ***
`;
}
