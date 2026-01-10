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

    // Global click/touch listener for ALL buttons
    useEffect(() => {
        const handleInteraction = (e: MouseEvent | TouchEvent) => {
            if (!isSoundEnabled) return;

            const target = e.target as HTMLElement;

            // Check if clicked/touched element is a button or inside a button
            const isButton =
                target.tagName === 'BUTTON' ||
                target.closest('button') !== null ||
                target.getAttribute('role') === 'button' ||
                target.classList.contains('cursor-pointer');

            if (isButton) {
                playSoftClick();
            }
        };

        // Listen to both click (desktop) and touchstart (mobile)
        document.addEventListener('click', handleInteraction, true);
        document.addEventListener('touchstart', handleInteraction, true);

        return () => {
            document.removeEventListener('click', handleInteraction, true);
            document.removeEventListener('touchstart', handleInteraction, true);
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
