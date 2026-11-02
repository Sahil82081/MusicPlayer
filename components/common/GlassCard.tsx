import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gradients, Palette, Radius, Spacing } from '@/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  withGradient?: boolean;
  gradientColors?: readonly [string, string, ...string[]];
  borderRadius?: number;
  elevated?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  withGradient = false,
  gradientColors = Gradients.surfaceGlass,
  borderRadius = Radius.lg,
  elevated = false,
}) => {
  const cardStyle: ViewStyle = {
    borderRadius,
    backgroundColor: elevated ? Palette.surfaceElevated : Palette.surface,
  };

  if (withGradient) {
    return (
      <View style={[styles.outerContainer, cardStyle, style]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientInner, { borderRadius }]}
        >
          {children}
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.outerContainer, cardStyle, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    overflow: 'hidden',
  },
  gradientInner: {
    padding: Spacing.base,
  },
});

export default GlassCard;

