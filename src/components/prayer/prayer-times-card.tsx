import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { getTodayInTimeZone, isSamePlainDate, type PlainDate } from '@/src/features/datetime/plain-date';
import { palette } from '@/src/theme/palette';
import { formatTime, getDailyPrayerTimes, type DailyPrayerTimes, type PrayerSettings } from '@/src/features/prayer/prayer-times';

type Props = {
  date: PlainDate;
  latitude: number;
  longitude: number;
  settings: PrayerSettings;
  timeZoneId: string;
};

type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

const PRAYERS: Array<{ key: PrayerKey; label: string }> = [
  { key: 'fajr', label: 'Fajr' },
  { key: 'dhuhr', label: 'Dhuhr' },
  { key: 'asr', label: 'Asr' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isha', label: 'Isha' },
];

const GRADIENT_COLORS = ['#1B5E20', '#2E7D32', '#1B5E20'] as const;

export function PrayerTimesCard({ date, latitude, longitude, settings, timeZoneId }: Props) {
  const [times, setTimes] = useState<DailyPrayerTimes | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const method = settings.calculationMethod;
  const madhab = settings.madhab;

  useEffect(() => {
    let cancelled = false;

    setStatus('loading');
    setError(null);
    setTimes(null);

    (async () => {
      try {
        const next = await getDailyPrayerTimes(date, latitude, longitude, settings);
        if (cancelled) return;
        setTimes(next);
        setStatus('ready');
      } catch (e) {
        if (cancelled) return;
        setError((e as Error)?.message ?? 'Failed to compute prayer times.');
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [date.day, date.month, date.year, latitude, longitude, method, madhab]);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const nowDate = useMemo(() => getTodayInTimeZone(timeZoneId, now), [now, timeZoneId]);

  const nextPrayerKey = useMemo(() => {
    if (!times) return null;
    if (!isSamePlainDate(date, nowDate)) return null;

    const nowMs = now.getTime();
    for (const p of PRAYERS) {
      if (times[p.key].getTime() > nowMs) return p.key;
    }
    return null;
  }, [date, now, nowDate, times]);

  if (status === 'loading') {
    return (
      <LinearGradient colors={GRADIENT_COLORS} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Prayer Times</Text>
          <Text style={styles.subtitle}>Loading...</Text>
        </View>
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#FFFFFF" />
          <Text style={styles.loadingText}>Calculating on-device...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (status === 'error' || !times) {
    return (
      <LinearGradient colors={GRADIENT_COLORS} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Prayer Times</Text>
          <Text style={styles.subtitle}>Unavailable</Text>
        </View>
        <Text style={styles.error}>{error ?? 'Failed to compute prayer times.'}</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={GRADIENT_COLORS} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Prayer Times</Text>
        <Text style={styles.subtitle}>
          {settings.calculationMethod} • {settings.madhab}
        </Text>
      </View>

      <View style={styles.grid}>
        {PRAYERS.map((p) => {
          const isNext = nextPrayerKey === p.key;
          return (
            <View key={p.key} style={[styles.row, isNext && styles.rowNext]}>
              <Text style={[styles.label, isNext && styles.labelNext]}>{p.label}</Text>
              <Text style={[styles.time, isNext && styles.timeNext]}>{formatTime(times[p.key], timeZoneId)}</Text>
            </View>
          );
        })}

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.labelMuted}>Sunrise</Text>
          <Text style={styles.timeMuted}>{formatTime(times.sunrise, timeZoneId)}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  header: { gap: 2 },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  subtitle: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 12, fontWeight: '600' },
  grid: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  rowNext: {
    backgroundColor: palette.gold,
    borderWidth: 0,
  },
  label: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  time: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  labelNext: { color: '#1B5E20' },
  timeNext: { color: '#1B5E20' },
  divider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.2)', marginVertical: 4 },
  labelMuted: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 14, fontWeight: '600' },
  timeMuted: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 14, fontWeight: '700' },
  error: { color: '#FFCDD2', fontSize: 12, lineHeight: 16 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 6 },
  loadingText: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 13, fontWeight: '600' },
});
