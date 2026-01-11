import { Note } from '../types';

/**
 * Entity Registry - Maintains a searchable index of entities from user's notes
 * Enables fast lookup, fuzzy matching, and disambiguation of entities
 */

export interface Entity {
    value: string; // The actual entity text (e.g., "LFM2.5", "https://...")
    type: 'acronym' | 'url' | 'proper_noun' | 'tag' | 'technical_term';
    sourceNoteId: string;
    sourceNoteTitle: string;
    lastMentioned: Date;
    frequency: number; // How many times mentioned across all notes
    context?: string; // Surrounding text for disambiguation
}

export interface EntityMatch {
    entity: Entity;
    confidence: number; // 0-1 score
    matchType: 'exact' | 'partial' | 'fuzzy' | 'phonetic';
    distance?: number; // Levenshtein distance for fuzzy matches
}

export interface EntityRegistry {
    entities: Map<string, Entity[]>; // Key: normalized entity value
    acronyms: Map<string, Entity[]>; // Separate index for acronyms
    urls: Map<string, Entity>; // URL index
    lastUpdated: Date;
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching with typo tolerance
 */
function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

/**
 * Calculate phonetic similarity using Soundex-like algorithm
 * Helps match similar-sounding terms (but we want to AVOID LFM→LLM confusion)
 */
function phoneticCode(str: string): string {
    const s = str.toUpperCase();
    let code = s[0] || '';

    const mapping: { [key: string]: string } = {
        'B': '1', 'F': '1', 'P': '1', 'V': '1',
        'C': '2', 'G': '2', 'J': '2', 'K': '2', 'Q': '2', 'S': '2', 'X': '2', 'Z': '2',
        'D': '3', 'T': '3',
        'L': '4',
        'M': '5', 'N': '5',
        'R': '6'
    };

    for (let i = 1; i < s.length; i++) {
        const mapped = mapping[s[i]];
        if (mapped && mapped !== code[code.length - 1]) {
            code += mapped;
        }
    }

    return code.substring(0, 4).padEnd(4, '0');
}

/**
 * Extract entities from note content
 */
function extractEntitiesFromNote(note: Note): Entity[] {
    const entities: Entity[] = [];
    const content = `${note.title} ${note.content}`;

    // Extract URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = content.match(urlRegex) || [];
    urls.forEach(url => {
        entities.push({
            value: url.trim(),
            type: 'url',
            sourceNoteId: note.id,
            sourceNoteTitle: note.title,
            lastMentioned: new Date(note.updatedAt),
            frequency: 1,
            context: extractContext(content, url)
        });
    });

    // Extract acronyms (2-6 uppercase letters, possibly with numbers)
    const acronymRegex = /\b([A-Z]{2,6}[\d.]*)\b/g;
    const acronyms = content.match(acronymRegex) || [];
    acronyms.forEach(acronym => {
        entities.push({
            value: acronym,
            type: 'acronym',
            sourceNoteId: note.id,
            sourceNoteTitle: note.title,
            lastMentioned: new Date(note.updatedAt),
            frequency: 1,
            context: extractContext(content, acronym)
        });
    });

    // Extract hashtags as tags
    const tagRegex = /#([a-zA-Z0-9_-]+)/g;
    const tags = content.match(tagRegex) || [];
    tags.forEach(tag => {
        entities.push({
            value: tag,
            type: 'tag',
            sourceNoteId: note.id,
            sourceNoteTitle: note.title,
            lastMentioned: new Date(note.updatedAt),
            frequency: 1,
            context: extractContext(content, tag)
        });
    });

    // Extract proper nouns (capitalized words, excluding sentence starts)
    const sentences = content.split(/[.!?]+/);
    sentences.forEach(sentence => {
        const words = sentence.trim().split(/\s+/);
        // Skip first word of sentence (likely capitalized anyway)
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            if (/^[A-Z][a-z]+/.test(word) && word.length > 3) {
                entities.push({
                    value: word,
                    type: 'proper_noun',
                    sourceNoteId: note.id,
                    sourceNoteTitle: note.title,
                    lastMentioned: new Date(note.updatedAt),
                    frequency: 1,
                    context: extractContext(content, word)
                });
            }
        }
    });

    return entities;
}

/**
 * Extract surrounding context (±30 chars) for an entity
 */
function extractContext(content: string, entity: string, windowSize = 30): string {
    const index = content.indexOf(entity);
    if (index === -1) return '';

    const start = Math.max(0, index - windowSize);
    const end = Math.min(content.length, index + entity.length + windowSize);

    return content.substring(start, end).trim();
}

/**
 * Build entity registry from all notes
 */
export function buildEntityRegistry(notes: Note[]): EntityRegistry {
    const entityMap = new Map<string, Entity[]>();
    const acronymMap = new Map<string, Entity[]>();
    const urlMap = new Map<string, Entity>();

    // Extract entities from all notes
    notes.forEach(note => {
        const entities = extractEntitiesFromNote(note);

        entities.forEach(entity => {
            const normalizedKey = entity.value.toLowerCase();

            // Add to main entity map
            if (!entityMap.has(normalizedKey)) {
                entityMap.set(normalizedKey, []);
            }

            // Check if entity already exists (merge frequency)
            const existing = entityMap.get(normalizedKey)!;
            const existingEntity = existing.find(e =>
                e.value === entity.value && e.sourceNoteId === entity.sourceNoteId
            );

            if (existingEntity) {
                existingEntity.frequency++;
                existingEntity.lastMentioned = new Date(Math.max(
                    existingEntity.lastMentioned.getTime(),
                    entity.lastMentioned.getTime()
                ));
            } else {
                existing.push(entity);
            }

            // Add to specialized indexes
            if (entity.type === 'acronym') {
                if (!acronymMap.has(normalizedKey)) {
                    acronymMap.set(normalizedKey, []);
                }
                acronymMap.get(normalizedKey)!.push(entity);
            } else if (entity.type === 'url') {
                urlMap.set(entity.value, entity);
            }
        });
    });

    return {
        entities: entityMap,
        acronyms: acronymMap,
        urls: urlMap,
        lastUpdated: new Date()
    };
}

/**
 * Find entity matches with fuzzy matching and confidence scoring
 */
export function findEntity(
    query: string,
    registry: EntityRegistry,
    options: {
        maxDistance?: number; // Max Levenshtein distance for fuzzy match
        minConfidence?: number; // Minimum confidence threshold
        preferRecent?: boolean; // Prefer recently mentioned entities
        entityType?: Entity['type']; // Filter by entity type
    } = {}
): EntityMatch[] {
    const {
        maxDistance = 2,
        minConfidence = 0.5,
        preferRecent = true,
        entityType
    } = options;

    const matches: EntityMatch[] = [];
    const normalizedQuery = query.toLowerCase().trim();

    // 1. Check for exact matches (highest confidence)
    const exactMatches = registry.entities.get(normalizedQuery);
    if (exactMatches) {
        exactMatches.forEach(entity => {
            if (!entityType || entity.type === entityType) {
                matches.push({
                    entity,
                    confidence: 1.0,
                    matchType: 'exact',
                    distance: 0
                });
            }
        });
    }

    // 2. Check for partial matches (substring)
    registry.entities.forEach((entities, key) => {
        if (key.includes(normalizedQuery) || normalizedQuery.includes(key)) {
            entities.forEach(entity => {
                if (!entityType || entity.type === entityType) {
                    // Avoid duplicate if already exact match
                    if (!matches.find(m => m.entity.value === entity.value && m.entity.sourceNoteId === entity.sourceNoteId)) {
                        const confidence = Math.min(normalizedQuery.length, key.length) /
                            Math.max(normalizedQuery.length, key.length);
                        matches.push({
                            entity,
                            confidence: confidence * 0.9, // Slightly lower than exact
                            matchType: 'partial',
                            distance: Math.abs(normalizedQuery.length - key.length)
                        });
                    }
                }
            });
        }
    });

    // 3. Check for fuzzy matches (typo tolerance)
    registry.entities.forEach((entities, key) => {
        const distance = levenshteinDistance(normalizedQuery, key);
        if (distance > 0 && distance <= maxDistance) {
            entities.forEach(entity => {
                if (!entityType || entity.type === entityType) {
                    // Avoid duplicates
                    if (!matches.find(m => m.entity.value === entity.value && m.entity.sourceNoteId === entity.sourceNoteId)) {
                        const confidence = 1 - (distance / Math.max(normalizedQuery.length, key.length));
                        matches.push({
                            entity,
                            confidence: confidence * 0.7, // Lower confidence for fuzzy
                            matchType: 'fuzzy',
                            distance
                        });
                    }
                }
            });
        }
    });

    // 4. Phonetic matching (CAREFUL: we want to avoid LFM→LLM)
    // Only use for queries > 4 chars to avoid false positives
    if (normalizedQuery.length > 4) {
        const queryPhonetic = phoneticCode(normalizedQuery);
        registry.entities.forEach((entities, key) => {
            if (phoneticCode(key) === queryPhonetic) {
                entities.forEach(entity => {
                    if (!entityType || entity.type === entityType) {
                        // Avoid duplicates
                        if (!matches.find(m => m.entity.value === entity.value && m.entity.sourceNoteId === entity.sourceNoteId)) {
                            matches.push({
                                entity,
                                confidence: 0.5, // Low confidence for phonetic
                                matchType: 'phonetic'
                            });
                        }
                    }
                });
            }
        });
    }

    // Boost confidence for recent mentions if preferRecent is true
    if (preferRecent) {
        const now = Date.now();
        matches.forEach(match => {
            const daysSinceLastMention = (now - match.entity.lastMentioned.getTime()) / (1000 * 60 * 60 * 24);
            const recencyBoost = Math.max(0, 1 - (daysSinceLastMention / 30)); // Decay over 30 days
            match.confidence = Math.min(1.0, match.confidence * (1 + recencyBoost * 0.2));
        });
    }

    // Boost confidence for frequently mentioned entities
    matches.forEach(match => {
        const frequencyBoost = Math.min(0.2, match.entity.frequency * 0.05);
        match.confidence = Math.min(1.0, match.confidence + frequencyBoost);
    });

    // Filter by minimum confidence and sort by confidence (descending)
    return matches
        .filter(m => m.confidence >= minConfidence)
        .sort((a, b) => b.confidence - a.confidence);
}

/**
 * Disambiguate between multiple entity matches
 * Returns the best match or null if ambiguous
 */
export function disambiguateEntity(
    matches: EntityMatch[],
    contextHints?: string[] // Additional context from user's query
): EntityMatch | null {
    if (matches.length === 0) return null;
    if (matches.length === 1) return matches[0];

    // If we have a clear winner (confidence gap > 0.3), return it
    const topMatch = matches[0];
    const secondMatch = matches[1];

    if (topMatch.confidence - secondMatch.confidence > 0.3) {
        return topMatch;
    }

    // Use context hints to disambiguate
    if (contextHints && contextHints.length > 0) {
        const contextScores = matches.map(match => {
            let score = match.confidence;
            const entityContext = (match.entity.context || '').toLowerCase();

            contextHints.forEach(hint => {
                if (entityContext.includes(hint.toLowerCase())) {
                    score += 0.2; // Boost for context match
                }
            });

            return { match, score };
        });

        contextScores.sort((a, b) => b.score - a.score);

        // If context helped disambiguate, return top match
        if (contextScores[0].score - contextScores[1].score > 0.2) {
            return contextScores[0].match;
        }
    }

    // Still ambiguous - return null to trigger clarification
    return null;
}

/**
 * Get full context for an entity (all notes mentioning it)
 */
export function getEntityContext(entity: Entity, registry: EntityRegistry): Entity[] {
    const normalizedValue = entity.value.toLowerCase();
    return registry.entities.get(normalizedValue) || [];
}
