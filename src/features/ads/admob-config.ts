import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

import { env } from '@/src/config/env';

export type BannerPlacement = 'homeBottom' | 'aboutTop' | 'bottomDock';
export type FullscreenPlacement = 'appOpen' | 'interstitial' | 'rewardedAudio' | 'rewardedInterstitial';

function sanitizeUnitId(input: string | undefined): string | null {
  const value = (input ?? '').trim();
  if (!value) return null;
  if (value.includes('xxxxxxxx')) return null;
  return value;
}

function pickPlatformValue<T>(opts: { ios: T; android: T }): T {
  if (Platform.OS === 'android') return opts.android;
  return opts.ios;
}

export function getFullscreenAdUnitId(placement: FullscreenPlacement): string | null {
  if (Platform.OS === 'web') return null;

  const configured = (() => {
    if (Platform.OS === 'android') {
      const a = env.admob.android;
      if (placement === 'appOpen') return sanitizeUnitId(a.appOpen);
      if (placement === 'interstitial') return sanitizeUnitId(a.interstitial);
      if (placement === 'rewardedAudio') return sanitizeUnitId(a.rewardedAudio);
      if (placement === 'rewardedInterstitial') return sanitizeUnitId(a.rewardedInterstitial);
      return null;
    }

    const i = env.admob.ios;
    if (placement === 'appOpen') return sanitizeUnitId(i.appOpen);
    if (placement === 'interstitial') return sanitizeUnitId(i.interstitial);
    if (placement === 'rewardedAudio') return sanitizeUnitId(i.rewardedAudio);
    if (placement === 'rewardedInterstitial') return sanitizeUnitId(i.rewardedInterstitial);
    return null;
  })();

  if (configured) return configured;
  if (__DEV__) {
    if (placement === 'appOpen') return TestIds.APP_OPEN;
    if (placement === 'interstitial') return TestIds.INTERSTITIAL;
    if (placement === 'rewardedAudio') return TestIds.REWARDED;
    if (placement === 'rewardedInterstitial') return TestIds.REWARDED_INTERSTITIAL;
  }
  return null;
}

export function getBannerAdUnitId(placement: BannerPlacement): string | null {
  if (Platform.OS === 'web') return null;

  const configured = (() => {
    if (Platform.OS === 'android') {
      const a = env.admob.android;
      if (placement === 'homeBottom') return sanitizeUnitId(a.bannerHomeBottom);
      if (placement === 'aboutTop') return sanitizeUnitId(a.bannerAboutTop);
      if (placement === 'bottomDock') return sanitizeUnitId(a.bannerBottomDock);
      return null;
    }

    const i = env.admob.ios;
    if (placement === 'homeBottom') return sanitizeUnitId(i.bannerHomeBottom);
    if (placement === 'aboutTop') return sanitizeUnitId(i.bannerAboutTop);
    if (placement === 'bottomDock') return sanitizeUnitId(i.bannerBottomDock);
    return null;
  })();

  if (configured) return configured;
  if (__DEV__) {
    // Use adaptive test units by default, since most banners in-app are adaptive.
    return pickPlatformValue({ ios: TestIds.ADAPTIVE_BANNER, android: TestIds.ADAPTIVE_BANNER });
  }
  return null;
}
