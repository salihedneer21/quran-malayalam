import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '@/src/storage/zustand-storage';

type QuranAudioState = {
  lastChapterIndex: number | null;
  setLastChapterIndex: (chapterIndex: number) => void;
};

export const useQuranAudioStore = create<QuranAudioState>()(
  persist(
    (set) => ({
      lastChapterIndex: null,
      setLastChapterIndex: (chapterIndex) => set({ lastChapterIndex: chapterIndex }),
    }),
    {
      name: 'qibla-namaz.quran-audio',
      storage: createJSONStorage(() => zustandStorage),
      version: 1,
      partialize: (state) => ({ lastChapterIndex: state.lastChapterIndex }),
    }
  )
);

