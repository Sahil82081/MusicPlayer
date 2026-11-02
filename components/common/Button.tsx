import React from 'react';
import {
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Gradients, Palette, Radius, Spacing } from '@/constants/theme';
import { AnimatedPressable } from './AnimatedPressable';
import Typography from './Typography';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  iconSize?: number;
  iconColor?: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  iconName,
  iconPosition = 'left',
  iconSize,
  iconColor,
  onPress,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
  children,
}) => {
  const sizeStyles: Record<ButtonSize, { height: number; paddingHorizontal: number; fontSize: number; iconSize: number }> = {
    sm: { height: 36, paddingHorizontal: Spacing.md, fontSize: 13, iconSize: 16 },
    md: { height: 46, paddingHorizontal: Spacing.xl, fontSize: 15, iconSize: 20 },
    lg: { height: 54, paddingHorizontal: Spacing.xxl, fontSize: 17, iconSize: 24 },
  };

  const currentSize = sizeStyles[size];
  const resolvedIconSize = iconSize || currentSize.iconSize;
  const resolvedIconColor =
    iconColor ||
    (variant === 'primary'
      ? '#FFFFFF'
      : variant === 'ghost'
      ? Palette.primaryLight
      : Palette.textPrimary);

  const renderContent = () => (
    <View style={styles.contentRow}>
      {iconName && iconPosition === 'left' && (
        <Ionicons
          name={iconName}
          size={resolvedIconSize}
          color={resolvedIconColor}
          style={title ? { marginRight: Spacing.sm } : undefined}
        />
      )}
      {title ? (
        <Typography
          variant={size === 'lg' ? 'titleSmall' : size === 'sm' ? 'subhead' : 'bodyMedium'}
          color={variant === 'primary' ? '#FFFFFF' : undefined}
          weight="600"
          style={textStyle}
        >
          {title}
        </Typography>
      ) : null}
      {children}
      {iconName && iconPosition === 'right' && (
        <Ionicons
          name={iconName}
          size={resolvedIconSize}
          color={resolvedIconColor}
          style={title ? { marginLeft: Spacing.sm } : undefined}
        />
      )}
    </View>
  );

  if (variant === 'primary') {
    return (
      <AnimatedPressable
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.base,
          {
            height: currentSize.height,
            paddingHorizontal: currentSize.paddingHorizontal,
            borderRadius: Radius.pill,
            width: fullWidth ? '100%' : undefined,
          },
          style,
        ]}
      >
        <LinearGradient
          colors={Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: Radius.pill },
          ]}
        />
        {renderContent()}
      </AnimatedPressable>
    );
  }

  if (variant === 'secondary') {
    return (
      <AnimatedPressable
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.base,
          styles.secondaryBase,
          {
            height: currentSize.height,
            paddingHorizontal: currentSize.paddingHorizontal,
            borderRadius: Radius.pill,
            width: fullWidth ? '100%' : undefined,
          },
          style,
        ]}
      >
        {renderContent()}
      </AnimatedPressable>
    );
  }

  if (variant === 'icon') {
    return (
      <AnimatedPressable
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.base,
          styles.iconBase,
          {
            width: currentSize.height,
            height: currentSize.height,
            borderRadius: currentSize.height / 2,
          },
          style,
        ]}
      >
        {renderContent()}
      </AnimatedPressable>
    );
  }

  // Ghost variant
  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        {
          height: currentSize.height,
          paddingHorizontal: currentSize.paddingHorizontal,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      {renderContent()}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBase: {
    backgroundColor: Palette.surfaceElevated,
    borderWidth: 1,
    borderColor: Palette.borderLight,
  },
  iconBase: {
    backgroundColor: Palette.surfaceElevated,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
});

export default Button;
