/**
 * Kingu Ramen - Web Audio API Synthesizer & Sound FX Engine
 * High-end procedural sound design without external MP3 dependencies
 */

class KinguSoundEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = true; // start muted by default for browser autoplay policy
        this.isAmbiencePlaying = false;
        this.ambienceNodes = [];
        this.initOnFirstInteraction = this.initOnFirstInteraction.bind(this);
        
        // Listen for user gesture to initialize AudioContext
        window.addEventListener('click', this.initOnFirstInteraction, { once: true });
        window.addEventListener('touchstart', this.initOnFirstInteraction, { once: true });
    }

    ensureContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    initOnFirstInteraction() {
        this.ensureContext();
    }

    toggleMute() {
        this.ensureContext();
        this.isMuted = !this.isMuted;
        
        if (this.isMuted) {
            this.stopAmbience();
        } else {
            this.playAmbience();
            this.playChime(660, 'sine', 0.15, 0.08);
        }
        
        return !this.isMuted;
    }

    /**
     * Subtle wooden / ceramic tactile tap for UI clicks
     */
    playClick() {
        if (this.isMuted) return;
        const ctx = this.ensureContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.04);
    }

    /**
     * Soft water drop / broth bubble sound when adding item to cart
     */
    playBubble() {
        if (this.isMuted) return;
        const ctx = this.ensureContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
    }

    /**
     * Warm bell/chime for luxury reveal
     */
    playChime(freq = 523.25, type = 'sine', duration = 0.4, vol = 0.08) {
        if (this.isMuted) return;
        const ctx = this.ensureContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
    }

    /**
     * Tactile ceramic bowl tap / clink
     */
    playCeramicClink() {
        if (this.isMuted) return;
        const ctx = this.ensureContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1620, now);
        osc.frequency.exponentialRampToValueAtTime(840, now + 0.08);

        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.14);
    }

    /**
     * Wooden chopstick clack sound
     */
    playChopsticks() {
        if (this.isMuted) return;
        const ctx = this.ensureContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(740, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.035);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.04);
    }

    /**
     * Upbeat notification pop for toast messages & tray badges
     */
    playToastPop() {
        if (this.isMuted) return;
        const ctx = this.ensureContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(880, now);
        osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.1); // D6

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now + 0.04);
        osc1.stop(now + 0.18);
        osc2.stop(now + 0.18);
    }

    /**
     * Success fanfare when generating VIP Pass or booking table
     */
    playSuccessFanfare() {
        if (this.isMuted) return;
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playChime(freq, 'sine', 0.35, 0.09);
            }, idx * 75);
        });
    }

    /**
     * Cozy Izakaya Ambient Simmering:
     * Generates a warm, hypnotic simmer & gentle sizzle using filtered pink noise and low sine drone
     */
    playAmbience() {
        if (this.isAmbiencePlaying) return;
        const ctx = this.ensureContext();
        if (!ctx) return;

        try {
            const bufferSize = ctx.sampleRate * 2;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            let b0 = 0, b1 = 0, b2 = 0;

            // Generate soft pink noise
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                output[i] = (b0 + b1 + b2) * 0.04;
            }

            const whiteNoise = ctx.createBufferSource();
            whiteNoise.buffer = noiseBuffer;
            whiteNoise.loop = true;

            // Warm low-pass filter (simulates bubbling broth)
            const brothFilter = ctx.createBiquadFilter();
            brothFilter.type = 'lowpass';
            brothFilter.frequency.setValueAtTime(450, ctx.currentTime);

            // Sizzle high-pass filter (simulates delicate oil/steam sizzle)
            const sizzleFilter = ctx.createBiquadFilter();
            sizzleFilter.type = 'bandpass';
            sizzleFilter.frequency.setValueAtTime(2800, ctx.currentTime);
            sizzleFilter.Q.setValueAtTime(3, ctx.currentTime);

            // Warm sub-drone for izakaya room depth
            const droneOsc = ctx.createOscillator();
            droneOsc.type = 'sine';
            droneOsc.frequency.setValueAtTime(110, ctx.currentTime); // A2 warm drone

            const masterGain = ctx.createGain();
            masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
            masterGain.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 1.5); // smooth fade-in

            whiteNoise.connect(brothFilter);
            brothFilter.connect(masterGain);

            whiteNoise.connect(sizzleFilter);
            sizzleFilter.connect(masterGain);

            const droneGain = ctx.createGain();
            droneGain.gain.setValueAtTime(0.012, ctx.currentTime);
            droneOsc.connect(droneGain);
            droneGain.connect(masterGain);

            masterGain.connect(ctx.destination);

            whiteNoise.start();
            droneOsc.start();

            this.ambienceNodes = [whiteNoise, droneOsc, masterGain];
            this.isAmbiencePlaying = true;
        } catch (e) {
            console.warn('Ambient audio could not start:', e);
        }
    }

    stopAmbience() {
        if (!this.isAmbiencePlaying) return;
        const ctx = this.ctx;
        if (ctx && this.ambienceNodes.length) {
            const masterGain = this.ambienceNodes[2];
            if (masterGain && masterGain.gain) {
                masterGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
            }
            setTimeout(() => {
                this.ambienceNodes.forEach(n => {
                    try { if (n.stop) n.stop(); } catch (e) {}
                });
                this.ambienceNodes = [];
                this.isAmbiencePlaying = false;
            }, 850);
        } else {
            this.isAmbiencePlaying = false;
        }
    }
}

// Global instance
window.kinguSound = new KinguSoundEngine();
