import { calculatePrayerTimes, prayerTimesToDates } from 'react-native-adhan';

import type { PlainDate } from '@/src/features/datetime/plain-date';

export type DailyPrayerTimes = {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
};

export type PrayerSettings = {
  /** `react-native-adhan` method name (e.g. "muslimWorldLeague"). */
  calculationMethod: string;
  /** `react-native-adhan` madhab ("shafi" | "hanafi"). */
  madhab: string;
};

function normalizeMethod(input: string | undefined) {
  if (!input) return 'muslimWorldLeague';

  const raw = input.trim();
  if (!raw) return 'muslimWorldLeague';

  // Accept legacy strings used earlier in this repo.
  const normalized = raw
    .replace(/\s+/g, '')
    .replace(/_/g, '')
    .toLowerCase();

  const map: Record<string, string> = {
    muslimworldleague: 'muslimWorldLeague',
    egyptian: 'egyptian',
    karachi: 'karachi',
    ummalqura: 'ummAlQura',
    dubai: 'dubai',
    moonsightingcommittee: 'moonsightingCommittee',
    northamerica: 'northAmerica',
    kuwait: 'kuwait',
    qatar: 'qatar',
    singapore: 'singapore',
    tehran: 'tehran',
    turkey: 'turkey',
    other: 'other',
  };

  return map[normalized] ?? raw;
}

function normalizeMadhab(input: string | undefined) {
  if (!input) return 'shafi';
  const normalized = input.trim().toLowerCase();
  if (normalized === 'hanafi') return 'hanafi';
  return 'shafi';
}

export async function getDailyPrayerTimes(
  date: PlainDate,
  latitude: number,
  longitude: number,
  settings: PrayerSettings
): Promise<DailyPrayerTimes> {
  try {
    const prayerTimes = await calculatePrayerTimes(
      { latitude, longitude },
      { year: date.year, month: date.month, day: date.day },
      {
        method: normalizeMethod(settings.calculationMethod),
        madhab: normalizeMadhab(settings.madhab),
      }
    );

    return prayerTimesToDates(prayerTimes);
  } catch (e) {
    const message = typeof (e as any)?.message === 'string' ? (e as any).message : String(e);

    if (
      message.includes('TurboModuleRegistry.getEnforcing') ||
      (message.includes('Adhan') && message.toLowerCase().includes('could not be found'))
    ) {
      throw new Error(
        [
          'Adhan native module is not available.',
          'If you enabled Remote JS Debugging (Chrome), disable it (TurboModules/JSI won’t work).',
          'Then rebuild the dev client once:',
          '  pnpm ios',
          '  # or',
          '  pnpm android',
        ].join('\n')
      );
    }

    throw e;
  }
}

export function formatTime(date: Date, timeZoneId: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: timeZoneId }).format(date);
  } catch {
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
  }
}
