export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'stopped' | 'error';

export type RepeatMode = 'off' | 'all' | 'one';

export interface AudioFormatInfo {
  format: 'FLAC' | 'WAV' | 'MP3' | 'AAC' | 'ALAC' | 'OGG';
  bitrate?: string; // e.g., '1411 kbps' or '320 kbps'
  sampleRate?: string; // e.g., '96 kHz' or '44.1 kHz'
  bitDepth?: string; // e.g., '24-bit' or '16-bit'
  isHiRes?: boolean;
}

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  album: string;
  albumId?: string;
  durationMs: number; // in milliseconds
  artworkUrl?: string;
  accentColor?: string;
  secondaryAccentColor?: string;
  fileUri: string;
  fileSizeBytes: number;
  formatInfo: AudioFormatInfo;
  dateAdded: string; // ISO date
  isFavorite?: boolean;
  playCount?: number;
}

export interface PlaybackState {
  status: PlaybackStatus;
  currentTrack: AudioTrack | null;
  positionMs: number;
  durationMs: number;
  progress: number; // 0 to 1
  volume: number; // 0 to 1
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  error?: string | null;
}

export interface IAudioPlaybackService {
  getState(): PlaybackState;
  playTrack(track: AudioTrack, queue?: AudioTrack[], startPositionMs?: number): Promise<void>;
  togglePlayPause(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  seekTo(positionMs: number): Promise<void>;
  skipToNext(): Promise<void>;
  skipToPrevious(): Promise<void>;
  toggleShuffle(): void;
  cycleRepeatMode(): void;
  setVolume(volume: number): void;
  getQueue(): AudioTrack[];
  setQueue(tracks: AudioTrack[]): void;
  removeFromQueue(trackId: string): void;
  clearQueue(): void;
  playNext(track: AudioTrack): void;
  getRecentlyPlayed(): AudioTrack[];
  addListener(listener: (state: PlaybackState) => void): () => void;
}
