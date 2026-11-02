import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Album } from '@/services/library/types';
import { Palette, Radius, Spacing } from '@/constants/theme';
import AnimatedPressable from '../common/AnimatedPressable';
import Typography from '../common/Typography';
import AnimatedFavoriteButton from '../common/AnimatedFavoriteButton';
import ArtworkView from './ArtworkView';

interface AlbumCardProps {
  album: Album;
  size?: number;
  onPress: () => void;
  onFavoriteToggle?: (albumId: string) => void;
  style?: StyleProp<ViewStyle>;
}

export const AlbumCard: React.FC<AlbumCardProps> = React.memo(({
  album,
  size = 148,
  onPress,
  onFavoriteToggle,
  style,
}) => {
  const accent = album.accentColor || Palette.primary;
  const albumArtwork = album.artworkUrl || album.tracks?.[0]?.artworkUrl;

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[styles.container, { width: size }, style]}
    >
      <View style={[styles.artworkWrapper, { width: size, height: size }]}>
        <ArtworkView
          artworkUri={albumArtwork}
          primaryColor={accent}
          secondaryColor="#090A0F"
          size={size}
          borderRadius={Radius.lg}
          showVinylGroove
          iconName="disc"
        />

        {/* Favorite Heart Tag if togglable */}
        {onFavoriteToggle && (
          <View style={styles.heartBtn}>
            <AnimatedFavoriteButton
              isFavorite={!!album.isFavorite}
              onToggle={() => onFavoriteToggle(album.id)}
              size={18}
              activeColor={Palette.secondary}
              inactiveColor="#FFFFFF"
            />
          </View>
        )}

        {/* Year Pill Tag */}
        <View style={styles.badgeContainer}>
          <Typography variant="meta" color="#FFFFFF" style={styles.badgeText}>
            {album.year}
          </Typography>
        </View>
      </View>

      <Typography
        variant="bodyMedium"
        color={Palette.textPrimary}
        numberOfLines={1}
        style={styles.title}
      >
        {album.title}
      </Typography>

      <Typography
        variant="subhead"
        color={Palette.textSecondary}
        numberOfLines={1}
      >
        {album.artist}
      </Typography>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  container: {
    marginRight: Spacing.md,
  },
  artworkWrapper: {
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  heartBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  badgeContainer: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  badgeText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  title: {
    marginTop: 2,
  },
});

export default AlbumCard;
