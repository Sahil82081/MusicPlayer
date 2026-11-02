export interface AppSettings {
  replayGain: boolean;
  gaplessPlayback: boolean;
  crossfadeDurationSec: number;
  highResAudioExclusiveMode: boolean;
  themeMode: 'dark' | 'black';
  autoScanOnLaunch: boolean;
  favoriteTrackIds: string[];
  favoriteAlbumIds: string[];
  recentSearches: string[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  replayGain: true,
  gaplessPlayback: true,
  crossfadeDurationSec: 0,
  highResAudioExclusiveMode: true,
  themeMode: 'dark',
  autoScanOnLaunch: true,
  favoriteTrackIds: ['track-1', 'track-2', 'track-4', 'track-6', 'track-8'],
  favoriteAlbumIds: ['album-1', 'album-2'],
  recentSearches: ['Aura', 'FLAC', 'Nocturnes', 'Kavinsky'],
};
