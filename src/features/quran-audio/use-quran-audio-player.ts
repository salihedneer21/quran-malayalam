import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import type { QuranAudioChapter } from './types';

type PlayerSnapshot = {
  isLoaded: boolean;
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  didJustFinish: boolean;
  error: string | null;
};

export type QuranAudioPlayer = {
  currentChapter: QuranAudioChapter | null;
  isLoading: boolean;
  snapshot: PlayerSnapshot;
  playChapter: (chapter: QuranAudioChapter, opts?: { autoPlay?: boolean }) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  stop: () => Promise<void>;
  seekTo: (positionMillis: number) => Promise<void>;
  skipBy: (deltaMillis: number) => Promise<void>;
  unload: () => Promise<void>;
};

export function useQuranAudioPlayer({
  baseUrl,
  initialChapter,
  onChapterChange,
  getDownloadedUri,
}: {
  baseUrl: string;
  initialChapter: QuranAudioChapter | null;
  onChapterChange?: (chapter: QuranAudioChapter) => void;
  getDownloadedUri?: (chapterIndex: number) => string | undefined;
}): QuranAudioPlayer {
  const [currentChapter, setCurrentChapter] = useState<QuranAudioChapter | null>(initialChapter);
  const [error, setError] = useState<string | null>(null);
  const lastSeekRequestRef = useRef<{ at: number; millis: number } | null>(null);

  const currentChapterRef = useRef<QuranAudioChapter | null>(initialChapter);
  currentChapterRef.current = currentChapter;

  const player = useAudioPlayer(null, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);

  const resolveUri = useCallback(
    (chapter: QuranAudioChapter) => {
      const local = getDownloadedUri?.(chapter.index);
      return local ?? `${baseUrl}${chapter.fileName}`;
    },
    [baseUrl, getDownloadedUri]
  );

  useEffect(() => {
    // Ensure audio works in silent mode (iOS) and "ducks" other audio while playing.
    setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'duckOthers',
    }).catch(() => {
      // Non-fatal: the player will still attempt to play.
    });
  }, []);

  const unload = useCallback(async () => {
    setError(null);
    setCurrentChapter(null);
    try {
      player.pause();
      player.replace(null);
    } catch {
      // Ignore unload errors.
    }
  }, [player]);

  const playChapter = useCallback(
    async (chapter: QuranAudioChapter, opts?: { autoPlay?: boolean }) => {
      const autoPlay = opts?.autoPlay ?? true;
      setError(null);

      setCurrentChapter(chapter);
      onChapterChange?.(chapter);

      try {
        const uri = resolveUri(chapter);
        player.replace(uri);
        if (autoPlay) {
          player.play();
        } else {
          player.pause();
        }
      } catch (e: any) {
        setError(typeof e?.message === 'string' ? e.message : 'Unable to play audio.');
      }
    },
    [onChapterChange, player, resolveUri]
  );

  const togglePlayPause = useCallback(async () => {
    const chapter = currentChapterRef.current;
    if (!chapter) return;

    setError(null);
    try {
      if (!status.isLoaded) {
        const uri = resolveUri(chapter);
        player.replace(uri);
        player.play();
        return;
      }

      if (status.playing) {
        player.pause();
        return;
      }

      // expo-audio doesn't automatically rewind when finished.
      if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration - 0.25)) {
        await player.seekTo(0);
      }

      player.play();
    } catch (e: any) {
      setError(typeof e?.message === 'string' ? e.message : 'Unable to play audio.');
    }
  }, [player, resolveUri, status.currentTime, status.didJustFinish, status.duration, status.isLoaded, status.playing]);

  const stop = useCallback(async () => {
    if (!status.isLoaded) return;
    setError(null);
    try {
      player.pause();
      await player.seekTo(0);
    } catch {
      // Ignore.
    }
  }, [player, status.isLoaded]);

  const seekTo = useCallback(async (positionMillis: number) => {
    if (!status.isLoaded) return;

    const durationMillis = Math.max(0, Math.floor(status.duration * 1000));
    const clampedMillis =
      durationMillis > 0
        ? Math.max(0, Math.min(durationMillis, Math.floor(positionMillis)))
        : Math.max(0, Math.floor(positionMillis));
    const seconds = clampedMillis / 1000;

    try {
      lastSeekRequestRef.current = { at: Date.now(), millis: clampedMillis };
      await player.seekTo(seconds);
    } catch {
      // Ignore seek errors.
    }
  }, [player, status.duration, status.isLoaded]);

  const skipBy = useCallback(
    async (deltaMillis: number) => {
      if (!status.isLoaded) return;
      const now = Date.now();
      const recent = lastSeekRequestRef.current && now - lastSeekRequestRef.current.at < 900;
      const baseMillis = recent ? lastSeekRequestRef.current!.millis : Math.floor(status.currentTime * 1000);
      void seekTo(baseMillis + deltaMillis);
    },
    [seekTo, status.currentTime, status.isLoaded]
  );

  const snapshot = useMemo<PlayerSnapshot>(() => {
    const isLoaded = status.isLoaded;
    const positionMillis = Math.floor(status.currentTime * 1000);
    const durationMillis = Math.max(0, Math.floor(status.duration * 1000));

    return {
      isLoaded,
      isPlaying: status.playing,
      positionMillis,
      durationMillis,
      didJustFinish: status.didJustFinish,
      error,
    };
  }, [error, status.currentTime, status.didJustFinish, status.duration, status.isLoaded, status.playing]);

  const isLoading = Boolean(currentChapter) && (!status.isLoaded || status.isBuffering);

  return {
    currentChapter,
    isLoading,
    snapshot,
    playChapter,
    togglePlayPause,
    stop,
    seekTo,
    skipBy,
    unload,
  };
}
