/**
 * Font Service
 * Provides font definitions and command parsing for the @font commands
 */

export interface Font {
    index: number;
    name: string;
    family: string;
}

// Available fonts with index for quick selection
export const AVAILABLE_FONTS: Font[] = [
    { index: 1, name: 'System Default', family: 'system-ui, -apple-system, sans-serif' },
    { index: 2, name: 'Inter', family: "'Inter', sans-serif" },
    { index: 3, name: 'Roboto', family: "'Roboto', sans-serif" },
    { index: 4, name: 'Open Sans', family: "'Open Sans', sans-serif" },
    { index: 5, name: 'Lora', family: "'Lora', serif" },
    { index: 6, name: 'Playfair Display', family: "'Playfair Display', serif" },
    { index: 7, name: 'Fira Code', family: "'Fira Code', monospace" },
    { index: 8, name: 'JetBrains Mono', family: "'JetBrains Mono', monospace" },
    { index: 9, name: 'Georgia', family: "Georgia, serif" },
    { index: 10, name: 'Merriweather', family: "'Merriweather', serif" },
    { index: 11, name: 'Source Sans Pro', family: "'Source Sans Pro', sans-serif" },
    { index: 12, name: 'Nunito', family: "'Nunito', sans-serif" },
    { index: 13, name: 'Poppins', family: "'Poppins', sans-serif" },
    { index: 14, name: 'Montserrat', family: "'Montserrat', sans-serif" },
    { index: 15, name: 'Comic Sans MS', family: "'Comic Sans MS', cursive" },
];

export const DEFAULT_FONT = AVAILABLE_FONTS[0];

/**
 * Check if input is a font-related command
 */
export function isFontCommand(input: string): boolean {
    const normalized = input.trim().toLowerCase();
    return normalized === '@fonts' || normalized.startsWith('@font-');
}

/**
 * Check if input is specifically the @fonts list command
 */
export function isFontsListCommand(input: string): boolean {
    return input.trim().toLowerCase() === '@fonts';
}

/**
 * Check if input is the default font command
 */
export function isDefaultFontCommand(input: string): boolean {
    return input.trim().toLowerCase() === '@font-d';
}

/**
 * Parse @font-[index/name] command and return the matching font
 * Returns null if no match found
 */
export function parseFontCommand(input: string): Font | null {
    const normalized = input.trim().toLowerCase();

    if (!normalized.startsWith('@font-')) return null;

    const value = normalized.slice(6).trim(); // Remove '@font-'

    if (!value || value === 'd') return null; // 'd' is handled separately as default

    // Try parsing as index first
    const indexNum = parseInt(value, 10);
    if (!isNaN(indexNum)) {
        return getFontByIndex(indexNum);
    }

    // Try matching by name
    return getFontByName(value);
}

/**
 * Get font by index (1-based)
 */
export function getFontByIndex(index: number): Font | null {
    return AVAILABLE_FONTS.find(f => f.index === index) || null;
}

/**
 * Get font by name (case-insensitive partial match)
 */
export function getFontByName(name: string): Font | null {
    const normalized = name.toLowerCase().replace(/\s+/g, '');
    return AVAILABLE_FONTS.find(f =>
        f.name.toLowerCase().replace(/\s+/g, '') === normalized
    ) || null;
}

/**
 * Generate formatted text list of all fonts (for inline insertion in notes)
 */
export function getFontsListText(): string {
    return AVAILABLE_FONTS
        .map(f => `${f.index}. ${f.name}`)
        .join('\n');
}

/**
 * LocalStorage key for font preference
 */
export const FONT_STORAGE_KEY = 'quillon-editor-font';

/**
 * Save font preference to localStorage
 */
export function saveFontPreference(font: Font): void {
    try {
        localStorage.setItem(FONT_STORAGE_KEY, JSON.stringify(font));
    } catch (e) {
        console.warn('Failed to save font preference:', e);
    }
}

/**
 * Load font preference from localStorage
 */
export function loadFontPreference(): Font {
    try {
        const stored = localStorage.getItem(FONT_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Validate it's a valid font
            const font = getFontByIndex(parsed.index);
            if (font) return font;
        }
    } catch (e) {
        console.warn('Failed to load font preference:', e);
    }
    return DEFAULT_FONT;
}
