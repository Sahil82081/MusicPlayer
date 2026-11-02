import { AudioTrack } from '../audio/types';
import { Album, Artist, LibrarySearchResults, LibrarySortOption, LibraryStats, MusicFolder, Playlist } from './types';
import { StorageService } from '../storage/StorageService';
import { PlatformMusicService } from '../platform/PlatformMusicAdapter';
import { DatabaseService } from '../database/DatabaseService';

class MusicLibraryManager {
  private isDbReady = false;

  private ensureDb(): void {
    if (!this.isDbReady) {
      DatabaseService.initDatabase();
      this.isDbReady = true;
    }
  }

  getAllTracks(): AudioTrack[] {
    this.ensureDb();
    return DatabaseService.getAllTracks();
  }

  getTrackById(id: string): AudioTrack | undefined {
    this.ensureDb();
    const track = DatabaseService.getTrackById(id);
    return track || undefined;
  }

  getFavoriteTracks(): AudioTrack[] {
    this.ensureDb();
    return DatabaseService.getFavoriteTracks();
  }

  toggleFavorite(trackId: string): boolean {
    this.ensureDb();
    return DatabaseService.toggleFavorite(trackId);
  }

  getAllAlbums(): Album[] {
    this.ensureDb();
    return DatabaseService.getAllAlbums();
  }

  getAlbumById(id: string): Album | undefined {
    this.ensureDb();
    return this.getAllAlbums().find((a) => a.id === id);
  }

  getFavoriteAlbums(): Album[] {
    this.ensureDb();
    return this.getAllAlbums().filter((a) => a.isFavorite);
  }

  toggleFavoriteAlbum(albumId: string): boolean {
    this.ensureDb();
    return DatabaseService.toggleFavoriteAlbum(albumId);
  }

  getAllArtists(): Artist[] {
    this.ensureDb();
    return DatabaseService.getAllArtists();
  }

  getArtistById(id: string): Artist | undefined {
    this.ensureDb();
    return this.getAllArtists().find((a) => a.id === id);
  }

  getTracksByArtist(artistId: string): AudioTrack[] {
    this.ensureDb();
    const artist = this.getArtistById(artistId);
    if (!artist) return [];
    return this.getAllTracks().filter((t) => t.artistId === artistId || t.artist === artist.name);
  }

  getAlbumsByArtist(artistId: string): Album[] {
    this.ensureDb();
    const artist = this.getArtistById(artistId);
    if (!artist) return [];
    return this.getAllAlbums().filter((a) => a.artistId === artistId || a.artist === artist.name);
  }

  getAllPlaylists(): Playlist[] {
    this.ensureDb();
    return DatabaseService.getAllPlaylists();
  }

  getPlaylistById(id: string): Playlist | undefined {
    this.ensureDb();
    return DatabaseService.getPlaylistById(id);
  }

  getTracksForPlaylist(playlistId: string): AudioTrack[] {
    this.ensureDb();
    return DatabaseService.getTracksForPlaylist(playlistId);
  }

  createPlaylist(name: string, description?: string, accentColor?: string): Playlist {
    this.ensureDb();
    return DatabaseService.createPlaylist(name, description, accentColor);
  }

  renamePlaylist(id: string, newName: string): boolean {
    this.ensureDb();
    return DatabaseService.renamePlaylist(id, newName);
  }

  deletePlaylist(id: string): boolean {
    this.ensureDb();
    return DatabaseService.deletePlaylist(id);
  }

  addTrackToPlaylist(playlistId: string, trackId: string): boolean {
    this.ensureDb();
    return DatabaseService.addTrackToPlaylist(playlistId, trackId);
  }

  removeTrackFromPlaylist(playlistId: string, trackId: string): boolean {
    this.ensureDb();
    return DatabaseService.removeTrackFromPlaylist(playlistId, trackId);
  }

  getRecentlyPlayedTracks(): AudioTrack[] {
    this.ensureDb();
    return DatabaseService.getRecentlyPlayedTracks();
  }

  addRecentlyPlayed(trackId: string): void {
    this.ensureDb();
    DatabaseService.addRecentlyPlayed(trackId);
  }

  getRecentSearches(): string[] {
    return StorageService.getRecentSearches();
  }

  addRecentSearch(term: string): void {
    StorageService.addRecentSearch(term);
  }

  clearRecentSearches(): void {
    StorageService.clearRecentSearches();
  }

  getAllFolders(): MusicFolder[] {
    this.ensureDb();
    return DatabaseService.getAllFolders();
  }

  getTracksForFolder(folderPath: string): AudioTrack[] {
    this.ensureDb();
    return DatabaseService.getTracksForFolder(folderPath);
  }

  sortTracks(tracks: AudioTrack[], sortOption: LibrarySortOption): AudioTrack[] {
    this.ensureDb();
    return DatabaseService.sortTracks(tracks, sortOption);
  }

  search(query: string): LibrarySearchResults {
    this.ensureDb();
    return DatabaseService.searchAll(query);
  }

  getLibraryStats(): LibraryStats {
    const allTracks = this.getAllTracks();
    const totalBytes = allTracks.reduce((acc, t) => acc + t.fileSizeBytes, 0);
    const totalMs = allTracks.reduce((acc, t) => acc + t.durationMs, 0);

    return {
      totalTracks: allTracks.length,
      totalAlbums: this.getAllAlbums().length,
      totalArtists: this.getAllArtists().length,
      totalPlaylists: this.getAllPlaylists().length,
      totalStorageBytes: totalBytes,
      totalDurationMs: totalMs,
      lastScannedAt: 'Just now',
    };
  }

  seedBenchmarkLibrary(count = 1000): number {
    this.ensureDb();
    return DatabaseService.seedBenchmarkLibrary(count);
  }

  /**
   * Triggers the appropriate platform scan or import workflow
   */
  async triggerPlatformImportOrScan(): Promise<{
    message: string;
    count: number;
    success: boolean;
  }> {
    const capabilities = PlatformMusicService.getCapabilities();

    if (capabilities.supportsDeviceAutoScan) {
      // Android auto-scan via MediaStore
      const res = await PlatformMusicService.scanLocalMedia();
      if (!res.success && res.error) {
        return {
          message: res.error,
          count: 0,
          success: false,
        };
      }
      return {
        message:
          res.newTracksCount > 0
            ? `Discovered ${res.newTracksCount} audio files from Android storage.`
            : `Device scan complete. ${res.scannedFilesCount} files indexed.`,
        count: res.newTracksCount || res.scannedFilesCount,
        success: true,
      };
    } else {
      // iOS DocumentPicker import
      const res = await PlatformMusicService.importFiles();
      if (res.canceled) {
        return {
          message: 'Import canceled',
          count: 0,
          success: true,
        };
      }
      return {
        message: `Imported ${res.importedCount} audio files from iOS Files.`,
        count: res.importedCount,
        success: res.success,
      };
    }
  }

  /**
   * Direct file picker import (works on both platforms)
   */
  async importAudioFilesManually(): Promise<{
    message: string;
    count: number;
    success: boolean;
  }> {
    const res = await PlatformMusicService.importFiles();
    if (res.canceled) {
      return { message: 'File selection canceled', count: 0, success: true };
    }
    return {
      message: `Imported ${res.importedCount} audio files into local library.`,
      count: res.importedCount,
      success: res.success,
    };
  }

  clearAllData(): void {
    DatabaseService.clearAllData();
  }
}

export const MusicLibraryService = new MusicLibraryManager();
