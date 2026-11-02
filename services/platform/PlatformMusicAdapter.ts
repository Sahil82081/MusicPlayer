import { Platform } from 'react-native';
import { IPlatformMusicAdapter, PlatformCapabilities, PlatformOS } from './types';
import { androidMusicAdapter } from './android/AndroidMusicAdapter';
import { iosMusicAdapter } from './ios/IOSMusicAdapter';

/**
 * Universal Platform Music Adapter Factory
 * 
 * Selects the active platform adapter based on runtime environment.
 * Provides clean platform isolation without cluttering UI components.
 */
class UniversalPlatformMusicAdapter implements IPlatformMusicAdapter {
  private activeAdapter: IPlatformMusicAdapter;

  constructor() {
    if (Platform.OS === 'ios') {
      this.activeAdapter = iosMusicAdapter;
    } else {
      // Default to Android adapter for Android and local test harness
      this.activeAdapter = androidMusicAdapter;
    }
  }

  getOS(): PlatformOS {
    return (Platform.OS as PlatformOS) || 'android';
  }

  getCapabilities(): PlatformCapabilities {
    return this.activeAdapter.getCapabilities();
  }

  async scanLocalMedia(options?: any) {
    return this.activeAdapter.scanLocalMedia(options);
  }

  async importFiles() {
    return this.activeAdapter.importFiles();
  }

  async requestStoragePermissions() {
    return this.activeAdapter.requestStoragePermissions();
  }

  async getMonitoredDirectories() {
    return this.activeAdapter.getMonitoredDirectories();
  }

  /**
   * For testing or previewing the other platform's UI flow
   */
  getAdapterFor(os: 'android' | 'ios'): IPlatformMusicAdapter {
    return os === 'ios' ? iosMusicAdapter : androidMusicAdapter;
  }
}

export const PlatformMusicService = new UniversalPlatformMusicAdapter();

