import React from 'react';
import {
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette, Spacing } from '@/constants/theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  withTopInset?: boolean;
  withBottomInset?: boolean;
  withMiniPlayerSpacing?: boolean;
  scrollViewProps?: Omit<ScrollViewProps, 'style' | 'contentContainerStyle'>;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = true,
  style,
  contentContainerStyle,
  withTopInset = true,
  withBottomInset = true,
  withMiniPlayerSpacing = true,
  scrollViewProps,
}) => {
  const insets = useSafeAreaInsets();

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: Palette.background,
    paddingTop: withTopInset ? insets.top : 0,
    paddingBottom: withBottomInset ? insets.bottom : 0,
  };

  // MiniPlayer occupies ~64pt + bottom padding
  const extraBottomPadding = withMiniPlayerSpacing ? 76 : 0;

  if (scrollable) {
    return (
      <View style={[styles.root, containerStyle, style]}>
        <StatusBar style="light" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: (withBottomInset ? insets.bottom : 0) + extraBottomPadding + Spacing.lg },
            contentContainerStyle,
          ]}
          {...scrollViewProps}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, containerStyle, style]}>
      <StatusBar style="light" />
      <View
        style={[
          styles.fixedContent,
          { paddingBottom: (withBottomInset ? insets.bottom : 0) + extraBottomPadding },
          contentContainerStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  fixedContent: {
    flex: 1,
  },
});

export default ScreenContainer;
