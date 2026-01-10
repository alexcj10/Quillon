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

// Digital Felt Tap (High-end UI texture, extremely short and clean)
export const playSoftClick = (volume: number = 0.03) => {
    try {
        const ctx = getAudioContext();

        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // High frequency texture (3000Hz) - feels like a microscopic tick
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(3000, ctx.currentTime);

        // Instantaneous attack and extreme fast decay
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.001); // 1ms attack
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.01); // 10ms decay

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.012); // Shorter than 15ms
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
