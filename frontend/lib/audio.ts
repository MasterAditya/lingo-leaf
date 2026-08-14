// Audio utility for UI sound effects with graceful fallbacks

type SoundType = 'correct' | 'incorrect' | 'click' | 'complete' | 'button';

class AudioManager {
  private soundsEnabled: boolean = true;
  private audioContext: AudioContext | null = null;
  private hasInteracted: boolean = false;

  constructor() {
    // Load sound preference from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('soundsEnabled');
      if (saved !== null) {
        this.soundsEnabled = saved === 'true';
      }
    }
  }

  // Initialize audio context on first user interaction
  private initAudioContext() {
    if (!this.audioContext && typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // Play a synthetic sound using Web Audio API (no external files needed)
  private playSyntheticSound(type: SoundType) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    const now = this.audioContext.currentTime;

    switch (type) {
      case 'correct':
        // Pleasant ascending chime
        oscillator.frequency.setValueAtTime(523.25, now); // C5
        oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, now + 0.2); // G5
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;

      case 'incorrect':
        // Low descending tone
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.setValueAtTime(150, now + 0.15);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
        break;

      case 'click':
      case 'button':
        // Short, subtle click
        oscillator.frequency.setValueAtTime(800, now);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        oscillator.start(now);
        oscillator.stop(now + 0.05);
        break;

      case 'complete':
        // Celebratory ascending arpeggio
        const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        frequencies.forEach((freq, i) => {
          const osc = this.audioContext!.createOscillator();
          const gain = this.audioContext!.createGain();
          osc.connect(gain);
          gain.connect(this.audioContext!.destination);
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          gain.gain.setValueAtTime(0.2, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.2);
        });
        break;
    }
  }

  // Play a sound effect
  play(type: SoundType) {
    if (!this.soundsEnabled) return;

    // Require user interaction before playing audio
    if (!this.hasInteracted) {
      this.hasInteracted = true;
    }

    this.initAudioContext();

    try {
      this.playSyntheticSound(type);
    } catch (error) {
      // Graceful fallback - fail silently if audio doesn't work
      console.debug('Audio playback failed:', error);
    }
  }

  // Toggle sounds on/off
  toggleSounds() {
    this.soundsEnabled = !this.soundsEnabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundsEnabled', this.soundsEnabled.toString());
    }
    return this.soundsEnabled;
  }

  // Check if sounds are enabled
  isEnabled() {
    return this.soundsEnabled;
  }

  // Mark that user has interacted with the page
  markInteraction() {
    this.hasInteracted = true;
  }
}

// Singleton instance
export const audioManager = new AudioManager();

// Convenience functions
export const playSound = (type: SoundType) => audioManager.play(type);
export const toggleSounds = () => audioManager.toggleSounds();
export const soundsEnabled = () => audioManager.isEnabled();
export const markAudioInteraction = () => audioManager.markInteraction();

// Hook for adding click sounds to buttons
export const useClickSound = () => {
  const handleClick = () => {
    markAudioInteraction();
    playSound('click');
  };
  return handleClick;
};