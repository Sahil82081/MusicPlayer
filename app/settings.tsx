import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLibrary } from '@/context/LibraryContext';
import { Palette, Radius, Spacing } from '@/constants/theme';
import ScreenContainer from '@/components/common/ScreenContainer';
import Typography from '@/components/common/Typography';
import AnimatedPressable from '@/components/common/AnimatedPressable';
import GlassCard from '@/components/common/GlassCard';
import Badge from '@/components/common/Badge';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { capabilities, stats, isScanning, triggerPlatformImport, seedBenchmarkLibrary, clearLibrary } = useLibrary();

  // Playback settings
  const [gapless, setGapless] = useState(true);
  const [hiResDirect, setHiResDirect] = useState(true);
  const [autoSkipCorrupt, setAutoSkipCorrupt] = useState(true);
  const [resumePlayback, setResumePlayback] = useState(true);

  // Appearance settings
  const [pureBlackTheme, setPureBlackTheme] = useState(false);
  const [reduceMotionSetting, setReduceMotionSetting] = useState(false);

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb > 1000) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(0)} MB`;
  };

  const handleRescanStorage = async () => {
    try {
      const msg = await triggerPlatformImport();
      Alert.alert('Storage Scan', msg);
    } catch {
      Alert.alert('Scan Failed', 'Unable to scan storage. Please verify device permissions.');
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Artwork Cache',
      'This will remove cached album artwork thumbnails. Offline audio files will NOT be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            try {
              await Image.clearDiskCache();
              await Image.clearMemoryCache();
            } catch {}
            Alert.alert('Success', 'Local artwork thumbnail cache has been cleared.');
          },
        },
      ]
    );
  };

  const handleBenchmark1000 = () => {
    Alert.alert(
      'Benchmark Large Library',
      'Populate your offline collection with 1,000 realistic tracks across 12 albums and 9 genres to stress-test virtualized scrolling, search, and SQLite indexing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate 1,000 Tracks',
          onPress: () => {
            const count = seedBenchmarkLibrary(1000);
            Alert.alert(
              'Large Library Active',
              `Indexed ${count} tracks in offline SQLite. Visit Library and Search to experience 60fps virtualization!`
            );
          },
        },
      ]
    );
  };

  const handleResetLibrary = () => {
    Alert.alert(
      'Reset Music Database',
      'This will clear the offline music database index so you can test discovery and file imports from a clean empty state.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Database',
          style: 'destructive',
          onPress: () => {
            clearLibrary();
            Alert.alert(
              'Database Cleared',
              'The offline music library index is now empty. Visit Home or Library to test scanning or importing audio files.'
            );
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer scrollable>
      {/* Top Header */}
      <View style={[styles.topNav, { paddingTop: insets.top + Spacing.xs }]}>
        <AnimatedPressable onPress={() => router.back()} style={styles.navIconButton}>
          <Ionicons name="chevron-back" size={24} color={Palette.textPrimary} />
        </AnimatedPressable>

        <Typography variant="titleLarge" color={Palette.textPrimary}>
          Settings
        </Typography>

        <View style={{ width: 40 }} />
      </View>

      {/* 1. PLAYBACK SECTION */}
      <View style={styles.sectionWrapper}>
        <Typography variant="meta" color={Palette.primaryLight} style={styles.sectionHeader}>
          PLAYBACK
        </Typography>

        <GlassCard style={styles.card} elevated>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Typography variant="bodyMedium" color={Palette.textPrimary}>
                High-Res Bit-Perfect DAC
              </Typography>
              <Typography variant="caption" color={Palette.textSecondary}>
                Direct hardware bypass for 24-bit 96kHz FLAC/WAV output.
              </Typography>
            </View>
            <Switch
              value={hiResDirect}
              onValueChange={setHiResDirect}
              trackColor={{ false: Palette.surfaceHover, true: Palette.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Typography variant="bodyMedium" color={Palette.textPrimary}>
                Gapless Audio
              </Typography>
              <Typography variant="caption" color={Palette.textSecondary}>
                Smooth transitions between continuous tracks without pauses.
              </Typography>
            </View>
            <Switch
              value={gapless}
              onValueChange={setGapless}
              trackColor={{ false: Palette.surfaceHover, true: Palette.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Typography variant="bodyMedium" color={Palette.textPrimary}>
                Resume Playback on Launch
              </Typography>
              <Typography variant="caption" color={Palette.textSecondary}>
                Remember last played song and exact seek position.
              </Typography>
            </View>
            <Switch
              value={resumePlayback}
              onValueChange={setResumePlayback}
              trackColor={{ false: Palette.surfaceHover, true: Palette.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Typography variant="bodyMedium" color={Palette.textPrimary}>
                Auto-Skip Corrupted Tracks
              </Typography>
              <Typography variant="caption" color={Palette.textSecondary}>
                Safely advances to next song if an audio file is missing or damaged.
              </Typography>
            </View>
            <Switch
              value={autoSkipCorrupt}
              onValueChange={setAutoSkipCorrupt}
              trackColor={{ false: Palette.surfaceHover, true: Palette.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </GlassCard>
      </View>

      {/* 2. APPEARANCE SECTION */}
      <View style={styles.sectionWrapper}>
        <Typography variant="meta" color={Palette.primaryLight} style={styles.sectionHeader}>
          APPEARANCE
        </Typography>

        <GlassCard style={styles.card} elevated>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Typography variant="bodyMedium" color={Palette.textPrimary}>
                Pure Black Theme (AMOLED)
              </Typography>
              <Typography variant="caption" color={Palette.textSecondary}>
                Uses deep true blacks (#000000) for OLED power saving.
              </Typography>
            </View>
            <Switch
              value={pureBlackTheme}
              onValueChange={setPureBlackTheme}
              trackColor={{ false: Palette.surfaceHover, true: Palette.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Typography variant="bodyMedium" color={Palette.textPrimary}>
                Reduce Motion
              </Typography>
              <Typography variant="caption" color={Palette.textSecondary}>
                Minimizes continuous breathing and spinning artwork effects.
              </Typography>
            </View>
            <Switch
              value={reduceMotionSetting}
              onValueChange={setReduceMotionSetting}
              trackColor={{ false: Palette.surfaceHover, true: Palette.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Typography variant="subhead" color={Palette.textSecondary}>
              Accent Tone
            </Typography>
            <View style={styles.accentBadgeRow}>
              <View style={[styles.colorDot, { backgroundColor: Palette.primary }]} />
              <Typography variant="caption" color={Palette.primaryLight} style={{ marginLeft: 6 }}>
                Violet / Magenta Aura
              </Typography>
            </View>
          </View>
        </GlassCard>
      </View>

      {/* 3. LIBRARY & STORAGE SECTION */}
      <View style={styles.sectionWrapper}>
        <Typography variant="meta" color={Palette.primaryLight} style={styles.sectionHeader}>
          LIBRARY & STORAGE
        </Typography>

        <GlassCard style={styles.card} elevated>
          <View style={styles.infoRow}>
            <Typography variant="subhead" color={Palette.textSecondary}>
              Local Audio Storage
            </Typography>
            <Typography variant="subhead" color={Palette.textPrimary}>
              {formatBytes(stats.totalStorageBytes)} ({stats.totalTracks} tracks)
            </Typography>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Typography variant="subhead" color={Palette.textSecondary}>
              Platform Conduit
            </Typography>
            <Typography variant="caption" color={Palette.primaryLight}>
              {capabilities.storageLocationLabel}
            </Typography>
          </View>

          <View style={styles.divider} />

          <AnimatedPressable onPress={handleRescanStorage} style={styles.actionLinkRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Typography variant="bodyMedium" color={Palette.textPrimary}>
                Rescan Local Storage
              </Typography>
              {isScanning && (
                <ActivityIndicator size="small" color={Palette.primaryLight} style={{ marginLeft: 8 }} />
              )}
            </View>
            <Ionicons name="sync-outline" size={18} color={Palette.primaryLight} />
          </AnimatedPressable>

          <View style={styles.divider} />

          <AnimatedPressable onPress={handleClearCache} style={styles.actionLinkRow}>
            <Typography variant="bodyMedium" color={Palette.textSecondary}>
              Clear Cached Artwork
            </Typography>
            <Ionicons name="images-outline" size={18} color={Palette.textSecondary} />
          </AnimatedPressable>

          <View style={styles.divider} />

          <AnimatedPressable onPress={handleBenchmark1000} style={styles.actionLinkRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Typography variant="bodyMedium" color={Palette.primaryLight} weight="600">
                Benchmark Large Library (1,000 Songs)
              </Typography>
            </View>
            <Ionicons name="speedometer-outline" size={18} color={Palette.primaryLight} />
          </AnimatedPressable>

          <View style={styles.divider} />

          <AnimatedPressable onPress={handleResetLibrary} style={styles.actionLinkRow}>
            <Typography variant="bodyMedium" color={Palette.secondaryLight}>
              Reset Database (Test Empty State)
            </Typography>
            <Ionicons name="trash-outline" size={18} color={Palette.secondaryLight} />
          </AnimatedPressable>
        </GlassCard>
      </View>

      {/* 4. ABOUT SECTION */}
      <View style={styles.sectionWrapper}>
        <Typography variant="meta" color={Palette.textTertiary} style={styles.sectionHeader}>
          ABOUT
        </Typography>

        <GlassCard style={styles.card} elevated>
          <View style={styles.infoRow}>
            <Typography variant="subhead" color={Palette.textSecondary}>
              Application
            </Typography>
            <Typography variant="subhead" color={Palette.textPrimary}>
              Aura Music Offline Player
            </Typography>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Typography variant="subhead" color={Palette.textSecondary}>
              Version
            </Typography>
            <Badge label="v1.0.0 PREMIUM" variant="primary" />
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Typography variant="subhead" color={Palette.textSecondary}>
              Platform Architecture
            </Typography>
            <Typography variant="caption" color={Palette.textTertiary}>
              React Native • Expo Router • Cross-Platform (Android & iOS)
            </Typography>
          </View>

          <View style={styles.divider} />

          <View style={styles.privacyNote}>
            <Ionicons name="shield-checkmark" size={18} color={Palette.success} style={{ marginRight: 8 }} />
            <Typography variant="caption" color={Palette.textSecondary} style={{ flex: 1 }}>
              100% Private Offline Audio. No accounts, zero analytics, zero cloud tracking, zero network requests.
            </Typography>
          </View>
        </GlassCard>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  navIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  sectionWrapper: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  sectionHeader: {
    marginBottom: Spacing.xs,
    marginLeft: 4,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  card: {
    padding: Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  settingInfo: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  actionLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  accentBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.borderSubtle,
    marginVertical: 4,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.sm,
  },
});
