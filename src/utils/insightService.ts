/**
 * Wikipedia API: Fetches a summary for a given topic.
 */
export async function fetchWikiSummary(topic: string): Promise<string> {
    try {
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`;
        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 404) return `Wikipedia: No entry found for "${topic}".`;
            return `Wikipedia: Error fetching data (${response.status}).`;
        }

        const data = await response.json();
        if (data.extract) {
            return `Wikipedia (${topic}):\n${data.extract}`;
        }

        return `Wikipedia: No summary available for "${topic}".`;
    } catch (error) {
        console.error('Wikipedia lookup error:', error);
        return 'Wikipedia: Network error or lookup failed.';
    }
}

/**
 * Dictionary API: Fetches definition for a given word.
 */
export async function fetchDefinition(word: string): Promise<string> {
    try {
        const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 404) return `Dictionary: No definition found for "${word}".`;
            return `Dictionary: Error fetching data (${response.status}).`;
        }

        const data = await response.json();
        if (Array.isArray(data) && data[0]) {
            const entry = data[0];
            let result = `Definition: ${entry.word}\n`;

            if (entry.phonetic) result += `[${entry.phonetic}]\n`;

            entry.meanings.slice(0, 2).forEach((meaning: any) => {
                result += `\n(${meaning.partOfSpeech})\n`;
                meaning.definitions.slice(0, 2).forEach((def: any, idx: number) => {
                    result += `${idx + 1}. ${def.definition}\n`;
                });
            });

            return result.trim();
        }

        return `Dictionary: No results found for "${word}".`;
    } catch (error) {
        console.error('Dictionary lookup error:', error);
        return 'Dictionary: Network error or lookup failed.';
    }
}

/**
 * Detects if the command is @wiki- or @def-
 */
export function isInsightCommand(input: string): boolean {
    const normalized = input.trim().toLowerCase();
    return normalized.startsWith('@wiki-') || normalized.startsWith('@def-');
}

/**
 * Extracts the type and search term
 */
export function parseInsightCommand(input: string): { type: 'wiki' | 'def', query: string } | null {
    const term = input.trim();
    if (term.toLowerCase().startsWith('@wiki-')) {
        return { type: 'wiki', query: term.slice(6).trim() };
    }
    if (term.toLowerCase().startsWith('@def-')) {
        return { type: 'def', query: term.slice(5).trim() };
    }
    return null;
}
