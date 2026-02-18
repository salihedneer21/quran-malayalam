export type PlainDate = {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
};

export type PlainMonth = {
  year: number;
  month: number; // 1-12
};

export function isSamePlainDate(a: PlainDate, b: PlainDate) {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

export function clampPlainMonth(input: PlainMonth): PlainMonth {
  const month = Math.max(1, Math.min(12, Math.round(input.month)));
  return { year: Math.round(input.year), month };
}

export function addMonthsToPlainMonth(input: PlainMonth, delta: number): PlainMonth {
  const year = input.year;
  const monthIndex = input.month - 1;
  const nextIndex = monthIndex + delta;
  const nextYear = year + Math.floor(nextIndex / 12);
  const mod = ((nextIndex % 12) + 12) % 12;
  return { year: nextYear, month: mod + 1 };
}

export function daysInGregorianMonth(year: number, month: number) {
  // month: 1-12
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** 0 = Sunday, 1 = Monday, ... */
export function weekdayIndex({ year, month, day }: PlainDate) {
  // Tomohiko Sakamoto algorithm (Gregorian calendar).
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  let y = year;
  if (month < 3) y -= 1;
  return (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + t[month - 1] + day) % 7;
}

export function formatPlainMonthLabel(month: PlainMonth) {
  const d = new Date(Date.UTC(month.year, month.month - 1, 1, 12, 0, 0));
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
}

export function formatPlainDateLong(date: PlainDate) {
  const d = new Date(Date.UTC(date.year, date.month - 1, date.day, 12, 0, 0));
  return new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(d);
}

export function getTodayInTimeZone(timeZoneId: string, at: Date | number = Date.now()): PlainDate {
  const atDate = typeof at === 'number' ? new Date(at) : at;
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZoneId,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    // Hermes/JSC should support formatToParts; keep a fallback just in case.
    const anyDtf: any = dtf as any;
    if (typeof anyDtf.formatToParts === 'function') {
      const parts = anyDtf.formatToParts(atDate) as Array<{ type: string; value: string }>;
      const year = Number(parts.find((p) => p.type === 'year')?.value);
      const month = Number(parts.find((p) => p.type === 'month')?.value);
      const day = Number(parts.find((p) => p.type === 'day')?.value);

      if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
        return { year, month, day };
      }
    }

    // Fallback parse for locales that render as MM/DD/YYYY.
    const text = dtf.format(atDate);
    const m = text.match(/(\d{1,2})\D+(\d{1,2})\D+(\d{2,4})/);
    if (m) {
      const month = Number(m[1]);
      const day = Number(m[2]);
      const year = Number(m[3].length === 2 ? `20${m[3]}` : m[3]);
      if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
        return { year, month, day };
      }
    }
  } catch {
    // ignore
  }

  // Last resort: UTC date (avoids relying on device-local timezone).
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1, day: now.getUTCDate() };
}
