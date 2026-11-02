import { AppState, AppStateStatus, Platform } from 'react-native';
import {
  createAudioPlayer,
  setAudioModeAsync,
  requestNotificationPermissionsAsync,
  AudioPlayer,
  AudioStatus,
} from 'expo-audio';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { AudioTrack, IAudioPlaybackService, PlaybackState, RepeatMode } from './types';
import { MOCK_TRACKS } from '../library/mockData';
import { DatabaseService } from '../database/DatabaseService';

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  (Constants as any).appOwnership === 'expo';

class RealAudioPlaybackService implements IAudioPlaybackService {
  private player: AudioPlayer | null = null;
  private demoAssetUri: string | null = null;
  private isSeeking: boolean = false;
  private errorSkipTimeout: ReturnType<typeof setTimeout> | null = null;
  private consecutiveErrors: number = 0;
  private isConfigured: boolean = false;
  private lastSavedPositionMs: number = 0;

  private state: PlaybackState = {
    status: 'idle',
    currentTrack: null,
    positionMs: 0,
    durationMs: 0,
    progress: 0,
    volume: 0.85,
    isMuted: false,
    repeatMode: 'off',
    isShuffle: false,
    error: null,
  };

  private queue: AudioTrack[] = [...MOCK_TRACKS];
  private recentlyPlayed: AudioTrack[] = [MOCK_TRACKS[0], MOCK_TRACKS[1], MOCK_TRACKS[2]];
  private shuffleHistory: string[] = [];
  private listeners: Set<(state: PlaybackState) => void> = new Set();

  constructor() {
    this.restorePlaybackState();
    this.initBackgroundAudioSystem();
    this.setupAppStateListener();
  }

  /**
   * Restores last played track and playback position from persistent SQLite storage,
   * along with the user's recently played track history.
   */
  private restorePlaybackState(): void {
    try {
      // 1. Restore Recently Played from persistent local storage
      const persistedRecent = DatabaseService.getRecentlyPlayedTracks();
      if (persistedRecent && persistedRecent.length > 0) {
        this.recentlyPlayed = persistedRecent;
      }

      // 2. Restore Last Played Track and Playback Position
      const lastState = DatabaseService.getLastPlaybackState();
      if (lastState && lastState.trackId) {
        const lastTrack = DatabaseService.getTrackById(lastState.trackId);
        if (lastTrack) {
          const pos = lastState.positionMs || 0;
          const dur = lastTrack.durationMs || 0;
          this.state = {
            ...this.state,
            currentTrack: lastTrack,
            status: 'paused',
            positionMs: pos,
            durationMs: dur,
            progress: dur > 0 ? Math.min(1, Math.max(0, pos / dur)) : 0,
          };
          this.lastSavedPositionMs = pos;
        }
      }
    } catch (err) {
      console.warn('[AuraAudioEngine] Failed to restore playback state:', err);
    }
  }

  /**
   * Initializes platform-specific background audio session and notification permissions.
   *
   * iOS: Sets AVAudioSessionCategoryPlayback with playsInSilentMode and shouldPlayInBackground.
   * Android: Configures audio focus with interruptionMode: doNotMix and requests POST_NOTIFICATIONS
   * for the media playback notification shade.
   */
  private async initBackgroundAudioSystem(): Promise<void> {
    if (this.isConfigured) return;

    try {
      // In the generic Expo Go client on Android, starting the custom background service fails
      // because Expo Go's prebuilt APK does not register the project's AudioPlaybackService.
      // Standalone APK and EAS builds have the native service and enable background audio.
      const shouldEnableBackground = !isExpoGo || Platform.OS === 'ios';

      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: shouldEnableBackground,
        interruptionMode: 'doNotMix',
      });

      if (Platform.OS === 'android' && !isExpoGo) {
        try {
          await requestNotificationPermissionsAsync();
        } catch (_) {
          // Handled gracefully on older Android devices (API < 33)
        }
      }

      this.isConfigured = true;
    } catch (err) {
      console.warn('[AuraAudioEngine] Failed to configure background audio mode:', err);
    }
  }

  /**
   * App lifecycle synchronization to handle Foreground, Background, Screen Lock, and Screen Unlock.
   * Keeps playback state and UI synchronized without jumps or stale metadata.
   */
  private setupAppStateListener(): void {
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      this.handleAppStateChange(nextAppState);
    });
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if ((nextAppState === 'background' || nextAppState === 'inactive') && this.state.currentTrack) {
      DatabaseService.saveLastPlaybackState(this.state.currentTrack.id, this.state.positionMs);
    }

    if (nextAppState === 'active' && this.player) {
      // Re-synchronize state when returning to the foreground or unlocking screen
      try {
        const isActuallyPlaying = this.player.playing;
        const currentPosMs = Math.round(this.player.currentTime * 1000);
        const durMs = this.player.duration > 0
          ? Math.round(this.player.duration * 1000)
          : this.state.durationMs;

        this.state.positionMs = currentPosMs;
        if (durMs > 0) {
          this.state.durationMs = durMs;
          this.state.progress = Math.min(1, Math.max(0, currentPosMs / durMs));
        }

        if (isActuallyPlaying && this.state.status !== 'playing') {
          this.state.status = 'playing';
        } else if (!isActuallyPlaying && this.state.status === 'playing') {
          this.state.status = 'paused';
        }

        this.notify();
      } catch (err) {
        console.warn('[AuraAudioEngine] Error synchronizing lifecycle state:', err);
      }
    }
  }

  private async getDemoAssetUri(): Promise<string> {
    if (this.demoAssetUri) return this.demoAssetUri;
    try {
      const asset = Asset.fromModule(require('@/assets/audio/aura_demo_resonance.wav'));
      await asset.downloadAsync();
      this.demoAssetUri = asset.localUri || asset.uri;
      return this.demoAssetUri;
    } catch (err) {
      console.warn('[AuraAudioEngine] Could not load offline demo asset:', err);
      return '';
    }
  }

  private async resolvePlayableUri(track: AudioTrack): Promise<string> {
    const uri = track.fileUri;

    // If URI is empty or is a simulated mock path, fallback to bundled offline WAV
    if (!uri || uri.startsWith('file:///offline/storage/')) {
      return this.getDemoAssetUri();
    }

    // Check if the physical file exists on local storage
    try {
      if (uri.startsWith('content://')) {
        // Android content:// URIs are streamed directly by Android MediaStore
        return uri;
      }
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        return uri;
      }
    } catch (_) {
      // Graceful fallback on path or permission check error
    }

    return this.getDemoAssetUri();
  }

  getState(): PlaybackState {
    return { ...this.state };
  }

  async playTrack(track: AudioTrack, newQueue?: AudioTrack[], startPositionMs?: number): Promise<void> {
    // 1. Ensure background audio session is active
    await this.initBackgroundAudioSystem();

    // 2. Update queue and persistent recently played list
    if (newQueue && newQueue.length > 0) {
      this.queue = [...newQueue];
    } else if (!this.queue.some((t) => t.id === track.id)) {
      this.queue.push(track);
    }

    // Persist recently played track in SQLite
    DatabaseService.addRecentlyPlayed(track.id);
    const updatedRecents = DatabaseService.getRecentlyPlayedTracks();
    if (updatedRecents.length > 0) {
      this.recentlyPlayed = updatedRecents;
    } else {
      this.recentlyPlayed = [
        track,
        ...this.recentlyPlayed.filter((t) => t.id !== track.id),
      ].slice(0, 20);
    }

    if (this.state.isShuffle && !this.shuffleHistory.includes(track.id)) {
      this.shuffleHistory.push(track.id);
    }

    // 3. Clear any pending error timers
    if (this.errorSkipTimeout) {
      clearTimeout(this.errorSkipTimeout);
      this.errorSkipTimeout = null;
    }

    // 4. Safely tear down any existing player to prevent duplicate playback
    if (this.player) {
      try {
        this.player.pause();
        this.player.clearLockScreenControls();
        this.player.remove();
      } catch (_) {}
      this.player = null;
    }

    const initialPos = startPositionMs && startPositionMs > 0 ? startPositionMs : 0;
    DatabaseService.saveLastPlaybackState(track.id, initialPos);
    this.lastSavedPositionMs = initialPos;

    this.state = {
      ...this.state,
      currentTrack: track,
      status: 'loading',
      durationMs: track.durationMs || 0,
      positionMs: initialPos,
      progress: track.durationMs > 0 ? initialPos / track.durationMs : 0,
      error: null,
    };
    this.notify();

    try {
      const playableUri = await this.resolvePlayableUri(track);
      if (!playableUri) {
        throw new Error(`Audio file not accessible: ${track.title}`);
      }

      // Create new native AudioPlayer with 200ms update intervals
      this.player = createAudioPlayer({ uri: playableUri }, { updateInterval: 200 });
      this.player.volume = this.state.volume;
      this.player.loop = this.state.repeatMode === 'one';

      // 5. Connect Native Lock Screen Controls and Media Notification
      // In Expo Go, skip calling setActiveForLockScreen because the native service cannot bind
      // In standalone APK and EAS builds, it binds to Android's AudioControlsService / iOS MPRemoteCommandCenter
      if (!isExpoGo) {
        try {
          this.player.setActiveForLockScreen(
            true,
            {
              title: track.title,
              artist: track.artist,
              albumTitle: track.album,
              artworkUrl: track.artworkUrl || undefined,
            },
            {
              showNextTrack: true,
              showPreviousTrack: true,
              showSeekForward: true,
              showSeekBackward: true,
              seekForwardIntervalSeconds: 10,
              seekBackwardIntervalSeconds: 10,
            }
          );
        } catch (lockScreenErr) {
          // Handled gracefully
        }
      }

      // 6. Listen to native status updates (handles play, pause, seek, finish, and remote commands)
      this.player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
        this.handlePlaybackStatusUpdate(status);
      });

      if (initialPos > 0) {
        try {
          await this.player.seekTo(initialPos / 1000);
        } catch (_) {}
      }

      this.player.play();

      this.state.status = 'playing';
      this.state.error = null;
      this.consecutiveErrors = 0;
      this.notify();
    } catch (err: any) {
      console.warn(`[AuraAudioEngine] Failed to play track "${track.title}":`, err?.message || err);
      this.state.status = 'error';
      this.state.error = `Could not play "${track.title}". Skipping to next track...`;
      this.notify();

      this.handlePlayError(track.id);
    }
  }

  private handlePlayError(failedTrackId: string): void {
    this.consecutiveErrors++;
    if (this.consecutiveErrors >= Math.min(this.queue.length, 5)) {
      this.consecutiveErrors = 0;
      this.state.status = 'stopped';
      this.state.error = 'Multiple audio files could not be played. Please check local storage.';
      this.notify();
      return;
    }

    this.errorSkipTimeout = setTimeout(() => {
      if (this.state.currentTrack?.id === failedTrackId) {
        this.skipToNext();
      }
    }, 1500);
  }

  private handlePlaybackStatusUpdate(status: AudioStatus): void {
    if (this.isSeeking) return;

    if (status.playing) {
      this.consecutiveErrors = 0;
    }

    const posMs = Math.round(status.currentTime * 1000);
    const durMs =
      status.duration > 0
        ? Math.round(status.duration * 1000)
        : this.state.currentTrack?.durationMs || 0;

    this.state.positionMs = posMs;
    this.state.durationMs = durMs;
    this.state.progress = durMs > 0 ? Math.min(1, Math.max(0, posMs / durMs)) : 0;

    // Periodic playback position persistence (every 5 seconds)
    if (this.state.currentTrack && Math.abs(posMs - this.lastSavedPositionMs) >= 5000) {
      this.lastSavedPositionMs = posMs;
      DatabaseService.saveLastPlaybackState(this.state.currentTrack.id, posMs);
    }

    // Synchronize play/pause state from Bluetooth, headphones, or lock screen commands
    if (status.playing && this.state.status !== 'playing') {
      this.state.status = 'playing';
    } else if (!status.playing && this.state.status === 'playing' && !status.didJustFinish) {
      this.state.status = 'paused';
    }

    if (status.didJustFinish) {
      this.handleTrackFinished();
    } else {
      this.notify();
    }
  }

  private async handleTrackFinished(): Promise<void> {
    if (this.state.repeatMode === 'one') {
      this.state.positionMs = 0;
      this.state.progress = 0;
      if (this.player) {
        await this.player.seekTo(0);
        this.player.play();
        this.state.status = 'playing';
      }
      this.notify();
      return;
    }

    if (this.state.repeatMode === 'all') {
      await this.skipToNext();
      return;
    }

    // repeatMode === 'off'
    const currentIndex = this.queue.findIndex((t) => t.id === this.state.currentTrack?.id);
    if (currentIndex >= 0 && currentIndex < this.queue.length - 1) {
      await this.skipToNext();
    } else {
      // Reached the end of queue in repeat 'off' mode: stop playback cleanly
      this.state.status = 'stopped';
      this.state.positionMs = 0;
      this.state.progress = 0;
      if (this.player) {
        this.player.pause();
        await this.player.seekTo(0);
        try {
          this.player.clearLockScreenControls();
        } catch (_) {}
      }
      this.notify();
    }
  }

  async togglePlayPause(): Promise<void> {
    if (!this.state.currentTrack) {
      if (this.queue.length > 0) {
        await this.playTrack(this.queue[0]);
      }
      return;
    }

    if (this.state.status === 'playing') {
      await this.pause();
    } else {
      await this.resume();
    }
  }

  async pause(): Promise<void> {
    if (this.player) {
      this.player.pause();
    }
    this.state.status = 'paused';
    if (this.state.currentTrack) {
      DatabaseService.saveLastPlaybackState(this.state.currentTrack.id, this.state.positionMs);
    }
    this.notify();
  }

  async resume(): Promise<void> {
    if (!this.state.currentTrack) {
      if (this.queue.length > 0) {
        await this.playTrack(this.queue[0]);
      }
      return;
    }

    if (this.player) {
      this.player.play();
      this.state.status = 'playing';
      this.notify();
    } else {
      // Resume from restored offline session with previous track position
      await this.playTrack(this.state.currentTrack, undefined, this.state.positionMs);
    }
  }

  async stop(): Promise<void> {
    if (this.player) {
      this.player.pause();
      await this.player.seekTo(0);
      try {
        this.player.clearLockScreenControls();
      } catch (_) {}
    }
    if (this.state.currentTrack) {
      DatabaseService.saveLastPlaybackState(this.state.currentTrack.id, 0);
    }
    this.state.status = 'stopped';
    this.state.positionMs = 0;
    this.state.progress = 0;
    this.notify();
  }

  async seekTo(positionMs: number): Promise<void> {
    const clamped = Math.max(0, Math.min(positionMs, this.state.durationMs));
    this.state.positionMs = clamped;
    this.state.progress = this.state.durationMs > 0 ? clamped / this.state.durationMs : 0;
    if (this.state.currentTrack) {
      DatabaseService.saveLastPlaybackState(this.state.currentTrack.id, clamped);
    }
    this.notify();

    if (this.player) {
      try {
        await this.player.seekTo(clamped / 1000);
      } catch (e) {
        console.warn('[AuraAudioEngine] Seek error:', e);
      }
    }
  }

  async skipToNext(): Promise<void> {
    if (!this.state.currentTrack || this.queue.length === 0) return;

    if (this.state.isShuffle) {
      const nextTrack = this.getNextShuffleTrack();
      if (nextTrack) {
        await this.playTrack(nextTrack);
      }
      return;
    }

    const currentIndex = this.queue.findIndex((t) => t.id === this.state.currentTrack?.id);
    let nextIndex = currentIndex + 1;

    if (nextIndex >= this.queue.length) {
      if (this.state.repeatMode === 'all') {
        nextIndex = 0;
      } else {
        await this.stop();
        return;
      }
    }

    const nextTrack = this.queue[nextIndex];
    if (nextTrack) {
      await this.playTrack(nextTrack);
    }
  }

  async skipToPrevious(): Promise<void> {
    if (!this.state.currentTrack || this.queue.length === 0) return;

    // If more than 3 seconds into the track, restart from beginning
    if (this.state.positionMs > 3000) {
      await this.seekTo(0);
      if (this.state.status === 'paused') {
        await this.resume();
      }
      return;
    }

    if (this.state.isShuffle && this.shuffleHistory.length > 1) {
      this.shuffleHistory.pop(); // Remove current track
      const prevId = this.shuffleHistory[this.shuffleHistory.length - 1];
      const prevTrack = this.queue.find((t) => t.id === prevId);
      if (prevTrack) {
        await this.playTrack(prevTrack);
        return;
      }
    }

    const currentIndex = this.queue.findIndex((t) => t.id === this.state.currentTrack?.id);
    let prevIndex = currentIndex - 1;

    if (prevIndex < 0) {
      prevIndex = this.state.repeatMode === 'all' ? this.queue.length - 1 : 0;
    }

    const prevTrack = this.queue[prevIndex];
    if (prevTrack) {
      await this.playTrack(prevTrack);
    }
  }

  private getNextShuffleTrack(): AudioTrack | null {
    if (this.queue.length === 0) return null;
    if (this.queue.length === 1) return this.queue[0];

    const currentId = this.state.currentTrack?.id;

    // Find tracks not yet played in this shuffle cycle
    let candidates = this.queue.filter(
      (t) => !this.shuffleHistory.includes(t.id) && t.id !== currentId
    );

    // If all tracks have been played, reset history and choose any track except current
    if (candidates.length === 0) {
      this.shuffleHistory = currentId ? [currentId] : [];
      candidates = this.queue.filter((t) => t.id !== currentId);
    }

    if (candidates.length === 0) {
      return this.queue[0];
    }

    const randomIndex = Math.floor(Math.random() * candidates.length);
    const chosen = candidates[randomIndex];
    this.shuffleHistory.push(chosen.id);
    return chosen;
  }

  toggleShuffle(): void {
    this.state.isShuffle = !this.state.isShuffle;
    if (this.state.isShuffle && this.state.currentTrack) {
      this.shuffleHistory = [this.state.currentTrack.id];
    } else {
      this.shuffleHistory = [];
    }
    this.notify();
  }

  cycleRepeatMode(): void {
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const nextIndex = (modes.indexOf(this.state.repeatMode) + 1) % modes.length;
    this.state.repeatMode = modes[nextIndex];
    if (this.player) {
      this.player.loop = this.state.repeatMode === 'one';
    }
    this.notify();
  }

  setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.state.volume = clamped;
    this.state.isMuted = clamped === 0;
    if (this.player) {
      this.player.volume = clamped;
    }
    this.notify();
  }

  getQueue(): AudioTrack[] {
    return [...this.queue];
  }

  setQueue(tracks: AudioTrack[]): void {
    this.queue = [...tracks];
    this.shuffleHistory = [];
    this.notify();
  }

  removeFromQueue(trackId: string): void {
    const isRemovingCurrent = this.state.currentTrack?.id === trackId;
    this.queue = this.queue.filter((t) => t.id !== trackId);
    this.shuffleHistory = this.shuffleHistory.filter((id) => id !== trackId);

    if (isRemovingCurrent) {
      if (this.queue.length > 0) {
        this.skipToNext();
      } else {
        this.stop();
        this.state.currentTrack = null;
        this.notify();
      }
    } else {
      this.notify();
    }
  }

  clearQueue(): void {
    if (this.state.currentTrack) {
      this.queue = [this.state.currentTrack];
      this.shuffleHistory = [this.state.currentTrack.id];
    } else {
      this.queue = [];
      this.shuffleHistory = [];
    }
    this.notify();
  }

  playNext(track: AudioTrack): void {
    if (!this.state.currentTrack) {
      this.playTrack(track);
      return;
    }
    const currentIndex = this.queue.findIndex((t) => t.id === this.state.currentTrack?.id);
    const existingIndex = this.queue.findIndex((t) => t.id === track.id);
    if (existingIndex !== -1) {
      this.queue.splice(existingIndex, 1);
    }
    const insertIndex = currentIndex !== -1 ? currentIndex + 1 : this.queue.length;
    this.queue.splice(insertIndex, 0, track);
    this.notify();
  }

  getRecentlyPlayed(): AudioTrack[] {
    return [...this.recentlyPlayed];
  }

  addListener(listener: (state: PlaybackState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const currentState = this.getState();
    this.listeners.forEach((listener) => listener(currentState));
  }
}

export const AudioPlaybackService = new RealAudioPlaybackService();