import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Radius } from '@/constants/theme';

export type ArtworkSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';

interface ArtworkViewProps {
  artworkUri?: string;
  primaryColor?: string;
  secondaryColor?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  size?: ArtworkSize | number;
  borderRadius?: number;
  showVinylGroove?: boolean;
  isPlaying?: boolean;
  style?: StyleProp<ViewStyle>;
}

const getDimension = (s: ArtworkSize | number): number => {
  if (typeof s === 'number') return s;
  switch (s) {
    case 'xs': return 36;
    case 'sm': return 46;
    case 'md': return 56;
    case 'lg': return 144;
    case 'xl': return 180;
    case 'hero': return 280;
    default: return 56;
  }
};

export const ArtworkView: React.FC<ArtworkViewProps> = React.memo(({
  artworkUri,
  primaryColor = Palette.primary,
  secondaryColor = Palette.secondary,
  iconName = 'disc',
  size = 'md',
  borderRadius,
  showVinylGroove = false,
  isPlaying,
  style,
}) => {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);

  const dim = getDimension(size);
  const isLarge = dim >= 140;
  const radius = borderRadius !== undefined ? borderRadius : isLarge ? Radius.xl : Radius.md;
  const iconSize = dim * 0.42;

  // Only subscribe to AccessibilityInfo for hero/large rotating artworks to avoid hundreds of listeners in lists
  useEffect(() => {
    if (!isLarge || isPlaying === undefined) return;

    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      subscription?.remove?.();
    };
  }, [isLarge, isPlaying]);

  // Animation drivers (only allocated when active/large to conserve memory)
  const baseScaleAnim = useRef(new Animated.Value(isPlaying ? 1 : 0.94)).current;
  const breathAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  const breathLoop = useRef<Animated.CompositeAnimation | null>(null);
  const spinLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isPlaying === undefined || reduceMotion || !isLarge) {
      breathLoop.current?.stop();
      spinLoop.current?.stop();
      return;
    }

    if (isPlaying) {
      // 1. Spring up to active scale
      Animated.spring(baseScaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();

      // 2. Gentle breathing scale loop
      breathLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(breathAnim, {
            toValue: 1.02,
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(breathAnim, {
            toValue: 0.99,
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      breathLoop.current.start();

      // 3. Gentle vinyl groove rotation (26 seconds per revolution)
      spinLoop.current = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 26000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinLoop.current.start();
    } else {
      // Resting paused state
      Animated.spring(baseScaleAnim, {
        toValue: 0.94,
        friction: 7,
        tension: 45,
        useNativeDriver: true,
      }).start();

      breathLoop.current?.stop();
      Animated.spring(breathAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }).start();

      spinLoop.current?.stop();
    }

    return () => {
      breathLoop.current?.stop();
      spinLoop.current?.stop();
    };
  }, [isPlaying, isLarge, reduceMotion, baseScaleAnim, breathAnim, spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const combinedScale = isLarge && isPlaying !== undefined ? Animated.multiply(baseScaleAnim, breathAnim) : undefined;

  const validArtworkUri = !hasImageError && artworkUri && artworkUri.trim().length > 0 ? artworkUri : null;

  return (
    <Animated.View
      style={[
        styles.outerContainer,
        {
          width: dim,
          height: dim,
          borderRadius: radius,
          transform: combinedScale && !reduceMotion ? [{ scale: combinedScale }] : undefined,
        },
        style,
      ]}
    >
      {validArtworkUri ? (
        <View style={[styles.imageContainer, { borderRadius: radius }]}>
          <Image
            source={{ uri: validArtworkUri }}
            style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
            contentFit="cover"
            transition={150}
            cachePolicy="disk"
            recyclingKey={validArtworkUri}
            onError={() => setHasImageError(true)}
          />
          {/* Subtle sheen highlight over real image */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.15)', 'transparent']}
            start={{ x: 0.1, y: 0.1 }}
            end={{ x: 0.7, y: 0.7 }}
            style={[styles.sheen, { borderRadius: radius }]}
          />
        </View>
      ) : (
        <LinearGradient
          colors={[primaryColor, secondaryColor, '#0A0B10']}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.9, y: 0.9 }}
          style={[styles.gradient, { borderRadius: radius }]}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.groovesAndCenter,
              showVinylGroove && isPlaying && !reduceMotion && isLarge ? { transform: [{ rotate: spin }] } : undefined,
            ]}
          >
            {/* Subtle Vinyl Grooves for larger sizes */}
            {showVinylGroove && isLarge && (
              <>
                <View
                  style={[
                    styles.grooveCircle,
                    {
                      width: dim * 0.82,
                      height: dim * 0.82,
                      borderRadius: (dim * 0.82) / 2,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.grooveCircle,
                    {
                      width: dim * 0.62,
                      height: dim * 0.62,
                      borderRadius: (dim * 0.62) / 2,
                    },
                  ]}
                />
              </>
            )}

            {/* Center Vinyl Center Hole / Icon */}
            <View
              style={[
                styles.centerHole,
                {
                  width: iconSize * 1.5,
                  height: iconSize * 1.5,
                  borderRadius: (iconSize * 1.5) / 2,
                },
              ]}
            >
              <Ionicons
                name={iconName}
                size={iconSize}
                color="rgba(255, 255, 255, 0.92)"
              />
            </View>
          </Animated.View>

          {/* Ambient Top Light Sheen */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.18)', 'transparent']}
            start={{ x: 0.1, y: 0.1 }}
            end={{ x: 0.7, y: 0.7 }}
            style={[styles.sheen, { borderRadius: radius }]}
          />
        </LinearGradient>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  outerContainer: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#12131C',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  gradient: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  groovesAndCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  grooveCircle: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  centerHole: {
    backgroundColor: 'rgba(10, 11, 16, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
  },
});

export default ArtworkView;
