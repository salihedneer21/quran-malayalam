import { useCallback, useMemo, useRef } from 'react';
import * as FileSystem from 'expo-file-system/legacy';

import type { QuranAudioChapter } from './types';
import { useQuranAudioDownloadsStore } from './quran-audio-downloads-store';

const DOWNLOAD_DIR_NAME = 'quran-audio-mal';

function getDownloadDir(): string {
  const base = FileSystem.documentDirectory;
  if (!base) {
    throw new Error('File system unavailable (no documentDirectory).');
  }
  return `${base}${DOWNLOAD_DIR_NAME}/`;
}

function getLocalUriForFile(fileName: string): string {
  return `${getDownloadDir()}${fileName}`;
}

function getTempUriForFile(fileName: string): string {
  return `${getLocalUriForFile(fileName)}.download`;
}

export function useQuranAudioDownloads({ baseUrl }: { baseUrl: string }) {
  const downloaded = useQuranAudioDownloadsStore((s) => s.downloaded);
  const activeDownload = useQuranAudioDownloadsStore((s) => s.activeDownload);
  const setDownloaded = useQuranAudioDownloadsStore((s) => s.setDownloaded);
  const removeDownloaded = useQuranAudioDownloadsStore((s) => s.removeDownloaded);
  const setActiveDownload = useQuranAudioDownloadsStore((s) => s.setActiveDownload);

  const downloadTaskRef = useRef<FileSystem.DownloadResumable | null>(null);
  const lastProgressAtRef = useRef(0);

  const ensureDir = useCallback(async () => {
    const dir = getDownloadDir();
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  }, []);

  const getDownloadedUri = useCallback((chapterIndex: number) => {
    return useQuranAudioDownloadsStore.getState().downloaded[chapterIndex];
  }, []);

  const isDownloaded = useCallback((chapterIndex: number) => {
    return Boolean(useQuranAudioDownloadsStore.getState().downloaded[chapterIndex]);
  }, []);

  const ensureDownloadedUri = useCallback(
    async (chapter: QuranAudioChapter): Promise<string | undefined> => {
      const existing = getDownloadedUri(chapter.index);
      if (existing) {
        const info = await FileSystem.getInfoAsync(existing);
        if (info.exists) return existing;
        removeDownloaded(chapter.index);
      }

      // Handle the case where the file exists on disk but the mapping was cleared.
      try {
        const localUri = getLocalUriForFile(chapter.fileName);
        const localInfo = await FileSystem.getInfoAsync(localUri);
        if (localInfo.exists) {
          setDownloaded(chapter.index, localUri);
          return localUri;
        }
      } catch {
        // Ignore file-system errors (e.g. documentDirectory unavailable).
      }

      return undefined;
    },
    [getDownloadedUri, removeDownloaded, setDownloaded]
  );

  const downloadChapter = useCallback(
    async (chapter: QuranAudioChapter): Promise<string> => {
      const existing = getDownloadedUri(chapter.index);
      if (existing) {
        const info = await FileSystem.getInfoAsync(existing);
        if (info.exists) return existing;
        removeDownloaded(chapter.index);
      }

      await ensureDir();

      const finalUri = getLocalUriForFile(chapter.fileName);
      const tempUri = getTempUriForFile(chapter.fileName);

      // Never treat an existing partial file as "downloaded". Only the final file counts.
      const finalInfo = await FileSystem.getInfoAsync(finalUri);
      if (finalInfo.exists) {
        setDownloaded(chapter.index, finalUri);
        return finalUri;
      }

      // Clean up any previous partial.
      await FileSystem.deleteAsync(tempUri, { idempotent: true });

      const remoteUri = `${baseUrl}${chapter.fileName}`;

      setActiveDownload({
        chapterIndex: chapter.index,
        bytesWritten: 0,
        bytesExpected: 0,
        updatedAt: Date.now(),
        error: null,
      });

      const task = FileSystem.createDownloadResumable(remoteUri, tempUri, {}, (progress) => {
        // Ignore late progress updates after cancellation/replacement.
        if (downloadTaskRef.current !== task) return;

        const now = Date.now();
        if (now - lastProgressAtRef.current < 250) return;
        lastProgressAtRef.current = now;

        setActiveDownload({
          chapterIndex: chapter.index,
          bytesWritten: progress.totalBytesWritten,
          bytesExpected: progress.totalBytesExpectedToWrite,
          updatedAt: now,
          error: null,
        });
      });

      downloadTaskRef.current = task;

      try {
        const result = await task.downloadAsync();
        if (!result?.uri) {
          throw new Error('Download cancelled.');
        }

        await FileSystem.moveAsync({ from: result.uri, to: finalUri });
        setDownloaded(chapter.index, finalUri);
        setActiveDownload(null);
        return finalUri;
      } catch (e: any) {
        // If the task was cancelled or replaced, don't surface an error state.
        if (downloadTaskRef.current !== task) {
          try {
            await FileSystem.deleteAsync(tempUri, { idempotent: true });
          } catch {
            // Ignore.
          }
          throw e;
        }
        setActiveDownload({
          chapterIndex: chapter.index,
          bytesWritten: 0,
          bytesExpected: 0,
          updatedAt: Date.now(),
          error: typeof e?.message === 'string' ? e.message : 'Download failed.',
        });
        try {
          await FileSystem.deleteAsync(tempUri, { idempotent: true });
        } catch {
          // Ignore.
        }
        throw e;
      } finally {
        if (downloadTaskRef.current === task) {
          downloadTaskRef.current = null;
        }
      }
    },
    [baseUrl, ensureDir, getDownloadedUri, removeDownloaded, setActiveDownload, setDownloaded]
  );

  const cancelActiveDownload = useCallback(async () => {
    const task = downloadTaskRef.current;
    downloadTaskRef.current = null;
    try {
      if (task) {
        await task.cancelAsync();
      }
    } finally {
      setActiveDownload(null);
    }
  }, [setActiveDownload]);

  const deleteDownload = useCallback(
    async (chapter: QuranAudioChapter) => {
      const uri = getDownloadedUri(chapter.index);
      removeDownloaded(chapter.index);
      try {
        const finalUri = uri ?? getLocalUriForFile(chapter.fileName);
        const tempUri = getTempUriForFile(chapter.fileName);
        await FileSystem.deleteAsync(finalUri, { idempotent: true });
        await FileSystem.deleteAsync(tempUri, { idempotent: true });
      } catch {
        // Ignore.
      }
    },
    [getDownloadedUri, removeDownloaded]
  );

  return useMemo(
    () => ({
      downloaded,
      activeDownload,
      isDownloaded,
      getDownloadedUri,
      ensureDownloadedUri,
      downloadChapter,
      cancelActiveDownload,
      deleteDownload,
      downloadDir: (() => {
        try {
          return getDownloadDir();
        } catch {
          return null;
        }
      })(),
    }),
    [
      activeDownload,
      cancelActiveDownload,
      deleteDownload,
      downloadChapter,
      downloaded,
      ensureDownloadedUri,
      getDownloadedUri,
      isDownloaded,
    ]
  );
}
