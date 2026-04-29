/**
 * Seasonal Moments — pure-function helper for resolving rule-based
 * cultural moments to actual dates for any given year.
 *
 * The seasonal_moments table stores RULES, not dates:
 *   - fixed_date:      month + day            (Valentine's Day = Feb 14)
 *   - nth_weekday:     month + weekday + nth  (Mother's Day = 2nd Sunday of May)
 *   - seasonal_window: start_month + end_month (Laser Season = Oct through Feb)
 *
 * This module resolves any row to a concrete { start, end } date pair for a
 * given year, and provides a sort utility that orders moments by their next
 * future occurrence relative to a reference date.
 *
 * All date math is performed in UTC to avoid timezone drift across users.
 * Display layer is responsible for rendering in the viewer's locale.
 */

// =============================================================================
// Types — mirror the seasonal_moments table schema exactly so a Supabase row
// is type-compatible withoransformation.
// =============================================================================

export type MomentType = 'fixed_date' | 'nth_weekday' | 'seasonal_window';

export interface SeasonalMoment {
  id: string;
  name: string;
  type: MomentType;

  // fixed_date uses: month + day
  // nth_weekday uses: month + weekday + nth
  month: number | null;
  day: number | null;
  weekday: number | null; // 0 = Sunday, 6 = Saturday
  nth: number | null;     // 1-5 = ordinal; -1 = last

  // seasonal_window uses: start_month + end_month
  start_month: number | null;
  end_month: number | null;

  vertical: string;
  is_us_only: boolean;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface ResolvedMoment {
  moment: SeasonalMoment;
  start: Date;
  end: Date;
}

export interface SortedMoment extends ResolvedMoment {
  /** Whole-day count from reference date to start. 0 if reference is inside window. Negative if window is in the past. */
  daysUntil: number;
  /** True when reference date falls within [start, end] inclusive. */
  isActive: boolean;
}

// =============================================================================
// resolveMoment — convert a rule-based moment to a concrete date range
// for a specific year.
// =============================================================================

/**
 * Resolve a SeasonalMoment to a concrete { start, end } date pair.
 *
 * - fixed_date:      single day, start === end at 00:00 UTC
 * - nth_weekday:     single day, start === end at 00:00 UTC
 * - seasonal_window: range from first day of start_month to last day of end_month.
 *                    If end_month < start_month the window wraps to year + 1.
 *
 * Throws if the moment row violates its type contract (defensive — the DB
 * CHECK constraints already enforce this, but tests may pass malformed mocks).
 */
export function resolveMoment(moment: SeasonalMoment, year: number): ResolvedMoment {
  switch (moment.type) {
    case 'fixed_date': {
      if (moment.month == null || moment.day == null) {
        throw new Error(`fixed_date moment "${moment.name}" missing month or day`);
      }
      const date = utcDate(year, moment.month, moment.day);
      return { moment, start: date, end: date };
    }

    case 'nth_weekday': {
      if (moment.month == null || moment.weekday == null || moment.nth == null) {
        throw new Error(`nth_weekday moment "${moment.name}" missing month, weekday, or nth`);
      }
      const date = nthWeekdayOfMonth(year, moment.month, moment.weekday, moment.nth);
      return { moment, start: date, end: date };
    }

    case 'seasonal_window': {
      if (moment.start_month == null || moment.end_month == null) {
        throw new Error(`seasonal_window moment "${moment.name}" missing start_month or end_month`);
      }
      const start = utcDate(year, moment.start_month, 1);
      // If end_month < start_month, window wraps year-end (e.g., Laser Season Oct-Feb).
      const endYear = moment.end_month < moment.start_month ? year + 1 : year;
      const end = utcDate(endYear, moment.end_month, lastDayOfMonth(endYear, moment.end_month));
      return { moment, start, end };
    }
  }
}

// =============================================================================
// sortMomentsByNextOccurrence — order moments by their next future window
// relative to a reference date. Active windows sort first.
// =============================================================================

/**
 * Sort moments by next occurrence relative to `fromDate`.
 *
 * - Active moments (fromDate falls within window) sort first, daysUntil = 0.
 * - Future moments sort by ascending daysUntil.
 * - Past moments are re-resolved to next year so the caller never sees a
 *   negative daysUntil (every moment recurs annually).
 *
 * Stable: moments with identical daysUntil preserve input order, then break
 * ties on the database's display_order field.
 */
export function sortMomentsByNextOccurrence(
  moments: SeasonalMoment[],
  fromDate: Date = new Date()
): SortedMoment[] {
  const refUTC = startOfDayUTC(fromDate);
  const currentYear = refUTC.getUTCFullYear();

  const sorted: SortedMoment[] = moments.map((moment) => {
    let resolved = resolveMoment(moment, currentYear);

    // For seasonal_windows that wrap year-end, the previous year's window
    // may still be active right now (we're in January, Laser Season started
    // last October). Check that case before deciding the window is past.
    if (moment.type === 'seasonal_window' && refUTC < resolved.start) {
      const prior = resolveMoment(moment, currentYear - 1);
      if (refUTC >= prior.start && refUTC <= prior.end) {
        resolved = prior;
      }
    }

    // If the window has fully passed this year, roll forward to next year.
    if (refUTC > resolved.end) {
      resolved = resolveMoment(moment, currentYear + 1);
    }

    const isActive = refUTC >= resolved.start && refUTC <= resolved.end;
    const daysUntil = isActive ? 0 : daysBetween(refUTC, resolved.start);

    return { ...resolved, isActive, daysUntil };
  });

  return sorted.sort((a, b) => {
    if (a.daysUntil !== b.daysUntil) return a.daysUntil - b.daysUntil;
    return a.moment.display_order - b.moment.display_order;
  });
}

// =============================================================================
// Internal date utilities — UTC only.
// =============================================================================

/** Construct a UTC date at midnight for the given Y/M/D. Month is 1-indexed. */
function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

/** Truncate a date to UTC midnight. */
function startOfDayUTC(date: Date): Date {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    0, 0, 0, 0
  ));
}

/** Days between two UTC-midnight dates, inclusive of fractional rounding. */
function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.round(ms / 86_400_000);
}

/** Last day-number of a month (handles leap years for February). */
function lastDayOfMonth(year: number, month: number): number {
  // Day 0 of month+1 = last day of month, in UTC.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Return the date of the Nth weekday of a month.
 * weekday: 0 = Sunday ... 6 = Saturday.
 * nth: 1-5 for ordinal; -1 for last weekday of the month.
 *
 * Throws if nth=N would fall past the end of the month
 * (e.g., 5th Friday of a month that only has 4 Fridays).
 */
function nthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number): Date {
  if (nth === 0 || nth < -1 || nth > 5) {
    throw new Error(`nth must be 1-5 or -1 (received ${nth})`);
  }

  if (nth === -1) {
    const lastDay = lastDayOfMonth(year, month);
    const lastDate = utcDate(year, month, lastDay);
    const lastWeekday = lastDate.getUTCDay();
    const offset = (lastWeekday - weekday + 7) % 7;
    return utcDate(year, month, lastDay - offset);
  }

  const firstDate = utcDate(year, month, 1);
  const firstWeekday = firstDate.getUTCDay();
  const offset = (weekday - firstWeekday + 7) % 7;
  const day = 1 + offset + (nth - 1) * 7;

  if (day > lastDayOfMonth(year, month)) {
    throw new Error(
      `Month ${year}-${month} does not have a ${nth}th weekday=${weekday}`
    );
  }

  return utcDate(year, month, day);
}
