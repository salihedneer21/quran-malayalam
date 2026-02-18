import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { quranChapters } from '@/src/features/quran-reading/quran-chapters';
import { useQuranReadingStore } from '@/src/features/quran-reading/quran-reading-store';
import { useAds } from '@/src/features/ads/use-ads';

// Placeholder - Replace with actual icons (44x44 recommended)
const NAMAZ_BG = require('@/assets/images/namaz/namaz.png');

type QuranRowProps = {
  title: string;
  subtitle: string;
  onPress?: () => void;
};

function QuranRow({ title, subtitle, onPress }: QuranRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: '#F0F0F0' }]}
    >
      <Image source={NAMAZ_BG} style={styles.rowIcon} resizeMode="cover" />
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#C0C0C0" />
    </Pressable>
  );
}

export function QuranCard() {
  const ads = useAds();
  const lastChapterIndex = useQuranReadingStore((s) => s.lastChapterIndex);
  const lastChapter = useMemo(() => {
    if (!lastChapterIndex) return null;
    return quranChapters.find((c) => c.index === lastChapterIndex) ?? null;
  }, [lastChapterIndex]);

  return (
    <View style={styles.container}>
      {/* Rows */}
      <QuranRow
        title="Find Qibla"
        subtitle="Point towards Qibla"
        onPress={() => {}}
      />

      <View style={styles.divider} />

      <QuranRow
        title="Quran Reading"
        subtitle="Read Arabic and Malayalam"
        onPress={() => {
          void (async () => {
            await ads.showInterstitial({ placement: 'home:quran-reading', maxWaitMs: 0 });
            router.push('/(tabs)/quran-reading');
          })();
        }}
      />

      {/* Last Read Section */}
      <View style={styles.lastReadSection}>
        <Text style={styles.lastReadLabel}>Last Read</Text>
        <View style={styles.lastReadRow}>
          <View style={styles.lastReadInfo}>
            <Text style={styles.lastReadSurah} numberOfLines={1}>
              {lastChapter?.nameTrans ?? 'Select a surah'}
            </Text>
            <Text style={styles.lastReadAyah} numberOfLines={1}>
              {lastChapter ? `${lastChapter.nameMl} • ${lastChapter.totalVerses} verses` : 'Start reading from any surah'}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              void (async () => {
                await ads.showInterstitial({ placement: 'home:continue-reading', maxWaitMs: 0 });
                router.push('/(tabs)/quran-reading');
              })();
            }}
            style={({ pressed }) => [styles.continueButton, pressed && { opacity: 0.92 }]}
            accessibilityRole="button"
            accessibilityLabel="Continue reading"
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  rowContent: {
    flex: 1,
    gap: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  rowSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#888888',
  },
  divider: {
    height: 0.5,
    backgroundColor: '#E8E8E8',
    marginLeft: 68,
  },
  lastReadSection: {
    borderTopWidth: 0.5,
    borderTopColor: '#E8E8E8',
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  lastReadLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  lastReadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastReadInfo: {
    gap: 1,
  },
  lastReadSurah: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  lastReadAyah: {
    fontSize: 12,
    fontWeight: '400',
    color: '#888888',
  },
  continueButton: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  continueButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
