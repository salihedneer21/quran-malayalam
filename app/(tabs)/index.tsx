import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useIsFocused } from '@react-navigation/native';

import { MonthCalendar } from '@/src/components/calendar/month-calendar';
import { QiblaCard } from '@/src/components/qibla/qibla-card';
import { PrayerTimesCard } from '@/src/components/prayer/prayer-times-card';
import { UpcomingPrayerCard } from '@/src/components/prayer/upcoming-prayer-card';
import { QuranCard } from '@/src/components/quran/quran-card';
import { env } from '@/src/config/env';
import { AdBanner } from '@/src/features/ads/ad-banner';
import { useAds } from '@/src/features/ads/use-ads';
import { getTodayInTimeZone, type PlainDate } from '@/src/features/datetime/plain-date';
import { getTimeZoneId } from '@/src/features/timezone/timezone';
import { useAppStore } from '@/src/store/app-store';
import { palette } from '@/src/theme/palette';
import { BannerAdSize } from 'react-native-google-mobile-ads';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const ads = useAds();
  const isFocused = useIsFocused();
  const location = useAppStore((s) => s.location);
  const setLocation = useAppStore((s) => s.setLocation);
  const prayerSettings = useAppStore((s) => s.prayerSettings);
  const calendarSettings = useAppStore((s) => s.calendarSettings);
  const setCalendarSettings = useAppStore((s) => s.setCalendarSettings);

  const [selectedDate, setSelectedDate] = useState<PlainDate>(() => getTodayInTimeZone('UTC'));

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const today = useMemo(() => {
    return location?.timeZoneId ? getTodayInTimeZone(location.timeZoneId, now) : getTodayInTimeZone('UTC', now);
  }, [location?.timeZoneId, now]);

  useEffect(() => {
    if (!location?.timeZoneId) return;
    setSelectedDate(getTodayInTimeZone(location.timeZoneId));
  }, [location?.timeZoneId]);

  const [isQiblaActive, setIsQiblaActive] = useState(false);
  const [qiblaLayout, setQiblaLayout] = useState<{ y: number; height: number } | null>(null);

  useEffect(() => {
    if (isFocused) return;
    setIsQiblaActive(false);
  }, [isFocused]);

  const onQiblaLayout = (e: LayoutChangeEvent) => {
    const { y, height } = e.nativeEvent.layout;
    setQiblaLayout({ y, height });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!isQiblaActive) return;
    if (!qiblaLayout) return;

    const scrollY = e.nativeEvent.contentOffset.y;
    const viewH = e.nativeEvent.layoutMeasurement.height;

    // Deactivate only when the user scrolls a meaningful distance away.
    const margin = 260;
    const qiblaTop = qiblaLayout.y;
    const qiblaBottom = qiblaLayout.y + qiblaLayout.height;
    const viewportTop = scrollY;
    const viewportBottom = scrollY + viewH;

    const farAway = qiblaBottom < viewportTop - margin || qiblaTop > viewportBottom + margin;
    if (farAway) setIsQiblaActive(false);
  };

  useEffect(() => {
    if (!location) return;
    const apiKey = env.googleMapsApiKey;
    if (!apiKey) return;

    let cancelled = false;
    getTimeZoneId(location.latitude, location.longitude, apiKey).then((tz) => {
      if (cancelled) return;
      if (tz && tz !== location.timeZoneId) {
        setLocation({ latitude: location.latitude, longitude: location.longitude, name: location.name, timeZoneId: tz });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [location, setLocation]);

  if (!location) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.flex}>
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Choose a location</Text>
            <Text style={styles.emptyBody}>Prayer times and Qibla need your saved coordinates.</Text>
            <Pressable
              onPress={() => {
                router.push('/(onboarding)/location');
              }}
              style={styles.emptyButton}
            >
              <Text style={styles.emptyButtonText}>Select location</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: tabBarHeight + 16 }]}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
          <View style={styles.top}>
            <Text style={styles.title}>Home</Text>
            <Text style={styles.subTitle} numberOfLines={1}>
              {location.name ?? `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`}
            </Text>
          </View>

          <UpcomingPrayerCard
            latitude={location.latitude}
            longitude={location.longitude}
            settings={prayerSettings}
            timeZoneId={location.timeZoneId ?? 'UTC'}
          />

          <QuranCard />

          <MonthCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            today={today}
            showHijri={calendarSettings.showHijri}
            onToggleHijri={(v) => {
              setCalendarSettings({ showHijri: v });
            }}
          />

          <View onLayout={onQiblaLayout}>
            <QiblaCard
              latitude={location.latitude}
              longitude={location.longitude}
              isActive={isQiblaActive}
              onPressActivate={() => {
                void (async () => {
                  await ads.showRewardedInterstitial({ placement: 'home:qibla-activate', maxWaitMs: 0 });
                  setIsQiblaActive(true);
                })();
              }}
            />
          </View>

          <AdBanner placement="homeBottom" size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />

          <PrayerTimesCard
            date={selectedDate}
            latitude={location.latitude}
            longitude={location.longitude}
            settings={prayerSettings}
            timeZoneId={location.timeZoneId}
          />

          <AdBanner placement="homeBottom" size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 16 },
  top: { alignItems: 'center', gap: 4 },
  title: { color: palette.text, fontSize: 28, fontWeight: '900' },
  subTitle: { color: palette.muted, fontSize: 13, fontWeight: '600' },
  empty: { flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { color: palette.text, fontSize: 24, fontWeight: '900' },
  emptyBody: { color: palette.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', maxWidth: 320 },
  emptyButton: { marginTop: 8, backgroundColor: palette.accent, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 20 },
  emptyButtonText: { color: palette.accentText, fontSize: 15, fontWeight: '800' },
});
