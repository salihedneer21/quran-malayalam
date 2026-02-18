import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform, StatusBar } from 'react-native';
import mobileAds, {
  AdEventType,
  AppOpenAd,
  InterstitialAd,
  RewardedAd,
  RewardedAdEventType,
  RewardedInterstitialAd,
} from 'react-native-google-mobile-ads';

import { getFullscreenAdUnitId } from './admob-config';

type RewardResult = { shown: boolean; earned: boolean };

export type AdsContextValue = {
  isInitialized: boolean;
  showAppOpen: (opts?: { force?: boolean; maxWaitMs?: number }) => Promise<boolean>;
  showInterstitial: (opts?: { force?: boolean; placement?: string; maxWaitMs?: number }) => Promise<boolean>;
  showRewardedAudio: (opts?: { placement?: string; maxWaitMs?: number }) => Promise<RewardResult>;
  showRewardedInterstitial: (opts?: { placement?: string; maxWaitMs?: number }) => Promise<RewardResult>;
};

export const AdsContext = createContext<AdsContextValue | null>(null);

const INTERSTITIAL_COOLDOWN_MS = 25_000;
const APP_OPEN_COOLDOWN_MS = 60_000;

function now() {
  return Date.now();
}

export function AdsProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  const isFullscreenShowingRef = useRef(false);

  const lastInterstitialAtRef = useRef(0);
  const lastAppOpenAtRef = useRef(0);

  const appOpenUnitId = getFullscreenAdUnitId('appOpen');
  const interstitialUnitId = getFullscreenAdUnitId('interstitial');
  const rewardedAudioUnitId = getFullscreenAdUnitId('rewardedAudio');
  const rewardedInterstitialUnitId = getFullscreenAdUnitId('rewardedInterstitial');

  const appOpenRef = useRef<AppOpenAd | null>(null);
  const appOpenLoadedRef = useRef(false);

  const interstitialRef = useRef<InterstitialAd | null>(null);
  const interstitialLoadedRef = useRef(false);

  const rewardedAudioRef = useRef<RewardedAd | null>(null);
  const rewardedAudioLoadedRef = useRef(false);

  const rewardedInterstitialRef = useRef<RewardedInterstitialAd | null>(null);
  const rewardedInterstitialLoadedRef = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    mobileAds()
      .initialize()
      .then(() => setIsInitialized(true))
      .catch(() => setIsInitialized(true));
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!appOpenUnitId) return;

    const ad = AppOpenAd.createForAdRequest(appOpenUnitId);
    appOpenRef.current = ad;

    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      appOpenLoadedRef.current = true;
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      appOpenLoadedRef.current = false;
      ad.load();
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      appOpenLoadedRef.current = false;
      // Try again later.
    });

    ad.load();
    return () => {
      unsubLoaded();
      unsubClosed();
      unsubError();
      appOpenRef.current = null;
      appOpenLoadedRef.current = false;
    };
  }, [appOpenUnitId]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!interstitialUnitId) return;

    const ad = InterstitialAd.createForAdRequest(interstitialUnitId);
    interstitialRef.current = ad;

    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      interstitialLoadedRef.current = true;
    });
    const unsubOpened = ad.addAdEventListener(AdEventType.OPENED, () => {
      if (Platform.OS === 'ios') StatusBar.setHidden(true);
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      interstitialLoadedRef.current = false;
      if (Platform.OS === 'ios') StatusBar.setHidden(false);
      ad.load();
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      interstitialLoadedRef.current = false;
      if (Platform.OS === 'ios') StatusBar.setHidden(false);
    });

    ad.load();
    return () => {
      unsubLoaded();
      unsubOpened();
      unsubClosed();
      unsubError();
      interstitialRef.current = null;
      interstitialLoadedRef.current = false;
    };
  }, [interstitialUnitId]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!rewardedAudioUnitId) return;

    const ad = RewardedAd.createForAdRequest(rewardedAudioUnitId);
    rewardedAudioRef.current = ad;

    const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      rewardedAudioLoadedRef.current = true;
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      rewardedAudioLoadedRef.current = false;
      ad.load();
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      rewardedAudioLoadedRef.current = false;
    });

    ad.load();
    return () => {
      unsubLoaded();
      unsubClosed();
      unsubError();
      rewardedAudioRef.current = null;
      rewardedAudioLoadedRef.current = false;
    };
  }, [rewardedAudioUnitId]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!rewardedInterstitialUnitId) return;

    const ad = RewardedInterstitialAd.createForAdRequest(rewardedInterstitialUnitId);
    rewardedInterstitialRef.current = ad;

    const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      rewardedInterstitialLoadedRef.current = true;
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      rewardedInterstitialLoadedRef.current = false;
      ad.load();
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      rewardedInterstitialLoadedRef.current = false;
    });

    ad.load();
    return () => {
      unsubLoaded();
      unsubClosed();
      unsubError();
      rewardedInterstitialRef.current = null;
      rewardedInterstitialLoadedRef.current = false;
    };
  }, [rewardedInterstitialUnitId]);

  const waitForLoaded = useCallback(async (ad: any, timeoutMs: number, loadedRef: { current: boolean }) => {
    if (loadedRef.current) return true;

    return await new Promise<boolean>((resolve) => {
      let settled = false;
      let timeout: ReturnType<typeof setTimeout> | null = null;

      let unsubLoaded: (() => void) | null = null;
      let unsubError: (() => void) | null = null;

      const cleanup = () => {
        if (timeout) clearTimeout(timeout);
        timeout = null;
        try {
          unsubLoaded?.();
        } catch {
          // Ignore.
        }
        try {
          unsubError?.();
        } catch {
          // Ignore.
        }
        unsubLoaded = null;
        unsubError = null;
      };

      const done = (value: boolean) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(value);
      };

      timeout = setTimeout(() => done(false), timeoutMs);

      try {
        unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => done(true));
        unsubError = ad.addAdEventListener(AdEventType.ERROR, () => done(false));
      } catch {
        done(false);
        return;
      }

      try {
        ad.load();
      } catch {
        done(false);
      }
    });
  }, []);

  const showAndWaitClosed = useCallback(async (ad: any) => {
    await new Promise<void>((resolve) => {
      let settled = false;

      let unsubClosed: (() => void) | null = null;
      let unsubError: (() => void) | null = null;

      const cleanup = () => {
        try {
          unsubClosed?.();
        } catch {
          // Ignore.
        }
        try {
          unsubError?.();
        } catch {
          // Ignore.
        }
        unsubClosed = null;
        unsubError = null;
      };

      const done = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      };

      try {
        unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, done);
        unsubError = ad.addAdEventListener(AdEventType.ERROR, done);
      } catch {
        done();
        return;
      }

      try {
        ad.show();
      } catch {
        // If show throws, just resolve and let caller continue.
        done();
      }
    });
  }, []);

  const showAppOpen = useCallback(
    async (opts?: { force?: boolean; maxWaitMs?: number }) => {
      if (Platform.OS === 'web') return false;
      if (!appOpenRef.current) return false;
      if (isFullscreenShowingRef.current) return false;

      if (!opts?.force) {
        if (now() - lastAppOpenAtRef.current < APP_OPEN_COOLDOWN_MS) return false;
      }

      const ad = appOpenRef.current;
      const loaded = await waitForLoaded(ad, opts?.maxWaitMs ?? 2500, appOpenLoadedRef);
      if (!loaded) return false;

      isFullscreenShowingRef.current = true;
      lastAppOpenAtRef.current = now();
      try {
        await showAndWaitClosed(ad);
      } finally {
        isFullscreenShowingRef.current = false;
      }
      return true;
    },
    [showAndWaitClosed, waitForLoaded]
  );

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void showAppOpen();
    });

    return () => sub.remove();
  }, [showAppOpen]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!isInitialized) return;

    // Attempt to show an app-open ad shortly after cold start.
    const t = setTimeout(() => {
      void showAppOpen();
    }, 1500);

    return () => clearTimeout(t);
  }, [isInitialized, showAppOpen]);

  const showInterstitial = useCallback(
    async (opts?: { force?: boolean; placement?: string; maxWaitMs?: number }) => {
      if (Platform.OS === 'web') return false;
      if (!interstitialRef.current) return false;
      if (isFullscreenShowingRef.current) return false;

      if (!opts?.force) {
        if (now() - lastInterstitialAtRef.current < INTERSTITIAL_COOLDOWN_MS) return false;
      }

      const ad = interstitialRef.current;
      const loaded = await waitForLoaded(ad, opts?.maxWaitMs ?? 2500, interstitialLoadedRef);
      if (!loaded) return false;

      isFullscreenShowingRef.current = true;
      lastInterstitialAtRef.current = now();
      try {
        await showAndWaitClosed(ad);
      } finally {
        isFullscreenShowingRef.current = false;
      }
      return true;
    },
    [showAndWaitClosed, waitForLoaded]
  );

  const showRewardedAudio = useCallback(
    async (opts?: { placement?: string; maxWaitMs?: number }) => {
      if (Platform.OS === 'web') return { shown: false, earned: false };
      if (!rewardedAudioRef.current) return { shown: false, earned: false };
      if (isFullscreenShowingRef.current) return { shown: false, earned: false };

      const ad = rewardedAudioRef.current;
      const loaded = await waitForLoaded(ad, opts?.maxWaitMs ?? 10_000, rewardedAudioLoadedRef);
      if (!loaded) return { shown: false, earned: false };

      let earned = false;
      isFullscreenShowingRef.current = true;

      let shown = false;
      try {
        await new Promise<void>((resolve) => {
          let settled = false;

          let unsubEarned: (() => void) | null = null;
          let unsubClosed: (() => void) | null = null;
          let unsubError: (() => void) | null = null;

          const cleanup = () => {
            try {
              unsubEarned?.();
            } catch {
              // Ignore.
            }
            try {
              unsubClosed?.();
            } catch {
              // Ignore.
            }
            try {
              unsubError?.();
            } catch {
              // Ignore.
            }
            unsubEarned = null;
            unsubClosed = null;
            unsubError = null;
          };

          const done = () => {
            if (settled) return;
            settled = true;
            cleanup();
            resolve();
          };

          try {
            unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
              earned = true;
            });
            unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, done);
            unsubError = ad.addAdEventListener(AdEventType.ERROR, done);
          } catch {
            done();
            return;
          }

          try {
            ad.show();
            shown = true;
          } catch {
            done();
          }
        });
      } finally {
        isFullscreenShowingRef.current = false;
      }

      return { shown, earned: shown ? earned : false };
    },
    [waitForLoaded]
  );

  const showRewardedInterstitial = useCallback(
    async (opts?: { placement?: string; maxWaitMs?: number }) => {
      if (Platform.OS === 'web') return { shown: false, earned: false };
      if (!rewardedInterstitialRef.current) return { shown: false, earned: false };
      if (isFullscreenShowingRef.current) return { shown: false, earned: false };

      const ad = rewardedInterstitialRef.current;
      const loaded = await waitForLoaded(ad, opts?.maxWaitMs ?? 10_000, rewardedInterstitialLoadedRef);
      if (!loaded) return { shown: false, earned: false };

      let earned = false;
      isFullscreenShowingRef.current = true;

      let shown = false;
      try {
        await new Promise<void>((resolve) => {
          let settled = false;

          let unsubEarned: (() => void) | null = null;
          let unsubClosed: (() => void) | null = null;
          let unsubError: (() => void) | null = null;

          const cleanup = () => {
            try {
              unsubEarned?.();
            } catch {
              // Ignore.
            }
            try {
              unsubClosed?.();
            } catch {
              // Ignore.
            }
            try {
              unsubError?.();
            } catch {
              // Ignore.
            }
            unsubEarned = null;
            unsubClosed = null;
            unsubError = null;
          };

          const done = () => {
            if (settled) return;
            settled = true;
            cleanup();
            resolve();
          };

          try {
            unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
              earned = true;
            });
            unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, done);
            unsubError = ad.addAdEventListener(AdEventType.ERROR, done);
          } catch {
            done();
            return;
          }

          try {
            ad.show();
            shown = true;
          } catch {
            done();
          }
        });
      } finally {
        isFullscreenShowingRef.current = false;
      }

      return { shown, earned: shown ? earned : false };
    },
    [waitForLoaded]
  );

  const value = useMemo<AdsContextValue>(
    () => ({
      isInitialized,
      showAppOpen,
      showInterstitial,
      showRewardedAudio,
      showRewardedInterstitial,
    }),
    [isInitialized, showAppOpen, showInterstitial, showRewardedAudio, showRewardedInterstitial]
  );

  return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>;
}
