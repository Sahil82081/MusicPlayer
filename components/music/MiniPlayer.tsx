import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { usePlayer } from '@/context/PlayerContext';
import { Gradients, Palette, Radius, Spacing } from '@/constants/theme';
import AnimatedPressable from '../common/AnimatedPressable';
import Typography from '../common/Typography';
import ArtworkView from './ArtworkView';

export const MiniPlayer: React.FC = () => {
  const router = useRouter();
  const { currentTrack, isPlaying, progress, togglePlayPause, skipToNext } = usePlayer();
  const translateY = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    if (currentTrack) {
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }).start();
    }
  }, [currentTrack, translateY]);

  if (!currentTrack) {
    return null;
  }

  const handleOpenFullPlayer = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
    router.push('/player');
  };

  const handleTogglePlay = (e: any) => {
    e?.stopPropagation?.();
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_) {}
    togglePlayPause();
  };

  const handleSkipNext = (e: any) => {
    e?.stopPropagation?.();
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
    skipToNext();
  };

  return (
    <Animated.View style={[styles.dockedWrapper, { transform: [{ translateY }] }]}>
      <AnimatedPressable
        onPress={handleOpenFullPlayer}
        style={styles.container}
        scaleTo={0.98}
      >
        {/* Fine Progress Indicator Line across the top */}
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={Gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.progressBar,
              { width: `${Math.min(100, Math.max(0, progress * 100))}%` },
            ]}
          />
        </View>

        <View style={styles.contentRow}>
          {/* Mini Artwork */}
          <ArtworkView
            artworkUri={currentTrack.artworkUrl}
            primaryColor={currentTrack.accentColor}
            secondaryColor={currentTrack.secondaryAccentColor}
            size={42}
            borderRadius={Radius.sm}
            isPlaying={isPlaying}
            iconName={isPlaying ? 'volume-high' : 'musical-note'}
            style={styles.artBadge}
          />

          {/* Song & Artist Info */}
          <View style={styles.textColumn}>
            <Typography
              variant="bodyMedium"
              color={Palette.textPrimary}
              numberOfLines={1}
              style={styles.title}
            >
              {currentTrack.title}
            </Typography>
            <Typography
              variant="caption"
              color={Palette.textSecondary}
              numberOfLines={1}
            >
              {currentTrack.artist} • {currentTrack.formatInfo.format}
            </Typography>
          </View>

          {/* Quick Play/Pause Control */}
          <AnimatedPressable
            onPress={handleTogglePlay}
            style={styles.playButton}
            scaleTo={0.88}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={18}
              color="#FFFFFF"
              style={!isPlaying ? { marginLeft: 2 } : undefined}
            />
          </AnimatedPressable>

          {/* Quick Next Control */}
          <AnimatedPressable
            onPress={handleSkipNext}
            style={styles.skipButton}
            scaleTo={0.88}
          >
            <Ionicons name="play-skip-forward" size={19} color={Palette.textSecondary} />
          </AnimatedPressable>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  dockedWrapper: {
    position: 'absolute',
    bottom: 56, // Sits directly above bottom tab bar
    left: Spacing.sm,
    right: Spacing.sm,
    zIndex: 99,
  },
  container: {
    backgroundColor: 'rgba(24, 25, 38, 0.96)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 12,
  },
  progressTrack: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  progressBar: {
    height: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    height: 58,
  },
  artBadge: {
    marginRight: Spacing.md,
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: 14,
    marginBottom: 2,
  },
  playButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  skipButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MiniPlayer;
