import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import type { BannerPlacement } from './admob-config';
import { getBannerAdUnitId } from './admob-config';

export function AdBanner({
  placement,
  size = BannerAdSize.BANNER,
  style,
}: {
  placement: BannerPlacement;
  size?: BannerAdSize;
  style?: ViewStyle;
}) {
  const unitId = useMemo(() => getBannerAdUnitId(placement), [placement]);
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [unitId]);

  if (Platform.OS === 'web') return null;
  if (!unitId) return null;
  if (failed) return null;

  return (
    <View style={[styles.wrap, style]}>
      <BannerAd
        unitId={unitId}
        size={size}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});

