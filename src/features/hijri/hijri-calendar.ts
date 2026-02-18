import kv from '@/src/storage/kv';

export type HijriDay = {
  day: number;
  month?: number;
  year?: number;
  monthName?: string;
};

export type HijriMonth = {
  gregorianYear: number;
  gregorianMonth: number; // 1-12
  adjustment: number;
  daysByGregorianDay: Record<string, HijriDay>;
  savedAt: number;
  source: 'aladhan';
};

const CACHE_VERSION = 1;
const inFlight = new Map<string, Promise<HijriMonth | null>>();

function cacheKey(year: number, month: number, adjustment: number) {
  return `hijri:gToHCalendar:v${CACHE_VERSION}:${year}-${month}:adj${adjustment}`;
}

function parseHijriMonth(input: string | undefined): HijriMonth | null {
  if (!input) return null;
  try {
    const data = JSON.parse(input);
    if (!data || typeof data !== 'object') return null;
    if (data.source !== 'aladhan') return null;
    if (typeof data.gregorianYear !== 'number') return null;
    if (typeof data.gregorianMonth !== 'number') return null;
    if (typeof data.adjustment !== 'number') return null;
    if (!data.daysByGregorianDay || typeof data.daysByGregorianDay !== 'object') return null;
    if (typeof data.savedAt !== 'number') return null;
    return data as HijriMonth;
  } catch {
    return null;
  }
}

async function fetchHijriMonthFromAladhan(year: number, month: number, adjustment: number): Promise<HijriMonth | null> {
  try {
    const url = `https://api.aladhan.com/v1/gToHCalendar/${month}/${year}?adjustment=${encodeURIComponent(
      String(adjustment)
    )}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const body = await response.json();
    const rows = body?.data;
    if (!Array.isArray(rows)) return null;

    const daysByGregorianDay: Record<string, HijriDay> = {};

    for (const row of rows) {
      const gDayRaw = row?.gregorian?.day ?? (typeof row?.gregorian?.date === 'string' ? row.gregorian.date.split('-')[0] : undefined);
      const gDay = Number.parseInt(String(gDayRaw), 10);
      if (!Number.isFinite(gDay)) continue;

      const hDayRaw = row?.hijri?.day ?? (typeof row?.hijri?.date === 'string' ? row.hijri.date.split('-')[0] : undefined);
      const hDay = Number.parseInt(String(hDayRaw), 10);
      if (!Number.isFinite(hDay)) continue;

      const hMonthRaw = row?.hijri?.month?.number ?? row?.hijri?.month;
      const hMonth = hMonthRaw != null ? Number.parseInt(String(hMonthRaw), 10) : undefined;

      const hYearRaw = row?.hijri?.year;
      const hYear = hYearRaw != null ? Number.parseInt(String(hYearRaw), 10) : undefined;

      const hMonthName = typeof row?.hijri?.month?.en === 'string' ? row.hijri.month.en : undefined;

      daysByGregorianDay[String(gDay)] = {
        day: hDay,
        month: Number.isFinite(hMonth) ? hMonth : undefined,
        year: Number.isFinite(hYear) ? hYear : undefined,
        monthName: hMonthName,
      };
    }

    if (Object.keys(daysByGregorianDay).length === 0) return null;

    return {
      gregorianYear: year,
      gregorianMonth: month,
      adjustment,
      daysByGregorianDay,
      savedAt: Date.now(),
      source: 'aladhan',
    };
  } catch {
    return null;
  }
}

export function getCachedHijriMonth(year: number, month: number, adjustment: number): HijriMonth | null {
  return parseHijriMonth(kv.getString(cacheKey(year, month, adjustment)));
}

export async function getHijriMonth(year: number, month: number, adjustment: number): Promise<HijriMonth | null> {
  const key = cacheKey(year, month, adjustment);
  const cached = getCachedHijriMonth(year, month, adjustment);
  if (cached) return cached;

  const existing = inFlight.get(key);
  if (existing) return existing;

  const promise = (async () => {
    const fetched = await fetchHijriMonthFromAladhan(year, month, adjustment);
    if (fetched) kv.set(key, JSON.stringify(fetched));
    return fetched;
  })();

  inFlight.set(key, promise);
  promise.finally(() => inFlight.delete(key));
  return promise;
}

