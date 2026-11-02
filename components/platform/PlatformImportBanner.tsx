import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLibrary } from '@/context/LibraryContext';
import { Palette, Radius, Spacing } from '@/constants/theme';
import GlassCard from '../common/GlassCard';
import Typography from '../common/Typography';
import Button from '../common/Button';
import Badge from '../common/Badge';
import AnimatedPressable from '../common/AnimatedPressable';

export const PlatformImportBanner: React.FC = () => {
  const { capabilities, isScanning, triggerPlatformImport, importAudioFilesManually } = useLibrary();
  const [feedback, setFeedback] = useState<string | null>(null);

  const isAndroid = capabilities.os === 'android';

  const handleScanAction = async () => {
    try {
      const message = await triggerPlatformImport();
      if (
        message.toLowerCase().includes('denied') ||
        message.toLowerCase().includes('restricts') ||
        message.toLowerCase().includes('permission')
      ) {
        Alert.alert(
          'Automatic Scan in Expo Go',
          'Android blocks developer apps like Expo Go from scanning all storage. Would you like to pick your music files directly?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Pick Songs',
              onPress: handleImportFilesAction,
            },
          ]
        );
      }
      setFeedback(message);
      setTimeout(() => setFeedback(null), 5000);
    } catch {
      Alert.alert('Scan Error', 'Unable to scan offline library storage.');
    }
  };

  const handleImportFilesAction = async () => {
    try {
      const message = await importAudioFilesManually();
      setFeedback(message);
      setTimeout(() => setFeedback(null), 4000);
    } catch {
      Alert.alert('Import Error', 'Unable to import selected files.');
    }
  };

  return (
    <GlassCard style={styles.container} elevated>
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <Badge
            label={isAndroid ? 'ANDROID MUSIC DIRECTORY' : 'IOS APPLE FILES'}
            variant="accent"
          />
          <Badge
            label="100% OFFLINE"
            variant="success"
            style={styles.offlineBadge}
          />
        </View>

        <Ionicons
          name={isAndroid ? 'phone-portrait-outline' : 'folder-open-outline'}
          size={22}
          color={Palette.accentBlue}
        />
      </View>

      <Typography variant="titleSmall" color={Palette.textPrimary} style={styles.title}>
        {isAndroid ? 'Local Storage Music Scanner' : 'Apple Files Document Importer'}
      </Typography>

      <Typography variant="subhead" color={Palette.textSecondary} style={styles.description}>
        {capabilities.permissionDescription}
      </Typography>

      <View style={styles.storageLocationRow}>
        <Ionicons name="location-outline" size={14} color={Palette.textTertiary} />
        <Typography variant="caption" color={Palette.textTertiary} style={styles.storageLocation}>
          {capabilities.storageLocationLabel}
        </Typography>
      </View>

      <View style={styles.actionRow}>
        <Button
          variant="secondary"
          size="sm"
          title={isScanning ? 'Scanning...' : capabilities.importActionLabel}
          iconName={isAndroid ? 'sync' : 'cloud-download-outline'}
          onPress={isAndroid ? handleScanAction : handleImportFilesAction}
          disabled={isScanning}
          style={styles.actionButton}
        >
          {isScanning && (
            <ActivityIndicator
              size="small"
              color={Palette.primaryLight}
              style={{ marginLeft: Spacing.sm }}
            />
          )}
        </Button>

        {isAndroid && (
          <Button
            variant="primary"
            size="sm"
            title="Pick Files"
            iconName="folder-open-outline"
            onPress={handleImportFilesAction}
            disabled={isScanning}
            style={{ marginLeft: Spacing.xs }}
          />
        )}
      </View>

      {feedback && (
        <View
          style={[
            styles.feedbackContainer,
            feedback.toLowerCase().includes('denied') && styles.feedbackWarning,
          ]}
        >
          <Ionicons
            name={feedback.toLowerCase().includes('denied') ? 'alert-circle' : 'checkmark-circle'}
            size={16}
            color={feedback.toLowerCase().includes('denied') ? Palette.warning : Palette.success}
          />
          <View style={{ flex: 1, marginLeft: 6 }}>
            <Typography
              variant="caption"
              color={feedback.toLowerCase().includes('denied') ? Palette.textPrimary : Palette.success}
              style={styles.feedbackText}
            >
              {feedback}
            </Typography>
            {feedback.toLowerCase().includes('denied') && (
              <AnimatedPressable onPress={() => Linking.openSettings().catch(() => {})} style={{ marginTop: 4 }}>
                <Typography variant="caption" color={Palette.primaryLight} weight="600">
                  Open Device Settings →
                </Typography>
              </AnimatedPressable>
            )}
          </View>
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.xl,
    marginVertical: Spacing.md,
    padding: Spacing.base,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineBadge: {
    marginLeft: Spacing.xs,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  description: {
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  storageLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  storageLocation: {
    marginLeft: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    borderRadius: Radius.sm,
  },
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Palette.borderSubtle,
  },
  feedbackWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: Spacing.xs + 2,
    borderRadius: Radius.sm,
    borderTopWidth: 0,
  },
  feedbackText: {
    marginLeft: Spacing.xs,
  },
});

export default PlatformImportBanner;
