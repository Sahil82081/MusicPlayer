import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '@/context/PlayerContext';
import { useLibrary } from '@/context/LibraryContext';
import { Gradients, Palette, Radius, Spacing } from '@/constants/theme';
import ScreenContainer from '@/components/common/ScreenContainer';
import Typography from '@/components/common/Typography';
import AnimatedPressable from '@/components/common/AnimatedPressable';
import SectionHeader from '@/components/common/SectionHeader';
import Badge from '@/components/common/Badge';
import SongListItem from '@/components/music/SongListItem';
import AlbumCard from '@/components/music/AlbumCard';
import ArtworkView from '@/components/music/ArtworkView';
import SongOptionsModal from '@/components/music/SongOptionsModal';
import LibraryEmptyState from '@/components/music/LibraryEmptyState';
import { AudioTrack } from '@/services/audio/types';

export default function HomeScreen() {
  const router = useRouter();
  const { currentTrack, isPlaying, playTrack, togglePlayPause, toggleFavorite, recentlyPlayed } = usePlayer();
  const { tracks, albums, favoriteTracks, playlists, stats } = useLibrary();

  const [selectedTrackForOptions, setSelectedTrackForOptions] = useState<AudioTrack | null>(null);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const heroTrack = currentTrack || tracks[0];

  const handleTrackPress = (track: AudioTrack) => {
    playTrack(track, tracks);
  };

  const handleHeroPlayPress = () => {
    if (heroTrack) {
      if (currentTrack?.id === heroTrack.id) {
        togglePlayPause();
      } else {
        playTrack(heroTrack, tracks);
      }
    }
  };

  return (
    <ScreenContainer scrollable>
      {/* Greeting / Header */}
      <View style={styles.topHeader}>
        <View style={styles.brandingRow}>
          <View style={styles.logoBadge}>
            <LinearGradient
              colors={Gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Ionicons name="musical-notes" size={20} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <View>
            <Typography variant="caption" color={Palette.textSecondary}>
              {getGreeting()}
            </Typography>
            <Typography variant="titleLarge" color={Palette.textPrimary}>
              Aura Music
            </Typography>
          </View>
        </View>

        <View style={styles.headerButtonsRow}>
          <AnimatedPressable
            onPress={() => router.push('/search')}
            style={styles.searchIconButton}
          >
            <Ionicons name="search" size={20} color={Palette.textPrimary} />
          </AnimatedPressable>

          <AnimatedPressable
            onPress={() => router.push('/settings')}
            style={[styles.searchIconButton, { marginLeft: Spacing.sm }]}
          >
            <Ionicons name="settings-outline" size={20} color={Palette.textPrimary} />
          </AnimatedPressable>
        </View>
      </View>

      {/* Conditional Content: Empty State vs Loaded Sections */}
      {tracks.length === 0 ? (
        <LibraryEmptyState />
      ) : (
        <>
          {/* Hero Quick Resume Offline Player Card */}
          {heroTrack && (
            <View style={styles.heroWrapper}>
              <AnimatedPressable
                onPress={() => router.push('/player')}
                style={styles.heroCard}
              >
                <LinearGradient
                  colors={[heroTrack.accentColor || Palette.primary, '#12131C', '#090A0F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroGradient}
                >
                  <View style={styles.heroTopRow}>
                    <Badge label="OFFLINE AUDIO ENGINE" variant="primary" />
                    <Badge
                      label={heroTrack.formatInfo.format}
                      variant={heroTrack.formatInfo.isHiRes ? 'accent' : 'outline'}
                    />
                  </View>

                  <View style={styles.heroMiddleRow}>
                    <ArtworkView
                      artworkUri={heroTrack.artworkUrl}
                      primaryColor={heroTrack.accentColor}
                      secondaryColor={heroTrack.secondaryAccentColor}
                      size={58}
                      borderRadius={Radius.md}
                      iconName={isPlaying && currentTrack?.id === heroTrack.id ? 'volume-high' : 'disc'}
                      style={styles.heroArtBox}
                    />

                    <View style={styles.heroTrackInfo}>
                      <Typography
                        variant="titleMedium"
                        color="#FFFFFF"
                        numberOfLines={1}
                        style={styles.heroTitle}
                      >
                        {heroTrack.title}
                      </Typography>
                      <Typography
                        variant="body"
                        color="rgba(255, 255, 255, 0.82)"
                        numberOfLines={1}
                      >
                        {heroTrack.artist}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="rgba(255, 255, 255, 0.6)"
                        numberOfLines={1}
                      >
                        {heroTrack.album} • {heroTrack.formatInfo.sampleRate || '96 kHz'}
                      </Typography>
                    </View>

                    <AnimatedPressable
                      onPress={(e: any) => {
                        e?.stopPropagation?.();
                        handleHeroPlayPress();
                      }}
                      style={styles.heroPlayButton}
                    >
                      <Ionicons
                        name={isPlaying && currentTrack?.id === heroTrack.id ? 'pause' : 'play'}
                        size={22}
                        color="#090A0F"
                        style={{ marginLeft: isPlaying && currentTrack?.id === heroTrack.id ? 0 : 2 }}
                      />
                    </AnimatedPressable>
                  </View>
                </LinearGradient>
              </AnimatedPressable>
            </View>
          )}

          {/* 1. RECENTLY PLAYED SECTION */}
          <SectionHeader
            title="Recently Played"
            subtitle="Last listened offline tracks"
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {(recentlyPlayed.length > 0 ? recentlyPlayed : tracks.slice(0, 4)).map((track) => (
              <AnimatedPressable
                key={`recent-${track.id}`}
                onPress={() => handleTrackPress(track)}
                style={styles.recentItemCard}
              >
                <ArtworkView
                  artworkUri={track.artworkUrl}
                  primaryColor={track.accentColor}
                  secondaryColor={track.secondaryAccentColor}
                  size={120}
                  borderRadius={Radius.lg}
                  iconName={currentTrack?.id === track.id && isPlaying ? 'volume-high' : 'disc'}
                />
                <Typography
                  variant="bodyMedium"
                  color={currentTrack?.id === track.id ? Palette.primaryLight : Palette.textPrimary}
                  numberOfLines={1}
                  style={styles.recentCardTitle}
                >
                  {track.title}
                </Typography>
                <Typography
                  variant="caption"
                  color={Palette.textSecondary}
                  numberOfLines={1}
                >
                  {track.artist}
                </Typography>
              </AnimatedPressable>
            ))}
          </ScrollView>

          {/* 2. RECENTLY ADDED SECTION */}
          <SectionHeader
            title="Recently Added"
            subtitle="Uncompressed local storage files"
            actionText="View all"
            onActionPress={() => router.push('/(tabs)/library')}
          />

          <View style={styles.trackListContainer}>
            {tracks.slice(0, 4).map((track, idx) => (
              <SongListItem
                key={track.id}
                track={track}
                index={idx + 1}
                isActiveTrack={currentTrack?.id === track.id}
                isPlaying={isPlaying && currentTrack?.id === track.id}
                onPress={() => handleTrackPress(track)}
                onFavoriteToggle={() => toggleFavorite(track.id)}
                onOptionsPress={() => setSelectedTrackForOptions(track)}
              />
            ))}
          </View>

          {/* 3. FAVORITES SECTION */}
          <SectionHeader
            title="Favorites"
            subtitle="Your starred offline collection"
            actionText="See all"
            onActionPress={() => router.push('/(tabs)/favorites')}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {favoriteTracks.slice(0, 5).map((track) => (
              <AnimatedPressable
                key={`fav-${track.id}`}
                onPress={() => handleTrackPress(track)}
                style={styles.recentItemCard}
              >
                <ArtworkView
                  artworkUri={track.artworkUrl}
                  primaryColor={track.accentColor}
                  secondaryColor={track.secondaryAccentColor}
                  size={120}
                  borderRadius={Radius.lg}
                  iconName="heart"
                />
                <Typography
                  variant="bodyMedium"
                  color={Palette.textPrimary}
                  numberOfLines={1}
                  style={styles.recentCardTitle}
                >
                  {track.title}
                </Typography>
                <Typography
                  variant="caption"
                  color={Palette.textSecondary}
                  numberOfLines={1}
                >
                  {track.artist}
                </Typography>
              </AnimatedPressable>
            ))}
          </ScrollView>

          {/* 4. YOUR LIBRARY SUMMARY CARDS */}
          <SectionHeader
            title="Your Library"
            subtitle="Offline audio vaults on device"
          />

          <View style={styles.libraryGrid}>
            <AnimatedPressable
              onPress={() => router.push('/(tabs)/library')}
              style={styles.libraryTile}
            >
              <View style={styles.tileIconCircle}>
                <Ionicons name="musical-notes" size={22} color={Palette.primaryLight} />
              </View>
              <Typography variant="titleSmall" color={Palette.textPrimary}>
                Songs
              </Typography>
              <Typography variant="caption" color={Palette.textSecondary}>
                {stats.totalTracks} offline files
              </Typography>
            </AnimatedPressable>

            <AnimatedPressable
              onPress={() => router.push('/(tabs)/library')}
              style={styles.libraryTile}
            >
              <View style={styles.tileIconCircle}>
                <Ionicons name="disc" size={22} color={Palette.secondaryLight} />
              </View>
              <Typography variant="titleSmall" color={Palette.textPrimary}>
                Albums
              </Typography>
              <Typography variant="caption" color={Palette.textSecondary}>
                {albums.length} master releases
              </Typography>
            </AnimatedPressable>

            <AnimatedPressable
              onPress={() => router.push('/(tabs)/library')}
              style={styles.libraryTile}
            >
              <View style={styles.tileIconCircle}>
                <Ionicons name="people" size={22} color={Palette.accentBlue} />
              </View>
              <Typography variant="titleSmall" color={Palette.textPrimary}>
                Artists
              </Typography>
              <Typography variant="caption" color={Palette.textSecondary}>
                {stats.totalArtists} composers
              </Typography>
            </AnimatedPressable>

            <AnimatedPressable
              onPress={() => router.push('/(tabs)/playlists')}
              style={styles.libraryTile}
            >
              <View style={styles.tileIconCircle}>
                <Ionicons name="list" size={22} color={Palette.success} />
              </View>
              <Typography variant="titleSmall" color={Palette.textPrimary}>
                Playlists
              </Typography>
              <Typography variant="caption" color={Palette.textSecondary}>
                {playlists.length} custom mixes
              </Typography>
            </AnimatedPressable>
          </View>
        </>
      )}

      {/* More Options Modal for Songs */}
      <SongOptionsModal
        visible={!!selectedTrackForOptions}
        track={selectedTrackForOptions}
        onClose={() => setSelectedTrackForOptions(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Palette.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  heroWrapper: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  heroCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  heroGradient: {
    padding: Spacing.lg,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  heroMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroArtBox: {
    marginRight: Spacing.md,
  },
  heroTrackInfo: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  heroTitle: {
    marginBottom: 2,
  },
  heroPlayButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalScroll: {
    paddingLeft: Spacing.xl,
    paddingRight: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  recentItemCard: {
    width: 120,
    marginRight: Spacing.md,
  },
  recentCardTitle: {
    marginTop: Spacing.xs,
  },
  trackListContainer: {
    marginBottom: Spacing.sm,
  },
  libraryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  libraryTile: {
    width: '48%',
    backgroundColor: Palette.surface,
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    marginBottom: Spacing.md,
  },
  tileIconCircle: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Palette.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
});
