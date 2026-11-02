import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AudioTrack } from '@/services/audio/types';
import { Palette, Radius, Spacing } from '@/constants/theme';
import AnimatedPressable from '../common/AnimatedPressable';
import Typography from '../common/Typography';
import Badge from '../common/Badge';
import AnimatedFavoriteButton from '../common/AnimatedFavoriteButton';
import ArtworkView from './ArtworkView';

export const SONG_ITEM_HEIGHT = 68;

interface SongListItemProps {
  track: AudioTrack;
  index?: number;
  isPlaying?: boolean;
  isActiveTrack?: boolean;
  onPress: () => void;
  onFavoriteToggle?: (trackId: string) => void;
  onOptionsPress?: () => void;
  showFormatBadge?: boolean;
  style?: StyleProp<ViewStyle>;
}

const EqualizerBars: React.FC<{ isPlaying: boolean }> = React.memo(({ isPlaying }) => {
  const bar1 = useRef(new Animated.Value(0.3)).current;
  const bar2 = useRef(new Animated.Value(0.7)).current;
  const bar3 = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (!isPlaying) {
      Animated.timing(bar1, { toValue: 0.25, duration: 180, useNativeDriver: false }).start();
      Animated.timing(bar2, { toValue: 0.45, duration: 180, useNativeDriver: false }).start();
      Animated.timing(bar3, { toValue: 0.3, duration: 180, useNativeDriver: false }).start();
      return;
    }

    const a1 = Animated.loop(
      Animated.sequence([
        Animated.timing(bar1, { toValue: 1, duration: 340, useNativeDriver: false }),
        Animated.timing(bar1, { toValue: 0.2, duration: 340, useNativeDriver: false }),
      ])
    );
    const a2 = Animated.loop(
      Animated.sequence([
        Animated.timing(bar2, { toValue: 0.2, duration: 280, useNativeDriver: false }),
        Animated.timing(bar2, { toValue: 0.95, duration: 280, useNativeDriver: false }),
      ])
    );
    const a3 = Animated.loop(
      Animated.sequence([
        Animated.timing(bar3, { toValue: 0.85, duration: 420, useNativeDriver: false }),
        Animated.timing(bar3, { toValue: 0.25, duration: 420, useNativeDriver: false }),
      ])
    );

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [isPlaying, bar1, bar2, bar3]);

  return (
    <View style={styles.equalizerBox}>
      <Animated.View
        style={[
          styles.equalizerBar,
          { height: bar1.interpolate({ inputRange: [0, 1], outputRange: [3, 14] }) },
        ]}
      />
      <Animated.View
        style={[
          styles.equalizerBar,
          { height: bar2.interpolate({ inputRange: [0, 1], outputRange: [3, 14] }) },
        ]}
      />
      <Animated.View
        style={[
          styles.equalizerBar,
          { height: bar3.interpolate({ inputRange: [0, 1], outputRange: [3, 14] }) },
        ]}
      />
    </View>
  );
});

export const SongListItem: React.FC<SongListItemProps> = React.memo(
  ({
    track,
    index,
    isPlaying = false,
    isActiveTrack = false,
    onPress,
    onFavoriteToggle,
    onOptionsPress,
    showFormatBadge = true,
    style,
  }) => {
    const formatDuration = (ms: number): string => {
      const totalSecs = Math.floor(ms / 1000);
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
      <AnimatedPressable
        onPress={onPress}
        style={[
          styles.container,
          isActiveTrack && styles.activeContainer,
          style,
        ]}
      >
        {/* Index Number or Active Equalizer */}
        {isActiveTrack ? (
          <EqualizerBars isPlaying={isPlaying} />
        ) : index !== undefined ? (
          <Typography
            variant="caption"
            color={Palette.textTertiary}
            style={styles.indexText}
          >
            {index < 10 ? `0${index}` : index}
          </Typography>
        ) : null}

        {/* Album Artwork */}
        <View style={styles.artBox}>
          <ArtworkView
            artworkUri={track.artworkUrl}
            primaryColor={track.accentColor}
            secondaryColor={track.secondaryAccentColor}
            size={48}
            borderRadius={Radius.sm}
            isPlaying={isActiveTrack ? isPlaying : undefined}
            iconName="musical-note"
          />
        </View>

        {/* Song Info */}
        <View style={styles.infoContainer}>
          <Typography
            variant="bodyMedium"
            color={isActiveTrack ? Palette.primaryLight : Palette.textPrimary}
            numberOfLines={1}
            style={styles.title}
            weight={isActiveTrack ? '600' : '400'}
          >
            {track.title}
          </Typography>

          <View style={styles.metaRow}>
            <Typography
              variant="subhead"
              color={Palette.textSecondary}
              numberOfLines={1}
              style={styles.artist}
            >
              {track.artist}
            </Typography>

            {showFormatBadge && (
              <>
                <View style={styles.dot} />
                <Badge
                  label={track.formatInfo.format}
                  variant={track.formatInfo.isHiRes ? 'primary' : 'outline'}
                />
              </>
            )}
          </View>
        </View>

        {/* Duration */}
        <Typography variant="caption" color={Palette.textTertiary} style={styles.duration}>
          {formatDuration(track.durationMs)}
        </Typography>

        {/* Favorite Heart Toggle with Subtle Animation */}
        {onFavoriteToggle && (
          <AnimatedFavoriteButton
            isFavorite={!!track.isFavorite}
            onToggle={() => onFavoriteToggle(track.id)}
            size={19}
          />
        )}

        {/* More Options Button */}
        {onOptionsPress && (
          <AnimatedPressable
            onPress={(e: any) => {
              e?.stopPropagation?.();
              onOptionsPress();
            }}
            style={styles.iconHitbox}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={Palette.textSecondary} />
          </AnimatedPressable>
        )}
      </AnimatedPressable>
    );
  },
  (prev, next) => {
    return (
      prev.track.id === next.track.id &&
      prev.track.isFavorite === next.track.isFavorite &&
      prev.track.title === next.track.title &&
      prev.track.artist === next.track.artist &&
      prev.track.artworkUrl === next.track.artworkUrl &&
      prev.isActiveTrack === next.isActiveTrack &&
      prev.isPlaying === next.isPlaying &&
      prev.index === next.index &&
      prev.showFormatBadge === next.showFormatBadge
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: SONG_ITEM_HEIGHT,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    marginVertical: 1,
  },
  activeContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: Palette.primary,
  },
  indexText: {
    width: 24,
    marginRight: Spacing.sm,
    fontWeight: '600',
  },
  equalizerBox: {
    width: 24,
    height: 16,
    marginRight: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  equalizerBar: {
    width: 3,
    backgroundColor: Palette.primaryLight,
    borderRadius: 1.5,
    marginHorizontal: 1,
  },
  artBox: {
    marginRight: Spacing.md,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: Spacing.sm,
  },
  title: {
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artist: {
    maxWidth: '65%',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Palette.textTertiary,
    marginHorizontal: Spacing.sm,
  },
  duration: {
    marginRight: Spacing.sm,
  },
  iconHitbox: {
    padding: Spacing.xs,
    marginLeft: 2,
  },
});

export default SongListItem;
