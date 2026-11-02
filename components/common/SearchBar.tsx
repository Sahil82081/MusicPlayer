import React from 'react';
import {
  StyleProp,
  StyleSheet,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radius, Spacing, Typography as TypographyTokens } from '@/constants/theme';
import { AnimatedPressable } from './AnimatedPressable';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onClear,
  placeholder = 'Search songs, artists, albums...',
  style,
  autoFocus = false,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Ionicons
        name="search"
        size={18}
        color={Palette.textTertiary}
        style={styles.searchIcon}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Palette.textMuted}
        autoFocus={autoFocus}
        style={styles.input}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <AnimatedPressable
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          style={styles.clearButton}
        >
          <Ionicons name="close-circle" size={18} color={Palette.textSecondary} />
        </AnimatedPressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Palette.textPrimary,
    fontSize: TypographyTokens.body.fontSize,
    height: '100%',
  },
  clearButton: {
    padding: Spacing.xs,
  },
});

export default SearchBar;

