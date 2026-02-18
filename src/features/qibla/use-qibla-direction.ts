import { useEffect, useMemo, useState } from 'react';
import { calculateQibla } from 'react-native-adhan';

import { qiblaBearing } from '@/src/features/qibla/qibla';

type State = {
  status: 'loading' | 'ready';
  direction: number;
  source: 'adhan' | 'fallback';
};

export function useQiblaDirection(latitude: number, longitude: number) {
  const fallback = useMemo(() => qiblaBearing(latitude, longitude), [latitude, longitude]);
  const [state, setState] = useState<State>({
    status: 'loading',
    direction: fallback,
    source: 'fallback',
  });

  useEffect(() => {
    let cancelled = false;

    setState({ status: 'loading', direction: fallback, source: 'fallback' });

    (async () => {
      try {
        const qibla = await calculateQibla({ latitude, longitude });
        if (cancelled) return;
        const direction = typeof qibla?.direction === 'number' ? qibla.direction : fallback;
        setState({ status: 'ready', direction, source: 'adhan' });
      } catch {
        if (cancelled) return;
        setState({ status: 'ready', direction: fallback, source: 'fallback' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fallback, latitude, longitude]);

  return state;
}

