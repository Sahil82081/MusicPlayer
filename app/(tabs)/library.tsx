import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, Modal, Alert, FlatList, Platform } from 'react-native';
import { useRouter } from 'expo-router';
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
import ArtistCard from '@/components/music/ArtistCard';
import SongOptionsModal from '@/components/music/SongOptionsModal';
import PlatformImportBanner from '@/components/platform/PlatformImportBanner';
import LibraryEmptyState from '@/components/music/LibraryEmptyState';
import { AudioTrack } from '@/services/audio/types';
import { Album, Artist, LibrarySortOption, MusicFolder } from '@/services/library/types';

type LibraryTab = 'songs' | 'albums' | 'artists' | 'folders';
type SongFilter = 'all' | 'favorites' | 'hires';

const SORT_LABELS: Record<LibrarySortOption, string> = {
  name: 'Name A-Z',
  recently_added: 'Recently Added',
  recently_played: 'Recently Played',
  artist: 'Artist',
  album: 'Album',
};

const SORT_ICONS: Record<LibrarySortOption, keyof typeof Ionicons.glyphMap> = {
  name: 'text-outline',
  recently_added: 'time-outline',
  recently_played: 'play-forward-outline',
  artist: 'person-outline',
  album: 'disc-outline',
};

export default function LibraryScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<LibraryTab>('songs');
  const [activeSort, setActiveSort] = useState<LibrarySortOption>('name');
  const [songFilter, setSongFilter] = useState<SongFilter>('all');
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);
  const [selectedTrackForOptions, setSelectedTrackForOptions] = useState<AudioTrack | null>(null);

  const { currentTrack, isPlaying, playTrack, toggleFavorite } = usePlayer();
  const {
    tracks,
    albums,
    artists,
    folders,
    stats,
    toggleFavoriteAlbum,
    sortTracks,
    getTracksForFolder,
  } = useLibrary();

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb > 1000) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(0)} MB`;
  };

  // High-performance memoized filtering & sorting
  const displayedTracks = useMemo(() => {
    let result = tracks;
    if (songFilter === 'favorites') {
      result = result.filter((t) => t.isFavorite);
    } else if (songFilter === 'hires') {
      result = result.filter((t) => t.formatInfo.isHiRes);
    }
    return sortTracks(result, activeSort);
  }, [tracks, songFilter, activeSort, sortTracks]);

  const displayedAlbums = useMemo(() => {
    if (activeSort === 'artist') {
      return [...albums].sort((a, b) => a.artist.localeCompare(b.artist));
    }
    return [...albums].sort((a, b) => a.title.localeCompare(b.title));
  }, [albums, activeSort]);

  const displayedArtists = useMemo(() => {
    return [...artists].sort((a, b) => a.name.localeCompare(b.name));
  }, [artists]);

  const handleShuffleAll = useCallback(() => {
    if (displayedTracks.length > 0) {
      const randomIndex = Math.floor(Math.random() * displayedTracks.length);
      playTrack(displayedTracks[randomIndex], displayedTracks);
    } else if (tracks.length > 0) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      playTrack(tracks[randomIndex], tracks);
    }
  }, [displayedTracks, tracks, playTrack]);

  const handleFolderPress = useCallback((folder: MusicFolder) => {
    const folderTracks = getTracksForFolder(folder.path);
    if (folderTracks.length > 0) {
      playTrack(folderTracks[0], folderTracks);
    } else {
      Alert.alert('Empty Folder', `No offline audio tracks found in ${folder.name}`);
    }
  }, [getTracksForFolder, playTrack]);

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
        onPress={() => playTrack(item, displayedTracks)}
        onFavoriteToggle={() => toggleFavorite(item.id)}
        onOptionsPress={() => setSelectedTrackForOptions(item)}
      />
    ),
    [currentTrack?.id, isPlaying, playTrack, displayedTracks, toggleFavorite]
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

  const renderArtistItem = useCallback(
    ({ item }: { item: Artist }) => (
      <AnimatedPressable
        onPress={() => router.push(`/artist/${item.id}`)}
        style={styles.artistRow}
      >
        <ArtistCard
          artist={item}
          size={54}
          onPress={() => router.push(`/artist/${item.id}`)}
        />
        <View style={styles.artistInfo}>
          <Typography variant="bodyMedium" color={Palette.textPrimary}>
            {item.name}
          </Typography>
          <Typography variant="caption" color={Palette.textSecondary}>
            {item.trackCount} tracks • {item.albumCount} album
          </Typography>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Palette.textTertiary} />
      </AnimatedPressable>
    ),
    [router]
  );

  const renderFolderItem = useCallback(
    ({ item }: { item: MusicFolder }) => (
      <AnimatedPressable
        onPress={() => handleFolderPress(item)}
        style={styles.folderCard}
      >
        <View style={styles.folderIconBox}>
          <Ionicons name="folder" size={24} color={Palette.primaryLight} />
        </View>
        <View style={styles.folderDetails}>
          <Typography variant="bodyMedium" color={Palette.textPrimary} numberOfLines={1}>
            {item.name}
          </Typography>
          <Typography variant="caption" color={Palette.textTertiary} numberOfLines={1}>
            {item.path}
          </Typography>
          <Typography variant="caption" color={Palette.primaryLight} style={{ marginTop: 2 }}>
            {item.trackCount} files • {formatBytes(item.sizeBytes)}
          </Typography>
        </View>
        <View style={styles.folderPlayIcon}>
          <Ionicons name="play-circle" size={28} color={Palette.primary} />
        </View>
      </AnimatedPressable>
    ),
    [handleFolderPress]
  );

  const renderHeader = useMemo(() => {
    return (
      <View>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Typography variant="titleLarge" color={Palette.textPrimary}>
              Library
            </Typography>
            <View style={styles.statsBadgeRow}>
              <Badge
                label={`${tracks.length} OFFLINE SONGS • ${formatBytes(stats.totalStorageBytes)}`}
                variant="primary"
              />
            </View>
          </View>

          <View style={styles.headerButtonsRow}>
            <AnimatedPressable
              onPress={() => router.push('/search')}
              style={styles.searchButton}
            >
              <Ionicons name="search" size={20} color={Palette.textPrimary} />
            </AnimatedPressable>

            <AnimatedPressable
              onPress={() => router.push('/settings')}
              style={[styles.searchButton, { marginLeft: Spacing.sm }]}
            >
              <Ionicons name="settings-outline" size={20} color={Palette.textPrimary} />
            </AnimatedPressable>
          </View>
        </View>

        {/* Platform Audio Storage Scanner Card */}
        <PlatformImportBanner />

        {tracks.length > 0 && (
          <>
            {/* Segmented Tab Switcher */}
            <View style={styles.tabBar}>
              {(['songs', 'albums', 'artists', 'folders'] as LibraryTab[]).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <AnimatedPressable
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={[styles.tabItem, isActive && styles.tabItemActive]}
                  >
                    <Typography
                      variant="subhead"
                      color={isActive ? '#FFFFFF' : Palette.textMuted}
                      weight={isActive ? '600' : '400'}
                      style={styles.tabText}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Typography>
                  </AnimatedPressable>
                );
              })}
            </View>

            {/* Action Bar (Shuffle All & Sort Trigger) */}
            <View style={styles.actionBar}>
              <Button
                variant="secondary"
                size="sm"
                title={`Shuffle (${displayedTracks.length})`}
                iconName="shuffle"
                onPress={handleShuffleAll}
                style={styles.actionShuffleButton}
              />

              {/* Sort Selector Trigger */}
              <AnimatedPressable
                onPress={() => setIsSortModalVisible(true)}
                style={styles.sortButton}
              >
                <Ionicons
                  name={SORT_ICONS[activeSort]}
                  size={16}
                  color={Palette.primaryLight}
                  style={{ marginRight: 6 }}
                />
                <Typography variant="caption" color={Palette.primaryLight} weight="600">
                  {SORT_LABELS[activeSort]}
                </Typography>
                <Ionicons
                  name="chevron-down"
                  size={14}
                  color={Palette.textTertiary}
                  style={{ marginLeft: 4 }}
                />
              </AnimatedPressable>
            </View>

            {/* Song Filter Pills Row (Only on Songs tab) */}
            {activeTab === 'songs' && (
              <View style={styles.songFilterPillsRow}>
                <AnimatedPressable
                  onPress={() => setSongFilter('all')}
                  style={[styles.songFilterPill, songFilter === 'all' && styles.songFilterPillActive]}
                >
                  <Typography
                    variant="caption"
                    color={songFilter === 'all' ? '#FFFFFF' : Palette.textSecondary}
                    weight={songFilter === 'all' ? '600' : '400'}
                  >
                    All Songs ({tracks.length})
                  </Typography>
                </AnimatedPressable>

                <AnimatedPressable
                  onPress={() => setSongFilter('favorites')}
                  style={[styles.songFilterPill, songFilter === 'favorites' && styles.songFilterPillActive]}
                >
                  <Ionicons
                    name="heart"
                    size={12}
                    color={songFilter === 'favorites' ? '#FFFFFF' : Palette.primaryLight}
                    style={{ marginRight: 4 }}
                  />
                  <Typography
                    variant="caption"
                    color={songFilter === 'favorites' ? '#FFFFFF' : Palette.textSecondary}
                    weight={songFilter === 'favorites' ? '600' : '400'}
                  >
                    Favorites ({tracks.filter((t) => t.isFavorite).length})
                  </Typography>
                </AnimatedPressable>

                <AnimatedPressable
                  onPress={() => setSongFilter('hires')}
                  style={[styles.songFilterPill, songFilter === 'hires' && styles.songFilterPillHiResActive]}
                >
                  <Ionicons
                    name="sparkles"
                    size={12}
                    color={songFilter === 'hires' ? '#090A0F' : Palette.secondary}
                    style={{ marginRight: 4 }}
                  />
                  <Typography
                    variant="caption"
                    color={songFilter === 'hires' ? '#090A0F' : Palette.secondary}
                    weight={songFilter === 'hires' ? '600' : '400'}
                  >
                    Hi-Res ({tracks.filter((t) => t.formatInfo.isHiRes).length})
                  </Typography>
                </AnimatedPressable>
              </View>
            )}
          </>
        )}
      </View>
    );
  }, [
    tracks,
    stats,
    router,
    activeTab,
    displayedTracks.length,
    handleShuffleAll,
    activeSort,
    songFilter,
  ]);

  return (
    <ScreenContainer scrollable={false}>
      {tracks.length === 0 ? (
        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={<LibraryEmptyState />}
          contentContainerStyle={{ paddingBottom: Spacing.xxl }}
        />
      ) : activeTab === 'songs' ? (
        <FlatList
          data={displayedTracks}
          renderItem={renderSongItem}
          keyExtractor={(item) => item.id}
          getItemLayout={getItemLayout}
          initialNumToRender={14}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.tabEmptyState}>
              <Ionicons name="filter-outline" size={32} color={Palette.textMuted} />
              <Typography variant="bodyMedium" color={Palette.textSecondary} style={{ marginTop: Spacing.sm }}>
                No tracks match this filter.
              </Typography>
              <AnimatedPressable onPress={() => setSongFilter('all')} style={{ marginTop: Spacing.sm }}>
                <Typography variant="caption" color={Palette.primaryLight} weight="600">
                  Show All Songs
                </Typography>
              </AnimatedPressable>
            </View>
          }
          contentContainerStyle={{ paddingBottom: Spacing.xxl }}
        />
      ) : activeTab === 'albums' ? (
        <FlatList
          key="albums-grid"
          data={displayedAlbums}
          renderItem={renderAlbumItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.albumColumnWrapper}
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingBottom: Spacing.xxl }}
        />
      ) : activeTab === 'artists' ? (
        <FlatList
          key="artists-list"
          data={displayedArtists}
          renderItem={renderArtistItem}
          keyExtractor={(item) => item.id}
          initialNumToRender={12}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingBottom: Spacing.xxl }}
        />
      ) : (
        <FlatList
          key="folders-list"
          data={folders}
          renderItem={renderFolderItem}
          keyExtractor={(item) => item.id}
          initialNumToRender={10}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingBottom: Spacing.xxl }}
        />
      )}

      {/* Track More Options Modal */}
      <SongOptionsModal
        visible={!!selectedTrackForOptions}
        track={selectedTrackForOptions}
        onClose={() => setSelectedTrackForOptions(null)}
      />

      {/* SORT SELECTION MODAL */}
      <Modal
        visible={isSortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSortModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <AnimatedPressable
            style={StyleSheet.absoluteFill}
            onPress={() => setIsSortModalVisible(false)}
            enableHaptics={false}
          >
            <View style={styles.modalDim} />
          </AnimatedPressable>

          <View style={styles.sortSheet}>
            <View style={styles.sortSheetHeader}>
              <Typography variant="titleSmall" color={Palette.textPrimary}>
                Sort Library Songs
              </Typography>
              <Typography variant="caption" color={Palette.textSecondary}>
                Select order for your offline collection
              </Typography>
            </View>

            {(Object.keys(SORT_LABELS) as LibrarySortOption[]).map((option) => {
              const isSelected = activeSort === option;
              return (
                <AnimatedPressable
                  key={option}
                  onPress={() => {
                    setActiveSort(option);
                    setIsSortModalVisible(false);
                  }}
                  style={[styles.sortOptionItem, isSelected && styles.sortOptionItemActive]}
                >
                  <View style={styles.sortOptionLeft}>
                    <Ionicons
                      name={SORT_ICONS[option]}
                      size={20}
                      color={isSelected ? Palette.primaryLight : Palette.textSecondary}
                      style={{ marginRight: Spacing.md }}
                    />
                    <Typography
                      variant="bodyMedium"
                      color={isSelected ? Palette.primaryLight : Palette.textPrimary}
                      weight={isSelected ? '600' : '400'}
                    >
                      {SORT_LABELS[option]}
                    </Typography>
                  </View>

                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={Palette.primaryLight} />
                  )}
                </AnimatedPressable>
              );
            })}

            <AnimatedPressable
              onPress={() => setIsSortModalVisible(false)}
              style={styles.sortCancelBtn}
            >
              <Typography variant="bodyMedium" color={Palette.textSecondary}>
                Close
              </Typography>
            </AnimatedPressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  statsBadgeRow: {
    marginTop: Spacing.xs,
  },
  headerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Palette.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Palette.surface,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
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
  tabText: {
    textTransform: 'capitalize',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  actionShuffleButton: {
    borderRadius: Radius.pill,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surfaceElevated,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  songFilterPillsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  songFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surfaceElevated,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  songFilterPillActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primaryLight,
  },
  songFilterPillHiResActive: {
    backgroundColor: Palette.secondary,
    borderColor: Palette.secondaryLight,
  },
  tabEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  albumColumnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
  },
  gridAlbumCard: {
    marginBottom: Spacing.lg,
    marginRight: 0,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderSubtle,
  },
  artistInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  folderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surfaceElevated,
    marginHorizontal: Spacing.xl,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  folderIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  folderDetails: {
    flex: 1,
  },
  folderPlayIcon: {
    marginLeft: Spacing.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalDim: {
    flex: 1,
  },
  sortSheet: {
    backgroundColor: Palette.surfaceElevated,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  sortSheetHeader: {
    marginBottom: Spacing.md,
  },
  sortOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderSubtle,
  },
  sortOptionItemActive: {
    borderBottomColor: 'rgba(139, 92, 246, 0.3)',
  },
  sortOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortCancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
});
