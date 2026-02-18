import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { palette } from '@/src/theme/palette';

const THUMB_SIZE = 14;
const TOOLTIP_WIDTH = 62;
const SMOOTH_ANIMATION_MS = 90;
const FORCED_CLEAR_THRESHOLD_MS = 750;

function formatSecondsWorklet(totalSeconds: number): string {
  'worklet';
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  if (hours > 0) {
    return `${hours}:${pad2(minutes)}:${pad2(remainingSeconds)}`;
  }
  return `${minutes}:${pad2(remainingSeconds)}`;
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export const SeekBar = memo(function SeekBar({
  positionMillis,
  durationMillis,
  onSeekToMillis,
  disabled,
}: {
  positionMillis: number;
  durationMillis: number;
  onSeekToMillis: (nextPositionMillis: number) => void;
  disabled?: boolean;
}) {
  const enabled = !disabled && durationMillis > 0;

  const onSeekToMillisRef = useRef(onSeekToMillis);
  onSeekToMillisRef.current = onSeekToMillis;

  const commitSeek = useCallback((nextPositionMillis: number) => {
    onSeekToMillisRef.current(nextPositionMillis);
  }, []);

  const widthSV = useSharedValue(1);
  const durationSV = useSharedValue(Math.max(0, Math.floor(durationMillis)));
  const positionSV = useSharedValue(Math.max(0, Math.floor(positionMillis)));

  // 0/1 to keep worklet-friendly.
  const isSeekingSV = useSharedValue(0);
  const seekMillisSV = useSharedValue(0);
  // -1 means "no forced/optimistic position".
  const forcedMillisSV = useSharedValue(-1);

  useEffect(() => {
    durationSV.value = Math.max(0, Math.floor(durationMillis));
  }, [durationMillis, durationSV]);

  useEffect(() => {
    positionSV.value = Math.max(0, Math.floor(positionMillis));
  }, [positionMillis, positionSV]);

  useAnimatedReaction(
    () => ({ pos: positionSV.value, forced: forcedMillisSV.value }),
    ({ pos, forced }) => {
      if (forced >= 0 && Math.abs(pos - forced) <= FORCED_CLEAR_THRESHOLD_MS) {
        forcedMillisSV.value = -1;
      }
    }
  );

  const displayMillisSV = useDerivedValue(() => {
    if (isSeekingSV.value) return seekMillisSV.value;
    if (forcedMillisSV.value >= 0) return forcedMillisSV.value;
    return positionSV.value;
  });

  const ratioSV = useDerivedValue(() => {
    const d = durationSV.value;
    if (d <= 0) return 0;
    const r = displayMillisSV.value / d;
    if (r < 0) return 0;
    if (r > 1) return 1;
    return r;
  });

  const smoothRatioSV = useDerivedValue(() => {
    const ratio = ratioSV.value;
    if (isSeekingSV.value) return ratio;
    return withTiming(ratio, { duration: SMOOTH_ANIMATION_MS });
  });

  const fillStyle = useAnimatedStyle(() => {
    return { width: smoothRatioSV.value * widthSV.value };
  });

  const thumbStyle = useAnimatedStyle(() => {
    const left = smoothRatioSV.value * widthSV.value - THUMB_SIZE / 2;
    return { transform: [{ translateX: left }] };
  });

  const tooltipStyle = useAnimatedStyle(() => {
    const opacity = isSeekingSV.value ? 1 : 0;
    const thumbX = smoothRatioSV.value * widthSV.value;
    const maxLeft = Math.max(0, widthSV.value - TOOLTIP_WIDTH);
    const nextLeft = Math.max(0, Math.min(maxLeft, thumbX - TOOLTIP_WIDTH / 2));

    return {
      opacity: withTiming(opacity, { duration: 120 }),
      transform: [{ translateX: nextLeft }],
    };
  });

  const tooltipTextProps = useAnimatedProps(() => {
    return { text: formatSecondsWorklet(seekMillisSV.value / 1000) } as any;
  });

  const gesture = useMemo(() => {
    const getMillisFromX = (x: number) => {
      'worklet';
      const w = Math.max(1, widthSV.value);
      const d = Math.max(0, durationSV.value);
      const clampedX = Math.max(0, Math.min(w, x));
      const ratio = w > 0 ? clampedX / w : 0;
      const millis = Math.round(ratio * d);
      return Math.max(0, Math.min(d, millis));
    };

    return Gesture.Pan()
      .enabled(enabled)
      .minDistance(0)
      .onBegin((e) => {
        isSeekingSV.value = 1;
        forcedMillisSV.value = -1;
        seekMillisSV.value = getMillisFromX(e.x);
      })
      .onUpdate((e) => {
        seekMillisSV.value = getMillisFromX(e.x);
      })
      .onEnd(() => {
        const next = seekMillisSV.value;
        isSeekingSV.value = 0;
        forcedMillisSV.value = next;
        runOnJS(commitSeek)(next);
      })
      .onFinalize(() => {
        isSeekingSV.value = 0;
      });
  }, [commitSeek, durationSV, enabled, forcedMillisSV, isSeekingSV, seekMillisSV, widthSV]);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        onLayout={(e) => {
          const next = Math.max(1, Math.floor(e.nativeEvent.layout.width));
          widthSV.value = next;
        }}
        style={styles.wrap}
      >
        <View style={styles.track} />
        <Animated.View style={[styles.fill, fillStyle]} />
        <Animated.View style={[styles.thumb, thumbStyle]} />
        <Animated.View pointerEvents="none" style={[styles.tooltip, tooltipStyle]}>
          <AnimatedTextInput
            editable={false}
            pointerEvents="none"
            underlineColorAndroid="transparent"
            style={styles.tooltipText}
            animatedProps={tooltipTextProps}
          />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  wrap: {
    height: 26,
    position: 'relative',
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 9,
    height: 8,
    borderRadius: 99,
    backgroundColor: '#EAEAEA',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 9,
    height: 8,
    borderRadius: 99,
    backgroundColor: palette.accentDark,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    top: 6,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: palette.accentDark,
  },
  tooltip: {
    position: 'absolute',
    left: 0,
    top: -22,
    width: TOOLTIP_WIDTH,
    alignItems: 'center',
    backgroundColor: palette.text,
    borderRadius: 10,
    paddingVertical: 4,
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    padding: 0,
    margin: 0,
    textAlign: 'center',
  },
});
