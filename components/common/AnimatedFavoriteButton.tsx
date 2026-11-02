import React, { useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Palette } from '@/constants/theme';
import AnimatedPressable from './AnimatedPressable';

interface AnimatedFavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  size?: number;
  activeColor?: string;
  inactiveColor?: string;
  style?: any;
}

export const AnimatedFavoriteButton: React.FC<AnimatedFavoriteButtonProps> = ({
  isFavorite,
  onToggle,
  size = 22,
  activeColor = Palette.secondary,
  inactiveColor = Palette.textMuted,
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = (e?: any) => {
    e?.stopPropagation?.();

    // Trigger subtle physical haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    // Pop bounce animation sequence
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.35,
        duration: 110,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    onToggle();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[styles.hitbox, style]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      scaleTo={0.92}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={size}
          color={isFavorite ? activeColor : inactiveColor}
        />
      </Animated.View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  hitbox: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AnimatedFavoriteButton;
