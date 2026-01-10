import { useCallback, useRef } from 'react';

// Audio context singleton for performance
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
};

// Export a function to resume the context (crucial for mobile unlocking)
export const resumeContext = async () => {
    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }
    } catch (e) {
        console.warn('Audio resume failed', e);
    }
};

// Generate a subtle click sound using Web Audio API
export const playClick = (volume: number = 0.3) => {
    try {
        const ctx = getAudioContext();

        // Resume context if suspended (browser autoplay policy)
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Configure sound - short, subtle click
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, ctx.currentTime); // Higher pitch
        oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05); // Quick decay

        // Volume envelope - quick attack and decay
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.005); // 5ms attack
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08); // 80ms decay

        // Play for 100ms
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
    } catch (error) {
        // Silently fail if audio is not available
        console.warn('Click sound failed:', error);
    }
};

// Digital Felt Tap (Improved for better volume perception)
export const playSoftClick = (volume: number = 0.03) => {
    try {
        const ctx = getAudioContext();

        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const masterGain = ctx.createGain();
        masterGain.connect(ctx.destination);

        // Core Texture (High frequency - the "Felt")
        const feltOsc = ctx.createOscillator();
        feltOsc.type = 'sine';
        feltOsc.frequency.setValueAtTime(3000, ctx.currentTime);

        const feltGain = ctx.createGain();
        feltGain.gain.setValueAtTime(0, ctx.currentTime);
        feltGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.001);
        feltGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.01);

        feltOsc.connect(feltGain);
        feltGain.connect(masterGain);

        // Sub Body (Lower frequency - gives it "weight" at high volumes)
        const bodyOsc = ctx.createOscillator();
        bodyOsc.type = 'sine';
        bodyOsc.frequency.setValueAtTime(400, ctx.currentTime);

        const bodyGain = ctx.createGain();
        bodyGain.gain.setValueAtTime(0, ctx.currentTime);
        bodyGain.gain.linearRampToValueAtTime(volume * 0.5, ctx.currentTime + 0.002);
        bodyGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.015);

        bodyOsc.connect(bodyGain);
        bodyGain.connect(masterGain);

        feltOsc.start(ctx.currentTime);
        bodyOsc.start(ctx.currentTime);

        feltOsc.stop(ctx.currentTime + 0.02);
        bodyOsc.stop(ctx.currentTime + 0.02);
    } catch (error) {
        // Silently fail
    }
};

// Success sound (for completed actions)
export const playSuccess = (volume: number = 0.2) => {
    try {
        const ctx = getAudioContext();

        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Rising tone for success
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, ctx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
    } catch (error) {
        console.warn('Success sound failed:', error);
    }
};

// React hook for click sounds
export function useClickSound() {
    const isEnabled = useRef(true);

    const click = useCallback(() => {
        if (isEnabled.current) playClick();
    }, []);

    const softClick = useCallback(() => {
        if (isEnabled.current) playSoftClick();
    }, []);

    const success = useCallback(() => {
        if (isEnabled.current) playSuccess();
    }, []);

    const toggleSound = useCallback((enabled: boolean) => {
        isEnabled.current = enabled;
    }, []);

    return { click, softClick, success, toggleSound };
}
