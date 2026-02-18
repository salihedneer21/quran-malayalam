import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '@/src/storage/zustand-storage';

import type { QuranReadingMode } from './types';

type QuranReadingState = {
  mode: QuranReadingMode;
  lastChapterIndex: number | null;
  setMode: (mode: QuranReadingMode) => void;
  setLastChapterIndex: (chapterIndex: number) => void;
};

export const useQuranReadingStore = create<QuranReadingState>()(
  persist(
    (set) => ({
      mode: 'ml-first',
      lastChapterIndex: null,
      setMode: (mode) => set({ mode }),
      setLastChapterIndex: (chapterIndex) => set({ lastChapterIndex: chapterIndex }),
    }),
    {
      name: 'qibla-namaz.quran-reading',
      storage: createJSONStorage(() => zustandStorage),
      version: 1,
      partialize: (state) => ({ mode: state.mode, lastChapterIndex: state.lastChapterIndex }),
    }
  )
);

