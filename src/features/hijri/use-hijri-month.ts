import { useEffect, useMemo, useState } from 'react';

import { getCachedHijriMonth, getHijriMonth, type HijriDay } from '@/src/features/hijri/hijri-calendar';

export type UseHijriMonthResult = {
  daysByGregorianDay: Record<string, HijriDay> | null;
  loading: boolean;
};

export function useHijriMonth({
  enabled,
  year,
  month,
  adjustment,
}: {
  enabled: boolean;
  year: number;
  month: number; // 1-12
  adjustment: number;
}): UseHijriMonthResult {
  const [daysByGregorianDay, setDaysByGregorianDay] = useState<Record<string, HijriDay> | null>(null);
  const [loading, setLoading] = useState(false);

  const cache = useMemo(() => {
    if (!enabled) return null;
    return getCachedHijriMonth(year, month, adjustment);
  }, [adjustment, enabled, month, year]);

  useEffect(() => {
    if (!enabled) {
      setDaysByGregorianDay(null);
      setLoading(false);
      return;
    }

    if (cache) {
      setDaysByGregorianDay(cache.daysByGregorianDay);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setDaysByGregorianDay(null);

    getHijriMonth(year, month, adjustment)
      .then((result) => {
        if (cancelled) return;
        setDaysByGregorianDay(result?.daysByGregorianDay ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [adjustment, cache, enabled, month, year]);

  return { daysByGregorianDay, loading };
}

