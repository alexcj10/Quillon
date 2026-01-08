/**
 * Simple mapping of common language names/codes to ISO codes
 */
export const LANGUAGE_MAP: Record<string, string> = {
    'spanish': 'es',
    'french': 'fr',
    'german': 'de',
    'hindi': 'hi',
    'italian': 'it',
    'japanese': 'ja',
    'korean': 'ko',
    'portuguese': 'pt',
    'russian': 'ru',
    'chinese': 'zh-CN',
    'arabic': 'ar',
    'dutch': 'nl',
    'turkish': 'tr',
    'es': 'es',
    'fr': 'fr',
    'de': 'de',
    'hi': 'hi',
    'it': 'it',
    'ja': 'ja',
    'ko': 'ko',
    'pt': 'pt',
    'ru': 'ru',
    'zh': 'zh-CN',
    'ar': 'ar',
    'nl': 'nl',
    'tr': 'tr'
};

/**
 * Translates text using the Google Translate "gtx" free endpoint.
 * This endpoint is fast, free, and generally unlimited for reasonable use.
 */
export async function translateText(text: string, targetLang: string): Promise<string | null> {
    if (!text.trim()) return null;

    // Normalize target language code
    const target = LANGUAGE_MAP[targetLang.toLowerCase()] || targetLang.toLowerCase();

    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Translation failed');

        const data = await response.json();

        // Google Translate "gtx" returns a complex nested array
        // data[0] contains the translated segments
        if (data && data[0]) {
            return data[0].map((segment: any[]) => segment[0]).join('');
        }

        return null;
    } catch (error) {
        console.error('Translation error:', error);
        return null;
    }
}

/**
 * Checks if a string is a translation command like @t-es
 */
export function isTranslationCommand(input: string): boolean {
    return input.trim().toLowerCase().startsWith('@t-');
}

/**
 * Extracts language code from command
 * Example: "@t-es" -> "es"
 */
export function extractLangCode(input: string): string {
    return input.trim().slice(3).toLowerCase();
}
