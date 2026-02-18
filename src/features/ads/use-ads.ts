import { useContext } from 'react';

import { AdsContext, type AdsContextValue } from './ads-provider';

export function useAds(): AdsContextValue {
  const ctx = useContext(AdsContext);
  if (!ctx) {
    throw new Error('useAds must be used within <AdsProvider />');
  }
  return ctx;
}

