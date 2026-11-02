import { Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import {
  IPlatformMusicAdapter,
  ImportResult,
  PlatformCapabilities,
  PlatformOS,
  ScanOptions,
  ScanResult,
} from '../types';
import { isSupportedAudioFile, parseAudioFileToTrack } from '../../library/MetadataParser';
import { DatabaseService } from '../../database/DatabaseService';
import { AudioTrack } from '../../audio/types';

/**
 * Android Music Adapter
 * 
 * Directly queries Android's MediaStore.Audio indexing:
 * - Scans local directories: /storage/emulated/0/Music (including subfolders like Music/Bollywood, Music/English, etc.)
 * - Uses READ_MEDIA_AUDIO (Android 13+) / READ_EXTERNAL_STORAGE (Android 12-)
 * - Extracts duration, filename, folder hierarchy, and indexes into SQLite
 */
export class AndroidMusicAdapter implements IPlatformMusicAdapter {
  getOS(): PlatformOS {
    return 'android';
  }

  getCapabilities(): PlatformCapabilities {
    return {
      os: 'android',
      supportsDeviceAutoScan: true,
      supportsSystemFilePicker: true,
      supportsCustomFolderMonitoring: true,
      storageLocationLabel: 'Internal Storage/Music/ & Subfolders',
      importActionLabel: 'Scan Music Folder',
      scanActionLabel: 'Scan Android MediaStore',
      permissionTitle: 'Audio Storage Access',
      permissionDescription:
        'Aura Music scans audio files from your device "Music/" directory and subfolders without uploading any data.',
      supportedFormats: ['MP3', 'M4A', 'AAC', 'WAV', 'FLAC', 'OGG', 'OPUS'],
    };
  }

  async requestStoragePermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      const { status, canAskAgain } = await MediaLibrary.getPermissionsAsync(false, ['audio']);
      if (status === 'granted') return true;

      const request = await MediaLibrary.requestPermissionsAsync(false, ['audio']);
      return request.status === 'granted';
    } catch (e) {
      console.warn('Error requesting Android storage permissions:', e);
      return false;
    }
  }

  async scanLocalMedia(options?: ScanOptions): Promise<ScanResult> {
    const startTime = Date.now();

    try {
      const hasPermission = await this.requestStoragePermissions();
      if (!hasPermission) {
        return {
          success: false,
          scannedFilesCount: 0,
          newTracksCount: 0,
          elapsedMs: Date.now() - startTime,
          error: 'Android restricts automatic folder scanning in Expo Go. Tap "Pick Files" to choose your songs!',
        };
      }

      // Fast differential scan: fetch existing URIs to avoid rescanning unchanged tracks
      const existingUris = DatabaseService.getExistingTrackUris();
      const assets = await MediaLibrary.getAssetsAsync({
        mediaType: [MediaLibrary.MediaType.audio],
        first: 1000,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });

      const newTracks: AudioTrack[] = [];

      for (const asset of assets.assets) {
        if (!isSupportedAudioFile(asset.filename)) continue;
        if (existingUris.has(asset.uri)) continue; // Already indexed, skip!

        // Extract folder name and subfolder path from URI or filename
        // Example: /storage/emulated/0/Music/Bollywood/track.mp3 -> folder: "Bollywood"
        let folderName = 'Music';
        let folderPath = '/storage/emulated/0/Music';

        if (asset.uri) {
          const pathParts = asset.uri.split('/');
          if (pathParts.length >= 2) {
            folderName = pathParts[pathParts.length - 2];
            folderPath = pathParts.slice(0, pathParts.length - 1).join('/');
          }
        }

        const track = parseAudioFileToTrack({
          uri: asset.uri,
          filename: asset.filename,
          durationMs: asset.duration ? Math.round(asset.duration * 1000) : undefined,
          folderName,
          folderPath,
        });

        newTracks.push(track);
      }

      if (newTracks.length > 0) {
        DatabaseService.saveTracksBatch(newTracks);
      }

      return {
        success: true,
        scannedFilesCount: assets.totalCount,
        newTracksCount: newTracks.length,
        elapsedMs: Date.now() - startTime,
      };
    } catch (err: any) {
      console.warn('Android MediaStore scan exception:', err);
      return {
        success: false,
        scannedFilesCount: 0,
        newTracksCount: 0,
        elapsedMs: Date.now() - startTime,
        error: err?.message || 'Failed to scan Android storage.',
      };
    }
  }

  async importFiles(): Promise<ImportResult> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'audio/*',
          'audio/mpeg',
          'audio/wav',
          'audio/x-wav',
          'audio/flac',
          'audio/x-flac',
          'audio/aac',
          'audio/mp4',
          'audio/ogg',
        ],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return {
          success: true,
          importedCount: 0,
          filePaths: [],
          canceled: true,
        };
      }

      const destDir = `${FileSystem.documentDirectory}AuraMusic/`;
      const dirInfo = await FileSystem.getInfoAsync(destDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
      }

      const importedTracks: AudioTrack[] = [];
      const filePaths: string[] = [];

      for (const file of result.assets) {
        if (!isSupportedAudioFile(file.name)) continue;

        const cleanFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const destinationUri = `${destDir}${cleanFilename}`;

        try {
          await FileSystem.copyAsync({
            from: file.uri,
            to: destinationUri,
          });

          const fileInfo = await FileSystem.getInfoAsync(destinationUri);

          const track = parseAudioFileToTrack({
            uri: destinationUri,
            filename: file.name,
            sizeBytes: fileInfo.exists ? fileInfo.size : file.size,
            folderName: 'Imported',
            folderPath: destDir,
          });

          importedTracks.push(track);
          filePaths.push(destinationUri);
        } catch (copyErr) {
          console.warn('Failed to copy imported track:', copyErr);
          const track = parseAudioFileToTrack({
            uri: file.uri,
            filename: file.name,
            sizeBytes: file.size,
            folderName: 'Imported',
            folderPath: destDir,
          });
          importedTracks.push(track);
          filePaths.push(file.uri);
        }
      }

      if (importedTracks.length > 0) {
        DatabaseService.saveTracksBatch(importedTracks, destDir, 'Imported');
      }

      return {
        success: true,
        importedCount: importedTracks.length,
        filePaths,
        canceled: false,
      };
    } catch (e: any) {
      return {
        success: false,
        importedCount: 0,
        filePaths: [],
        canceled: false,
        error: e?.message || 'Import failed',
      };
    }
  }

  async getMonitoredDirectories(): Promise<string[]> {
    return [
      'Internal Storage/Music/',
      'Internal Storage/Music/Bollywood/',
      'Internal Storage/Music/English/',
      'Internal Storage/Music/Instrumental/',
    ];
  }
}

export const androidMusicAdapter = new AndroidMusicAdapter();
