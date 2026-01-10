import { createContext, useContext, useState, ReactNode } from 'react';
import { Font, loadFontPreference, saveFontPreference } from '../utils/fontService';

interface FontContextType {
    currentFont: Font;
    setCurrentFont: (font: Font) => void;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

export function FontProvider({ children }: { children: ReactNode }) {
    const [currentFont, setCurrentFontState] = useState<Font>(() => loadFontPreference());

    const setCurrentFont = (font: Font) => {
        setCurrentFontState(font);
        saveFontPreference(font);
    };

    return (
        <FontContext.Provider value={{ currentFont, setCurrentFont }}>
            {children}
        </FontContext.Provider>
    );
}

export function useFont() {
    const context = useContext(FontContext);
    if (context === undefined) {
        throw new Error('useFont must be used within a FontProvider');
    }
    return context;
}
