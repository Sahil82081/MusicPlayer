export type PlatformOS = 'android' | 'ios' | 'web' | 'windows' | 'macos';

export interface PlatformCapabilities {
  os: PlatformOS;
  supportsDeviceAutoScan: boolean;
  supportsSystemFilePicker: boolean;
  supportsCustomFolderMonitoring: boolean;
  storageLocationLabel: string;
  importActionLabel: string;
  scanActionLabel: string;
  permissionTitle: string;
  permissionDescription: string;
  supportedFormats: string[];
}

export interface ScanOptions {
  directoryPath?: string;
  recursive?: boolean;
  minDurationMs?: number;
  ignoreRingtones?: boolean;
}

export interface ScanResult {
  success: boolean;
  scannedFilesCount: number;
  newTracksCount: number;
  elapsedMs: number;
  error?: string;
}

export interface ImportResult {
  success: boolean;
  importedCount: number;
  filePaths: string[];
  canceled: boolean;
  error?: string;
}

export interface IPlatformMusicAdapter {
  getOS(): PlatformOS;
  getCapabilities(): PlatformCapabilities;
  scanLocalMedia(options?: ScanOptions): Promise<ScanResult>;
  importFiles(): Promise<ImportResult>;
  requestStoragePermissions(): Promise<boolean>;
  getMonitoredDirectories(): Promise<string[]>;
}

