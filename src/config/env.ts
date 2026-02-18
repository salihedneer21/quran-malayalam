import Constants from 'expo-constants';

type ExpoExtra = {
  googleMapsApiKey?: string;
  admob?: {
    android?: {
      appOpen?: string;
      interstitial?: string;
      rewardedAudio?: string;
      rewardedInterstitial?: string;
      bannerHomeBottom?: string;
      bannerAboutTop?: string;
      bannerBottomDock?: string;
    };
    ios?: {
      appOpen?: string;
      interstitial?: string;
      rewardedAudio?: string;
      rewardedInterstitial?: string;
      bannerHomeBottom?: string;
      bannerAboutTop?: string;
      bannerBottomDock?: string;
    };
  };
};

function readExpoExtra(): ExpoExtra | undefined {
  const config = Constants.expoConfig;
  if (!config) return undefined;
  return (config.extra ?? undefined) as ExpoExtra | undefined;
}

export const env = {
  googleMapsApiKey:
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??
    readExpoExtra()?.googleMapsApiKey ??
    undefined,
  admob: {
    android: {
      appOpen: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_OPEN ?? readExpoExtra()?.admob?.android?.appOpen ?? undefined,
      interstitial:
        process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL ?? readExpoExtra()?.admob?.android?.interstitial ?? undefined,
      rewardedAudio:
        process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_AUDIO ?? readExpoExtra()?.admob?.android?.rewardedAudio ?? undefined,
      rewardedInterstitial:
        process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_INTERSTITIAL ??
        readExpoExtra()?.admob?.android?.rewardedInterstitial ??
        undefined,
      bannerHomeBottom:
        process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_HOME_BOTTOM ??
        readExpoExtra()?.admob?.android?.bannerHomeBottom ??
        undefined,
      bannerAboutTop:
        process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ABOUT_TOP ?? readExpoExtra()?.admob?.android?.bannerAboutTop ?? undefined,
      bannerBottomDock:
        process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_BOTTOM_DOCK ??
        readExpoExtra()?.admob?.android?.bannerBottomDock ??
        undefined,
    },
    ios: {
      appOpen: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_OPEN ?? readExpoExtra()?.admob?.ios?.appOpen ?? undefined,
      interstitial: process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL ?? readExpoExtra()?.admob?.ios?.interstitial ?? undefined,
      rewardedAudio:
        process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_AUDIO ?? readExpoExtra()?.admob?.ios?.rewardedAudio ?? undefined,
      rewardedInterstitial:
        process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_INTERSTITIAL ??
        readExpoExtra()?.admob?.ios?.rewardedInterstitial ??
        undefined,
      bannerHomeBottom:
        process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_HOME_BOTTOM ?? readExpoExtra()?.admob?.ios?.bannerHomeBottom ?? undefined,
      bannerAboutTop:
        process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_ABOUT_TOP ?? readExpoExtra()?.admob?.ios?.bannerAboutTop ?? undefined,
      bannerBottomDock:
        process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_BOTTOM_DOCK ?? readExpoExtra()?.admob?.ios?.bannerBottomDock ?? undefined,
    },
  },
};
