import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RepeatMode } from '@/services/audio/types';
import { Gradients, Palette, Spacing } from '@/constants/theme';
import AnimatedPressable from '../common/AnimatedPressable';

interface PlayerControlsProps {
  isPlaying: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  onTogglePlayPause: () => void;
  onSkipNext: () => void;
  onSkipPrevious: () => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  size?: 'normal' | 'large';
  style?: StyleProp<ViewStyle>;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  isShuffle,
  repeatMode,
  onTogglePlayPause,
  onSkipNext,
  onSkipPrevious,
  onToggleShuffle,
  onCycleRepeat,
  size = 'large',
  style,
}) => {
  const isLarge = size === 'large';
  const playButtonSize = isLarge ? 68 : 54;
  const secondaryIconSize = isLarge ? 28 : 22;
  const auxiliaryIconSize = isLarge ? 22 : 18;

  const handlePlayPause = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_) {}
    onTogglePlayPause();
  };

  const handleSkipNext = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
    onSkipNext();
  };

  const handleSkipPrevious = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}
    onSkipPrevious();
  };

  const handleShuffle = () => {
    try {
      Haptics.selectionAsync();
    } catch (_) {}
    onToggleShuffle();
  };

  const handleRepeat = () => {
    try {
      Haptics.selectionAsync();
    } catch (_) {}
    onCycleRepeat();
  };

  const getRepeatIcon = (): keyof typeof Ionicons.glyphMap => {
    if (repeatMode === 'one') return 'repeat-outline';
    return 'repeat';
  };

  return (
    <View style={[styles.container, style]}>
      {/* Shuffle Button */}
      <AnimatedPressable
        onPress={handleShuffle}
        style={styles.auxiliaryButton}
        scaleTo={0.88}
      >
        <Ionicons
          name="shuffle"
          size={auxiliaryIconSize}
          color={isShuffle ? Palette.primaryLight : Palette.textMuted}
        />
        {isShuffle && <View style={styles.activeDot} />}
      </AnimatedPressable>

      {/* Previous Button */}
      <AnimatedPressable
        onPress={handleSkipPrevious}
        style={styles.navButton}
        scaleTo={0.88}
      >
        <Ionicons
          name="play-skip-back"
          size={secondaryIconSize}
          color={Palette.textPrimary}
        />
      </AnimatedPressable>

      {/* Play / Pause Circular Hero Button */}
      <AnimatedPressable
        onPress={handlePlayPause}
        scaleTo={0.9}
        style={[
          styles.playButton,
          {
            width: playButtonSize,
            height: playButtonSize,
            borderRadius: playButtonSize / 2,
          },
        ]}
      >
        <LinearGradient
          colors={Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: playButtonSize / 2 },
          ]}
        />
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={playButtonSize * 0.45}
          color="#FFFFFF"
          style={!isPlaying ? { marginLeft: 3 } : undefined}
        />
      </AnimatedPressable>

      {/* Next Button */}
      <AnimatedPressable
        onPress={handleSkipNext}
        style={styles.navButton}
        scaleTo={0.88}
      >
        <Ionicons
          name="play-skip-forward"
          size={secondaryIconSize}
          color={Palette.textPrimary}
        />
      </AnimatedPressable>

      {/* Repeat Button */}
      <AnimatedPressable
        onPress={handleRepeat}
        style={styles.auxiliaryButton}
        scaleTo={0.88}
      >
        <Ionicons
          name={getRepeatIcon()}
          size={auxiliaryIconSize}
          color={repeatMode !== 'off' ? Palette.primaryLight : Palette.textMuted}
        />
        {repeatMode !== 'off' && (
          <View style={[styles.activeDot, repeatMode === 'one' && styles.repeatOneDot]} />
        )}
      </AnimatedPressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    width: '100%',
  },
  auxiliaryButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.primary,
  },
  repeatOneDot: {
    backgroundColor: Palette.secondary,
  },
  navButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
});

export default PlayerControls;
