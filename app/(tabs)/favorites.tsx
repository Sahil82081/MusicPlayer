import React, { useState, useCallback, useMemo } from 'react';
import { FlatList, Platform, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '@/context/PlayerContext';
import { useLibrary } from '@/context/LibraryContext';
import { Palette, Radius, Spacing } from '@/constants/theme';
import ScreenContainer from '@/components/common/ScreenContainer';
import Typography from '@/components/common/Typography';
import AnimatedPressable from '@/components/common/AnimatedPressable';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import SongListItem, { SONG_ITEM_HEIGHT } from '@/components/music/SongListItem';
import AlbumCard from '@/components/music/AlbumCard';
import SongOptionsModal from '@/components/music/SongOptionsModal';
import { AudioTrack } from '@/services/audio/types';
import { Album } from '@/services/library/types';

type FavoritesTab = 'songs' | 'albums';

export default function FavoritesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FavoritesTab>('songs');
  const [selectedTrackForOptions, setSelectedTrackForOptions] = useState<AudioTrack | null>(null);

  const { currentTrack, isPlaying, playTrack, toggleFavorite } = usePlayer();
  const { favoriteTracks, favoriteAlbums, toggleFavoriteAlbum } = useLibrary();

  const totalDurationMs = useMemo(
    () => favoriteTracks.reduce((acc, t) => acc + t.durationMs, 0),
    [favoriteTracks]
  );
  const totalMins = Math.floor(totalDurationMs / (1000 * 60));

  const handleShuffleFavorites = useCallback(() => {
    if (favoriteTracks.length > 0) {
      const randomIndex = Math.floor(Math.random() * favoriteTracks.length);
      playTrack(favoriteTracks[randomIndex], favoriteTracks);
    }
  }, [favoriteTracks, playTrack]);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: SONG_ITEM_HEIGHT,
      offset: SONG_ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  const renderSongItem = useCallback(
    ({ item, index }: { item: AudioTrack; index: number }) => (
      <SongListItem
        track={item}
        index={index + 1}
        isActiveTrack={currentTrack?.id === item.id}
        isPlaying={isPlaying && currentTrack?.id === item.id}
        onPress={() => playTrack(item, favoriteTracks)}
        onFavoriteToggle={() => toggleFavorite(item.id)}
        onOptionsPress={() => setSelectedTrackForOptions(item)}
      />
    ),
    [currentTrack?.id, isPlaying, playTrack, favoriteTracks, toggleFavorite]
  );

  const renderAlbumItem = useCallback(
    ({ item }: { item: Album }) => (
      <AlbumCard
        album={item}
        size={160}
        onPress={() => router.push(`/album/${item.id}`)}
        onFavoriteToggle={() => toggleFavoriteAlbum(item.id)}
        style={styles.gridAlbumCard}
      />
    ),
    [router, toggleFavoriteAlbum]
  );

  const renderHeader = useMemo(() => {
    return (
      <View>
        {/* Hero Header Banner */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#EC4899', '#8B5CF6', '#12131C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heartIconCircle}>
              <Ionicons name="heart" size={32} color="#FFFFFF" />
            </View>

            <Badge label="OFFLINE FAVORITES" variant="secondary" style={styles.badge} />

            <Typography variant="titleLarge" color="#FFFFFF" style={styles.title}>
              Your Favorites
            </Typography>

            <Typography variant="subhead" color="rgba(255, 255, 255, 0.85)">
              {favoriteTracks.length} songs • {favoriteAlbums.length} albums • {totalMins} mins
            </Typography>

            {favoriteTracks.length > 0 && (
              <View style={styles.buttonRow}>
                <Button
                  variant="primary"
                  size="md"
                  title="Shuffle Favorite Songs"
                  iconName="shuffle"
                  onPress={handleShuffleFavorites}
                  style={styles.shuffleBtn}
                />
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Segmented Filter Switch: Songs vs Albums */}
        <View style={styles.tabBar}>
          <AnimatedPressable
            onPress={() => setActiveTab('songs')}
            style={[styles.tabItem, activeTab === 'songs' && styles.tabItemActive]}
          >
            <Typography
              variant="subhead"
              color={activeTab === 'songs' ? '#FFFFFF' : Palette.textMuted}
              weight={activeTab === 'songs' ? '600' : '400'}
            >
              Favorite Songs ({favoriteTracks.length})
            </Typography>
          </AnimatedPressable>

          <AnimatedPressable
            onPress={() => setActiveTab('albums')}
            style={[styles.tabItem, activeTab === 'albums' && styles.tabItemActive]}
          >
            <Typography
              variant="subhead"
              color={activeTab === 'albums' ? '#FFFFFF' : Palette.textMuted}
              weight={activeTab === 'albums' ? '600' : '400'}
            >
              Favorite Albums ({favoriteAlbums.length})
            </Typography>
          </AnimatedPressable>
        </View>
      </View>
    );
  }, [favoriteTracks.length, favoriteAlbums.length, totalMins, handleShuffleFavorites, activeTab]);

  return (
    <ScreenContainer scrollable={false}>
      {activeTab === 'songs' ? (
        <FlatList
          data={favoriteTracks}
          renderItem={renderSongItem}
          keyExtractor={(item) => item.id}
          getItemLayout={getItemLayout}
          initialNumToRender={14}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="heart-outline" size={38} color={Palette.secondary} />
              </View>
              <Typography variant="titleSmall" color={Palette.textPrimary} style={{ marginTop: Spacing.md }}>
                No favorite songs yet
              </Typography>
              <Typography variant="subhead" color={Palette.textTertiary} align="center" style={styles.emptySubtitle}>
                Tap the heart icon on any offline track to keep your most-loved audio in one quick-access place.
              </Typography>
              <Button
                variant="secondary"
                size="md"
                title="Explore Library"
                iconName="musical-notes-outline"
                onPress={() => router.push('/(tabs)/library')}
                style={styles.exploreBtn}
              />
            </View>
          }
          contentContainerStyle={{ paddingBottom: Spacing.xxl }}
        />
      ) : (
        <FlatList
          key="fav-albums-grid"
          data={favoriteAlbums}
          renderItem={renderAlbumItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.albumColumnWrapper}
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="disc-outline" size={38} color={Palette.primaryLight} />
              </View>
              <Typography variant="titleSmall" color={Palette.textPrimary} style={{ marginTop: Spacing.md }}>
                No favorite albums yet
              </Typography>
              <Typography variant="subhead" color={Palette.textTertiary} align="center" style={styles.emptySubtitle}>
                Mark full master albums as favorites to build your offline album showcase.
              </Typography>
              <Button
                variant="secondary"
                size="md"
                title="Browse Albums"
                iconName="disc-outline"
                onPress={() => router.push('/(tabs)/library')}
                style={styles.exploreBtn}
              />
            </View>
          }
          contentContainerStyle={{ paddingBottom: Spacing.xxl }}
        />
      )}

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
  heroSection: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  heroCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  heartIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.xs,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  buttonRow: {
    marginTop: Spacing.md,
    flexDirection: 'row',
  },
  shuffleBtn: {
    borderRadius: Radius.pill,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Palette.surface,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    padding: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  tabItem: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
  tabItemActive: {
    backgroundColor: Palette.surfaceElevated,
  },
  albumColumnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
  },
  gridAlbumCard: {
    marginBottom: Spacing.lg,
    marginRight: 0,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Palette.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  emptySubtitle: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
    maxWidth: 280,
  },
  exploreBtn: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
  },
});
