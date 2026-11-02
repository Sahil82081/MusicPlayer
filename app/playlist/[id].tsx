import React, { useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  View,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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
import ArtworkView from '@/components/music/ArtworkView';
import SongOptionsModal from '@/components/music/SongOptionsModal';
import { AudioTrack } from '@/services/audio/types';

export default function PlaylistDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { currentTrack, isPlaying, playTrack, toggleFavorite } = usePlayer();
  const {
    playlists,
    tracks: allLibraryTracks,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
  } = useLibrary();

  const [selectedTrackForOptions, setSelectedTrackForOptions] = useState<AudioTrack | null>(null);
  const [isAddSongsModalVisible, setIsAddSongsModalVisible] = useState(false);

  const playlist = playlists.find((p) => p.id === id);
  const tracks = playlist ? MusicLibraryService.getTracksForPlaylist(playlist.id) : [];

  if (!playlist) {
    return (
      <ScreenContainer>
        <View style={styles.errorContainer}>
          <Typography variant="bodyMedium" color={Palette.textSecondary}>
            Playlist not found in local offline storage.
          </Typography>
          <Button title="Back" onPress={() => router.back()} style={{ marginTop: Spacing.md }} />
        </View>
      </ScreenContainer>
    );
  }

  const primaryAccent = playlist.accentColor || Palette.primary;

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  const handleShuffle = () => {
    if (tracks.length > 0) {
      const rand = Math.floor(Math.random() * tracks.length);
      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
      playTrack(tracks[rand], shuffled);
    }
  };

  const handleDeletePlaylist = () => {
    Alert.alert(
      'Delete Playlist',
      `Delete "${playlist.name}"? Audio files will remain safely on your device.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePlaylist(playlist.id);
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } catch (_) {}
            router.back();
          },
        },
      ]
    );
  };

  const handleRemoveTrack = (trackId: string, trackTitle: string) => {
    Alert.alert(
      'Remove Song',
      `Remove "${trackTitle}" from this playlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeTrackFromPlaylist(playlist.id, trackId);
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } catch (_) {}
          },
        },
      ]
    );
  };

  // Tracks available to add (not already in playlist)
  const candidateTracks = allLibraryTracks.filter(
    (t) => !playlist.trackIds.includes(t.id)
  );

  return (
    <ScreenContainer scrollable>
      {/* Top Floating Nav */}
      <View style={[styles.topNav, { paddingTop: insets.top + Spacing.xs }]}>
        <AnimatedPressable onPress={() => router.back()} style={styles.navIconButton}>
          <Ionicons name="chevron-back" size={24} color={Palette.textPrimary} />
        </AnimatedPressable>

        <Typography variant="meta" color={Palette.textTertiary}>
          OFFLINE PLAYLIST
        </Typography>

        <AnimatedPressable onPress={handleDeletePlaylist} style={styles.navIconButton}>
          <Ionicons name="trash-outline" size={20} color={Palette.error} />
        </AnimatedPressable>
      </View>

      {/* Hero Header Section */}
      <View style={styles.heroSection}>
        <ArtworkView
          artworkUri={tracks[0]?.artworkUrl}
          primaryColor={primaryAccent}
          secondaryColor="#090A0F"
          size={180}
          borderRadius={Radius.xl}
          showVinylGroove
          iconName="list"
          style={styles.artBox}
        />

        <Typography variant="titleLarge" color={Palette.textPrimary} align="center" style={styles.title}>
          {playlist.name}
        </Typography>

        <Typography variant="body" color={Palette.textSecondary} align="center" style={styles.description}>
          {playlist.description || 'Custom offline playlist'}
        </Typography>

        <View style={styles.metaRow}>
          <Badge label={`${tracks.length} OFFLINE TRACKS`} variant="primary" />
        </View>

        {/* Action Buttons: Play, Shuffle, Add Songs */}
        <View style={styles.actionRow}>
          <Button
            variant="primary"
            size="md"
            title="Play"
            iconName="play"
            onPress={handlePlayAll}
            disabled={tracks.length === 0}
            style={styles.actionBtn}
          />

          <Button
            variant="secondary"
            size="md"
            title="Shuffle"
            iconName="shuffle"
            onPress={handleShuffle}
            disabled={tracks.length === 0}
            style={styles.actionBtn}
          />

          <AnimatedPressable
            onPress={() => setIsAddSongsModalVisible(true)}
            style={styles.addSongsIconBtn}
          >
            <Ionicons name="add" size={24} color={Palette.primaryLight} />
          </AnimatedPressable>
        </View>
      </View>

      {/* Song List */}
      <View style={styles.trackListContainer}>
        {tracks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="musical-notes-outline" size={48} color={Palette.textMuted} />
            <Typography variant="bodyMedium" color={Palette.textSecondary} style={{ marginTop: Spacing.sm }}>
              Playlist is empty
            </Typography>
            <Typography variant="caption" color={Palette.textTertiary} align="center" style={{ marginBottom: Spacing.md }}>
              Add songs from your offline music library to this playlist.
            </Typography>
            <Button
              variant="secondary"
              size="sm"
              title="Add Songs"
              iconName="add"
              onPress={() => setIsAddSongsModalVisible(true)}
            />
          </View>
        ) : (
          tracks.map((track, idx) => (
            <View key={`pl-track-${track.id}`} style={styles.trackRowWrapper}>
              <View style={styles.trackItemFlex}>
                <SongListItem
                  track={track}
                  index={idx + 1}
                  isActiveTrack={currentTrack?.id === track.id}
                  isPlaying={isPlaying && currentTrack?.id === track.id}
                  onPress={() => playTrack(track, tracks)}
                  onFavoriteToggle={() => toggleFavorite(track.id)}
                  onOptionsPress={() => setSelectedTrackForOptions(track)}
                />
              </View>

              {/* Remove from this playlist button */}
              <AnimatedPressable
                onPress={() => handleRemoveTrack(track.id, track.title)}
                style={styles.removeTrackBtn}
              >
                <Ionicons name="close-circle-outline" size={20} color={Palette.textTertiary} />
              </AnimatedPressable>
            </View>
          ))
        )}
      </View>

      {/* ADD SONGS MODAL */}
      <Modal
        visible={isAddSongsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddSongsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Typography variant="titleSmall" color={Palette.textPrimary}>
                  Add Songs to Playlist
                </Typography>
                <Typography variant="caption" color={Palette.textSecondary}>
                  {candidateTracks.length} available offline songs
                </Typography>
              </View>

              <AnimatedPressable
                onPress={() => setIsAddSongsModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color={Palette.textPrimary} />
              </AnimatedPressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalList}>
              {candidateTracks.length === 0 ? (
                <View style={styles.allAddedContainer}>
                  <Ionicons name="checkmark-circle-outline" size={44} color={Palette.success} />
                  <Typography variant="bodyMedium" color={Palette.textPrimary} style={{ marginTop: Spacing.sm }}>
                    All offline songs added!
                  </Typography>
                  <Typography variant="caption" color={Palette.textSecondary}>
                    Every track in your library is already in this playlist.
                  </Typography>
                </View>
              ) : (
                candidateTracks.map((track) => (
                  <View key={`add-${track.id}`} style={styles.addTrackRow}>
                    <ArtworkView
                      artworkUri={track.artworkUrl}
                      primaryColor={track.accentColor}
                      secondaryColor={track.secondaryAccentColor}
                      size={44}
                      borderRadius={Radius.sm}
                      iconName="musical-note"
                    />

                    <View style={styles.addTrackInfo}>
                      <Typography variant="bodyMedium" color={Palette.textPrimary} numberOfLines={1}>
                        {track.title}
                      </Typography>
                      <Typography variant="caption" color={Palette.textSecondary} numberOfLines={1}>
                        {track.artist} • {track.formatInfo.format}
                      </Typography>
                    </View>

                    <Button
                      variant="primary"
                      size="sm"
                      title="Add"
                      iconName="add"
                      onPress={() => {
                        addTrackToPlaylist(playlist.id, track.id);
                        try {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (_) {}
                      }}
                    />
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Options Modal for tracks */}
      <SongOptionsModal
        visible={!!selectedTrackForOptions}
        track={selectedTrackForOptions}
        onClose={() => setSelectedTrackForOptions(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
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
  description: {
    marginBottom: Spacing.sm,
  },
  metaRow: {
    marginBottom: Spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    marginHorizontal: Spacing.xs,
    maxWidth: 130,
  },
  addSongsIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
    marginLeft: Spacing.xs,
  },
  trackListContainer: {
    paddingBottom: Spacing.xxl,
  },
  trackRowWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackItemFlex: {
    flex: 1,
  },
  removeTrackBtn: {
    paddingRight: Spacing.lg,
    paddingLeft: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Palette.surfaceElevated,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    height: '75%',
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderSubtle,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalList: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  allAddedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  addTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderSubtle,
  },
  addTrackInfo: {
    flex: 1,
    marginHorizontal: Spacing.md,
  },
});

