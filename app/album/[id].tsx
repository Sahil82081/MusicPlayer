import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayer } from '@/context/PlayerContext';
import { useLibrary } from '@/context/LibraryContext';
import { MusicLibraryService } from '@/services/library/MusicLibraryService';
import { Palette, Radius, Spacing } from '@/constants/theme';
import ScreenContainer from '@/components/common/ScreenContainer';
import Typography from '@/components/common/Typography';
import AnimatedPressable from '@/components/common/AnimatedPressable';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import AnimatedFavoriteButton from '@/components/common/AnimatedFavoriteButton';
import SongListItem from '@/components/music/SongListItem';
import ArtworkView from '@/components/music/ArtworkView';
import SongOptionsModal from '@/components/music/SongOptionsModal';
import { AudioTrack } from '@/services/audio/types';

export default function AlbumDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { currentTrack, isPlaying, playTrack, toggleFavorite } = usePlayer();
  const { toggleFavoriteAlbum } = useLibrary();

  const [selectedTrackForOptions, setSelectedTrackForOptions] = useState<AudioTrack | null>(null);

  const album = MusicLibraryService.getAlbumById(id as string);
  const tracks = album?.tracks || [];

  if (!album) {
    return (
      <ScreenContainer>
        <View style={styles.errorContainer}>
          <Typography variant="bodyMedium" color={Palette.textSecondary}>
            Album not found in offline storage.
          </Typography>
          <Button title="Back" onPress={() => router.back()} style={{ marginTop: Spacing.md }} />
        </View>
      </ScreenContainer>
    );
  }

  const primaryAccent = album.accentColor || Palette.primary;

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  const handleShuffle = () => {
    if (tracks.length > 0) {
      const rand = Math.floor(Math.random() * tracks.length);
      playTrack(tracks[rand], tracks);
    }
  };

  return (
    <ScreenContainer scrollable>
      {/* Top Floating Nav */}
      <View style={[styles.topNav, { paddingTop: insets.top + Spacing.xs }]}>
        <AnimatedPressable onPress={() => router.back()} style={styles.navIconButton}>
          <Ionicons name="chevron-back" size={24} color={Palette.textPrimary} />
        </AnimatedPressable>

        <Typography variant="meta" color={Palette.textTertiary}>
          OFFLINE MASTER ALBUM
        </Typography>

        <AnimatedFavoriteButton
          isFavorite={!!album.isFavorite}
          onToggle={() => toggleFavoriteAlbum(album.id)}
          size={22}
          activeColor={Palette.secondary}
          inactiveColor={Palette.textPrimary}
          style={styles.navIconButton}
        />
      </View>

      {/* Hero Album Card */}
      <View style={styles.heroSection}>
        <ArtworkView
          artworkUri={tracks[0]?.artworkUrl}
          primaryColor={primaryAccent}
          secondaryColor="#090A0F"
          size={180}
          borderRadius={Radius.xl}
          showVinylGroove
          iconName="disc"
          style={styles.artBox}
        />

        <Typography variant="titleLarge" color={Palette.textPrimary} align="center" style={styles.title}>
          {album.title}
        </Typography>

        <AnimatedPressable onPress={() => router.push(`/artist/${album.artistId}`)}>
          <Typography variant="body" color={Palette.primaryLight} align="center" style={styles.artist}>
            {album.artist}
          </Typography>
        </AnimatedPressable>

        <View style={styles.metadataBadgeRow}>
          <Badge label={`${album.year}`} variant="outline" />
          <Badge label={`${tracks.length} SONGS`} variant="outline" style={{ marginLeft: 6 }} />
          <Badge label="24-BIT FLAC" variant="primary" style={{ marginLeft: 6 }} />
        </View>

        {/* Action Buttons: Play & Shuffle */}
        <View style={styles.actionButtonsRow}>
          <Button
            variant="primary"
            size="md"
            title="Play All"
            iconName="play"
            onPress={handlePlayAll}
            style={styles.actionBtn}
          />

          <Button
            variant="secondary"
            size="md"
            title="Shuffle"
            iconName="shuffle"
            onPress={handleShuffle}
            style={styles.actionBtn}
          />
        </View>
      </View>

      {/* Songs in this Album */}
      <View style={styles.trackListContainer}>
        {tracks.map((track, idx) => (
          <SongListItem
            key={track.id}
            track={track}
            index={idx + 1}
            isActiveTrack={currentTrack?.id === track.id}
            isPlaying={isPlaying && currentTrack?.id === track.id}
            onPress={() => playTrack(track, tracks)}
            onFavoriteToggle={() => toggleFavorite(track.id)}
            onOptionsPress={() => setSelectedTrackForOptions(track)}
          />
        ))}
      </View>

      {/* Track Options Modal */}
      <SongOptionsModal
        visible={!!selectedTrackForOptions}
        track={selectedTrackForOptions}
        onClose={() => setSelectedTrackForOptions(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xs,
  },
  navIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  artBox: {
    marginBottom: Spacing.md,
  },
  title: {
    marginBottom: 4,
  },
  artist: {
    marginBottom: Spacing.sm,
  },
  metadataBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
  },
  actionBtn: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  trackListContainer: {
    paddingBottom: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
