import kv from '@/src/storage/kv';

type CachedTimeZone = {
  timeZoneId: string;
  savedAt: number;
  source: 'google';
};

const CACHE_VERSION = 1;

function cacheKey(latitude: number, longitude: number) {
  const lat = latitude.toFixed(4);
  const lng = longitude.toFixed(4);
  return `tz:v${CACHE_VERSION}:${lat},${lng}`;
}

function parseCachedTimeZone(raw: string | undefined): CachedTimeZone | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    if (data.source !== 'google') return null;
    if (typeof data.timeZoneId !== 'string' || !data.timeZoneId) return null;
    if (typeof data.savedAt !== 'number') return null;
    return data as CachedTimeZone;
  } catch {
    return null;
  }
}

export function getCachedTimeZoneId(latitude: number, longitude: number): string | null {
  return parseCachedTimeZone(kv.getString(cacheKey(latitude, longitude)))?.timeZoneId ?? null;
}

export async function fetchTimeZoneIdFromGoogle(
  latitude: number,
  longitude: number,
  apiKey: string | undefined
): Promise<string | null> {
  if (!apiKey) return null;

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const url = `https://maps.googleapis.com/maps/api/timezone/json?location=${encodeURIComponent(
      `${latitude},${longitude}`
    )}&timestamp=${timestamp}&key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    if (data?.status !== 'OK') return null;
    const timeZoneId = typeof data?.timeZoneId === 'string' ? data.timeZoneId : null;
    if (!timeZoneId) return null;
    return timeZoneId;
  } catch {
    return null;
  }
}

export async function getTimeZoneId(latitude: number, longitude: number, apiKey: string | undefined): Promise<string | null> {
  const cached = getCachedTimeZoneId(latitude, longitude);
  if (cached) return cached;

  const timeZoneId = await fetchTimeZoneIdFromGoogle(latitude, longitude, apiKey);
  if (!timeZoneId) return null;

  const payload: CachedTimeZone = { timeZoneId, savedAt: Date.now(), source: 'google' };
  kv.set(cacheKey(latitude, longitude), JSON.stringify(payload));
  return timeZoneId;
}

