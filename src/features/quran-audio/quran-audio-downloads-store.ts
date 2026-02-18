import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '@/src/storage/zustand-storage';

export type QuranAudioDownloadProgress = {
  chapterIndex: number;
  bytesWritten: number;
  bytesExpected: number;
  updatedAt: number;
  error: string | null;
};

type QuranAudioDownloadsState = {
  /** Map of surah index -> local file URI (file://...) */
  downloaded: Record<number, string>;
  activeDownload: QuranAudioDownloadProgress | null;
  setDownloaded: (chapterIndex: number, uri: string) => void;
  removeDownloaded: (chapterIndex: number) => void;
  setActiveDownload: (progress: QuranAudioDownloadProgress | null) => void;
};

export const useQuranAudioDownloadsStore = create<QuranAudioDownloadsState>()(
  persist(
    (set) => ({
      downloaded: {},
      activeDownload: null,
      setDownloaded: (chapterIndex, uri) =>
        set((state) => ({
          downloaded: { ...state.downloaded, [chapterIndex]: uri },
        })),
      removeDownloaded: (chapterIndex) =>
        set((state) => {
          const next = { ...state.downloaded };
          delete next[chapterIndex];
          return { downloaded: next };
        }),
      setActiveDownload: (progress) => set({ activeDownload: progress }),
    }),
    {
      name: 'qibla-namaz.quran-audio.downloads',
      storage: createJSONStorage(() => zustandStorage),
      version: 1,
      partialize: (state) => ({ downloaded: state.downloaded }),
    }
  )
);

