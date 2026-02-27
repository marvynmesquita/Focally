/**
 * Singleton manager to ensure only one AudioContext is created
 * preventing memory leaks and performance dips.
 */
class AudioContextManager {
    constructor() {
        this.audioContext = null;
    }

    getAudioContext() {
        if (!this.audioContext) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.audioContext = new AudioContextClass();
            } else {
                console.error('AudioContext não suportado neste navegador.');
            }
        }

        // Resume context if it was suspended (autoplay policy)
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        return this.audioContext;
    }

    closeAudioContext() {
        if (this.audioContext) {
            if (this.audioContext.state !== 'closed') {
                this.audioContext.close();
            }
            this.audioContext = null;
        }
    }
}

export const audioContextManager = new AudioContextManager();
