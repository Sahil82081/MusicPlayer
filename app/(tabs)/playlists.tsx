import React, { useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLibrary } from '@/context/LibraryContext';
import { usePlayer } from '@/context/PlayerContext';
import { Palette, Radius, Spacing } from '@/constants/theme';
import ScreenContainer from '@/components/common/ScreenContainer';
import Typography from '@/components/common/Typography';
import AnimatedPressable from '@/components/common/AnimatedPressable';
import Button from '@/components/common/Button';
import PlaylistCard from '@/components/music/PlaylistCard';
import SectionHeader from '@/components/common/SectionHeader';
import { MusicLibraryService } from '@/services/library/MusicLibraryService';
import { Playlist } from '@/services/library/types';

export default function PlaylistsScreen() {
  const router = useRouter();
  const { playlists, createPlaylist, renamePlaylist, deletePlaylist } = useLibrary();
  const { playTrack } = usePlayer();

  // Create Playlist Modal state
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  // Rename Playlist Modal state
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [selectedPlaylistForRename, setSelectedPlaylistForRename] = useState<Playlist | null>(null);
  const [renameText, setRenameText] = useState('');

  // Playlist Options Action Sheet state
  const [selectedPlaylistForOptions, setSelectedPlaylistForOptions] = useState<Playlist | null>(null);

  const handlePlaylistPress = (playlistId: string) => {
    router.push(`/playlist/${playlistId}`);
  };

  const handleConfirmCreate = () => {
    if (!newPlaylistName.trim()) {
      Alert.alert('Validation', 'Please provide a playlist name.');
      return;
    }
    createPlaylist(newPlaylistName.trim(), newPlaylistDesc.trim() || 'Custom offline playlist');
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_) {}
    setNewPlaylistName('');
    setNewPlaylistDesc('');
    setIsCreateModalVisible(false);
  };

  const handleOpenRename = (pl: Playlist) => {
    setSelectedPlaylistForOptions(null);
    setSelectedPlaylistForRename(pl);
    setRenameText(pl.name);
    setIsRenameModalVisible(true);
  };

  const handleConfirmRename = () => {
    if (!selectedPlaylistForRename || !renameText.trim()) return;
    renamePlaylist(selectedPlaylistForRename.id, renameText.trim());
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_) {}
    setIsRenameModalVisible(false);
    setSelectedPlaylistForRename(null);
  };

  const handleDelete = (pl: Playlist) => {
    setSelectedPlaylistForOptions(null);
    Alert.alert(
      'Delete Playlist',
      `Are you sure you want to delete "${pl.name}"? (Audio files will remain safely on device)`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePlaylist(pl.id);
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } catch (_) {}
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer scrollable>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Typography variant="titleLarge" color={Palette.textPrimary}>
            Playlists
          </Typography>
          <Typography variant="subhead" color={Palette.textSecondary}>
            {playlists.length} curated offline vaults
          </Typography>
        </View>

        <Button
          variant="primary"
          size="sm"
          title="New Playlist"
          iconName="add"
          onPress={() => setIsCreateModalVisible(true)}
        />
      </View>

      <SectionHeader
        title="Custom Offline Mixes"
        subtitle="Manage and organize your device music"
      />

      <View style={styles.listContainer}>
        {playlists.map((playlist) => (
          <PlaylistCard
            key={playlist.id}
            playlist={playlist}
            variant="horizontal"
            onPress={() => handlePlaylistPress(playlist.id)}
            onOptionsPress={() => setSelectedPlaylistForOptions(playlist)}
          />
        ))}
      </View>

      {/* CREATE PLAYLIST MODAL */}
      <Modal
        visible={isCreateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCreateModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}>
              <Ionicons name="musical-notes" size={28} color={Palette.primaryLight} />
            </View>

            <Typography variant="titleSmall" color={Palette.textPrimary} style={{ marginBottom: 4 }}>
              Create Offline Playlist
            </Typography>
            <Typography variant="caption" color={Palette.textSecondary} style={{ marginBottom: Spacing.base }}>
              Playlist metadata is saved locally to your device storage.
            </Typography>

            <TextInput
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              placeholder="Playlist name (e.g., Midnight Vibes)"
              placeholderTextColor={Palette.textMuted}
              style={styles.textInput}
              autoFocus
            />

            <TextInput
              value={newPlaylistDesc}
              onChangeText={setNewPlaylistDesc}
              placeholder="Description (optional)"
              placeholderTextColor={Palette.textMuted}
              style={[styles.textInput, { marginTop: Spacing.sm }]}
            />

            <View style={styles.modalButtonsRow}>
              <AnimatedPressable
                onPress={() => setIsCreateModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Typography variant="bodyMedium" color={Palette.textSecondary}>
                  Cancel
                </Typography>
              </AnimatedPressable>

              <Button
                variant="primary"
                size="md"
                title="Create"
                onPress={handleConfirmCreate}
                style={{ flex: 1, marginLeft: Spacing.sm }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* RENAME PLAYLIST MODAL */}
      <Modal
        visible={isRenameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRenameModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Typography variant="titleSmall" color={Palette.textPrimary} style={{ marginBottom: Spacing.sm }}>
              Rename Playlist
            </Typography>

            <TextInput
              value={renameText}
              onChangeText={setRenameText}
              placeholder="New playlist name"
              placeholderTextColor={Palette.textMuted}
              style={styles.textInput}
              autoFocus
            />

            <View style={styles.modalButtonsRow}>
              <AnimatedPressable
                onPress={() => setIsRenameModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Typography variant="bodyMedium" color={Palette.textSecondary}>
                  Cancel
                </Typography>
              </AnimatedPressable>

              <Button
                variant="primary"
                size="md"
                title="Save Name"
                onPress={handleConfirmRename}
                style={{ flex: 1, marginLeft: Spacing.sm }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* PLAYLIST OPTIONS ACTION SHEET */}
      <Modal
        visible={!!selectedPlaylistForOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPlaylistForOptions(null)}
      >
        <View style={styles.actionSheetBackdrop}>
          <AnimatedPressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedPlaylistForOptions(null)}
            enableHaptics={false}
          >
            <View style={styles.sheetDim} />
          </AnimatedPressable>

          <View style={styles.actionSheet}>
            <View style={styles.sheetHeader}>
              <Typography variant="titleSmall" color={Palette.textPrimary}>
                {selectedPlaylistForOptions?.name}
              </Typography>
              <Typography variant="caption" color={Palette.textSecondary}>
                {selectedPlaylistForOptions?.trackCount} offline tracks
              </Typography>
            </View>

            <AnimatedPressable
              onPress={() => {
                if (selectedPlaylistForOptions) {
                  router.push(`/playlist/${selectedPlaylistForOptions.id}`);
                  setSelectedPlaylistForOptions(null);
                }
              }}
              style={styles.sheetAction}
            >
              <Ionicons name="folder-open-outline" size={20} color={Palette.textPrimary} style={{ marginRight: Spacing.md }} />
              <Typography variant="bodyMedium" color={Palette.textPrimary}>
                View Songs & Edit
              </Typography>
            </AnimatedPressable>

            <AnimatedPressable
              onPress={() => {
                if (selectedPlaylistForOptions) {
                  const tracks = MusicLibraryService.getTracksForPlaylist(selectedPlaylistForOptions.id);
                  if (tracks.length > 0) {
                    playTrack(tracks[0], tracks);
                  } else {
                    Alert.alert('Empty Playlist', 'This playlist does not have any offline tracks yet.');
                  }
                  setSelectedPlaylistForOptions(null);
                }
              }}
              style={styles.sheetAction}
            >
              <Ionicons name="play" size={20} color={Palette.primaryLight} style={{ marginRight: Spacing.md }} />
              <Typography variant="bodyMedium" color={Palette.textPrimary}>
                Play Playlist
              </Typography>
            </AnimatedPressable>

            <AnimatedPressable
              onPress={() => {
                if (selectedPlaylistForOptions) {
                  handleOpenRename(selectedPlaylistForOptions);
                }
              }}
              style={styles.sheetAction}
            >
              <Ionicons name="pencil-outline" size={20} color={Palette.textPrimary} style={{ marginRight: Spacing.md }} />
              <Typography variant="bodyMedium" color={Palette.textPrimary}>
                Rename Playlist
              </Typography>
            </AnimatedPressable>

            <AnimatedPressable
              onPress={() => {
                if (selectedPlaylistForOptions) {
                  handleDelete(selectedPlaylistForOptions);
                }
              }}
              style={styles.sheetAction}
            >
              <Ionicons name="trash-outline" size={20} color={Palette.error} style={{ marginRight: Spacing.md }} />
              <Typography variant="bodyMedium" color={Palette.error}>
                Delete Playlist
              </Typography>
            </AnimatedPressable>

            <AnimatedPressable
              onPress={() => setSelectedPlaylistForOptions(null)}
              style={styles.sheetCloseBtn}
            >
              <Typography variant="bodyMedium" color={Palette.textSecondary}>
                Cancel
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
    paddingBottom: Spacing.sm,
  },
  listContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    width: '100%',
    backgroundColor: Palette.surfaceElevated,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  textInput: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.borderLight,
    paddingHorizontal: Spacing.md,
    height: 48,
    color: Palette.textPrimary,
    fontSize: 15,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  modalCancelBtn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  actionSheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetDim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  actionSheet: {
    backgroundColor: Palette.surfaceElevated,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sheetHeader: {
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderSubtle,
    marginBottom: Spacing.sm,
  },
  sheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  sheetCloseBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.pill,
  },
});
