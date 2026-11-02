import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ScrollView, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '@/context/PlayerContext';
import { useLibrary } from '@/context/LibraryContext';
import { Palette, Radius, Spacing } from '@/constants/theme';
import ScreenContainer from '@/components/common/ScreenContainer';
import Typography from '@/components/common/Typography';
import AnimatedPressable from '@/components/common/AnimatedPressable';
import SearchBar from '@/components/common/SearchBar';
import SongListItem from '@/components/music/SongListItem';
import AlbumCard from '@/components/music/AlbumCard';
import ArtistCard from '@/components/music/ArtistCard';
import SectionHeader from '@/components/common/SectionHeader';
import SongOptionsModal from '@/components/music/SongOptionsModal';
import Badge from '@/components/common/Badge';
import { AudioTrack } from '@/services/audio/types';
import { LibrarySortOption, MusicFolder } from '@/services/library/types';

type FilterType = 'all' | 'songs' | 'albums' | 'artists' | 'folders';

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

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [activeSort, setActiveSort] = useState<LibrarySortOption>('name');
  const [isHiResOnly, setIsHiResOnly] = useState<boolean>(false);
  const [isSortModalVisible, setIsSortModalVisible] = useState<boolean>(false);
  const [selectedTrackForOptions, setSelectedTrackForOptions] = useState<AudioTrack | null>(null);

  const resultsFadeAnim = useRef(new Animated.Value(0)).current;

  const { currentTrack, isPlaying, playTrack, toggleFavorite } = usePlayer();
  const {
    tracks,
    albums,
    artists,
    folders,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    toggleFavoriteAlbum,
    sortTracks,
    getTracksForFolder,
  } = useLibrary();

  // Responsive search debouncing: immediate UI typing with 100ms deferred heavy computation
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      if (query.trim().length > 2) {
        addRecentSearch(query.trim());
      }
    }, 100);
    return () => clearTimeout(handler);
  }, [query, addRecentSearch]);

  useEffect(() => {
    if (debouncedQuery.trim().length > 0) {
      resultsFadeAnim.setValue(0);
      Animated.timing(resultsFadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  }, [debouncedQuery, activeFilter, activeSort, isHiResOnly, resultsFadeAnim]);

  const handleSelectRecent = (term: string) => {
    setQuery(term);
    setDebouncedQuery(term);
    addRecentSearch(term);
  };

  const handleFolderPress = (folder: MusicFolder) => {
    const folderTracks = getTracksForFolder(folder.path);
    if (folderTracks.length > 0) {
      playTrack(folderTracks[0], folderTracks);
    } else {
      Alert.alert('Empty Folder', `No offline audio tracks found in ${folder.name}`);
    }
  };

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb > 1000) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(0)} MB`;
  };

  // High-performance memoized search across Songs, Artists, Albums, and Folders
  const filteredResults = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) {
      return {
        tracks: [],
        albums: [],
        artists: [],
        folders: [],
      };
    }

    let matchedTracks = tracks.filter((t) => {
      if (isHiResOnly && !t.formatInfo.isHiRes) return false;
      return (
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q) ||
        t.formatInfo.format.toLowerCase().includes(q)
      );
    });

    matchedTracks = sortTracks(matchedTracks, activeSort);

    const matchedAlbums = albums.filter(
      (a) => a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q)
    );

    const matchedArtists = artists.filter((art) => art.name.toLowerCase().includes(q));

    const matchedFolders = folders.filter(
      (f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q)
    );

    return {
      tracks: matchedTracks,
      albums: matchedAlbums,
      artists: matchedArtists,
      folders: matchedFolders,
    };
  }, [debouncedQuery, tracks, albums, artists, folders, isHiResOnly, activeSort, sortTracks]);

  const hasResults =
    filteredResults.tracks.length > 0 ||
    filteredResults.albums.length > 0 ||
    filteredResults.artists.length > 0 ||
    filteredResults.folders.length > 0;

  const totalResultsCount =
    filteredResults.tracks.length +
    filteredResults.albums.length +
    filteredResults.artists.length +
    filteredResults.folders.length;

  return (
    <ScreenContainer scrollable>
      {/* Header & Search Bar */}
      <View style={styles.header}>
        <View style={styles.topRow}>
          <AnimatedPressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Palette.textPrimary} />
          </AnimatedPressable>

          <View style={{ flex: 1 }}>
            <Typography variant="titleLarge" color={Palette.textPrimary}>
              Search Library
            </Typography>
            <Typography variant="caption" color={Palette.textSecondary}>
              Local offline songs, artists, albums & folders
            </Typography>
          </View>

          {/* Quick Sort Trigger */}
          <AnimatedPressable
            onPress={() => setIsSortModalVisible(true)}
            style={styles.sortTriggerButton}
          >
            <Ionicons name={SORT_ICONS[activeSort]} size={16} color={Palette.primaryLight} />
            <Typography variant="caption" color={Palette.primaryLight} style={{ marginLeft: 4 }} weight="600">
              {SORT_LABELS[activeSort].split(' ')[0]}
            </Typography>
          </AnimatedPressable>
        </View>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          onClear={() => {
            setQuery('');
            setDebouncedQuery('');
          }}
          placeholder="Search songs, artists, albums, folders..."
          autoFocus
          style={styles.searchBar}
        />

        {/* Filter & Sort Pills Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsRow}
        >
          {(['all', 'songs', 'albums', 'artists', 'folders'] as FilterType[]).map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <AnimatedPressable
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
              >
                <Typography
                  variant="caption"
                  color={isActive ? '#FFFFFF' : Palette.textSecondary}
                  weight={isActive ? '600' : '400'}
                >
                  {filter.toUpperCase()}
                </Typography>
              </AnimatedPressable>
            );
          })}

          {/* Useful Quick Filter: Hi-Res Audio Only */}
          <AnimatedPressable
            onPress={() => setIsHiResOnly(!isHiResOnly)}
            style={[styles.filterPill, isHiResOnly && styles.filterPillHiResActive]}
          >
            <Ionicons
              name="sparkles"
              size={12}
              color={isHiResOnly ? '#090A0F' : Palette.secondary}
              style={{ marginRight: 4 }}
            />
            <Typography
              variant="caption"
              color={isHiResOnly ? '#090A0F' : Palette.secondary}
              weight="600"
            >
              HI-RES ONLY
            </Typography>
          </AnimatedPressable>
        </ScrollView>
      </View>

      {/* Query Results */}
      {query.trim().length > 0 ? (
        hasResults ? (
          <Animated.View style={[styles.resultsContainer, { opacity: resultsFadeAnim }]}>
            {/* Results Count Header */}
            <View style={styles.resultsSummaryBar}>
              <Typography variant="caption" color={Palette.textSecondary}>
                Found {totalResultsCount} results • Sorted by {SORT_LABELS[activeSort]}
              </Typography>
              <AnimatedPressable
                onPress={() => setIsSortModalVisible(true)}
                style={styles.inlineSortChangeBtn}
              >
                <Ionicons name="swap-vertical" size={14} color={Palette.primaryLight} style={{ marginRight: 4 }} />
                <Typography variant="caption" color={Palette.primaryLight} weight="600">
                  Change Sort
                </Typography>
              </AnimatedPressable>
            </View>

            {/* 1. Tracks results */}
            {(activeFilter === 'all' || activeFilter === 'songs') &&
              filteredResults.tracks.length > 0 && (
                <View style={styles.section}>
                  <SectionHeader
                    title={`Songs (${filteredResults.tracks.length})`}
                    subtitle={`Ordered by ${SORT_LABELS[activeSort]}`}
                  />
                  {/* Capped slice for optimal frame-rate rendering */}
                  {filteredResults.tracks.slice(0, 50).map((track) => (
                    <SongListItem
                      key={track.id}
                      track={track}
                      isActiveTrack={currentTrack?.id === track.id}
                      isPlaying={isPlaying && currentTrack?.id === track.id}
                      onPress={() => playTrack(track, filteredResults.tracks)}
                      onFavoriteToggle={() => toggleFavorite(track.id)}
                      onOptionsPress={() => setSelectedTrackForOptions(track)}
                    />
                  ))}
                </View>
              )}

            {/* 2. Albums results */}
            {(activeFilter === 'all' || activeFilter === 'albums') &&
              filteredResults.albums.length > 0 && (
                <View style={styles.section}>
                  <SectionHeader title={`Albums (${filteredResults.albums.length})`} />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalScroll}
                  >
                    {filteredResults.albums.map((album) => (
                      <AlbumCard
                        key={album.id}
                        album={album}
                        size={150}
                        onPress={() => router.push(`/album/${album.id}`)}
                        onFavoriteToggle={() => toggleFavoriteAlbum(album.id)}
                      />
                    ))}
                  </ScrollView>
                </View>
              )}

            {/* 3. Artists results */}
            {(activeFilter === 'all' || activeFilter === 'artists') &&
              filteredResults.artists.length > 0 && (
                <View style={styles.section}>
                  <SectionHeader title={`Artists (${filteredResults.artists.length})`} />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalScroll}
                  >
                    {filteredResults.artists.map((artist) => (
                      <ArtistCard
                        key={artist.id}
                        artist={artist}
                        size={84}
                        onPress={() => router.push(`/artist/${artist.id}`)}
                      />
                    ))}
                  </ScrollView>
                </View>
              )}

            {/* 4. Folders results */}
            {(activeFilter === 'all' || activeFilter === 'folders') &&
              filteredResults.folders.length > 0 && (
                <View style={styles.section}>
                  <SectionHeader
                    title={`Folders (${filteredResults.folders.length})`}
                    subtitle="Tap to play folder tracks"
                  />
                  <View style={styles.foldersContainer}>
                    {filteredResults.folders.map((folder) => (
                      <AnimatedPressable
                        key={folder.id}
                        onPress={() => handleFolderPress(folder)}
                        style={styles.folderResultCard}
                      >
                        <View style={styles.folderIconBox}>
                          <Ionicons name="folder" size={24} color={Palette.primaryLight} />
                        </View>
                        <View style={styles.folderDetails}>
                          <Typography variant="bodyMedium" color={Palette.textPrimary} numberOfLines={1}>
                            {folder.name}
                          </Typography>
                          <Typography variant="caption" color={Palette.textTertiary} numberOfLines={1}>
                            {folder.path}
                          </Typography>
                          <Typography variant="caption" color={Palette.primaryLight} style={{ marginTop: 2 }}>
                            {folder.trackCount} files • {formatBytes(folder.sizeBytes)}
                          </Typography>
                        </View>
                        <View style={styles.folderPlayIcon}>
                          <Ionicons name="play-circle" size={28} color={Palette.primary} />
                        </View>
                      </AnimatedPressable>
                    ))}
                  </View>
                </View>
              )}
          </Animated.View>
        ) : (
          /* Polished No Results State */
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="search" size={36} color={Palette.textMuted} />
            </View>
            <Typography variant="titleSmall" color={Palette.textPrimary} style={{ marginTop: Spacing.md }}>
              No offline music found
            </Typography>
            <Typography variant="subhead" color={Palette.textTertiary} align="center" style={styles.emptySubtitle}>
              No songs, artists, albums, or folders match "{query}". Try checking your spelling or searching for another tag.
            </Typography>
          </View>
        )
      ) : (
        /* Pre-search: Recent Searches & Popular Suggestions */
        <View style={styles.preSearchContainer}>
          {recentSearches.length > 0 && (
            <View style={styles.recentSearchesSection}>
              <View style={styles.recentSearchesHeader}>
                <Typography variant="meta" color={Palette.textTertiary}>
                  RECENT SEARCHES
                </Typography>
                <AnimatedPressable onPress={clearRecentSearches} style={styles.clearAllBtn}>
                  <Typography variant="caption" color={Palette.primaryLight} weight="600">
                    Clear All
                  </Typography>
                </AnimatedPressable>
              </View>

              <View style={styles.recentTagsWrapper}>
                {recentSearches.map((term, i) => (
                  <AnimatedPressable
                    key={`search-${i}-${term}`}
                    onPress={() => handleSelectRecent(term)}
                    style={styles.recentTag}
                  >
                    <Ionicons name="time-outline" size={14} color={Palette.textTertiary} style={{ marginRight: 6 }} />
                    <Typography variant="bodyMedium" color={Palette.textPrimary}>
                      {term}
                    </Typography>
                  </AnimatedPressable>
                ))}
              </View>
            </View>
          )}

          <SectionHeader title="Popular Offline Tracks" subtitle="Frequently played on device" />

          {tracks.slice(0, 5).map((track) => (
            <SongListItem
              key={track.id}
              track={track}
              isActiveTrack={currentTrack?.id === track.id}
              isPlaying={isPlaying && currentTrack?.id === track.id}
              onPress={() => playTrack(track, tracks)}
              onFavoriteToggle={() => toggleFavorite(track.id)}
              onOptionsPress={() => setSelectedTrackForOptions(track)}
            />
          ))}
        </View>
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
                Sort Search Results
              </Typography>
              <Typography variant="caption" color={Palette.textSecondary}>
                Choose your preferred offline library ordering
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  backButton: {
    marginRight: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortTriggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surfaceElevated,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.primary,
  },
  searchBar: {
    marginBottom: Spacing.sm,
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  filterPill: {
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
  filterPillActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primaryLight,
  },
  filterPillHiResActive: {
    backgroundColor: Palette.secondary,
    borderColor: Palette.secondaryLight,
  },
  resultsContainer: {
    paddingBottom: Spacing.xl,
  },
  resultsSummaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  inlineSortChangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  section: {
    marginBottom: Spacing.md,
  },
  horizontalScroll: {
    paddingLeft: Spacing.xl,
    paddingRight: Spacing.md,
  },
  foldersContainer: {
    paddingHorizontal: Spacing.xl,
  },
  folderResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  folderIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.xxxl,
    paddingHorizontal: Spacing.xxl,
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
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  preSearchContainer: {
    marginTop: Spacing.sm,
  },
  recentSearchesSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  recentSearchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  clearAllBtn: {
    paddingVertical: 2,
  },
  recentTagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  recentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surfaceElevated,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
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
