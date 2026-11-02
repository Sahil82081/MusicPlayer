import React, { useCallback, useMemo } from 'react';
import { FlatList, Platform, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayer } from '@/context/PlayerContext';
import { Palette, Radius, Spacing } from '@/constants/theme';
import ScreenContainer from '@/components/common/ScreenContainer';
import Typography from '@/components/common/Typography';
import AnimatedPressable from '@/components/common/AnimatedPressable';
import Badge from '@/components/common/Badge';
import GlassCard from '@/components/common/GlassCard';
import ArtworkView from '@/components/music/ArtworkView';
import { AudioTrack } from '@/services/audio/types';

const QUEUE_ITEM_HEIGHT = 58;

export default function QueueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    currentTrack,
    queue,
    isPlaying,
    playTrack,
    togglePlayPause,
    skipToPrevious,
    skipToNext,
    removeFromQueue,
    clearQueue,
  } = usePlayer();

  const upNextTracks = useMemo(
    () => (currentTrack ? queue.filter((t) => t.id !== currentTrack.id) : queue),
    [queue, currentTrack]
  );

  const formatDuration = (ms: number): string => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: QUEUE_ITEM_HEIGHT,
      offset: QUEUE_ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  const renderQueueItem = useCallback(
    ({ item }: { item: AudioTrack }) => (
      <AnimatedPressable
        onPress={() => playTrack(item, queue)}
        style={styles.queueItemRow}
      >
        <ArtworkView
          artworkUri={item.artworkUrl}
          primaryColor={item.accentColor}
          secondaryColor={item.secondaryAccentColor}
          size={42}
          borderRadius={Radius.xs}
          iconName="musical-note"
          style={{ marginRight: Spacing.md }}
        />

        <View style={styles.trackDetails}>
          <Typography variant="bodyMedium" color={Palette.textPrimary} numberOfLines={1}>
            {item.title}
          </Typography>
          <Typography variant="caption" color={Palette.textSecondary} numberOfLines={1}>
            {item.artist} • {formatDuration(item.durationMs)}
          </Typography>
        </View>

        {/* Remove from Queue Button */}
        <AnimatedPressable
          onPress={(e: any) => {
            e?.stopPropagation?.();
            removeFromQueue(item.id);
          }}
          style={styles.removeBtn}
        >
          <Ionicons name="remove-circle-outline" size={22} color={Palette.error} />
        </AnimatedPressable>
      </AnimatedPressable>
    ),
    [playTrack, queue, removeFromQueue]
  );

  const renderHeader = useMemo(() => {
    return (
      <View>
        {/* Top Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View>
            <Typography variant="titleLarge" color={Palette.textPrimary}>
              Playback Queue
            </Typography>
            <Typography variant="subhead" color={Palette.textSecondary}>
              {queue.length} offline tracks in queue
            </Typography>
          </View>

          <View style={styles.headerRightActions}>
            {upNextTracks.length > 0 && (
              <AnimatedPressable onPress={clearQueue} style={styles.clearBtn}>
                <Typography variant="caption" color={Palette.secondaryLight}>
                  Clear
                </Typography>
              </AnimatedPressable>
            )}

            <AnimatedPressable onPress={() => router.back()} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Palette.textPrimary} />
            </AnimatedPressable>
          </View>
        </View>

        {/* Currently Playing Track */}
        {currentTrack && (
          <View style={styles.nowPlayingSection}>
            <Typography variant="meta" color={Palette.primaryLight} style={styles.sectionLabel}>
              CURRENTLY PLAYING
            </Typography>

            <GlassCard style={styles.nowPlayingCard} elevated>
              <View style={styles.nowPlayingRow}>
                <ArtworkView
                  artworkUri={currentTrack.artworkUrl}
                  primaryColor={currentTrack.accentColor}
                  secondaryColor={currentTrack.secondaryAccentColor}
                  size={48}
                  borderRadius={Radius.sm}
                  isPlaying={isPlaying}
                  iconName={isPlaying ? 'volume-high' : 'disc'}
                />

                <View style={styles.nowPlayingText}>
                  <Typography variant="bodyMedium" color={Palette.textPrimary} numberOfLines={1}>
                    {currentTrack.title}
                  </Typography>
                  <Typography variant="caption" color={Palette.textSecondary} numberOfLines={1}>
                    {currentTrack.artist} • {currentTrack.album}
                  </Typography>
                </View>

                <View style={styles.nowPlayingControls}>
                  <AnimatedPressable onPress={skipToPrevious} style={styles.queueControlBtn}>
                    <Ionicons name="play-skip-back" size={18} color={Palette.textPrimary} />
                  </AnimatedPressable>

                  <AnimatedPressable
                    onPress={togglePlayPause}
                    style={[styles.queueControlBtn, styles.playPauseBtn]}
                  >
                    <Ionicons
                      name={isPlaying ? 'pause' : 'play'}
                      size={18}
                      color="#FFFFFF"
                      style={isPlaying ? undefined : { marginLeft: 2 }}
                    />
                  </AnimatedPressable>

                  <AnimatedPressable onPress={skipToNext} style={styles.queueControlBtn}>
                    <Ionicons name="play-skip-forward" size={18} color={Palette.textPrimary} />
                  </AnimatedPressable>
                </View>
              </View>

              <View style={styles.nowPlayingMetaRow}>
                <Badge
                  label={currentTrack.formatInfo.format}
                  variant={currentTrack.formatInfo.isHiRes ? 'primary' : 'outline'}
                />
                <Typography variant="caption" color={Palette.textTertiary}>
                  {formatDuration(currentTrack.durationMs)}
                </Typography>
              </View>
            </GlassCard>
          </View>
        )}

        <View style={styles.upNextHeaderWrapper}>
          <Typography variant="meta" color={Palette.textTertiary} style={styles.sectionLabel}>
            UP NEXT ({upNextTracks.length})
          </Typography>
        </View>
      </View>
    );
  }, [
    insets.top,
    queue.length,
    upNextTracks.length,
    clearQueue,
    router,
    currentTrack,
    isPlaying,
    skipToPrevious,
    togglePlayPause,
    skipToNext,
  ]);

  return (
    <ScreenContainer scrollable={false} withTopInset={false} withMiniPlayerSpacing={false}>
      <FlatList
        data={upNextTracks}
        renderItem={renderQueueItem}
        keyExtractor={(item) => item.id}
        getItemLayout={getItemLayout}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyQueue}>
            <Ionicons name="musical-notes-outline" size={40} color={Palette.textMuted} />
            <Typography variant="bodyMedium" color={Palette.textSecondary} style={{ marginTop: Spacing.sm }}>
              Queue is empty
            </Typography>
            <Typography variant="caption" color={Palette.textTertiary}>
              Add songs from your offline library to play next.
            </Typography>
          </View>
        }
        contentContainerStyle={{ paddingBottom: Spacing.xxl }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    marginRight: Spacing.sm,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.borderSubtle,
  },
  nowPlayingSection: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.md,
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
    paddingHorizontal: 2,
  },
  nowPlayingCard: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  nowPlayingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nowPlayingText: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  nowPlayingControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  queueControlBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  playPauseBtn: {
    backgroundColor: Palette.primary,
  },
  nowPlayingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Palette.borderSubtle,
  },
  upNextHeaderWrapper: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
  },
  queueItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: QUEUE_ITEM_HEIGHT,
    paddingHorizontal: Spacing.xl,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: Palette.borderSubtle,
  },
  trackDetails: {
    flex: 1,
  },
  removeBtn: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  emptyQueue: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
});
