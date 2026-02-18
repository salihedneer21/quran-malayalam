import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
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
import { BannerAdSize } from 'react-native-google-mobile-ads';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { BottomAdDock, useBottomAdPadding } from '@/src/features/ads/bottom-ad-dock';
import { quranChapters } from '@/src/features/quran-reading/quran-chapters';
import { useQuranReadingStore } from '@/src/features/quran-reading/quran-reading-store';
import { getQuranSurah } from '@/src/features/quran-reading/quran-surah-loader';
import type { QuranChapterMeta, QuranReadingMode, QuranVerse } from '@/src/features/quran-reading/types';
import { useAds } from '@/src/features/ads/use-ads';
import { palette } from '@/src/theme/palette';

function normalizeSearch(input: string) {
  return input.trim().toLowerCase().replace(/\s+/g, ' ');
}

function ModeCard({
  title,
  subtitle,
  selected,
  onPress,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.modeCard,
        selected && styles.modeCardSelected,
        pressed && { opacity: 0.92 },
      ]}
    >
      <View style={styles.modeIconWrap}>
        <Ionicons name={selected ? 'checkmark-circle' : 'language'} size={18} color={selected ? palette.accentText : palette.accentDark} />
      </View>
      <View style={styles.modeText}>
        <Text style={[styles.modeTitle, selected && { color: palette.accentText }]}>{title}</Text>
        <Text style={[styles.modeSub, selected && { color: 'rgba(255,255,255,0.9)' }]} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

function ChapterRow({
  chapter,
  selected,
  onPress,
}: {
  chapter: QuranChapterMeta;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${chapter.index}. ${chapter.nameTrans}`}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        pressed && { opacity: 0.9 },
      ]}
    >
      <View style={[styles.badge, selected && styles.badgeSelected]}>
        <Text style={[styles.badgeText, selected && styles.badgeTextSelected]}>{chapter.index}</Text>
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {chapter.nameTrans}
        </Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {chapter.nameMl} • {chapter.name.trim()}
        </Text>
        <Text style={styles.rowMeta}>{chapter.totalVerses} verses</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={palette.muted} />
    </Pressable>
  );
}

function VerseBlock({ verse, mode }: { verse: QuranVerse; mode: QuranReadingMode }) {
  const arabicFirst = mode === 'ar-first';
  const primary = arabicFirst ? (
    <Text style={[styles.arabic, styles.rtl]}>{verse.arabic}</Text>
  ) : (
    <Text style={[styles.malayalam, styles.ltr]}>{verse.malayalam}</Text>
  );
  const secondary = arabicFirst ? (
    <Text style={[styles.malayalam, styles.ltr]}>{verse.malayalam}</Text>
  ) : (
    <Text style={[styles.arabic, styles.rtl]}>{verse.arabic}</Text>
  );

  return (
    <View style={styles.verse}>
      <View style={styles.verseHeader}>
        <View style={styles.verseNumber}>
          <Text style={styles.verseNumberText}>{verse.number}</Text>
        </View>
      </View>
      {primary}
      {secondary}
      <View style={styles.verseDivider} />
    </View>
  );
}

export default function QuranReadingScreen() {
  const bottomDockSize = BannerAdSize.BANNER;
  const tabBarHeight = useBottomTabBarHeight();
  const bottomAdPadding = useBottomAdPadding(bottomDockSize);
  const ads = useAds();

  const mode = useQuranReadingStore((s) => s.mode);
  const setMode = useQuranReadingStore((s) => s.setMode);
  const lastChapterIndex = useQuranReadingStore((s) => s.lastChapterIndex);
  const setLastChapterIndex = useQuranReadingStore((s) => s.setLastChapterIndex);

  const [query, setQuery] = useState('');
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number | null>(null);

  const filteredChapters = useMemo(() => {
    const q = normalizeSearch(query);
    if (!q) return quranChapters;

    const qNum = Number(q);
    const hasNum = Number.isFinite(qNum);

    return quranChapters.filter((c) => {
      if (hasNum && String(c.index).startsWith(String(qNum))) return true;
      const hay = normalizeSearch(`${c.nameTrans} ${c.nameMl} ${c.name}`);
      return hay.includes(q);
    });
  }, [query]);

  const selectedChapter = useMemo(() => {
    if (!selectedChapterIndex) return null;
    return quranChapters.find((c) => c.index === selectedChapterIndex) ?? null;
  }, [selectedChapterIndex]);

  const surah = useMemo(() => {
    if (!selectedChapterIndex) return null;
    try {
      return getQuranSurah(selectedChapterIndex);
    } catch {
      return null;
    }
  }, [selectedChapterIndex]);

  const onChangeQuery = useCallback((e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    setQuery(e.nativeEvent.text);
  }, []);

  const onSelectChapter = useCallback(
    (chapterIndex: number) => {
      setSelectedChapterIndex(chapterIndex);
      setLastChapterIndex(chapterIndex);
    },
    [setLastChapterIndex]
  );

  const onBackToChapters = useCallback(() => {
    setSelectedChapterIndex(null);
  }, []);

  const bottomPad = bottomAdPadding + 16;
  const readerBottomPad = tabBarHeight + 16;

  if (selectedChapter && surah) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.flex}>
          <View style={styles.headerSection}>
            <View style={styles.readerTop}>
              <Pressable
                onPress={() => {
                  onBackToChapters();
                }}
                accessibilityRole="button"
                accessibilityLabel="Back to chapters"
                style={({ pressed }) => [styles.readerBackBtn, pressed && { opacity: 0.85 }]}
              >
                <Ionicons name="arrow-back" size={18} color={palette.text} />
              </Pressable>
              <View style={styles.readerTitleWrap}>
                <Text style={styles.readerTitle} numberOfLines={1}>
                  {surah.nameTrans}
                </Text>
                <Text style={styles.readerSub} numberOfLines={1}>
                  {surah.nameMl} • {surah.name.trim()} • {surah.totalVerses} verses
                </Text>
              </View>
            </View>

            <View style={styles.modeRow}>
              <ModeCard
                title="Malayalam Quran"
                subtitle="Malayalam first, Arabic included"
                selected={mode === 'ml-first'}
                onPress={() => {
                  setMode('ml-first');
                }}
              />
              <ModeCard
                title="Arabic Quran"
                subtitle="Arabic first, Malayalam included"
                selected={mode === 'ar-first'}
                onPress={() => {
                  setMode('ar-first');
                }}
              />
            </View>
          </View>

          <View style={styles.listContainer}>
            <FlashList
              data={surah.verses}
              keyExtractor={(v) => String(v.number)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: readerBottomPad }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => <VerseBlock verse={item} mode={mode} />}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const lastChapter = lastChapterIndex ? quranChapters.find((c) => c.index === lastChapterIndex) ?? null : null;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.headerSection}>
          <View style={styles.header}>
            <Text style={styles.title}>Quran Reading</Text>
            <Text style={styles.subTitle}>Arabic + Malayalam • 114 surahs</Text>
          </View>

          <View style={styles.modeRow}>
            <ModeCard
              title="Malayalam Quran"
              subtitle="Malayalam first, Arabic included"
              selected={mode === 'ml-first'}
              onPress={() => {
                void (async () => {
                  await ads.showInterstitial({ placement: 'reading:mode-ml-first', maxWaitMs: 0 });
                  setMode('ml-first');
                })();
              }}
            />
            <ModeCard
              title="Arabic Quran"
              subtitle="Arabic first, Malayalam included"
              selected={mode === 'ar-first'}
              onPress={() => {
                void (async () => {
                  await ads.showInterstitial({ placement: 'reading:mode-ar-first', maxWaitMs: 0 });
                  setMode('ar-first');
                })();
              }}
            />
          </View>

          {lastChapter && (
            <Pressable
              onPress={() => {
                void (async () => {
                  await ads.showInterstitial({ placement: 'reading:continue', maxWaitMs: 0 });
                  onSelectChapter(lastChapter.index);
                })();
              }}
              accessibilityRole="button"
              accessibilityLabel="Continue reading"
              style={({ pressed }) => [styles.continueCard, pressed && { opacity: 0.92 }]}
            >
              <View style={styles.continueLeft}>
                <Text style={styles.continueLabel}>Continue</Text>
                <Text style={styles.continueTitle} numberOfLines={1}>
                  {lastChapter.nameTrans}
                </Text>
                <Text style={styles.continueSub} numberOfLines={1}>
                  {lastChapter.nameMl} • {lastChapter.name.trim()}
                </Text>
              </View>
              <Ionicons name="play" size={18} color={palette.accentText} />
            </Pressable>
          )}

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
              <Pressable
                onPress={() => setQuery('')}
                style={styles.clearBtn}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <Ionicons name="close-circle" size={16} color={palette.muted} />
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.listContainer}>
          <FlashList
            data={filteredChapters}
            keyExtractor={(item) => String(item.index)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPad }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <ChapterRow
                chapter={item}
                selected={item.index === lastChapterIndex}
                onPress={() => {
                  void (async () => {
                    await ads.showInterstitial({ placement: 'reading:select-chapter', maxWaitMs: 0 });
                    onSelectChapter(item.index);
                  })();
                }}
              />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No results</Text>
                <Text style={styles.emptyBody}>Try searching by surah name or number.</Text>
              </View>
            }
          />
        </View>
      </SafeAreaView>

      <BottomAdDock placement="bottomDock" size={bottomDockSize} />
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
  separator: { height: 10 },

  modeRow: { flexDirection: 'row', gap: 10 },
  modeCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  modeCardSelected: { backgroundColor: palette.accentDark, shadowOpacity: 0.1, elevation: 2 },
  modeIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeText: { flex: 1, gap: 2 },
  modeTitle: { color: palette.text, fontSize: 14, fontWeight: '900' },
  modeSub: { color: palette.muted, fontSize: 11, fontWeight: '700', lineHeight: 15 },

  continueCard: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: palette.accentDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  continueLeft: { flex: 1, gap: 2, paddingRight: 10 },
  continueLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  continueTitle: { color: palette.accentText, fontSize: 16, fontWeight: '900' },
  continueSub: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '700' },

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
  rowSelected: { backgroundColor: '#E8F5E9', shadowOpacity: 0.08 },
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

  empty: { padding: 16, alignItems: 'center', gap: 8 },
  emptyTitle: { color: palette.text, fontSize: 16, fontWeight: '800' },
  emptyBody: { color: palette.muted, fontSize: 13, fontWeight: '600', textAlign: 'center', maxWidth: 320 },

  readerTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  readerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  readerTitleWrap: { flex: 1, gap: 2 },
  readerTitle: { color: palette.text, fontSize: 18, fontWeight: '900' },
  readerSub: { color: palette.muted, fontSize: 12, fontWeight: '700' },

  verse: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  verseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
  verseNumber: {
    minWidth: 34,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  verseNumberText: { color: palette.text, fontSize: 12, fontWeight: '900' },
  verseDivider: { height: 1, backgroundColor: palette.borderLight, borderRadius: 99 },

  arabic: {
    color: palette.text,
    fontSize: 20,
    lineHeight: 34,
    fontWeight: '600',
  },
  malayalam: {
    color: palette.textSecondary,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '600',
  },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  ltr: { writingDirection: 'ltr', textAlign: 'left' },
});
