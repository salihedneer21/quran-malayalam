import { useEffect, useMemo, useState } from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getTodayInTimeZone } from '@/src/features/datetime/plain-date';
import { formatTime, getDailyPrayerTimes, type DailyPrayerTimes, type PrayerSettings } from '@/src/features/prayer/prayer-times';

const NAMAZ_BG = require('@/assets/images/namaz/namaz.png');

type Props = {
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

export function UpcomingPrayerCard({ latitude, longitude, settings, timeZoneId }: Props) {
  const [times, setTimes] = useState<DailyPrayerTimes | null>(null);

  const method = settings.calculationMethod;
  const madhab = settings.madhab;

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Always use today's date for upcoming prayer
  const today = useMemo(() => getTodayInTimeZone(timeZoneId, now.getTime()), [timeZoneId, now]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const next = await getDailyPrayerTimes(today, latitude, longitude, settings);
        if (cancelled) return;
        setTimes(next);
      } catch {
        // Silently fail
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [today.day, today.month, today.year, latitude, longitude, method, madhab, settings]);

  // Get tomorrow's prayer times for fallback
  const tomorrow = useMemo(() => {
    const t = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return getTodayInTimeZone(timeZoneId, t.getTime());
  }, [timeZoneId, now]);

  const [tomorrowTimes, setTomorrowTimes] = useState<DailyPrayerTimes | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const next = await getDailyPrayerTimes(tomorrow, latitude, longitude, settings);
        if (cancelled) return;
        setTomorrowTimes(next);
      } catch {
        // Silently fail
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tomorrow.day, tomorrow.month, tomorrow.year, latitude, longitude, method, madhab, settings]);

  const upcomingPrayer = useMemo(() => {
    const nowMs = now.getTime();

    // Check today's prayers first
    if (times) {
      for (const p of PRAYERS) {
        const prayerTime = times[p.key].getTime();
        if (prayerTime > nowMs) {
          const diffMs = prayerTime - nowMs;
          const diffMins = Math.floor(diffMs / 60000);
          const hours = Math.floor(diffMins / 60);
          const mins = diffMins % 60;

          return {
            key: p.key,
            label: p.label,
            time: times[p.key],
            timeRemaining: hours > 0 ? `in ${hours}h ${mins}m` : `in ${mins} min`,
          };
        }
      }
    }

    // If all today's prayers are done, show tomorrow's Fajr
    if (tomorrowTimes) {
      const fajrTime = tomorrowTimes.fajr.getTime();
      const diffMs = fajrTime - nowMs;
      const diffMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;

      return {
        key: 'fajr' as PrayerKey,
        label: 'Fajr',
        time: tomorrowTimes.fajr,
        timeRemaining: hours > 0 ? `in ${hours}h ${mins}m` : `in ${mins} min`,
      };
    }

    return null;
  }, [now, times, tomorrowTimes]);

  if (!upcomingPrayer) {
    return null;
  }

  return (
    <ImageBackground
      source={NAMAZ_BG}
      style={styles.container}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      {/* Content */}
      <View style={styles.content}>
        <View style={styles.leftContent}>
          <Text style={styles.upcomingLabel}>Upcoming</Text>
          <Text style={styles.prayerName}>{upcomingPrayer.label}</Text>
          <Text style={styles.prayerTime}>{formatTime(upcomingPrayer.time, timeZoneId)}</Text>
        </View>

        <View style={styles.rightContent}>
          <View style={styles.countdownBadge}>
            <Ionicons name="moon-outline" size={14} color="#FFFFFF" />
            <Text style={styles.countdownText}>{upcomingPrayer.timeRemaining}</Text>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 100,
  },
  backgroundImage: {
    borderRadius: 20,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  leftContent: {
    gap: 0,
  },
  upcomingLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '600',
  },
  prayerName: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    marginTop: -2,
  },
  prayerTime: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    fontWeight: '700',
  },
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(80, 120, 80, 0.45)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  countdownText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
