import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Playlist } from '@/services/library/types';
import { Palette, Radius, Spacing } from '@/constants/theme';
import AnimatedPressable from '../common/AnimatedPressable';
import Typography from '../common/Typography';
import ArtworkView from './ArtworkView';

interface PlaylistCardProps {
  playlist: Playlist;
  variant?: 'grid' | 'horizontal';
  onPress: () => void;
  onOptionsPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({
  playlist,
  variant = 'horizontal',
  onPress,
  onOptionsPress,
  style,
}) => {
  const accent = playlist.accentColor || Palette.primary;

  if (variant === 'grid') {
    return (
      <AnimatedPressable
        onPress={onPress}
        style={[styles.gridContainer, style]}
      >
        <View style={styles.gridArtContainer}>
          <ArtworkView
            primaryColor={accent}
            secondaryColor="#12131C"
            size="lg"
            borderRadius={Radius.lg}
            iconName="musical-notes"
            style={styles.gridArt}
          />
        </View>

        <View style={styles.gridTitleRow}>
          <Typography
            variant="bodyMedium"
            color={Palette.textPrimary}
            numberOfLines={1}
            style={styles.gridTitle}
          >
            {playlist.name}
          </Typography>

          {onOptionsPress && (
            <AnimatedPressable
              onPress={(e: any) => {
                e?.stopPropagation?.();
                onOptionsPress();
              }}
              style={styles.menuHitbox}
            >
              <Ionicons name="ellipsis-vertical" size={16} color={Palette.textTertiary} />
            </AnimatedPressable>
          )}
        </View>

        <Typography variant="caption" color={Palette.textSecondary}>
          {playlist.trackCount} tracks
        </Typography>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[styles.horizontalContainer, style]}
    >
      <ArtworkView
        primaryColor={accent}
        secondaryColor="#090A0F"
        size={60}
        borderRadius={Radius.md}
        iconName="list"
        style={styles.horizontalArt}
      />

      <View style={styles.horizontalInfo}>
        <Typography
          variant="titleSmall"
          color={Palette.textPrimary}
          numberOfLines={1}
        >
          {playlist.name}
        </Typography>

        <Typography
          variant="subhead"
          color={Palette.textSecondary}
          numberOfLines={1}
          style={styles.description}
        >
          {playlist.description}
        </Typography>

        <Typography variant="caption" color={Palette.textTertiary}>
          {playlist.trackCount} offline songs
        </Typography>
      </View>

      {onOptionsPress ? (
        <AnimatedPressable
          onPress={(e: any) => {
            e?.stopPropagation?.();
            onOptionsPress();
          }}
          style={styles.menuHitbox}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={Palette.textSecondary} />
        </AnimatedPressable>
      ) : (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={Palette.textTertiary}
          style={styles.chevron}
        />
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    width: '48%',
    marginBottom: Spacing.base,
  },
  gridArtContainer: {
    aspectRatio: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  gridArt: {
    width: '100%',
    height: '100%',
  },
  gridTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gridTitle: {
    flex: 1,
    marginTop: 2,
  },
  menuHitbox: {
    padding: Spacing.xs,
  },
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    marginBottom: Spacing.md,
  },
  horizontalArt: {
    marginRight: Spacing.md,
  },
  horizontalInfo: {
    flex: 1,
  },
  description: {
    marginTop: 2,
    marginBottom: 4,
  },
  chevron: {
    marginLeft: Spacing.sm,
  },
});

export default PlaylistCard;
