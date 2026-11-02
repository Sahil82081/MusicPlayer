import React, { useEffect, useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayer } from '@/context/PlayerContext';
import { Palette, Radius, Spacing } from '@/constants/theme';
import Typography from '@/components/common/Typography';
import AnimatedPressable from '@/components/common/AnimatedPressable';
import Badge from '@/components/common/Badge';
import AnimatedFavoriteButton from '@/components/common/AnimatedFavoriteButton';
import ProgressBar from '@/components/music/ProgressBar';
import PlayerControls from '@/components/music/PlayerControls';
import ArtworkView from '@/components/music/ArtworkView';

export default function PlayerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    currentTrack,
    isPlaying,
    positionMs,
    durationMs,
    isShuffle,
    repeatMode,
    volume,
    setVolume,
    togglePlayPause,
    skipToNext,
    skipToPrevious,
    toggleShuffle,
    cycleRepeatMode,
    seekTo,
    toggleFavorite,
    state,
  } = usePlayer();

  // Natural Gesture Dismissal Animation
  const translateY = useRef(new Animated.Value(0)).current;

  // Song transition crossfade & subtle scale animation
  const trackTransitionAnim = useRef(new Animated.Value(1)).current;
  const previousTrackId = useRef<string | null>(currentTrack?.id || null);

  useEffect(() => {
    if (currentTrack && currentTrack.id !== previousTrackId.current) {
      previousTrackId.current = currentTrack.id;

      // Subtle song change crossfade & scale
      trackTransitionAnim.setValue(0.85);
      Animated.spring(trackTransitionAnim, {
        toValue: 1,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }).start();

      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (_) {}
    }
  }, [currentTrack?.id, trackTransitionAnim]);

  // Dedicated PanResponder on top header & drag pill to avoid interfering with scrubbers or scrolling
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 110 || gestureState.vy > 0.6) {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch (_) {}
          Animated.timing(translateY, {
            toValue: 700,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            router.back();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            friction: 7,
            tension: 50,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!currentTrack) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top }]}>
        <Typography variant="bodyMedium" color={Palette.textSecondary}>
          No track loaded in player
        </Typography>
        <AnimatedPressable onPress={() => router.back()} style={styles.backButtonEmpty}>
          <Typography variant="bodyMedium" color={Palette.primaryLight}>
            Back to Library
          </Typography>
        </AnimatedPressable>
      </View>
    );
  }

  const primaryAccent = currentTrack.accentColor || Palette.primary;
  const secondaryAccent = currentTrack.secondaryAccentColor || Palette.secondary;

  const handleTogglePlay = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_) {}
    togglePlayPause();
  };

  const handleDismiss = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
    router.back();
  };

  return (
    <Animated.View
      style={[
        styles.root,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      {/* Dynamic Ambient Background Gradient */}
      <LinearGradient
        colors={[primaryAccent + '40', '#12131C', Palette.background]}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.xs,
            paddingBottom: insets.bottom + Spacing.base,
          },
        ]}
      >
        {/* Top Drag Indicator & Header Area with Swipe Gesture */}
        <View {...panResponder.panHandlers} style={styles.gestureHeaderArea}>
          <View style={styles.dragPillWrapper}>
            <View style={styles.dragPill} />
          </View>

          <View style={styles.topBar}>
            <AnimatedPressable onPress={handleDismiss} style={styles.iconButton}>
              <Ionicons name="chevron-down" size={26} color={Palette.textPrimary} />
            </AnimatedPressable>

            <View style={styles.titleColumn}>
              <Typography variant="meta" color={Palette.textTertiary} align="center">
                PLAYING FROM OFFLINE STORAGE
              </Typography>
              <Typography
                variant="caption"
                color={Palette.primaryLight}
                align="center"
                numberOfLines={1}
              >
                {currentTrack.album}
              </Typography>
            </View>

            <AnimatedPressable onPress={() => router.push('/queue')} style={styles.iconButton}>
              <Ionicons name="list" size={22} color={Palette.textPrimary} />
            </AnimatedPressable>
          </View>
        </View>

        {/* Center Large Artwork Hero with Smooth Transition */}
        <Animated.View
          style={[
            styles.artSection,
            {
              opacity: trackTransitionAnim,
              transform: [{ scale: trackTransitionAnim }],
            },
          ]}
        >
          <ArtworkView
            artworkUri={currentTrack.artworkUrl}
            primaryColor={primaryAccent}
            secondaryColor={secondaryAccent}
            size={280}
            borderRadius={Radius.xl}
            showVinylGroove
            isPlaying={isPlaying}
            iconName="disc"
            style={styles.artCard}
          />

          {/* Floating Hi-Res Audio Format Pill */}
          <View style={styles.floatingBadgeRow}>
            <Badge
              label={`${currentTrack.formatInfo.format} • ${currentTrack.formatInfo.sampleRate || '96 kHz'} • ${currentTrack.formatInfo.bitDepth || '24-bit'}`}
              variant={currentTrack.formatInfo.isHiRes ? 'primary' : 'outline'}
            />
          </View>
        </Animated.View>

        {/* Error / Status Notice */}
        {state.error && (
          <View style={styles.errorNotice}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={Palette.secondaryLight}
              style={{ marginRight: 6 }}
            />
            <Typography variant="caption" color={Palette.secondaryLight} numberOfLines={1}>
              {state.error}
            </Typography>
          </View>
        )}

        {/* Song Info & Favorite Row */}
        <Animated.View
          style={[
            styles.infoSection,
            {
              opacity: trackTransitionAnim,
            },
          ]}
        >
          <View style={styles.titleWrapper}>
            <Typography
              variant="titleLarge"
              color={Palette.textPrimary}
              numberOfLines={1}
              style={styles.trackTitle}
            >
              {currentTrack.title}
            </Typography>
            <AnimatedPressable onPress={() => router.push(`/artist/${currentTrack.artistId}`)}>
              <Typography
                variant="body"
                color={Palette.textSecondary}
                numberOfLines={1}
                style={styles.artistName}
              >
                {currentTrack.artist}
              </Typography>
            </AnimatedPressable>
          </View>

          <AnimatedFavoriteButton
            isFavorite={!!currentTrack.isFavorite}
            onToggle={() => toggleFavorite(currentTrack.id)}
            size={28}
            activeColor={Palette.secondary}
            inactiveColor={Palette.textSecondary}
          />
        </Animated.View>

        {/* Scrubber Progress Bar */}
        <View style={styles.progressSection}>
          <ProgressBar
            positionMs={positionMs}
            durationMs={durationMs}
            onSeek={seekTo}
            height={5}
          />
        </View>

        {/* Playback Controls */}
        <View style={styles.controlsSection}>
          <PlayerControls
            isPlaying={isPlaying}
            isShuffle={isShuffle}
            repeatMode={repeatMode}
            onTogglePlayPause={handleTogglePlay}
            onSkipNext={skipToNext}
            onSkipPrevious={skipToPrevious}
            onToggleShuffle={toggleShuffle}
            onCycleRepeat={cycleRepeatMode}
            size="large"
          />
        </View>

        {/* Hardware / Software Offline Volume Bar */}
        <View style={styles.volumeRow}>
          <AnimatedPressable
            onPress={() => setVolume(volume > 0 ? 0 : 0.85)}
            style={styles.volumeIconBtn}
          >
            <Ionicons
              name={volume === 0 ? 'volume-mute' : volume < 0.4 ? 'volume-low' : 'volume-medium'}
              size={18}
              color={Palette.textTertiary}
            />
          </AnimatedPressable>

          <View style={styles.volumeTrackWrapper}>
            <ProgressBar
              positionMs={volume * 100}
              durationMs={100}
              onSeek={(val) => setVolume(val / 100)}
              showTimeLabels={false}
              height={3}
            />
          </View>

          <AnimatedPressable onPress={() => setVolume(1.0)} style={styles.volumeIconBtn}>
            <Ionicons name="volume-high" size={18} color={Palette.textTertiary} />
          </AnimatedPressable>
        </View>

        {/* Bottom Auxiliary Bar */}
        <View style={styles.bottomAuxBar}>
          <View style={styles.outputRoutePill}>
            <Ionicons name="hardware-chip-outline" size={16} color={Palette.textTertiary} />
            <Typography variant="caption" color={Palette.textSecondary} style={styles.outputRouteText}>
              Bit-Perfect DAC Output
            </Typography>
          </View>

          <AnimatedPressable onPress={() => router.push('/queue')} style={styles.queuePill}>
            <Ionicons name="reorder-three" size={18} color={Palette.primaryLight} />
            <Typography variant="caption" color={Palette.primaryLight} style={styles.queueText}>
              Queue
            </Typography>
          </AnimatedPressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.background,
  },
  backButtonEmpty: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
  },
  gestureHeaderArea: {
    paddingBottom: Spacing.xs,
  },
  dragPillWrapper: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  dragPill: {
    width: 38,
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  titleColumn: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xs,
  },
  artCard: {
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
    elevation: 16,
  },
  floatingBadgeRow: {
    marginTop: Spacing.md,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWrapper: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  trackTitle: {
    marginBottom: 4,
  },
  artistName: {
    fontWeight: '400',
  },
  progressSection: {
    marginVertical: Spacing.xs,
  },
  controlsSection: {
    marginVertical: Spacing.xs,
  },
  errorNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.25)',
    marginHorizontal: Spacing.md,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
  },
  volumeIconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeTrackWrapper: {
    flex: 1,
    marginHorizontal: Spacing.md,
    paddingTop: 10,
  },
  bottomAuxBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
  },
  outputRoutePill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  outputRouteText: {
    marginLeft: 6,
  },
  queuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  queueText: {
    marginLeft: 4,
    fontWeight: '600',
  },
});
