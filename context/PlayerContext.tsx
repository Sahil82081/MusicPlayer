import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AudioTrack, PlaybackState, RepeatMode } from '@/services/audio/types';
import { AudioPlaybackService } from '@/services/audio/AudioPlaybackService';
import { MOCK_TRACKS } from '@/services/library/mockData';
import { MusicLibraryService } from '@/services/library/MusicLibraryService';

interface PlayerContextValue {
  state: PlaybackState;
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  progress: number;
  positionMs: number;
  durationMs: number;
  queue: AudioTrack[];
  recentlyPlayed: AudioTrack[];
  repeatMode: RepeatMode;
  isShuffle: boolean;
  volume: number;
  playTrack: (track: AudioTrack, queue?: AudioTrack[], startPositionMs?: number) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seekTo: (positionMs: number) => Promise<void>;
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  setVolume: (vol: number) => void;
  toggleFavorite: (trackId: string) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  playNext: (track: AudioTrack) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playbackState, setPlaybackState] = useState<PlaybackState>(() => AudioPlaybackService.getState());
  const [queue, setQueue] = useState<AudioTrack[]>(() => AudioPlaybackService.getQueue());
  const [recentlyPlayed, setRecentlyPlayed] = useState<AudioTrack[]>(() => AudioPlaybackService.getRecentlyPlayed());

  useEffect(() => {
    // Populate queue with library tracks if available, fallback to mock tracks
    const libraryTracks = MusicLibraryService.getAllTracks();
    const initialTracks = libraryTracks.length > 0 ? libraryTracks : MOCK_TRACKS;

    if (!AudioPlaybackService.getState().currentTrack && initialTracks.length > 0) {
      AudioPlaybackService.setQueue(initialTracks);
    }

    const unsubscribe = AudioPlaybackService.addListener((state) => {
      setPlaybackState(state);
      setQueue(AudioPlaybackService.getQueue());
      setRecentlyPlayed(AudioPlaybackService.getRecentlyPlayed());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const toggleFavorite = useCallback((trackId: string) => {
    MusicLibraryService.toggleFavorite(trackId);
    if (playbackState.currentTrack?.id === trackId) {
      setPlaybackState((prev) => ({
        ...prev,
        currentTrack: prev.currentTrack
          ? { ...prev.currentTrack, isFavorite: !prev.currentTrack.isFavorite }
          : null,
      }));
    }
  }, [playbackState.currentTrack]);

  const removeFromQueue = useCallback((trackId: string) => {
    AudioPlaybackService.removeFromQueue(trackId);
    setQueue(AudioPlaybackService.getQueue());
  }, []);

  const clearQueue = useCallback(() => {
    AudioPlaybackService.clearQueue();
    setQueue(AudioPlaybackService.getQueue());
  }, []);

  const playNext = useCallback((track: AudioTrack) => {
    AudioPlaybackService.playNext(track);
    setQueue(AudioPlaybackService.getQueue());
  }, []);

  const value: PlayerContextValue = {
    state: playbackState,
    currentTrack: playbackState.currentTrack,
    isPlaying: playbackState.status === 'playing',
    progress: playbackState.progress,
    positionMs: playbackState.positionMs,
    durationMs: playbackState.durationMs,
    queue,
    recentlyPlayed,
    repeatMode: playbackState.repeatMode,
    isShuffle: playbackState.isShuffle,
    volume: playbackState.volume,
    playTrack: (track, q, startPos) => AudioPlaybackService.playTrack(track, q, startPos),
    togglePlayPause: () => AudioPlaybackService.togglePlayPause(),
    pause: () => AudioPlaybackService.pause(),
    resume: () => AudioPlaybackService.resume(),
    seekTo: (ms) => AudioPlaybackService.seekTo(ms),
    skipToNext: () => AudioPlaybackService.skipToNext(),
    skipToPrevious: () => AudioPlaybackService.skipToPrevious(),
    toggleShuffle: () => AudioPlaybackService.toggleShuffle(),
    cycleRepeatMode: () => AudioPlaybackService.cycleRepeatMode(),
    setVolume: (vol) => AudioPlaybackService.setVolume(vol),
    toggleFavorite,
    removeFromQueue,
    clearQueue,
    playNext,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

export function usePlayer(): PlayerContextValue {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
