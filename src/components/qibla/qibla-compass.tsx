import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, ImageBackground, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line } from 'react-native-svg';

import { normalizeAngle180 } from '@/src/features/qibla/qibla';
import { palette } from '@/src/theme/palette';

const KAABA_IMAGE = require('@/assets/images/qibla/qibla.png');
const COMPASS_BG = require('@/assets/images/qibla/compass.png');

// Border gradient colors - bright lime/mint greens
const BORDER_COLORS = ['#C8DD80', '#5EC188', '#81C9AD', '#55B582', '#C8DD80'] as const;

// Light green gradient overlay
const COMPASS_OVERLAY = ['rgba(100, 160, 100, 0.4)', 'rgba(60, 120, 60, 0.5)'] as const;

export function QiblaCompass({
  qiblaBearing,
  deviceHeading,
  headingReference,
}: {
  qiblaBearing: number;
  deviceHeading: number | null;
  headingReference: 'true' | 'magnetic' | null;
}) {
  const { width: screenWidth } = useWindowDimensions();
  const compassSize = Math.min(screenWidth - 48, 280);
  const borderWidth = 8;
  const innerCompassSize = compassSize - borderWidth * 2;

  // Calculate how far the arrow is from pointing to Qibla
  const delta = deviceHeading != null ? normalizeAngle180(qiblaBearing - deviceHeading) : null;
  const aligned = delta != null && Math.abs(delta) <= 5;

  // Haptic feedback when aligned
  const alignedRef = useRef(false);
  const lastHapticAt = useRef(0);

  useEffect(() => {
    if (!aligned && alignedRef.current) alignedRef.current = false;
    if (aligned && !alignedRef.current) {
      alignedRef.current = true;
      const now = Date.now();
      if (now - lastHapticAt.current > 1500) {
        lastHapticAt.current = now;
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, [aligned]);

  // Smooth rotation animation for the arrow
  const arrowRotation = useRef(new Animated.Value(0)).current;
  const lastArrowRotation = useRef(0);

  // Smooth rotation for the compass ring (rotates opposite to device heading)
  const ringRotation = useRef(new Animated.Value(0)).current;
  const lastRingRotation = useRef(0);

  useEffect(() => {
    if (delta == null || deviceHeading == null) return;

    // Arrow points toward Qibla relative to device
    const arrowShortest = normalizeAngle180(delta - lastArrowRotation.current);
    lastArrowRotation.current = lastArrowRotation.current + arrowShortest;

    Animated.timing(arrowRotation, {
      toValue: lastArrowRotation.current,
      duration: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Ring rotates opposite to device heading so N stays at true north
    const ringTarget = -deviceHeading;
    const ringShortest = normalizeAngle180(ringTarget - lastRingRotation.current);
    lastRingRotation.current = lastRingRotation.current + ringShortest;

    Animated.timing(ringRotation, {
      toValue: lastRingRotation.current,
      duration: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [delta, deviceHeading, arrowRotation, ringRotation]);

  const arrowRotate = arrowRotation.interpolate({
    inputRange: [-720, 720],
    outputRange: ['-720deg', '720deg'],
    extrapolate: 'extend',
  });

  const ringRotate = ringRotation.interpolate({
    inputRange: [-720, 720],
    outputRange: ['-720deg', '720deg'],
    extrapolate: 'extend',
  });

  const arrowColor = aligned ? '#81C784' : palette.gold;

  return (
    <View style={styles.container}>
      {/* Gradient border ring */}
      <LinearGradient
        colors={BORDER_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradientBorder,
          {
            width: compassSize,
            height: compassSize,
            borderRadius: compassSize / 2,
          },
        ]}
      >
        {/* Inner compass with background image */}
        <ImageBackground
          source={COMPASS_BG}
          style={[
            styles.compassContainer,
            {
              width: innerCompassSize,
              height: innerCompassSize,
              borderRadius: innerCompassSize / 2,
            },
          ]}
          imageStyle={{ borderRadius: innerCompassSize / 2 }}
          resizeMode="cover"
        >
          {/* Light green gradient overlay */}
          <LinearGradient
            colors={COMPASS_OVERLAY}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.gradientOverlay, { borderRadius: innerCompassSize / 2 }]}
          />

          {/* Compass grid lines */}
          <View style={styles.compassLinesContainer}>
            <Svg width={innerCompassSize} height={innerCompassSize}>
              {/* Outer circle */}
              <Circle
                cx={innerCompassSize / 2}
                cy={innerCompassSize / 2}
                r={innerCompassSize / 2 - 12}
                stroke="rgba(255, 255, 255, 0.25)"
                strokeWidth={1}
                fill="none"
              />
              {/* Middle circle */}
              <Circle
                cx={innerCompassSize / 2}
                cy={innerCompassSize / 2}
                r={innerCompassSize / 2 - 35}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth={1}
                fill="none"
              />
              {/* Inner circle */}
              <Circle
                cx={innerCompassSize / 2}
                cy={innerCompassSize / 2}
                r={innerCompassSize / 2 - 60}
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth={1}
                fill="none"
              />
              {/* Vertical line */}
              <Line
                x1={innerCompassSize / 2}
                y1={12}
                x2={innerCompassSize / 2}
                y2={innerCompassSize - 12}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth={1}
              />
              {/* Horizontal line */}
              <Line
                x1={12}
                y1={innerCompassSize / 2}
                x2={innerCompassSize - 12}
                y2={innerCompassSize / 2}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth={1}
              />
              {/* Diagonal line 1 */}
              <Line
                x1={innerCompassSize * 0.15}
                y1={innerCompassSize * 0.15}
                x2={innerCompassSize * 0.85}
                y2={innerCompassSize * 0.85}
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth={1}
              />
              {/* Diagonal line 2 */}
              <Line
                x1={innerCompassSize * 0.85}
                y1={innerCompassSize * 0.15}
                x2={innerCompassSize * 0.15}
                y2={innerCompassSize * 0.85}
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth={1}
              />
            </Svg>
          </View>

          {/* Rotating compass ring - rotates to show where Qibla is */}
          <Animated.View
            style={[
              styles.compassRing,
              {
                width: innerCompassSize,
                height: innerCompassSize,
                transform: [{ rotate: arrowRotate }],
              },
            ]}
          >
            {/* Kaaba icon - marks Qibla direction at top of rotating ring */}
            <View style={[styles.kaabaContainer, { top: 15 }]}>
              <Image source={KAABA_IMAGE} style={styles.kaabaImage} resizeMode="contain" />
            </View>
          </Animated.View>

          {/* North indicator - rotates with device heading */}
          <Animated.View
            style={[
              styles.cardinalRing,
              {
                width: innerCompassSize - 20,
                height: innerCompassSize - 20,
                transform: [{ rotate: ringRotate }],
              },
            ]}
          >
            <View style={[styles.cardinalDirection, styles.north]}>
              <View style={[styles.northBadge, aligned && styles.northBadgeAligned]}>
                <Text style={styles.northText}>N</Text>
              </View>
            </View>
          </Animated.View>

          {/* Fixed arrow - points up toward Kaaba when aligned */}
          <View style={styles.fixedArrowContainer}>
            <Ionicons
              name="navigate"
              size={48}
              color={arrowColor}
              style={[styles.arrowIcon, { transform: [{ rotate: '-45deg' }] }]}
            />
          </View>
        </ImageBackground>
      </LinearGradient>

      {/* Readout below compass */}
      <View style={styles.readout}>
        <Text style={styles.label}>QIBLA</Text>
        <Text style={[styles.degrees, aligned && styles.degreesAligned]}>{qiblaBearing.toFixed(0)}°</Text>
        <Text style={styles.status}>
          {deviceHeading == null
            ? 'Calibrating compass...'
            : aligned
              ? 'You are facing Qibla'
              : `Turn ${delta != null && delta > 0 ? 'right' : 'left'} ${delta != null ? Math.abs(delta).toFixed(0) : 0}°`}
        </Text>
        {headingReference && (
          <Text style={styles.reference}>
            {headingReference === 'true' ? 'True North' : 'Magnetic North'}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 20,
  },
  gradientBorder: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5EC188',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  compassContainer: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  compassLinesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  compassRing: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardinalRing: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardinalDirection: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  north: {
    top: -4,
  },
  northBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  northBadgeAligned: {
    backgroundColor: 'rgba(129, 199, 132, 0.4)',
    borderColor: 'rgba(129, 199, 132, 0.7)',
  },
  northText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  fixedArrowContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  kaabaContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kaabaImage: {
    width: 52,
    height: 52,
    tintColor: palette.gold,
  },
  readout: {
    alignItems: 'center',
    gap: 4,
  },
  label: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 3,
  },
  degrees: {
    color: palette.text,
    fontSize: 36,
    fontWeight: '800',
  },
  degreesAligned: {
    color: '#81C784',
  },
  status: {
    color: palette.muted,
    fontSize: 15,
    fontWeight: '600',
  },
  reference: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
});
