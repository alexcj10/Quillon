import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { playSoftClick, playSuccess, resumeContext } from '../hooks/useClickSound';

interface SoundContextType {
    isSoundEnabled: boolean;
    setSoundEnabled: (enabled: boolean) => void;
    softClick: () => void;
    success: () => void;
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

    const success = useCallback(() => {
        if (isSoundEnabled) playSuccess();
    }, [isSoundEnabled]);

    // Unlock audio context on first interaction (required for mobile)
    useEffect(() => {
        const unlock = async () => {
            await resumeContext();

            // Once unlocked, we can remove these listeners
            window.removeEventListener('click', unlock);
            window.removeEventListener('touchstart', unlock);
            window.removeEventListener('pointerdown', unlock);
        };

        window.addEventListener('click', unlock);
        window.addEventListener('touchstart', unlock);
        window.addEventListener('pointerdown', unlock);

        return () => {
            window.removeEventListener('click', unlock);
            window.removeEventListener('touchstart', unlock);
            window.removeEventListener('pointerdown', unlock);
        };
    }, []);

    // Global interaction listener for ALL buttons
    useEffect(() => {
        const handleInteraction = (e: Event) => {
            if (!isSoundEnabled) return;

            const target = e.target as HTMLElement;

            // Check if interacted element is a button or inside a button
            const isButton =
                target.tagName === 'BUTTON' ||
                target.closest('button') !== null ||
                target.getAttribute('role') === 'button' ||
                target.classList.contains('cursor-pointer');

            if (isButton) {
                // Important: on mobile, playSoftClick also calls resumeContext internally if needed
                playSoftClick();
            }
        };

        // Listen to BOTH pointerdown (modern) and touchstart (older mobile)
        document.addEventListener('pointerdown', handleInteraction, true);
        document.addEventListener('touchstart', handleInteraction, true);

        return () => {
            document.removeEventListener('pointerdown', handleInteraction, true);
            document.removeEventListener('touchstart', handleInteraction, true);
        };
    }, [isSoundEnabled]);

    return (
        <SoundContext.Provider value={{
            isSoundEnabled,
            setSoundEnabled,
            softClick,
            success
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
