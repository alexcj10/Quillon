/**
 * Simple mapping of common language names/codes to ISO codes
 */
export const LANGUAGE_MAP: Record<string, string> = {
    // A-Z
    'afrikaans': 'af', 'albanian': 'sq', 'amharic': 'am', 'arabic': 'ar', 'armenian': 'hy', 'azerbaijani': 'az',
    'basque': 'eu', 'belarusian': 'be', 'bengali': 'bn', 'bosnian': 'bs', 'bulgarian': 'bg',
    'catalan': 'ca', 'cebuano': 'ceb', 'chinese': 'zh-CN', 'corsican': 'co', 'croatian': 'hr', 'czech': 'cs',
    'danish': 'da', 'dutch': 'nl',
    'english': 'en', 'esperanto': 'eo', 'estonian': 'et',
    'finnish': 'fi', 'french': 'fr', 'frisian': 'fy',
    'galician': 'gl', 'georgian': 'ka', 'german': 'de', 'greek': 'el', 'gujarati': 'gu',
    'haitian creole': 'ht', 'hausa': 'ha', 'hawaiian': 'haw', 'hebrew': 'he', 'hindi': 'hi', 'hmong': 'hmn', 'hungarian': 'hu',
    'icelandic': 'is', 'igbo': 'ig', 'indonesian': 'id', 'irish': 'ga', 'italian': 'it',
    'japanese': 'ja', 'javanese': 'jw',
    'kannada': 'kn', 'kazakh': 'kk', 'khmer': 'km', 'korean': 'ko', 'kurdish': 'ku', 'kyrgyz': 'ky',
    'lao': 'lo', 'latin': 'la', 'latvian': 'lv', 'lithuanian': 'lt', 'luxembourgish': 'lb',
    'macedonian': 'mk', 'malagasy': 'mg', 'malay': 'ms', 'malayalam': 'ml', 'maltese': 'mt', 'maori': 'mi', 'marathi': 'mr', 'mongolian': 'mn', 'myanmar': 'my',
    'nepali': 'ne', 'norwegian': 'no', 'nyanja': 'ny',
    'pashto': 'ps', 'persian': 'fa', 'polish': 'pl', 'portuguese': 'pt', 'punjabi': 'pa',
    'romanian': 'ro', 'russian': 'ru',
    'samoan': 'sm', 'scots gaelic': 'gd', 'serbian': 'sr', 'sesotho': 'st', 'shona': 'sn', 'sindhi': 'sd', 'sinhala': 'si', 'slovak': 'sk', 'slovenian': 'sl', 'somali': 'so', 'spanish': 'es', 'sundanese': 'su', 'swahili': 'sw', 'swedish': 'sv',
    'tagalog': 'tl', 'tajik': 'tg', 'tamil': 'ta', 'telugu': 'te', 'thai': 'th', 'turkish': 'tr',
    'ukrainian': 'uk', 'urdu': 'ur', 'uzbek': 'uz',
    'vietnamese': 'vi', 'welsh': 'cy', 'xhosa': 'xh', 'yiddish': 'yi', 'yoruba': 'yo', 'zulu': 'zu',

    // Shortcuts (ISO 639-1)
    'af': 'af', 'sq': 'sq', 'am': 'am', 'ar': 'ar', 'hy': 'hy', 'az': 'az', 'eu': 'eu', 'be': 'be', 'bn': 'bn', 'bs': 'bs', 'bg': 'bg', 'ca': 'ca', 'ceb': 'ceb', 'zh': 'zh-CN', 'co': 'co', 'hr': 'hr', 'cs': 'cs', 'da': 'da', 'nl': 'nl', 'en': 'en', 'eo': 'eo', 'et': 'et', 'fi': 'fi', 'fr': 'fr', 'fy': 'fy', 'gl': 'gl', 'ka': 'ka', 'de': 'de', 'el': 'el', 'gu': 'gu', 'ht': 'ht', 'ha': 'ha', 'haw': 'haw', 'he': 'he', 'hi': 'hi', 'hmn': 'hmn', 'hu': 'hu', 'is': 'is', 'ig': 'ig', 'id': 'id', 'ga': 'ga', 'it': 'it', 'ja': 'ja', 'jw': 'jw', 'kn': 'kn', 'kk': 'kk', 'km': 'km', 'ko': 'ko', 'ku': 'ku', 'ky': 'ky', 'lo': 'lo', 'la': 'la', 'lv': 'lv', 'lt': 'lt', 'lb': 'lb', 'mk': 'mk', 'mg': 'mg', 'ms': 'ms', 'ml': 'ml', 'mt': 'mt', 'mi': 'mi', 'mr': 'mr', 'mn': 'mn', 'my': 'my', 'ne': 'ne', 'no': 'no', 'ny': 'ny', 'ps': 'ps', 'fa': 'fa', 'pl': 'pl', 'pt': 'pt', 'pa': 'pa', 'ro': 'ro', 'ru': 'ru', 'sm': 'sm', 'gd': 'gd', 'sr': 'sr', 'st': 'st', 'sn': 'sn', 'sd': 'sd', 'si': 'si', 'sk': 'sk', 'sl': 'sl', 'so': 'so', 'es': 'es', 'su': 'su', 'sw': 'sw', 'sv': 'sv', 'tl': 'tl', 'tg': 'tg', 'ta': 'ta', 'te': 'te', 'th': 'th', 'tr': 'tr', 'uk': 'uk', 'ur': 'ur', 'uz': 'uz', 'vi': 'vi', 'cy': 'cy', 'xh': 'xh', 'yi': 'yi', 'yo': 'yo', 'zu': 'zu'
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
