import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { AudioTrack } from '@/services/audio/types';
import { Album, Artist, LibrarySearchResults, LibrarySortOption, LibraryStats, MusicFolder, Playlist } from '@/services/library/types';
import { MusicLibraryService } from '@/services/library/MusicLibraryService';
import { PlatformMusicService } from '@/services/platform/PlatformMusicAdapter';
import { PlatformCapabilities } from '@/services/platform/types';

interface LibraryContextValue {
  tracks: AudioTrack[];
  favoriteTracks: AudioTrack[];
  albums: Album[];
  favoriteAlbums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  folders: MusicFolder[];
  stats: LibraryStats;
  capabilities: PlatformCapabilities;
  isScanning: boolean;
  recentSearches: string[];
  toggleFavorite: (trackId: string) => void;
  toggleFavoriteAlbum: (albumId: string) => void;
  createPlaylist: (name: string, description?: string, accentColor?: string) => Playlist;
  renamePlaylist: (id: string, newName: string) => boolean;
  deletePlaylist: (id: string) => boolean;
  addTrackToPlaylist: (playlistId: string, trackId: string) => boolean;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => boolean;
  getTracksForFolder: (folderPath: string) => AudioTrack[];
  sortTracks: (tracks: AudioTrack[], sortOption: LibrarySortOption) => AudioTrack[];
  searchLibrary: (query: string) => LibrarySearchResults;
  addRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;
  refreshLibrary: () => void;
  triggerPlatformImport: () => Promise<string>;
  importAudioFilesManually: () => Promise<string>;
  seedBenchmarkLibrary: (count?: number) => number;
  clearLibrary: () => void;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tracks, setTracks] = useState<AudioTrack[]>(() => MusicLibraryService.getAllTracks());
  const [albums, setAlbums] = useState<Album[]>(() => MusicLibraryService.getAllAlbums());
  const [artists, setArtists] = useState<Artist[]>(() => MusicLibraryService.getAllArtists());
  const [playlists, setPlaylists] = useState<Playlist[]>(() => MusicLibraryService.getAllPlaylists());
  const [folders, setFolders] = useState<MusicFolder[]>(() => MusicLibraryService.getAllFolders());
  const [stats, setStats] = useState<LibraryStats>(() => MusicLibraryService.getLibraryStats());
  const [recentSearches, setRecentSearches] = useState<string[]>(() => MusicLibraryService.getRecentSearches());
  const [isScanning, setIsScanning] = useState(false);

  const capabilities = useMemo(() => PlatformMusicService.getCapabilities(), []);

  const refreshLibrary = useCallback(() => {
    const updatedTracks = MusicLibraryService.getAllTracks();
    setTracks(updatedTracks);
    setAlbums(MusicLibraryService.getAllAlbums());
    setArtists(MusicLibraryService.getAllArtists());
    setPlaylists(MusicLibraryService.getAllPlaylists());
    setFolders(MusicLibraryService.getAllFolders());
    setStats(MusicLibraryService.getLibraryStats());
    setRecentSearches(MusicLibraryService.getRecentSearches());
  }, []);

  useEffect(() => {
    refreshLibrary();
  }, [refreshLibrary]);

  // Zero-latency optimistic favorite toggling without costly multi-table rebuilds
  const toggleFavorite = useCallback((trackId: string) => {
    MusicLibraryService.toggleFavorite(trackId);
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, isFavorite: !t.isFavorite } : t))
    );
  }, []);

  const toggleFavoriteAlbum = useCallback((albumId: string) => {
    MusicLibraryService.toggleFavoriteAlbum(albumId);
    setAlbums((prev) =>
      prev.map((a) => (a.id === albumId ? { ...a, isFavorite: !a.isFavorite } : a))
    );
  }, []);

  const createPlaylist = useCallback((name: string, description?: string, accentColor?: string) => {
    const pl = MusicLibraryService.createPlaylist(name, description, accentColor);
    setPlaylists(MusicLibraryService.getAllPlaylists());
    return pl;
  }, []);

  const renamePlaylist = useCallback((id: string, newName: string) => {
    const success = MusicLibraryService.renamePlaylist(id, newName);
    setPlaylists(MusicLibraryService.getAllPlaylists());
    return success;
  }, []);

  const deletePlaylist = useCallback((id: string) => {
    const success = MusicLibraryService.deletePlaylist(id);
    setPlaylists(MusicLibraryService.getAllPlaylists());
    return success;
  }, []);

  const addTrackToPlaylist = useCallback((playlistId: string, trackId: string) => {
    const success = MusicLibraryService.addTrackToPlaylist(playlistId, trackId);
    setPlaylists(MusicLibraryService.getAllPlaylists());
    return success;
  }, []);

  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    const success = MusicLibraryService.removeTrackFromPlaylist(playlistId, trackId);
    setPlaylists(MusicLibraryService.getAllPlaylists());
    return success;
  }, []);

  const addRecentSearch = useCallback((term: string) => {
    MusicLibraryService.addRecentSearch(term);
    setRecentSearches(MusicLibraryService.getRecentSearches());
  }, []);

  const clearRecentSearches = useCallback(() => {
    MusicLibraryService.clearRecentSearches();
    setRecentSearches([]);
  }, []);

  const triggerPlatformImport = useCallback(async (): Promise<string> => {
    setIsScanning(true);
    try {
      const result = await MusicLibraryService.triggerPlatformImportOrScan();
      refreshLibrary();
      return result.message;
    } finally {
      setIsScanning(false);
    }
  }, [refreshLibrary]);

  const importAudioFilesManually = useCallback(async (): Promise<string> => {
    setIsScanning(true);
    try {
      const result = await MusicLibraryService.importAudioFilesManually();
      refreshLibrary();
      return result.message;
    } finally {
      setIsScanning(false);
    }
  }, [refreshLibrary]);

  const seedBenchmarkLibrary = useCallback((count = 1000) => {
    const seeded = MusicLibraryService.seedBenchmarkLibrary(count);
    refreshLibrary();
    return seeded;
  }, [refreshLibrary]);

  const clearLibrary = useCallback(() => {
    MusicLibraryService.clearAllData();
    refreshLibrary();
  }, [refreshLibrary]);

  const favoriteTracks = useMemo(() => tracks.filter((t) => t.isFavorite), [tracks]);
  const favoriteAlbums = useMemo(() => albums.filter((a) => a.isFavorite), [albums]);

  const getTracksForFolder = useCallback((folderPath: string) => {
    return MusicLibraryService.getTracksForFolder(folderPath);
  }, []);

  const sortTracks = useCallback((trackList: AudioTrack[], sortOption: LibrarySortOption) => {
    return MusicLibraryService.sortTracks(trackList, sortOption);
  }, []);

  const searchLibrary = useCallback((q: string) => {
    return MusicLibraryService.search(q);
  }, []);

  const value: LibraryContextValue = useMemo(
    () => ({
      tracks,
      favoriteTracks,
      albums,
      favoriteAlbums,
      artists,
      playlists,
      folders,
      stats,
      capabilities,
      isScanning,
      recentSearches,
      toggleFavorite,
      toggleFavoriteAlbum,
      createPlaylist,
      renamePlaylist,
      deletePlaylist,
      addTrackToPlaylist,
      removeTrackFromPlaylist,
      getTracksForFolder,
      sortTracks,
      searchLibrary,
      addRecentSearch,
      clearRecentSearches,
      refreshLibrary,
      triggerPlatformImport,
      importAudioFilesManually,
      seedBenchmarkLibrary,
      clearLibrary,
    }),
    [
      tracks,
      favoriteTracks,
      albums,
      favoriteAlbums,
      artists,
      playlists,
      folders,
      stats,
      capabilities,
      isScanning,
      recentSearches,
      toggleFavorite,
      toggleFavoriteAlbum,
      createPlaylist,
      renamePlaylist,
      deletePlaylist,
      addTrackToPlaylist,
      removeTrackFromPlaylist,
      getTracksForFolder,
      sortTracks,
      searchLibrary,
      addRecentSearch,
      clearRecentSearches,
      refreshLibrary,
      triggerPlatformImport,
      importAudioFilesManually,
      seedBenchmarkLibrary,
      clearLibrary,
    ]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
};

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
}
