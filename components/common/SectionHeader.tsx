import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Spacing } from '@/constants/theme';
import { AnimatedPressable } from './AnimatedPressable';
import Typography from './Typography';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionText,
  onActionPress,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleColumn}>
        <Typography variant="titleMedium" color={Palette.textPrimary}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="subhead" color={Palette.textSecondary} style={styles.subtitle}>
            {subtitle}
          </Typography>
        )}
      </View>
      {actionText && (
        <AnimatedPressable onPress={onActionPress} style={styles.actionPressable}>
          <Typography variant="bodyMedium" color={Palette.primaryLight} style={styles.actionText}>
            {actionText}
          </Typography>
          <Ionicons name="chevron-forward" size={16} color={Palette.primaryLight} />
        </AnimatedPressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  titleColumn: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  subtitle: {
    marginTop: 2,
  },
  actionPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  actionText: {
    marginRight: 2,
    fontWeight: '600',
  },
});

export default SectionHeader;

