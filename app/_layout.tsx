import { DarkTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import 'react-native-reanimated';

// Ignore development sandbox logs for features that require standalone/custom native builds
LogBox.ignoreLogs([
  'Failed to start the expo-audio playback service',
  'Failed to activate lock screen controls',
  'service binding failed',
  'expo-audio config plugin',
  'enableBackgroundPlayback',
]);

import { PlayerProvider } from '@/context/PlayerContext';
import { LibraryProvider } from '@/context/LibraryContext';
import { Palette } from '@/constants/theme';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Prevent splash screen auto-hide
SplashScreen.preventAutoHideAsync().catch(() => {});

const AuraNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Palette.background,
    card: Palette.surface,
    text: Palette.textPrimary,
    border: Palette.borderSubtle,
    primary: Palette.primaryLight,
  },
};

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <ThemeProvider value={AuraNavigationTheme}>
      <PlayerProvider>
        <LibraryProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Palette.background },
              animation: 'slide_from_right',
              gestureEnabled: true,
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="player"
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
                headerShown: false,
                gestureEnabled: true,
                gestureDirection: 'vertical',
                fullScreenGestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="queue"
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
                headerShown: false,
                gestureEnabled: true,
                gestureDirection: 'vertical',
              }}
            />
            <Stack.Screen
              name="search"
              options={{
                headerShown: false,
                animation: 'fade_from_bottom',
              }}
            />
            <Stack.Screen name="album/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="artist/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="playlist/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
            <Stack.Screen name="settings" options={{ headerShown: false, animation: 'slide_from_right' }} />
          </Stack>
        </LibraryProvider>
      </PlayerProvider>
    </ThemeProvider>
  );
}
