// Web Audio API synthesized notification sound chime
class SoundManager {
    ctx = null;
    isEnabled = true;
    constructor() {
        // Lazy initialize on first interaction
        const saved = localStorage.getItem('pulsechat_sound');
        if (saved !== null) {
            this.isEnabled = saved === 'true';
        }
    }
    initContext() {
        if (!this.ctx && typeof window !== 'undefined') {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
    toggleSound() {
        this.isEnabled = !this.isEnabled;
        localStorage.setItem('pulsechat_sound', String(this.isEnabled));
        if (this.isEnabled) {
            this.playMessageSent();
        }
        return this.isEnabled;
    }
    getSoundEnabled() {
        return this.isEnabled;
    }
    playIncomingMessage() {
        if (!this.isEnabled)
            return;
        try {
            this.initContext();
            if (!this.ctx)
                return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            // Harmonic pleasant double ding (A5 -> E6)
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.35);
        }
        catch {
            // Audio context might be restricted before user gesture
        }
    }
    playMessageSent() {
        if (!this.isEnabled)
            return;
        try {
            this.initContext();
            if (!this.ctx)
                return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, now); // D5
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.06); // A5
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.18);
        }
        catch {
            // ignore
        }
    }
}
export const soundManager = new SoundManager();
