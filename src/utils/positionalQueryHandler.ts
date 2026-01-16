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
 * Enhanced to capture FULL multi-line content under each step
 */
export function parseNumberedLists(content: string): ParsedList[] {
    const lists: ParsedList[] = [];
    const lines = content.split(/\r?\n/);

    // First pass: identify all step/numbered headers and their line positions
    interface StepMarker {
        lineIndex: number;
        position: number;
        title: string;
        type: 'numbered' | 'step';
    }

    const stepMarkers: StepMarker[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Pattern: "1. Item" or "1) Item" or "1: Item"
        const numberedMatch = line.match(/^(\d+)[.):]\s*(.+)/);
        if (numberedMatch) {
            stepMarkers.push({
                lineIndex: i,
                position: parseInt(numberedMatch[1]),
                title: numberedMatch[2].trim(),
                type: 'numbered'
            });
            continue;
        }

        // Pattern: "Step 1 - Item" or "STEP 1 — Item" or "Step 1: Item"
        const stepMatch = line.match(/^(?:step|STEP)\s*(\d+)\s*[-—:]\s*(.+)/i);
        if (stepMatch) {
            stepMarkers.push({
                lineIndex: i,
                position: parseInt(stepMatch[1]),
                title: stepMatch[2].trim(),
                type: 'step'
            });
            continue;
        }
    }

    // If we found step markers, extract full content for each
    if (stepMarkers.length >= 2) {
        const items: ParsedListItem[] = [];

        for (let i = 0; i < stepMarkers.length; i++) {
            const currentMarker = stepMarkers[i];
            const nextMarker = stepMarkers[i + 1];

            // Get all lines from current marker to next marker (or end of content)
            const startLine = currentMarker.lineIndex;
            const endLine = nextMarker ? nextMarker.lineIndex : lines.length;

            // Collect all content lines
            const contentLines: string[] = [];
            for (let j = startLine + 1; j < endLine; j++) {
                const line = lines[j];
                // Skip completely empty lines at the end
                if (line.trim() || contentLines.length > 0) {
                    contentLines.push(line);
                }
            }

            // Trim trailing empty lines
            while (contentLines.length > 0 && !contentLines[contentLines.length - 1].trim()) {
                contentLines.pop();
            }

            // Build full content: title + all sub-content
            let fullContent = currentMarker.title;
            if (contentLines.length > 0) {
                fullContent += '\n' + contentLines.join('\n');
            }

            items.push({
                position: currentMarker.position,
                content: fullContent,
                rawLine: lines[currentMarker.lineIndex]
            });
        }

        if (items.length >= 2) {
            lists.push({
                items,
                listType: stepMarkers[0].type
            });
        }
    }

    // Fallback: Simple list parsing for notes without step markers
    // (e.g., just "1. A\n2. B\n3. C" without sub-content)
    if (lists.length === 0) {
        let currentList: ParsedListItem[] = [];
        let currentType: 'numbered' | 'step' | 'bullet' = 'numbered';
        let inList = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) {
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

            // Pattern: "- Item" or "* Item" or "• Item" (bullet list)
            const bulletMatch = line.match(/^[-*•]\s+(.+)/);
            if (bulletMatch && !inList) {
                currentList.push({
                    position: currentList.length + 1,
                    content: bulletMatch[1].trim(),
                    rawLine: line
                });
                currentType = 'bullet';
                inList = true;
                continue;
            } else if (bulletMatch && inList && currentType === 'bullet') {
                currentList.push({
                    position: currentList.length + 1,
                    content: bulletMatch[1].trim(),
                    rawLine: line
                });
                continue;
            }

            // Continuation line
            if (inList && line.length > 0 && !line.match(/^[\d\-*•]/)) {
                if (currentList.length > 0) {
                    currentList[currentList.length - 1].content += ' ' + line;
                }
            }
        }

        if (currentList.length >= 2) {
            lists.push({ items: [...currentList], listType: currentType });
        }
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
