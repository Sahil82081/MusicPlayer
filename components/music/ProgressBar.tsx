import React, { useRef, useState } from 'react';
import {
  PanResponder,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gradients, Palette, Radius } from '@/constants/theme';
import Typography from '../common/Typography';

interface ProgressBarProps {
  positionMs: number;
  durationMs: number;
  onSeek?: (positionMs: number) => void;
  showTimeLabels?: boolean;
  style?: StyleProp<ViewStyle>;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  positionMs,
  durationMs,
  onSeek,
  showTimeLabels = true,
  style,
  height = 4,
}) => {
  const barWidthRef = useRef<number>(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubPositionMs, setScrubPositionMs] = useState(0);

  const formatTime = (ms: number): string => {
    if (isNaN(ms) || ms < 0) return '0:00';
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const currentDisplayMs = isScrubbing ? scrubPositionMs : positionMs;
  const progressPercent = durationMs > 0 ? Math.min(1, Math.max(0, currentDisplayMs / durationMs)) : 0;

  const calculateTargetFromTouch = (locationX: number): number => {
    if (barWidthRef.current <= 0) return 0;
    const ratio = Math.max(0, Math.min(1, locationX / barWidthRef.current));
    return ratio * durationMs;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !!onSeek,
      onMoveShouldSetPanResponder: () => !!onSeek,
      onPanResponderGrant: (evt) => {
        if (!onSeek) return;
        setIsScrubbing(true);
        const target = calculateTargetFromTouch(evt.nativeEvent.locationX);
        setScrubPositionMs(target);
      },
      onPanResponderMove: (evt) => {
        if (!onSeek) return;
        const target = calculateTargetFromTouch(evt.nativeEvent.locationX);
        setScrubPositionMs(target);
      },
      onPanResponderRelease: (evt) => {
        if (!onSeek) return;
        const target = calculateTargetFromTouch(evt.nativeEvent.locationX);
        setIsScrubbing(false);
        onSeek(target);
      },
      onPanResponderTerminate: () => {
        setIsScrubbing(false);
      },
    })
  ).current;

  return (
    <View style={[styles.wrapper, style]}>
      {/* Hitbox container for comfortable touch interaction */}
      <View
        style={[styles.touchTarget, { height: height + 24 }]}
        onLayout={(e) => {
          barWidthRef.current = e.nativeEvent.layout.width;
        }}
        {...panResponder.panHandlers}
      >
        <View style={[styles.trackBg, { height }]}>
          <LinearGradient
            colors={Gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.fill,
              {
                width: `${progressPercent * 100}%`,
                height,
              },
            ]}
          />
        </View>

        {/* Scrubber thumb circle */}
        {showTimeLabels && (
          <View
            style={[
              styles.thumb,
              {
                left: `${progressPercent * 100}%`,
                top: (height + 24 - 14) / 2,
                transform: [{ scale: isScrubbing ? 1.3 : 1 }],
              },
            ]}
          />
        )}
      </View>

      {showTimeLabels && (
        <View style={styles.timeRow}>
          <Typography variant="caption" color={isScrubbing ? Palette.primaryLight : Palette.textSecondary}>
            {formatTime(currentDisplayMs)}
          </Typography>
          <Typography variant="caption" color={Palette.textTertiary}>
            {formatTime(durationMs)}
          </Typography>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  touchTarget: {
    width: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  trackBg: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: Radius.pill,
  },
  thumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: Palette.primary,
    marginLeft: -7,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
});

export default ProgressBar;

