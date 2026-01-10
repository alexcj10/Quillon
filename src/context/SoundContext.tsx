import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { playSoftClick, playSuccess, resumeContext } from '../hooks/useClickSound';

interface SoundContextType {
    isSoundEnabled: boolean;
    setSoundEnabled: (enabled: boolean) => void;
    volume: number;
    setVolume: (volume: number) => void;
    softClick: () => void;
    success: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: React.ReactNode }) {
    const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
        const saved = localStorage.getItem('quillon-sound-enabled');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const [volume, setVolumeState] = useState(() => {
        const saved = localStorage.getItem('quillon-sound-volume');
        return saved !== null ? JSON.parse(saved) : 1.0; // Default 100%
    });

    // Refs for real-time access in event listeners without stale closures
    const volumeRef = useRef(volume);
    const isEnabledRef = useRef(isSoundEnabled);
    const lastClickTimeRef = useRef(0);

    // Persist settings and sync refs
    useEffect(() => {
        localStorage.setItem('quillon-sound-enabled', JSON.stringify(isSoundEnabled));
        isEnabledRef.current = isSoundEnabled;
    }, [isSoundEnabled]);

    useEffect(() => {
        localStorage.setItem('quillon-sound-volume', JSON.stringify(volume));
        volumeRef.current = volume;
    }, [volume]);

    const setSoundEnabled = useCallback((enabled: boolean) => {
        setIsSoundEnabled(enabled);
    }, []);

    const setVolume = useCallback((val: number) => {
        setVolumeState(val);
    }, []);

    // Squared Scaling: Matches human hearing much better than linear
    const getGain = (v: number) => v * v;

    const softClick = useCallback(() => {
        if (isSoundEnabled) playSoftClick(getGain(volume));
    }, [isSoundEnabled, volume]);

    const success = useCallback(() => {
        if (isSoundEnabled) playSuccess(0.3 * getGain(volume));
    }, [isSoundEnabled, volume]);

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
            // Use refs to bypass state closures
            if (!isEnabledRef.current) return;

            // Throttle to prevent double-clicks (e.g., pointerdown + touchstart firing together)
            const now = Date.now();
            if (now - lastClickTimeRef.current < 50) return;
            lastClickTimeRef.current = now;

            const target = e.target as HTMLElement;

            // Check if interacted element is a button or inside a button
            const isButton =
                target.tagName === 'BUTTON' ||
                target.closest('button') !== null ||
                target.getAttribute('role') === 'button' ||
                target.classList.contains('cursor-pointer');

            if (isButton) {
                // Apply squared scaling for natural volume
                const gain = volumeRef.current * volumeRef.current;
                playSoftClick(gain);
            }
        };

        // Listen to BOTH pointerdown (modern) and touchstart (older mobile)
        document.addEventListener('pointerdown', handleInteraction, true);
        document.addEventListener('touchstart', handleInteraction, true);

        return () => {
            document.removeEventListener('pointerdown', handleInteraction, true);
            document.removeEventListener('touchstart', handleInteraction, true);
        };
    }, []); // Empty dependency array - relies on refs for real-time values

    return (
        <SoundContext.Provider value={{
            isSoundEnabled,
            setSoundEnabled,
            volume,
            setVolume,
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
