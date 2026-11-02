import { AudioTrack } from '../audio/types';

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  year: number;
  artworkUrl?: string;
  accentColor?: string;
  trackCount: number;
  totalDurationMs: number;
  tracks?: AudioTrack[];
  isFavorite?: boolean;
}

export interface Artist {
  id: string;
  name: string;
  bio?: string;
  artworkUrl?: string;
  accentColor?: string;
  trackCount: number;
  albumCount: number;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  artworkUrl?: string;
  accentColor: string;
  trackCount: number;
  totalDurationMs: number;
  trackIds: string[];
  createdAt: string;
  isCustom?: boolean;
}

export interface MusicFolder {
  id: string;
  path: string;
  name: string;
  trackCount: number;
  sizeBytes: number;
}

export interface LibraryStats {
  totalTracks: number;
  totalAlbums: number;
  totalArtists: number;
  totalPlaylists: number;
  totalStorageBytes: number;
  totalDurationMs: number;
  lastScannedAt: string;
}

export type LibrarySortOption =
  | 'name'
  | 'recently_added'
  | 'recently_played'
  | 'artist'
  | 'album';

export interface LibrarySearchResults {
  tracks: AudioTrack[];
  albums: Album[];
  artists: Artist[];
  folders: MusicFolder[];
}
