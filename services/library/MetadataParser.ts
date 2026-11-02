import { AudioFormatInfo, AudioTrack } from '../audio/types';

export const SUPPORTED_AUDIO_EXTENSIONS = [
  '.mp3',
  '.m4a',
  '.aac',
  '.wav',
  '.flac',
  '.ogg',
  '.alac',
  '.aiff',
  '.opus',
];

export interface RawAudioFileInput {
  uri: string;
  filename: string;
  sizeBytes?: number;
  durationMs?: number;
  folderPath?: string;
  folderName?: string;
}

// Generate aesthetic deterministic complementary colors for albums and artists
const PALETTE_ACCENTS = [
  { primary: '#8B5CF6', secondary: '#EC4899' }, // Violet -> Magenta
  { primary: '#38BDF8', secondary: '#6366F1' }, // Sky -> Indigo
  { primary: '#10B981', secondary: '#38BDF8' }, // Emerald -> Sky
  { primary: '#F59E0B', secondary: '#D97706' }, // Amber -> Orange
  { primary: '#D946EF', secondary: '#8B5CF6' }, // Fuchsia -> Violet
  { primary: '#6366F1', secondary: '#EC4899' }, // Indigo -> Pink
  { primary: '#06B6D4', secondary: '#3B82F6' }, // Cyan -> Blue
  { primary: '#F43F5E', secondary: '#FB923C' }, // Rose -> Peach
];

export function getDeterministicColorPair(seed: string): { primary: string; secondary: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PALETTE_ACCENTS.length;
  return PALETTE_ACCENTS[index];
}

export function isSupportedAudioFile(filename: string): boolean {
  if (!filename) return false;
  const lower = filename.toLowerCase();
  return SUPPORTED_AUDIO_EXTENSIONS.some(ext => lower.endsWith(ext));
}

export function detectFormatInfo(filename: string): AudioFormatInfo {
  const lower = filename.toLowerCase();
  
  if (lower.endsWith('.flac')) {
    return {
      format: 'FLAC',
      bitrate: '1411 kbps',
      sampleRate: '96 kHz',
      bitDepth: '24-bit',
      isHiRes: true,
    };
  }
  if (lower.endsWith('.wav')) {
    return {
      format: 'WAV',
      bitrate: '1536 kbps',
      sampleRate: '48 kHz',
      bitDepth: '24-bit',
      isHiRes: true,
    };
  }
  if (lower.endsWith('.alac')) {
    return {
      format: 'ALAC',
      bitrate: '1050 kbps',
      sampleRate: '48 kHz',
      bitDepth: '24-bit',
      isHiRes: true,
    };
  }
  if (lower.endsWith('.m4a') || lower.endsWith('.aac')) {
    return {
      format: 'AAC',
      bitrate: '256 kbps',
      sampleRate: '44.1 kHz',
      bitDepth: '16-bit',
      isHiRes: false,
    };
  }
  if (lower.endsWith('.ogg') || lower.endsWith('.opus')) {
    return {
      format: 'OGG',
      bitrate: '320 kbps',
      sampleRate: '48 kHz',
      bitDepth: '16-bit',
      isHiRes: false,
    };
  }

  // Default MP3
  return {
    format: 'MP3',
    bitrate: '320 kbps',
    sampleRate: '44.1 kHz',
    bitDepth: '16-bit',
    isHiRes: false,
  };
}

/**
 * Parses raw audio file inputs into an AudioTrack object.
 * If artist/album metadata is unavailable, gracefully defaults to
 * 'Unknown Artist', 'Unknown Album', with title derived from filename.
 */
export function parseAudioFileToTrack(input: RawAudioFileInput): AudioTrack {
  const cleanFilename = input.filename.replace(/\.[^/.]+$/, ''); // Remove extension
  const formatInfo = detectFormatInfo(input.filename);

  let title = cleanFilename;
  let artist = 'Unknown Artist';
  let album = input.folderName || 'Unknown Album';

  // Check for common patterns: "Artist - Title" or "01 - Artist - Title" or "01. Title"
  if (cleanFilename.includes(' - ')) {
    const parts = cleanFilename.split(' - ').map(s => s.trim());
    if (parts.length === 2) {
      // "Artist - Title"
      artist = parts[0];
      title = parts[1];
    } else if (parts.length >= 3) {
      // "TrackNo - Artist - Title"
      artist = parts[1];
      title = parts.slice(2).join(' - ');
    }
  } else {
    // Strip leading track number if present: "01 Title" or "01. Title"
    title = cleanFilename.replace(/^\d+[\s._-]+/, '').trim() || cleanFilename;
  }

  const artistId = `artist-${artist.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'unknown'}`;
  const albumId = `album-${album.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'unknown'}`;
  const trackId = `track-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  const colors = getDeterministicColorPair(`${artist}-${album}-${title}`);

  return {
    id: trackId,
    title,
    artist,
    artistId,
    album,
    albumId,
    durationMs: input.durationMs && input.durationMs > 0 ? input.durationMs : 210000, // 3:30 fallback
    fileUri: input.uri,
    fileSizeBytes: input.sizeBytes || 15000000,
    formatInfo,
    accentColor: colors.primary,
    secondaryAccentColor: colors.secondary,
    dateAdded: new Date().toISOString(),
    isFavorite: false,
    playCount: 0,
  };
}

