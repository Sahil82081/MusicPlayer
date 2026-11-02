import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Palette, Radius, Spacing } from '@/constants/theme';
import Typography from './Typography';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'outline';
  style?: StyleProp<ViewStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'outline',
  style,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: 'rgba(139, 92, 246, 0.16)',
          border: 'rgba(139, 92, 246, 0.35)',
          text: Palette.primaryLight,
        };
      case 'secondary':
        return {
          bg: 'rgba(236, 72, 153, 0.16)',
          border: 'rgba(236, 72, 153, 0.35)',
          text: Palette.secondaryLight,
        };
      case 'accent':
        return {
          bg: 'rgba(56, 189, 248, 0.16)',
          border: 'rgba(56, 189, 248, 0.35)',
          text: Palette.accentBlue,
        };
      case 'success':
        return {
          bg: 'rgba(16, 185, 129, 0.16)',
          border: 'rgba(16, 185, 129, 0.35)',
          text: Palette.success,
        };
      case 'outline':
      default:
        return {
          bg: 'rgba(255, 255, 255, 0.05)',
          border: Palette.borderSubtle,
          text: Palette.textTertiary,
        };
    }
  };

  const colors = getColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <Typography variant="meta" color={colors.text} style={styles.text}>
        {label}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 9,
    letterSpacing: 0.6,
  },
});

export default Badge;

