import { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BannerAdSize } from 'react-native-google-mobile-ads';

import type { BannerPlacement } from './admob-config';
import { estimateBannerHeight } from './ad-metrics';
import { AdBanner } from './ad-banner';

export function useBottomAdPadding(size: BannerAdSize) {
  const tabBarHeight = useBottomTabBarHeight();
  return useMemo(() => tabBarHeight + estimateBannerHeight(size), [size, tabBarHeight]);
}

export function BottomAdDock({
  placement,
  size = BannerAdSize.BANNER,
  bottomGap = 0,
}: {
  placement: BannerPlacement;
  size?: BannerAdSize;
  bottomGap?: number;
}) {
  const tabBarHeight = useBottomTabBarHeight();

  if (Platform.OS === 'web') return null;

  return (
    <View style={[styles.wrap, { bottom: tabBarHeight + bottomGap }]} pointerEvents="box-none">
      <View pointerEvents="auto">
        <AdBanner placement={placement} size={size} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
