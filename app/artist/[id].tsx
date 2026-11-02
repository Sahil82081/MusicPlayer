import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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
import SongListItem from '@/components/music/SongListItem';
import AlbumCard from '@/components/music/AlbumCard';
import SectionHeader from '@/components/common/SectionHeader';
import SongOptionsModal from '@/components/music/SongOptionsModal';
import { AudioTrack } from '@/services/audio/types';

export default function ArtistDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { currentTrack, isPlaying, playTrack, toggleFavorite } = usePlayer();
  const { toggleFavoriteAlbum } = useLibrary();

  const [selectedTrackForOptions, setSelectedTrackForOptions] = useState<AudioTrack | null>(null);

  const artist = MusicLibraryService.getArtistById(id as string);
  const tracks = MusicLibraryService.getTracksByArtist(id as string);
  const albums = MusicLibraryService.getAlbumsByArtist(id as string);

  if (!artist) {
    return (
      <ScreenContainer>
        <View style={styles.errorContainer}>
          <Typography variant="bodyMedium" color={Palette.textSecondary}>
            Artist not found in offline storage.
          </Typography>
          <Button title="Back" onPress={() => router.back()} style={{ marginTop: Spacing.md }} />
        </View>
      </ScreenContainer>
    );
  }

  const primaryAccent = artist.accentColor || Palette.primary;

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  return (
    <ScreenContainer scrollable>
      {/* Top Nav */}
      <View style={[styles.topNav, { paddingTop: insets.top + Spacing.xs }]}>
        <AnimatedPressable onPress={() => router.back()} style={styles.navIconButton}>
          <Ionicons name="chevron-back" size={24} color={Palette.textPrimary} />
        </AnimatedPressable>

        <Typography variant="meta" color={Palette.textTertiary}>
          OFFLINE ARTIST
        </Typography>

        <View style={{ width: 40 }} />
      </View>

      {/* Hero Artist Profile */}
      <View style={styles.heroSection}>
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={[primaryAccent, '#12131C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGradient}
          >
            <Ionicons name="person" size={68} color="#FFFFFF" />
          </LinearGradient>
        </View>

        <Typography variant="titleLarge" color={Palette.textPrimary} align="center" style={styles.name}>
          {artist.name}
        </Typography>

        <View style={styles.badgeRow}>
          <Badge label={`${tracks.length} OFFLINE SONGS`} variant="accent" />
          <Badge label={`${artist.albumCount} ALBUM`} variant="outline" style={{ marginLeft: 6 }} />
        </View>

        {artist.bio && (
          <Typography
            variant="subhead"
            color={Palette.textSecondary}
            align="center"
            style={styles.bio}
          >
            {artist.bio}
          </Typography>
        )}

        <View style={styles.buttonRow}>
          <Button
            variant="primary"
            size="md"
            title="Play All Songs"
            iconName="play"
            onPress={handlePlayAll}
            style={styles.actionBtn}
          />
        </View>
      </View>

      {/* Albums by this Artist */}
      {albums.length > 0 && (
        <>
          <SectionHeader
            title="Albums"
            subtitle={`Discography by ${artist.name}`}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.albumsHorizontalScroll}
          >
            {albums.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                size={144}
                onPress={() => router.push(`/album/${album.id}`)}
                onFavoriteToggle={() => toggleFavoriteAlbum(album.id)}
              />
            ))}
          </ScrollView>
        </>
      )}

      {/* Discography Tracks */}
      <SectionHeader
        title="Songs"
        subtitle={`Locally stored tracks by ${artist.name}`}
      />

      <View style={styles.trackList}>
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

      {/* Track More Options Modal */}
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
  avatarContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  bio: {
    marginTop: Spacing.sm,
    lineHeight: 20,
    maxWidth: 320,
  },
  buttonRow: {
    marginTop: Spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  actionBtn: {
    minWidth: 200,
  },
  albumsHorizontalScroll: {
    paddingLeft: Spacing.xl,
    paddingRight: Spacing.md,
    paddingBottom: Spacing.md,
  },
  trackList: {
    paddingBottom: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
