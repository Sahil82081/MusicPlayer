import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AudioTrack } from '@/services/audio/types';
import { usePlayer } from '@/context/PlayerContext';
import { useLibrary } from '@/context/LibraryContext';
import { Palette, Radius, Spacing } from '@/constants/theme';
import Typography from '../common/Typography';
import AnimatedPressable from '../common/AnimatedPressable';
import ArtworkView from './ArtworkView';
import Badge from '../common/Badge';

interface SongOptionsModalProps {
  visible: boolean;
  track: AudioTrack | null;
  onClose: () => void;
}

export const SongOptionsModal: React.FC<SongOptionsModalProps> = ({
  visible,
  track,
  onClose,
}) => {
  const router = useRouter();
  const { playNext, toggleFavorite } = usePlayer();
  const { playlists, addTrackToPlaylist, toggleFavorite: libToggleFavorite } = useLibrary();
  const [showPlaylistsSubmenu, setShowPlaylistsSubmenu] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!track) return null;

  const handlePlayNext = () => {
    playNext(track);
    setSuccessMessage('Playing next in queue');
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 900);
  };

  const handleToggleFavorite = () => {
    toggleFavorite(track.id);
    libToggleFavorite(track.id);
    onClose();
  };

  const handleGoToAlbum = () => {
    onClose();
    if (track.albumId) {
      router.push(`/album/${track.albumId}`);
    }
  };

  const handleGoToArtist = () => {
    onClose();
    if (track.artistId) {
      router.push(`/artist/${track.artistId}`);
    }
  };

  const handleAddToPlaylist = (playlistId: string) => {
    const pl = playlists.find(p => p.id === playlistId);
    addTrackToPlaylist(playlistId, track.id);
    setSuccessMessage(`Added to ${pl?.name || 'playlist'}`);
    setTimeout(() => {
      setSuccessMessage(null);
      setShowPlaylistsSubmenu(false);
      onClose();
    }, 1000);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <AnimatedPressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          enableHaptics={false}
        >
          <View style={styles.dimLayer} />
        </AnimatedPressable>

        <View style={styles.sheetContainer}>
          {/* Header Info */}
          <View style={styles.trackHeader}>
            <ArtworkView
              primaryColor={track.accentColor}
              secondaryColor={track.secondaryAccentColor}
              size={52}
              borderRadius={Radius.md}
            />
            <View style={styles.trackDetails}>
              <Typography variant="bodyMedium" color={Palette.textPrimary} numberOfLines={1}>
                {track.title}
              </Typography>
              <Typography variant="caption" color={Palette.textSecondary} numberOfLines={1}>
                {track.artist} • {track.album}
              </Typography>
              <Badge
                label={`${track.formatInfo.format} • ${track.formatInfo.sampleRate || '44.1 kHz'}`}
                variant={track.formatInfo.isHiRes ? 'primary' : 'outline'}
                style={{ marginTop: 4 }}
              />
            </View>
          </View>

          {successMessage ? (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={24} color={Palette.success} />
              <Typography variant="bodyMedium" color={Palette.success} style={{ marginLeft: Spacing.sm }}>
                {successMessage}
              </Typography>
            </View>
          ) : showPlaylistsSubmenu ? (
            /* Add to Playlist Submenu */
            <View style={styles.submenuContainer}>
              <View style={styles.submenuHeader}>
                <AnimatedPressable onPress={() => setShowPlaylistsSubmenu(false)} style={styles.backButton}>
                  <Ionicons name="chevron-back" size={20} color={Palette.textPrimary} />
                  <Typography variant="caption" color={Palette.textSecondary} style={{ marginLeft: 4 }}>
                    Back
                  </Typography>
                </AnimatedPressable>
                <Typography variant="titleSmall" color={Palette.textPrimary}>
                  Select Offline Playlist
                </Typography>
                <View style={{ width: 40 }} />
              </View>

              <ScrollView style={styles.playlistList} showsVerticalScrollIndicator={false}>
                {playlists.map((pl) => (
                  <AnimatedPressable
                    key={pl.id}
                    onPress={() => handleAddToPlaylist(pl.id)}
                    style={styles.playlistRow}
                  >
                    <Ionicons name="musical-notes" size={18} color={Palette.primaryLight} />
                    <View style={styles.playlistInfo}>
                      <Typography variant="bodyMedium" color={Palette.textPrimary}>
                        {pl.name}
                      </Typography>
                      <Typography variant="caption" color={Palette.textSecondary}>
                        {pl.trackCount} tracks
                      </Typography>
                    </View>
                    <Ionicons name="add-circle-outline" size={20} color={Palette.textTertiary} />
                  </AnimatedPressable>
                ))}
              </ScrollView>
            </View>
          ) : (
            /* Main Actions List */
            <View style={styles.actionList}>
              <AnimatedPressable onPress={handlePlayNext} style={styles.actionItem}>
                <View style={styles.actionIconBox}>
                  <Ionicons name="play-forward-outline" size={20} color={Palette.primaryLight} />
                </View>
                <Typography variant="bodyMedium" color={Palette.textPrimary}>
                  Play Next in Queue
                </Typography>
              </AnimatedPressable>

              <AnimatedPressable onPress={() => setShowPlaylistsSubmenu(true)} style={styles.actionItem}>
                <View style={styles.actionIconBox}>
                  <Ionicons name="add-outline" size={22} color={Palette.textPrimary} />
                </View>
                <Typography variant="bodyMedium" color={Palette.textPrimary}>
                  Add to Offline Playlist
                </Typography>
              </AnimatedPressable>

              <AnimatedPressable onPress={handleToggleFavorite} style={styles.actionItem}>
                <View style={styles.actionIconBox}>
                  <Ionicons
                    name={track.isFavorite ? 'heart-dislike-outline' : 'heart-outline'}
                    size={20}
                    color={track.isFavorite ? Palette.secondary : Palette.textPrimary}
                  />
                </View>
                <Typography variant="bodyMedium" color={Palette.textPrimary}>
                  {track.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                </Typography>
              </AnimatedPressable>

              <AnimatedPressable onPress={handleGoToAlbum} style={styles.actionItem}>
                <View style={styles.actionIconBox}>
                  <Ionicons name="disc-outline" size={20} color={Palette.textPrimary} />
                </View>
                <Typography variant="bodyMedium" color={Palette.textPrimary}>
                  Go to Album
                </Typography>
              </AnimatedPressable>

              <AnimatedPressable onPress={handleGoToArtist} style={styles.actionItem}>
                <View style={styles.actionIconBox}>
                  <Ionicons name="person-outline" size={20} color={Palette.textPrimary} />
                </View>
                <Typography variant="bodyMedium" color={Palette.textPrimary}>
                  Go to Artist
                </Typography>
              </AnimatedPressable>
            </View>
          )}

          {/* Close button */}
          <AnimatedPressable onPress={onClose} style={styles.closeBtn}>
            <Typography variant="bodyMedium" color={Palette.textSecondary}>
              Cancel
            </Typography>
          </AnimatedPressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dimLayer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  sheetContainer: {
    backgroundColor: Palette.surfaceElevated,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  trackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderSubtle,
    marginBottom: Spacing.sm,
  },
  trackDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  actionList: {
    marginVertical: Spacing.xs,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  submenuContainer: {
    paddingVertical: Spacing.sm,
  },
  submenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playlistList: {
    maxHeight: 220,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderSubtle,
  },
  playlistInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  closeBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.pill,
  },
});

export default SongOptionsModal;
