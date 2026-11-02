import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette, Spacing } from '@/constants/theme';
import MiniPlayer from '@/components/music/MiniPlayer';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  const handleTabPress = () => {
    try {
      Haptics.selectionAsync();
    } catch (_) {}
  };

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Palette.primaryLight,
          tabBarInactiveTintColor: Palette.textMuted,
          tabBarStyle: {
            backgroundColor: Palette.surface,
            borderTopColor: Palette.borderSubtle,
            borderTopWidth: 1,
            height: 56 + (insets.bottom > 0 ? insets.bottom - 4 : Spacing.xs),
            paddingBottom: insets.bottom > 0 ? insets.bottom : Spacing.xs,
            paddingTop: Spacing.xs,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 0.2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={22}
                color={String(color)}
              />
            ),
          }}
          listeners={{
            tabPress: handleTabPress,
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Library',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'library' : 'library-outline'}
                size={22}
                color={String(color)}
              />
            ),
          }}
          listeners={{
            tabPress: handleTabPress,
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: 'Favorites',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'heart' : 'heart-outline'}
                size={22}
                color={String(color)}
              />
            ),
          }}
          listeners={{
            tabPress: handleTabPress,
          }}
        />
        <Tabs.Screen
          name="playlists"
          options={{
            title: 'Playlists',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'musical-notes' : 'musical-notes-outline'}
                size={22}
                color={String(color)}
              />
            ),
          }}
          listeners={{
            tabPress: handleTabPress,
          }}
        />
      </Tabs>

      {/* Floating MiniPlayer docked above tabs */}
      <MiniPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
});
