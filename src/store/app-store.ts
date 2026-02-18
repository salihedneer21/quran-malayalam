import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '@/src/storage/zustand-storage';

export type SavedLocation = {
  latitude: number;
  longitude: number;
  name?: string;
  timeZoneId: string;
  updatedAt: number;
};

export type PrayerSettings = {
  /** `react-native-adhan` calculation method (e.g. "muslimWorldLeague", "egyptian", "karachi"). */
  calculationMethod: string;
  /** `react-native-adhan` madhab ("shafi" | "hanafi"). */
  madhab: string;
};

export type CalendarSettings = {
  showHijri: boolean;
};

type AppState = {
  hasHydrated: boolean;
  location: SavedLocation | null;
  prayerSettings: PrayerSettings;
  calendarSettings: CalendarSettings;
  setLocation: (input: Omit<SavedLocation, 'updatedAt'>) => void;
  clearLocation: () => void;
  setPrayerSettings: (settings: Partial<PrayerSettings>) => void;
  setCalendarSettings: (settings: Partial<CalendarSettings>) => void;
  setHasHydrated: (value: boolean) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      location: null,
      prayerSettings: {
        calculationMethod: 'muslimWorldLeague',
        madhab: 'shafi',
      },
      calendarSettings: {
        showHijri: true,
      },
      setLocation: (input) =>
        set({
          location: {
            ...input,
            updatedAt: Date.now(),
          },
        }),
      clearLocation: () => set({ location: null }),
      setPrayerSettings: (settings) =>
        set((state) => ({
          prayerSettings: { ...state.prayerSettings, ...settings },
        })),
      setCalendarSettings: (settings) =>
        set((state) => ({
          calendarSettings: { ...state.calendarSettings, ...settings },
        })),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'qibla-namaz.store',
      storage: createJSONStorage(() => zustandStorage),
      version: 3,
      migrate: (persistedState) => {
        const state: any = persistedState ?? {};
        const ps = state?.prayerSettings;
        const method = typeof ps?.calculationMethod === 'string' ? ps.calculationMethod : undefined;
        const madhab = typeof ps?.madhab === 'string' ? ps.madhab : undefined;

        const normalizedMethod = normalizeMethod(method);
        const normalizedMadhab = normalizeMadhab(madhab);

        const cs = state?.calendarSettings;
        const showHijri = typeof cs?.showHijri === 'boolean' ? cs.showHijri : true;

        const loc = state?.location;
        const location = loc
          ? {
              ...loc,
              timeZoneId:
                typeof loc?.timeZoneId === 'string' && loc.timeZoneId.trim().length > 0 ? loc.timeZoneId : 'UTC',
            }
          : null;

        return {
          ...state,
          location,
          prayerSettings: {
            calculationMethod: normalizedMethod,
            madhab: normalizedMadhab,
          },
          calendarSettings: {
            showHijri,
          },
        };
      },
      partialize: (state) => ({
        location: state.location,
        prayerSettings: state.prayerSettings,
        calendarSettings: state.calendarSettings,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

function normalizeMethod(input: string | undefined) {
  if (!input) return 'muslimWorldLeague';

  const raw = input.trim();
  if (!raw) return 'muslimWorldLeague';

  // Handle legacy values used earlier in this repo ("MuslimWorldLeague", "Shafi", etc.).
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
