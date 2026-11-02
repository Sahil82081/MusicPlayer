import React, { useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLibrary } from '@/context/LibraryContext';
import { Palette, Radius, Spacing } from '@/constants/theme';
import Typography from '../common/Typography';
import Button from '../common/Button';
import Badge from '../common/Badge';
import AnimatedPressable from '../common/AnimatedPressable';

interface LibraryEmptyStateProps {
  onImportComplete?: () => void;
}

export const LibraryEmptyState: React.FC<LibraryEmptyStateProps> = () => {
  const { capabilities, isScanning, triggerPlatformImport, importAudioFilesManually } = useLibrary();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isAndroid = capabilities.os === 'android';

  const handlePrimaryImport = async () => {
    setErrorMessage(null);
    try {
      const message = await triggerPlatformImport();
      if (message.toLowerCase().includes('denied') || message.toLowerCase().includes('permission')) {
        setErrorMessage(message);
      }
    } catch {
      setErrorMessage(
        isAndroid
          ? 'Unable to scan storage. Please allow audio access in Android settings.'
          : 'Unable to open Files app. Please ensure Files access is enabled.'
      );
    }
  };

  const handleManualPick = async () => {
    setErrorMessage(null);
    try {
      await importAudioFilesManually();
    } catch {
      setErrorMessage('Unable to import selected files.');
    }
  };

  const handleOpenSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      // Graceful fallback
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons
          name={isAndroid ? 'folder-open-outline' : 'cloud-download-outline'}
          size={44}
          color={Palette.primaryLight}
        />
      </View>

      <Badge
        label={isAndroid ? 'ANDROID LOCAL STORAGE' : 'APPLE FILES IMPORT'}
        variant="primary"
        style={styles.badge}
      />

      <Typography variant="titleLarge" color={Palette.textPrimary} align="center" style={styles.title}>
        No music yet
      </Typography>

      <Typography variant="body" color={Palette.textSecondary} align="center" style={styles.explanation}>
        {isAndroid
          ? 'Add music to your Music folder.\nPlace MP3, FLAC, or WAV files into Internal Storage/Music/ or subfolders (e.g., Bollywood, English) to build your offline library.'
          : 'Import music using Files.\nSelect audio files from Apple Files, iCloud Drive, or Downloads to store them locally in Aura Music.'}
      </Typography>

      {/* Permission / Storage Notice if unavailable */}
      {errorMessage && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={20} color={Palette.warning} style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Typography variant="caption" color={Palette.textPrimary} style={{ lineHeight: 18 }}>
              {errorMessage}
            </Typography>
            <AnimatedPressable onPress={handleOpenSettings} style={styles.openSettingsBtn}>
              <Typography variant="caption" color={Palette.primaryLight} weight="600">
                Open Device Settings →
              </Typography>
            </AnimatedPressable>
          </View>
        </View>
      )}

      <View style={styles.actionColumn}>
        <Button
          variant="primary"
          size="lg"
          title={
            isScanning
              ? 'Scanning Storage...'
              : isAndroid
              ? 'Scan Music Folder'
              : 'Import from Files'
          }
          iconName={isAndroid ? 'sync' : 'document-text-outline'}
          onPress={handlePrimaryImport}
          disabled={isScanning}
          style={styles.primaryButton}
        >
          {isScanning && (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
              style={{ marginLeft: Spacing.sm }}
            />
          )}
        </Button>

        {isAndroid && (
          <Button
            variant="secondary"
            size="md"
            title="Select Files Directly"
            iconName="add"
            onPress={handleManualPick}
            disabled={isScanning}
            style={styles.secondaryButton}
          />
        )}
      </View>

      {/* Storage location hint */}
      <View style={styles.storageHintRow}>
        <Ionicons name="information-circle-outline" size={14} color={Palette.textTertiary} />
        <Typography variant="caption" color={Palette.textTertiary} style={styles.storageHint}>
          {capabilities.storageLocationLabel}
        </Typography>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  badge: {
    marginBottom: Spacing.sm,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  explanation: {
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: Spacing.lg,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: Spacing.lg,
    maxWidth: 340,
  },
  openSettingsBtn: {
    marginTop: 6,
    paddingVertical: 2,
  },
  actionColumn: {
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    marginBottom: Spacing.sm,
  },
  secondaryButton: {
    width: '100%',
  },
  storageHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  storageHint: {
    marginLeft: 4,
  },
});

export default LibraryEmptyState;
