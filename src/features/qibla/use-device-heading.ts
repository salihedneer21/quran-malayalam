import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

type HeadingState = {
  heading: number | null;
  accuracy: number | null;
  northReference: 'true' | 'magnetic' | null;
  error: string | null;
};

export function useDeviceHeading(enabled: boolean) {
  const [state, setState] = useState<HeadingState>({
    heading: null,
    accuracy: null,
    northReference: null,
    error: null,
  });

  useEffect(() => {
    if (!enabled) return;

    let subscription: Location.LocationSubscription | null = null;
    let isMounted = true;
    let didReceiveHeading = false;
    const timeoutId = setTimeout(() => {
      if (!isMounted || didReceiveHeading) return;
      setState((prev) => ({
        ...prev,
        error:
          prev.error ??
          'Compass heading is unavailable. If you are using the iOS/Android simulator, compass sensors are not supported—please test on a physical device.',
      }));
    }, 3500);

    (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          setState((prev) => ({
            ...prev,
            error: 'Location permission is required for accurate compass (true heading).',
          }));
          return;
        }

        // Helps iOS compute `trueHeading` by ensuring the location manager has a fix.
        try {
          await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        } catch {
          // ignore
        }

        subscription = await Location.watchHeadingAsync((h) => {
          didReceiveHeading = true;
          const hasTrue = typeof h.trueHeading === 'number' && h.trueHeading >= 0;
          const value = hasTrue ? h.trueHeading : h.magHeading;
          if (!isMounted) return;
          setState({
            heading: value,
            accuracy: h.accuracy ?? null,
            northReference: hasTrue ? 'true' : 'magnetic',
            error: null,
          });
        });
      } catch (e) {
        if (!isMounted) return;
        setState((prev) => ({
          ...prev,
          error: (e as Error)?.message ?? 'Heading unavailable',
        }));
      }
    })();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription?.remove();
    };
  }, [enabled]);

  return state;
}
