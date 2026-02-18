import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputChangeEventData,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BannerAdSize } from 'react-native-google-mobile-ads';

import { AdBanner } from '@/src/features/ads/ad-banner';
import { formatBytes, formatSeconds } from '@/src/features/quran-audio/format';
import { SeekBar } from '@/src/features/quran-audio/seek-bar';
import { useQuranAudioDownloadsStore } from '@/src/features/quran-audio/quran-audio-downloads-store';
import { useQuranAudioDownloads } from '@/src/features/quran-audio/use-quran-audio-downloads';
import { quranAudioMalayalam } from '@/src/features/quran-audio/quran-audio-malayalam';
import { useQuranAudioStore } from '@/src/features/quran-audio/quran-audio-store';
import { useQuranAudioPlayer } from '@/src/features/quran-audio/use-quran-audio-player';
import type { QuranAudioChapter } from '@/src/features/quran-audio/types';
import { useAds } from '@/src/features/ads/use-ads';
import { palette } from '@/src/theme/palette';

function normalizeSearch(input: string) {
  return input.trim().toLowerCase().replace(/\s+/g, ' ');
}

function buildMailtoUrl({ subject, to }: { subject: string; to: string[] }) {
  const recipients = to.join(',');
  const qs = `subject=${encodeURIComponent(subject)}`;
  return `mailto:${recipients}?${qs}`;
}

export default function QuranAudioScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const ads = useAds();

  const lastChapterIndex = useQuranAudioStore((s) => s.lastChapterIndex);
  const setLastChapterIndex = useQuranAudioStore((s) => s.setLastChapterIndex);

  const chapters = quranAudioMalayalam.chapters;

  const initialChapter = useMemo(() => {
    if (!lastChapterIndex) return null;
    return chapters.find((c) => c.index === lastChapterIndex) ?? null;
  }, [chapters, lastChapterIndex]);

  const downloads = useQuranAudioDownloads({ baseUrl: quranAudioMalayalam.baseUrl });

  const player = useQuranAudioPlayer({
    baseUrl: quranAudioMalayalam.baseUrl,
    initialChapter,
    onChapterChange: (chapter) => setLastChapterIndex(chapter.index),
    getDownloadedUri: downloads.getDownloadedUri,
  });

  const selectedChapter = useMemo(() => {
    if (player.currentChapter) return player.currentChapter;
    return initialChapter;
  }, [initialChapter, player.currentChapter]);

  useEffect(() => {
    if (!selectedChapter) return;
    // Prune stale download mappings so UI state matches reality.
    void downloads.ensureDownloadedUri(selectedChapter);
  }, [downloads, selectedChapter]);

  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = normalizeSearch(query);
    if (!q) return chapters;

    const qNum = Number(q);
    const hasNum = Number.isFinite(qNum);

    return chapters.filter((c) => {
      if (hasNum && String(c.index).startsWith(String(qNum))) return true;
      const hay = normalizeSearch(`${c.nameTrans} ${c.nameMl} ${c.name}`);
      return hay.includes(q);
    });
  }, [chapters, query]);

  const downloadIntentTokenRef = useRef(0);

  const startDownloadInBackground = useCallback(
    (chapter: QuranAudioChapter) => {
      downloadIntentTokenRef.current += 1;
      const token = downloadIntentTokenRef.current;

      void (async () => {
        const existing = await downloads.ensureDownloadedUri(chapter);
        if (existing) return;

        if (downloadIntentTokenRef.current !== token) return;

        const active = useQuranAudioDownloadsStore.getState().activeDownload;
        if (active && active.chapterIndex !== chapter.index) {
          await downloads.cancelActiveDownload();
        }

        if (downloadIntentTokenRef.current !== token) return;

        const activeNow = useQuranAudioDownloadsStore.getState().activeDownload;
        if (activeNow?.chapterIndex === chapter.index && !activeNow.error) return;

        try {
          await downloads.downloadChapter(chapter);
        } catch {
          // Errors are stored in the downloads store for the UI.
        }
      })();
    },
    [downloads]
  );

  const rewardedAttemptedChaptersRef = useRef<Set<number>>(new Set());

  const maybeShowRewardedForChapter = useCallback(
    async (chapter: QuranAudioChapter) => {
      if (rewardedAttemptedChaptersRef.current.has(chapter.index)) return;
      const result = await ads.showRewardedAudio({ placement: `quran-audio:${chapter.index}`, maxWaitMs: 0 });
      if (result.shown) rewardedAttemptedChaptersRef.current.add(chapter.index);
    },
    [ads]
  );

  const playFromBeginningAndDownload = useCallback(
    async (chapter: QuranAudioChapter) => {
      await maybeShowRewardedForChapter(chapter);

      // Start playback immediately (streams if not downloaded).
      await player.playChapter(chapter, { autoPlay: true });
      // Download for offline use without blocking playback.
      startDownloadInBackground(chapter);
    },
    [maybeShowRewardedForChapter, player, startDownloadInBackground]
  );

  const playNext = useCallback(async () => {
    if (!selectedChapter) return;
    const idx = chapters.findIndex((c) => c.index === selectedChapter.index);
    const next = idx >= 0 ? chapters[idx + 1] : undefined;
    if (!next) return;
    await playFromBeginningAndDownload(next);
  }, [chapters, playFromBeginningAndDownload, selectedChapter]);

  const playPrev = useCallback(async () => {
    if (!selectedChapter) return;
    const idx = chapters.findIndex((c) => c.index === selectedChapter.index);
    const prev = idx > 0 ? chapters[idx - 1] : undefined;
    if (!prev) return;
    await playFromBeginningAndDownload(prev);
  }, [chapters, playFromBeginningAndDownload, selectedChapter]);

  useEffect(() => {
    if (!player.snapshot.isLoaded) return;
    if (!player.snapshot.didJustFinish) return;
    void playNext();
  }, [playNext, player.snapshot.didJustFinish, player.snapshot.isLoaded]);

  const onPressPrimary = useCallback(
    async (chapter: QuranAudioChapter) => {
      // Toggle play/pause for the currently loaded chapter. Otherwise start from the beginning.
      const isSameChapter = player.currentChapter?.index === chapter.index;
      const isLoadedThis = isSameChapter && player.snapshot.isLoaded;
      const isPlayingThis = isLoadedThis && player.snapshot.isPlaying;

      if (isPlayingThis) {
        await player.togglePlayPause();
        return;
      }

      await maybeShowRewardedForChapter(chapter);

      if (isSameChapter && player.snapshot.isLoaded) {
        await player.togglePlayPause();
      } else {
        await player.playChapter(chapter, { autoPlay: true });
      }
      startDownloadInBackground(chapter);
    },
    [maybeShowRewardedForChapter, player, startDownloadInBackground]
  );

  const onChangeQuery = useCallback((e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    setQuery(e.nativeEvent.text);
  }, []);

  const onShare = useCallback(async () => {
    void ads.showInterstitial({ placement: 'audio:share', maxWaitMs: 0 });
    await Share.share({ message: quranAudioMalayalam.shareText });
  }, [ads]);

  const onContact = useCallback(async () => {
    void ads.showInterstitial({ placement: 'audio:contact', maxWaitMs: 0 });
    const url = buildMailtoUrl(quranAudioMalayalam.mail);
    const can = await Linking.canOpenURL(url);
    if (can) {
      await Linking.openURL(url);
    }
  }, [ads]);

  const isPlaying = player.snapshot.isLoaded && player.snapshot.isPlaying;

  const [playerHeight, setPlayerHeight] = useState(280);
  const bottomPad = tabBarHeight + 16 + (selectedChapter ? playerHeight + 16 : 0);

  const selectedIsDownloaded = selectedChapter ? Boolean(downloads.downloaded[selectedChapter.index]) : false;
  const selectedDownload =
    selectedChapter && downloads.activeDownload?.chapterIndex === selectedChapter.index ? downloads.activeDownload : null;
  const isDownloadingSelected = Boolean(selectedDownload);
  const selectedProgressLabel = selectedDownload
    ? (() => {
        const written = formatBytes(selectedDownload.bytesWritten ?? 0);
        const expected = selectedDownload.bytesExpected > 0 ? formatBytes(selectedDownload.bytesExpected) : null;
        return expected ? `Downloading ${written} / ${expected}` : `Downloading ${written}`;
      })()
    : null;
  const selectedProgressRatio =
    selectedDownload && selectedDownload.bytesExpected > 0
      ? Math.max(0, Math.min(1, selectedDownload.bytesWritten / selectedDownload.bytesExpected))
      : null;

  const durationMillisForUi =
    selectedChapter && player.snapshot.durationMillis > 0 ? player.snapshot.durationMillis : (selectedChapter?.durationInSecs ?? 0) * 1000;
  const positionSecsForUi = player.snapshot.positionMillis / 1000;
  const durationSecsForUi = durationMillisForUi / 1000;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.headerSection}>
          <View style={styles.header}>
            <Text style={styles.title}>Quran Audio</Text>
            <Text style={styles.subTitle}>Malayalam meaning • 114 surahs</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={onShare}
              accessibilityRole="button"
              accessibilityLabel="Share"
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="share-social" size={18} color={palette.text} />
            </Pressable>
            <Pressable
              onPress={onContact}
              accessibilityRole="button"
              accessibilityLabel="Contact"
              style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="mail" size={18} color={palette.text} />
            </Pressable>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search" size={16} color={palette.muted} />
            <TextInput
              value={query}
              onChange={onChangeQuery}
              placeholder="Search surah (name or number)"
              placeholderTextColor={palette.muted}
              style={styles.search}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {query.trim().length > 0 && (
              <Pressable onPress={() => setQuery('')} style={styles.clearBtn} accessibilityRole="button" accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={16} color={palette.muted} />
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.listContainer}>
          <FlashList
            data={filtered}
            keyExtractor={(item) => String(item.index)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPad }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => {
              const isSelected = selectedChapter?.index === item.index;
              const isDownloaded = Boolean(downloads.downloaded[item.index]);
              const download = downloads.activeDownload;
              const isDownloadingThis = download?.chapterIndex === item.index;
              const isLoadingThis = player.isLoading && player.currentChapter?.index === item.index;
              const isLoadedThis = player.snapshot.isLoaded && player.currentChapter?.index === item.index;
              const isPlayingThis = isLoadedThis && player.snapshot.isPlaying;

              const progressLabel = isDownloadingThis
                ? (() => {
                    const written = formatBytes(download?.bytesWritten ?? 0);
                    const expected = download?.bytesExpected && download.bytesExpected > 0 ? formatBytes(download.bytesExpected) : null;
                    return expected ? `Downloading ${written} / ${expected}` : `Downloading ${written}`;
                  })()
                : null;
              const progressRatio =
                isDownloadingThis && download?.bytesExpected && download.bytesExpected > 0
                  ? Math.max(0, Math.min(1, download.bytesWritten / download.bytesExpected))
                  : null;

              return (
                <Pressable
                  onPress={() => playFromBeginningAndDownload(item)}
                  style={({ pressed }) => [
                    styles.row,
                    isSelected && styles.rowSelected,
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  <View style={[styles.badge, isSelected && styles.badgeSelected]}>
                    <Text style={[styles.badgeText, isSelected && styles.badgeTextSelected]}>{item.index}</Text>
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {item.nameTrans}
                    </Text>
                    <Text style={styles.rowSub} numberOfLines={1}>
                      {item.nameMl} • {item.name.trim()}
                    </Text>
                    <Text style={styles.rowMeta}>{formatSeconds(item.durationInSecs)} • {item.size.trim()}</Text>
                    {isDownloadingThis && progressLabel && <Text style={styles.downloadMeta}>{progressLabel}</Text>}
                    {isDownloadingThis && download?.error && <Text style={styles.downloadError}>{download.error}</Text>}
                    {isDownloadingThis && progressRatio !== null && (
                      <View style={styles.downloadTrack}>
                        <View style={[styles.downloadFill, { width: `${progressRatio * 100}%` }]} />
                      </View>
                    )}
                  </View>
                  <View style={styles.rowRight}>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        if (isSelected) {
                          void onPressPrimary(item);
                        } else {
                          void playFromBeginningAndDownload(item);
                        }
                      }}
                      style={({ pressed }) => [pressed && { opacity: 0.85 }]}
                      accessibilityRole="button"
                      accessibilityLabel={isSelected ? (isPlayingThis ? 'Pause' : 'Play') : isDownloaded ? 'Play' : 'Download and play'}
                    >
                      {isSelected ? (
                        isLoadingThis ? (
                          <ActivityIndicator size="small" color={palette.accentDark} />
                        ) : (
                          <Ionicons name={isPlayingThis ? 'pause' : 'play'} size={18} color={palette.accentDark} />
                        )
                      ) : isDownloadingThis ? (
                        <ActivityIndicator size="small" color={palette.accentDark} />
                      ) : !isDownloaded ? (
                        <Ionicons name="download" size={18} color={palette.accentDark} />
                      ) : (
                        <Ionicons name="play" size={18} color={palette.muted} />
                      )}
                    </Pressable>
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No results</Text>
                <Text style={styles.emptyBody}>Try searching by surah name or number.</Text>
              </View>
            }
          />
        </View>
      </SafeAreaView>

      {selectedChapter && (
        <View style={[styles.playerWrap, { bottom: tabBarHeight + 12 }]} pointerEvents="box-none">
          <View
            style={styles.playerCard}
            onLayout={(e) => {
              const h = Math.ceil(e.nativeEvent.layout.height);
              if (h > 0 && Math.abs(h - playerHeight) > 2) setPlayerHeight(h);
            }}
          >
            <View style={styles.playerTop}>
              <View style={styles.playerText}>
                <Text style={styles.playerTitle} numberOfLines={1}>
                  {selectedChapter.nameTrans}
                </Text>
                <Text style={styles.playerSub} numberOfLines={1}>
                  {selectedChapter.nameMl} • {selectedChapter.name.trim()}
                </Text>
              </View>
              <Pressable
                onPress={() => void onPressPrimary(selectedChapter)}
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
                style={({ pressed }) => [styles.playBtn, pressed && { opacity: 0.9 }]}
              >
                {player.isLoading ? (
                  <ActivityIndicator size="small" color={palette.accentText} />
                ) : (
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color={palette.accentText} />
                )}
              </Pressable>
            </View>

            {player.snapshot.error && (
              <Text style={styles.errorText} numberOfLines={2}>
                {player.snapshot.error}
              </Text>
            )}

            <View style={styles.playerBanner}>
              <AdBanner placement="bottomDock" size={BannerAdSize.BANNER} />
            </View>

            <SeekBar
              positionMillis={player.snapshot.positionMillis}
              durationMillis={durationMillisForUi}
              onSeekToMillis={(ms) => {
                void player.seekTo(ms);
              }}
              disabled={!player.snapshot.isLoaded || !selectedIsDownloaded}
            />
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatSeconds(positionSecsForUi)}</Text>
              <Text style={styles.timeText}>{formatSeconds(durationSecsForUi)}</Text>
            </View>

            {isDownloadingSelected && selectedProgressLabel && <Text style={styles.downloadMeta}>{selectedProgressLabel}</Text>}
            {isDownloadingSelected && selectedDownload?.error && <Text style={styles.downloadError}>{selectedDownload.error}</Text>}
            {isDownloadingSelected && selectedProgressRatio !== null && (
              <View style={styles.downloadTrack}>
                <View style={[styles.downloadFill, { width: `${selectedProgressRatio * 100}%` }]} />
              </View>
            )}

            <View style={styles.controls}>
              <Pressable onPress={playPrev} style={styles.ctrlBtn} accessibilityRole="button" accessibilityLabel="Previous surah">
                <Ionicons name="play-skip-back" size={18} color={palette.text} />
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!selectedIsDownloaded) return;
                  void player.skipBy(-15_000);
                }}
                disabled={!selectedIsDownloaded || !player.snapshot.isLoaded}
                style={[styles.ctrlBtn, (!selectedIsDownloaded || !player.snapshot.isLoaded) && { opacity: 0.45 }]}
                accessibilityRole="button"
                accessibilityLabel="Rewind 15 seconds"
              >
                <Ionicons name="play-back" size={18} color={palette.text} />
              </Pressable>
              <Pressable
                onPress={() => void onPressPrimary(selectedChapter)}
                style={styles.ctrlBtnPrimary}
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
              >
                {player.isLoading ? (
                  <ActivityIndicator size="small" color={palette.accentText} />
                ) : (
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color={palette.accentText} />
                )}
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!selectedIsDownloaded) return;
                  void player.skipBy(15_000);
                }}
                disabled={!selectedIsDownloaded || !player.snapshot.isLoaded}
                style={[styles.ctrlBtn, (!selectedIsDownloaded || !player.snapshot.isLoaded) && { opacity: 0.45 }]}
                accessibilityRole="button"
                accessibilityLabel="Forward 15 seconds"
              >
                <Ionicons name="play-forward" size={18} color={palette.text} />
              </Pressable>
              <Pressable onPress={playNext} style={styles.ctrlBtn} accessibilityRole="button" accessibilityLabel="Next surah">
                <Ionicons name="play-skip-forward" size={18} color={palette.text} />
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  flex: { flex: 1 },
  headerSection: { paddingHorizontal: 16, gap: 14 },
  listContainer: { flex: 1 },
  header: { alignItems: 'center', gap: 4 },
  title: { color: palette.text, fontSize: 28, fontWeight: '900' },
  subTitle: { color: palette.muted, fontSize: 13, fontWeight: '600' },
  headerActions: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  separator: { height: 10 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  search: { flex: 1, color: palette.text, fontSize: 14, fontWeight: '600' },
  clearBtn: { padding: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  rowSelected: {
    backgroundColor: '#E8F5E9',
    shadowOpacity: 0.08,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSelected: { backgroundColor: palette.accentDark },
  badgeText: { color: palette.text, fontSize: 13, fontWeight: '900' },
  badgeTextSelected: { color: palette.accentText },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { color: palette.text, fontSize: 15, fontWeight: '800' },
  rowSub: { color: palette.muted, fontSize: 12, fontWeight: '600' },
  rowMeta: { color: '#9E9E9E', fontSize: 11, fontWeight: '600' },
  downloadMeta: { color: palette.accentDark, fontSize: 11, fontWeight: '700' },
  downloadError: { color: palette.danger, fontSize: 11, fontWeight: '700' },
  downloadTrack: { height: 6, borderRadius: 99, backgroundColor: '#EAEAEA', overflow: 'hidden' },
  downloadFill: { height: 6, borderRadius: 99, backgroundColor: palette.accentDark },
  rowRight: { width: 24, alignItems: 'flex-end' },
  empty: { padding: 16, alignItems: 'center', gap: 8 },
  emptyTitle: { color: palette.text, fontSize: 16, fontWeight: '800' },
  emptyBody: { color: palette.muted, fontSize: 13, fontWeight: '600', textAlign: 'center', maxWidth: 320 },
  playerWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  playerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  playerTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  playerText: { flex: 1, gap: 2 },
  playerTitle: { color: palette.text, fontSize: 16, fontWeight: '900' },
  playerSub: { color: palette.muted, fontSize: 12, fontWeight: '700' },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: palette.accentDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: { color: palette.danger, fontSize: 12, fontWeight: '700' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  timeText: { color: palette.muted, fontSize: 11, fontWeight: '700' },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ctrlBtn: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlBtnPrimary: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: palette.accentDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerBanner: { alignItems: 'center' },
});
