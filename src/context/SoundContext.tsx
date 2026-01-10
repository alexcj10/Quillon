import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { playSoftClick } from '../hooks/useClickSound';

interface SoundContextType {
    isSoundEnabled: boolean;
    setSoundEnabled: (enabled: boolean) => void;
    softClick: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: React.ReactNode }) {
    const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
        const saved = localStorage.getItem('quillon-sound-enabled');
        return saved !== null ? JSON.parse(saved) : true; // Enabled by default
    });

    // Persist setting
    useEffect(() => {
        localStorage.setItem('quillon-sound-enabled', JSON.stringify(isSoundEnabled));
    }, [isSoundEnabled]);

    const setSoundEnabled = useCallback((enabled: boolean) => {
        setIsSoundEnabled(enabled);
    }, []);

    const softClick = useCallback(() => {
        if (isSoundEnabled) playSoftClick();
    }, [isSoundEnabled]);

    // Global click listener for ALL buttons
    useEffect(() => {
        const handleGlobalClick = (e: MouseEvent) => {
            if (!isSoundEnabled) return;

            const target = e.target as HTMLElement;

            // Check if clicked element is a button or inside a button
            const isButton =
                target.tagName === 'BUTTON' ||
                target.closest('button') !== null ||
                target.getAttribute('role') === 'button' ||
                target.classList.contains('cursor-pointer');

            if (isButton) {
                playSoftClick();
            }
        };

        // Use capture phase to catch clicks early
        document.addEventListener('click', handleGlobalClick, true);

        return () => {
            document.removeEventListener('click', handleGlobalClick, true);
        };
    }, [isSoundEnabled]);

    return (
        <SoundContext.Provider value={{
            isSoundEnabled,
            setSoundEnabled,
            softClick
        }}>
            {children}
        </SoundContext.Provider>
    );
}

export function useSound() {
    const context = useContext(SoundContext);
    if (context === undefined) {
        throw new Error('useSound must be used within a SoundProvider');
    }
    return context;
}
