// Audio service for managing background music and sound effects
export class AudioService {
  private static instance: AudioService;
  private currentAudio: HTMLAudioElement | null = null;
  private isPlaying = false;
  private volume = 0.3;

  private constructor() {}

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  // Inspirational background music URLs
  private readonly BACKGROUND_MUSIC = [
    '/music/inspirational1.mp3',
    '/music/inspirational2.mp3', 
    '/music/inspirational3.mp3',
    // Fallback to a simple tone if music files don't exist
    'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'
  ];

  async playBackgroundMusic(index: number = 0): Promise<void> {
    try {
      // Stop current audio if playing
      this.stop();

      const audioUrl = this.BACKGROUND_MUSIC[index % this.BACKGROUND_MUSIC.length];
      this.currentAudio = new Audio(audioUrl);
      this.currentAudio.loop = true;
      this.currentAudio.volume = this.volume;

      // Handle audio loading errors gracefully
      this.currentAudio.addEventListener('error', () => {
        console.log('Background music failed to load, continuing without audio');
      });

      await this.currentAudio.play();
      this.isPlaying = true;
    } catch (error) {
      console.log('Audio autoplay blocked or failed:', error);
      // Don't throw error, just continue without audio
    }
  }

  pause(): void {
    if (this.currentAudio && this.isPlaying) {
      this.currentAudio.pause();
      this.isPlaying = false;
    }
  }

  resume(): void {
    if (this.currentAudio && !this.isPlaying) {
      this.currentAudio.play().catch(() => {
        console.log('Failed to resume audio');
      });
      this.isPlaying = true;
    }
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.isPlaying = false;
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentAudio) {
      this.currentAudio.volume = this.volume;
    }
  }

  getVolume(): number {
    return this.volume;
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  // Play a short sound effect
  async playSound(soundUrl: string, volume: number = 0.5): Promise<void> {
    try {
      const audio = new Audio(soundUrl);
      audio.volume = volume;
      await audio.play();
    } catch (error) {
      console.log('Sound effect failed to play:', error);
    }
  }

  // Generate a simple tone programmatically (fallback)
  generateTone(frequency: number = 440, duration: number = 1000): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.log('Web Audio API not supported');
    }
  }
}

export const audioService = AudioService.getInstance();