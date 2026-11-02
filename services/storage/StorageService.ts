import { AppSettings, DEFAULT_SETTINGS } from './types';

class StorageServiceManager {
  private settings: AppSettings = { ...DEFAULT_SETTINGS };

  getSettings(): AppSettings {
    return { ...this.settings };
  }

  updateSettings(partial: Partial<AppSettings>): AppSettings {
    this.settings = { ...this.settings, ...partial };
    return { ...this.settings };
  }

  isFavorite(trackId: string): boolean {
    return this.settings.favoriteTrackIds.includes(trackId);
  }

  toggleFavorite(trackId: string): boolean {
    const exists = this.settings.favoriteTrackIds.includes(trackId);
    if (exists) {
      this.settings.favoriteTrackIds = this.settings.favoriteTrackIds.filter(id => id !== trackId);
    } else {
      this.settings.favoriteTrackIds.push(trackId);
    }
    return !exists;
  }

  isAlbumFavorite(albumId: string): boolean {
    return this.settings.favoriteAlbumIds.includes(albumId);
  }

  toggleFavoriteAlbum(albumId: string): boolean {
    const exists = this.settings.favoriteAlbumIds.includes(albumId);
    if (exists) {
      this.settings.favoriteAlbumIds = this.settings.favoriteAlbumIds.filter(id => id !== albumId);
    } else {
      this.settings.favoriteAlbumIds.push(albumId);
    }
    return !exists;
  }

  getRecentSearches(): string[] {
    return [...this.settings.recentSearches];
  }

  addRecentSearch(term: string): void {
    const trimmed = term.trim();
    if (!trimmed) return;
    this.settings.recentSearches = [
      trimmed,
      ...this.settings.recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase()),
    ].slice(0, 8);
  }

  clearRecentSearches(): void {
    this.settings.recentSearches = [];
  }
}

export const StorageService = new StorageServiceManager();
