import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Artist } from '@/services/library/types';
import { Palette, Radius, Spacing } from '@/constants/theme';
import AnimatedPressable from '../common/AnimatedPressable';
import Typography from '../common/Typography';

interface ArtistCardProps {
  artist: Artist;
  size?: number;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export const ArtistCard: React.FC<ArtistCardProps> = React.memo(({
  artist,
  size = 96,
  onPress,
  style,
}) => {
  const accent = artist.accentColor || Palette.primary;

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[styles.container, { width: size + 16 }, style]}
    >
      <View
        style={[
          styles.avatarContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <LinearGradient
          colors={[accent, '#12131C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Ionicons name="person" size={size * 0.42} color="#FFFFFF" />
        </LinearGradient>
      </View>

      <Typography
        variant="bodyMedium"
        color={Palette.textPrimary}
        numberOfLines={1}
        align="center"
        style={styles.name}
      >
        {artist.name}
      </Typography>

      <Typography
        variant="caption"
        color={Palette.textSecondary}
        numberOfLines={1}
        align="center"
      >
        {artist.trackCount} tracks
      </Typography>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarContainer: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: Spacing.sm,
    backgroundColor: Palette.surfaceElevated,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  gradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    marginTop: 2,
    width: '100%',
  },
});

export default ArtistCard;
