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
    const lastInteractionRef = useRef<{ x: number, y: number, time: number } | null>(null);

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
        const handleInteractionStart = (e: PointerEvent) => {
            if (!isEnabledRef.current) return;

            // Extreme responsiveness: 25ms throttle
            const now = Date.now();
            if (now - lastClickTimeRef.current < 25) return;

            const target = e.target as HTMLElement;
            const isButton =
                target.tagName === 'BUTTON' ||
                target.closest('button') !== null ||
                target.getAttribute('role') === 'button' ||
                target.classList.contains('cursor-pointer');

            if (!isButton) return;

            // MOUSE: Immediate feedback on press (Down event)
            if (e.pointerType === 'mouse') {
                lastClickTimeRef.current = now;
                playSoftClick(volumeRef.current * volumeRef.current);
                return;
            }

            // TOUCH/PEN: Use hybrid logic to allow scrolling
            // Only trigger "Press" instantly for things in Header/Nav (Safe regions)
            const isInFixedZone = target.closest('header, nav, .toolbar, .fixed-navbar');

            if (isInFixedZone) {
                lastClickTimeRef.current = now;
                playSoftClick(volumeRef.current * volumeRef.current);
                lastInteractionRef.current = null; // Don't trigger on Release
            } else {
                lastInteractionRef.current = {
                    x: e.clientX,
                    y: e.clientY,
                    time: now
                };
            }
        };

        const handleInteractionMove = (e: PointerEvent) => {
            if (!lastInteractionRef.current || e.pointerType === 'mouse') return;

            // If the finger moves more than 5px while down, it's a scroll/swipe
            const start = lastInteractionRef.current;
            const dx = Math.abs(e.clientX - start.x);
            const dy = Math.abs(e.clientY - start.y);

            if (dx > 5 || dy > 5) {
                lastInteractionRef.current = null; // CANCEL the sound trigger
            }
        };

        const handleInteractionEnd = (e: PointerEvent) => {
            if (!isEnabledRef.current || e.pointerType === 'mouse') return;
            if (!lastInteractionRef.current) return;

            const now = Date.now();
            const start = lastInteractionRef.current;
            lastInteractionRef.current = null;

            const dx = e.clientX - start.x;
            const dy = e.clientY - start.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const duration = now - start.time;

            // 10px threshold for 'tap vs scroll'
            if (distance < 10 && duration < 300) {
                lastClickTimeRef.current = now;
                playSoftClick(volumeRef.current * volumeRef.current);
            }
        };

        const handleInteractionCancel = () => {
            lastInteractionRef.current = null;
        };

        document.addEventListener('pointerdown', handleInteractionStart, { capture: true, passive: true });
        document.addEventListener('pointermove', handleInteractionMove, { capture: true, passive: true });
        document.addEventListener('pointerup', handleInteractionEnd, { capture: true, passive: true });
        document.addEventListener('pointercancel', handleInteractionCancel, { capture: true, passive: true });

        return () => {
            document.removeEventListener('pointerdown', handleInteractionStart, { capture: true });
            document.removeEventListener('pointermove', handleInteractionMove, { capture: true });
            document.removeEventListener('pointerup', handleInteractionEnd, { capture: true });
            document.removeEventListener('pointercancel', handleInteractionCancel, { capture: true });
        };
    }, []);

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
