import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import {
  addMonthsToPlainMonth,
  daysInGregorianMonth,
  isSamePlainDate,
  type PlainDate,
  type PlainMonth,
  weekdayIndex,
} from '@/src/features/datetime/plain-date';
import { useHijriMonth } from '@/src/features/hijri/use-hijri-month';

// Sunday-first week (standard Gregorian)
const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const HIJRI_MONTH_NAMES = [
  'Muharram',
  'Safar',
  "Rabi' al-Awwal",
  "Rabi' al-Thani",
  'Jumada al-Awwal',
  'Jumada al-Thani',
  'Rajab',
  "Sha'ban",
  'Ramadan',
  'Shawwal',
  "Dhul Qi'dah",
  'Dhul Hijjah',
];

const GREGORIAN_MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// Gradient colors for the calendar background
const GRADIENT_COLORS = ['#8FBC8F', '#5A9A5A', '#3D7A3D', '#2E6B2E'] as const;

function getHijriMonthInfo(daysByGregorianDay: Record<string, { day: number; month?: number; year?: number }> | null) {
  if (!daysByGregorianDay) return null;

  const entries = Object.entries(daysByGregorianDay);
  if (entries.length === 0) return null;

  const months = new Map<number, { year?: number; count: number }>();

  for (const [, hijri] of entries) {
    if (hijri.month != null) {
      const existing = months.get(hijri.month);
      if (existing) {
        existing.count++;
        if (hijri.year != null) existing.year = hijri.year;
      } else {
        months.set(hijri.month, { year: hijri.year, count: 1 });
      }
    }
  }

  if (months.size === 0) return null;

  const sorted = Array.from(months.entries()).sort((a, b) => b[1].count - a[1].count);
  const primary = sorted[0];
  const secondary = sorted.length > 1 ? sorted[1] : null;

  return {
    primaryMonth: primary[0],
    primaryYear: primary[1].year,
    secondaryMonth: secondary?.[0],
    secondaryYear: secondary?.[1].year,
  };
}

function DayCell({
  date,
  selected,
  isToday,
  hijriDay,
  onPress,
}: {
  date: PlainDate;
  selected: boolean;
  isToday: boolean;
  hijriDay?: number;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  const isFirstOfHijriMonth = hijriDay === 1;

  return (
    <View style={styles.cellContainer}>
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} style={styles.cellPressable}>
        <Animated.View
          style={[
            styles.cell,
            { transform: [{ scale: scaleAnim }] },
            selected && styles.cellSelected,
            isToday && !selected && styles.cellToday,
          ]}
        >
          <Text style={[styles.dayNumber, selected && styles.dayNumberSelected, isToday && !selected && styles.dayNumberToday]}>
            {date.day}
          </Text>
          {hijriDay != null && (
            <Text
              style={[
                styles.hijriDay,
                selected && styles.hijriDaySelected,
                isToday && !selected && styles.hijriDayToday,
                isFirstOfHijriMonth && !selected && !isToday && styles.hijriDayFirst,
              ]}
            >
              {hijriDay}
            </Text>
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
}

function EmptyCell() {
  return <View style={styles.cellContainer} />;
}

export function MonthCalendar({
  selectedDate,
  onSelectDate,
  today,
  showHijri = true,
  onToggleHijri,
}: {
  selectedDate: PlainDate;
  onSelectDate: (date: PlainDate) => void;
  today: PlainDate;
  showHijri?: boolean;
  onToggleHijri?: (value: boolean) => void;
}) {
  const [visibleMonth, setVisibleMonth] = useState<PlainMonth>(() => ({
    year: selectedDate.year,
    month: selectedDate.month,
  }));

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setVisibleMonth({ year: selectedDate.year, month: selectedDate.month });
  }, [selectedDate.month, selectedDate.year]);

  const year = visibleMonth.year;
  const month = visibleMonth.month;

  // weekdayIndex returns 0=Sunday, which matches our WEEKDAY_LABELS order
  const offset = weekdayIndex({ year, month, day: 1 });
  const totalDays = daysInGregorianMonth(year, month);

  const { daysByGregorianDay } = useHijriMonth({
    enabled: showHijri,
    year,
    month,
    adjustment: 0,
  });

  const hijriInfo = useMemo(() => getHijriMonthInfo(daysByGregorianDay), [daysByGregorianDay]);

  const cells = useMemo(() => {
    const totalCells = Math.ceil((offset + totalDays) / 7) * 7;
    return Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - offset + 1;
      if (dayNumber < 1 || dayNumber > totalDays) return null;
      return { year, month, day: dayNumber } satisfies PlainDate;
    });
  }, [month, offset, totalDays, year]);

  const navigateMonth = (direction: number) => {
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: direction * -15,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
    setVisibleMonth((m) => addMonthsToPlainMonth(m, direction));
  };

  // Build Hijri header text
  let hijriHeader = '';
  if (showHijri && hijriInfo) {
    const primaryName = HIJRI_MONTH_NAMES[hijriInfo.primaryMonth - 1] || '';
    const primaryYear = hijriInfo.primaryYear ?? '';

    if (hijriInfo.secondaryMonth) {
      const secondaryName = HIJRI_MONTH_NAMES[hijriInfo.secondaryMonth - 1] || '';
      hijriHeader = `${primaryName} - ${secondaryName} ${primaryYear}`;
    } else {
      hijriHeader = `${primaryName} ${primaryYear}`;
    }
  }

  const gregorianHeader = `${GREGORIAN_MONTH_NAMES[month - 1]} ${year}`;

  return (
    <LinearGradient
      colors={GRADIENT_COLORS}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Top header with Calendar title and Hijri toggle */}
      <View style={styles.topHeader}>
        <Text style={styles.calendarTitle}>Calendar</Text>
        {onToggleHijri && (
          <View style={styles.hijriToggle}>
            <Text style={styles.hijriLabel}>Hijri</Text>
            <Switch
              value={showHijri}
              onValueChange={onToggleHijri}
              trackColor={{ true: '#2E7D32', false: 'rgba(255,255,255,0.3)' }}
              thumbColor="#FFFFFF"
              style={styles.switch}
            />
          </View>
        )}
      </View>

      {/* Month/Year Header with navigation */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {showHijri && hijriHeader ? (
            <>
              <Text style={styles.hijriTitle}>{hijriHeader}</Text>
              <Text style={styles.gregorianSubtitle}>( {gregorianHeader} )</Text>
            </>
          ) : (
            <Text style={styles.hijriTitle}>{gregorianHeader}</Text>
          )}
        </View>
        <View style={styles.navButtons}>
          <Pressable
            onPress={() => navigateMonth(-1)}
            style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
            hitSlop={8}
          >
            <Text style={styles.navIcon}>{'<'}</Text>
          </Pressable>
          <Pressable
            onPress={() => navigateMonth(1)}
            style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
            hitSlop={8}
          >
            <Text style={styles.navIcon}>{'>'}</Text>
          </Pressable>
        </View>
      </View>

      {/* Weekday Labels */}
      <View style={styles.weekdaysRow}>
        {WEEKDAY_LABELS.map((label) => (
          <View key={label} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <Animated.View style={[styles.grid, { transform: [{ translateX: slideAnim }] }]}>
        {cells.map((date, index) => {
          if (!date) {
            return <EmptyCell key={index} />;
          }

          const selected = isSamePlainDate(date, selectedDate);
          const isToday = isSamePlainDate(date, today);
          const hijriData = showHijri ? daysByGregorianDay?.[String(date.day)] : undefined;
          const hijriDay = hijriData?.day;

          return (
            <DayCell
              key={index}
              date={date}
              selected={selected}
              isToday={isToday}
              hijriDay={hijriDay}
              onPress={() => onSelectDate(date)}
            />
          );
        })}
      </Animated.View>
    </LinearGradient>
  );
}

const CELL_WIDTH = `${100 / 7}%` as const;

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  calendarTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  hijriToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hijriLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '600',
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  headerContent: {
    flex: 1,
  },
  hijriTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  gregorianSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  navButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  navIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  weekdaysRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    borderRadius: 10,
    paddingVertical: 10,
  },
  weekdayCell: {
    width: CELL_WIDTH,
    alignItems: 'center',
  },
  weekdayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cellContainer: {
    width: CELL_WIDTH,
    aspectRatio: 0.9,
    padding: 2,
  },
  cellPressable: {
    flex: 1,
  },
  cell: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cellSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'rgba(255, 255, 255, 1)',
  },
  cellToday: {
    backgroundColor: '#2E7D32',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  dayNumber: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  dayNumberSelected: {
    color: '#2E7D32',
  },
  dayNumberToday: {
    color: '#FFFFFF',
  },
  hijriDay: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  hijriDaySelected: {
    color: 'rgba(46, 125, 50, 0.7)',
  },
  hijriDayToday: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  hijriDayFirst: {
    color: '#FFD700',
    fontWeight: '700',
  },
});
