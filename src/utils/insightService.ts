/**
 * Wikipedia API: Fetches summaries for given topic(s).
 * Supports multiple topics separated by " and ", " & ", or commas.
 */
export async function fetchWikiSummary(topic: string): Promise<string> {
    // Split by " and ", " & ", or "," (with surrounding whitespace)
    const topics = topic.split(/\s+and\s+|\s*&\s*|\s*,\s*/i).filter(t => t.trim().length > 0);

    if (topics.length === 0) return 'Wikipedia: No topic provided.';

    try {
        const results: string[] = [];

        for (const t of topics) {
            const trimmedTopic = t.trim();

            // Step 1: Search for the best matching page title
            const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(trimmedTopic)}&format=json&origin=*&srlimit=1`;
            const searchResponse = await fetch(searchUrl);
            const searchData = await searchResponse.json();

            const searchResult = searchData.query?.search?.[0];
            const correctTitle = searchResult ? searchResult.title : trimmedTopic;

            // Step 2: Fetch detailed introduction (extracts)
            // exintro=true: Get only the content before the first section
            // explaintext=true: Get plain text instead of HTML
            const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(correctTitle)}&format=json&origin=*`;
            const extractResponse = await fetch(extractUrl);

            if (!extractResponse.ok) {
                results.push(`Wikipedia (${trimmedTopic}): No entry found or error fetching data.`);
                continue;
            }

            const data = await extractResponse.json();
            const pages = data?.query?.pages;
            const pageId = Object.keys(pages || {})[0];
            const extract = pages?.[pageId]?.extract;

            if (extract) {
                results.push(`Wikipedia (${correctTitle}):\n${extract}`);
            } else {
                results.push(`Wikipedia (${correctTitle}): No summary available.`);
            }
        }

        // Combine with proper spacing
        return results.join('\n\n');
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
