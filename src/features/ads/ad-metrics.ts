import { BannerAdSize } from 'react-native-google-mobile-ads';

export function estimateBannerHeight(size: BannerAdSize): number {
  if (size === BannerAdSize.LARGE_BANNER) return 100;
  if (size === BannerAdSize.FULL_BANNER) return 60;
  if (size === BannerAdSize.LEADERBOARD) return 90;
  if (size === BannerAdSize.MEDIUM_RECTANGLE) return 250;
  return 50;
}

