import { Platform } from 'react-native';
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
 * iOS Music Adapter
 * 
 * iOS sandboxing isolates files per app container.
 * - Opens iOS Files App document picker
 * - Copies selected audio files into Aura Music's local Documents/AuraMusic/ storage
 * - Supports iTunes / Finder File Sharing inbox scanning
 * - 100% offline, zero cloud uploads
 */
export class IOSMusicAdapter implements IPlatformMusicAdapter {
  private readonly STORAGE_DIR = `${FileSystem.documentDirectory}AuraMusic/`;

  getOS(): PlatformOS {
    return 'ios';
  }

  getCapabilities(): PlatformCapabilities {
    return {
      os: 'ios',
      supportsDeviceAutoScan: false, // iOS sandbox requires document picking or sandbox scanning
      supportsSystemFilePicker: true,
      supportsCustomFolderMonitoring: false,
      storageLocationLabel: 'Aura Music Sandbox (Apple Files App)',
      importActionLabel: 'Import from Files',
      scanActionLabel: 'Refresh App Documents Folder',
      permissionTitle: 'Files App Access',
      permissionDescription:
        'Select audio files from Apple Files (iCloud Drive, On My iPhone, Downloads) to import locally into Aura Music.',
      supportedFormats: ['ALAC', 'FLAC', 'WAV', 'MP3', 'AAC', 'M4A', 'AIFF'],
    };
  }

  async requestStoragePermissions(): Promise<boolean> {
    // iOS sandboxed document picker does not require broad storage permissions
    return true;
  }

  private async ensureStorageDirectory(): Promise<string> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.STORAGE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.STORAGE_DIR, { intermediates: true });
      }
      return this.STORAGE_DIR;
    } catch {
      return FileSystem.documentDirectory || '';
    }
  }

  /**
   * Scans the app's local sandbox Documents/ directory for previously imported or iTunes-shared files
   */
  async scanLocalMedia(options?: ScanOptions): Promise<ScanResult> {
    const startTime = Date.now();
    try {
      const targetDir = await this.ensureStorageDirectory();
      const existingUris = DatabaseService.getExistingTrackUris();
      const fileNames = await FileSystem.readDirectoryAsync(targetDir);

      const scannedTracks: AudioTrack[] = [];

      for (const name of fileNames) {
        if (!isSupportedAudioFile(name)) continue;

        const fileUri = `${targetDir}${name}`;
        if (existingUris.has(fileUri)) continue; // Already indexed, skip!

        const fileInfo = await FileSystem.getInfoAsync(fileUri);

        const track = parseAudioFileToTrack({
          uri: fileUri,
          filename: name,
          sizeBytes: fileInfo.exists ? fileInfo.size : undefined,
          folderName: 'AuraMusic Sandbox',
          folderPath: targetDir,
        });

        scannedTracks.push(track);
      }

      if (scannedTracks.length > 0) {
        DatabaseService.saveTracksBatch(scannedTracks, targetDir, 'AuraMusic Sandbox');
      }

      return {
        success: true,
        scannedFilesCount: fileNames.length,
        newTracksCount: scannedTracks.length,
        elapsedMs: Date.now() - startTime,
      };
    } catch (err: any) {
      console.warn('iOS sandbox scan error:', err);
      return {
        success: false,
        scannedFilesCount: 0,
        newTracksCount: 0,
        elapsedMs: Date.now() - startTime,
        error: err?.message || 'Failed to scan iOS Documents folder',
      };
    }
  }

  /**
   * Opens Apple Files picker, lets user select audio files, and copies them to local storage
   */
  async importFiles(): Promise<ImportResult> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'audio/*',
          'public.audio',
          'audio/mpeg',
          'audio/wav',
          'audio/x-wav',
          'audio/flac',
          'audio/x-flac',
          'audio/aac',
          'audio/mp4',
          'audio/x-m4a',
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

      const targetDir = await this.ensureStorageDirectory();
      const importedTracks: AudioTrack[] = [];
      const filePaths: string[] = [];

      for (const asset of result.assets) {
        if (!isSupportedAudioFile(asset.name)) continue;

        const destinationUri = `${targetDir}${asset.name}`;

        try {
          // Copy from picker cache to permanent app sandbox Documents/AuraMusic/
          await FileSystem.copyAsync({
            from: asset.uri,
            to: destinationUri,
          });

          const fileInfo = await FileSystem.getInfoAsync(destinationUri);

          const track = parseAudioFileToTrack({
            uri: destinationUri,
            filename: asset.name,
            sizeBytes: fileInfo.exists ? fileInfo.size : asset.size,
            folderName: 'Imported Files',
            folderPath: targetDir,
          });

          importedTracks.push(track);
          filePaths.push(destinationUri);
        } catch (copyErr) {
          console.warn(`Failed to copy ${asset.name} to sandbox:`, copyErr);
        }
      }

      if (importedTracks.length > 0) {
        DatabaseService.saveTracksBatch(importedTracks, targetDir, 'Imported Files');
      }

      return {
        success: true,
        importedCount: importedTracks.length,
        filePaths,
        canceled: false,
      };
    } catch (e: any) {
      console.warn('iOS DocumentPicker error:', e);
      return {
        success: false,
        importedCount: 0,
        filePaths: [],
        canceled: false,
        error: e?.message || 'Failed to import files from iOS Files app',
      };
    }
  }

  async getMonitoredDirectories(): Promise<string[]> {
    return [
      'Documents/AuraMusic/',
      'Documents/Inbox/ (AirDrop & iTunes Sharing)',
    ];
  }
}

export const iosMusicAdapter = new IOSMusicAdapter();
