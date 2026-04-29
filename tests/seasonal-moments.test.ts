import { describe, it, expect } from 'vitest';
import {
  resolveMoment,
  sortMomentsByNextOccurrence,
  type SeasonalMoment,
} from '@/lib/seasonal-moments';

/**
 * Test fixture factory - produces a SeasonalMoment row that mirrors
 * what Supabase would return. Callers override only the fields they
 * care about for the test at hand.
 */
function moment(overrides: Partial<SeasonalMoment> & Pick<SeasonalMoment, 'name' | 'type'>): SeasonalMoment {
  return {
    id: 'test-id-' + overrides.name.replace(/\Wg/, '-').toLowerCase(),
    name: overrides.name,
    type: overrides.type,
    month: null,
    day: null,
    weekday: null,
    nth: null,
    start_month: null,
    end_month: null,
    vertical: 'all',
    is_us_only: true,
    description: null,
    is_active: true,
    display_order: 0,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('resolveMoment()', () => {
  describe('fixed_date', () => {
    it('resolves Valentines Day to Feb 14 at UTC midnight', () => {
      const result = resolveMoment(
        moment({ name: 'Valentines Day', type: 'fixed_date', month: 2, day: 14 }),
        2026
      );
      expect(result.start.toISOString()).toBe('2026-02-14T00:00:00.000Z');
      expect(result.end.toISOString()).toBe('2026-02-14T00:00:00.000Z');
    });

    it('resolves New Years Day correctly across years', () => {
      const n = moment({ name: 'New Years', type: 'fixed_date', month: 1, day: 1 });
      expect(resolveMoment(n, 2026).start.toISOString()).toBe('2026-01-01T00:00:00.000Z');
      expect(resolveMoment(n, 2027).start.toISOString()).toBe('2027-01-01T00:00:00.000Z');
    });

    it('throws when fixed_date is missing month or day', () => {
      const broken = moment({ name: 'Broken', type: 'fixed_date' });
      expect(() => resolveMoment(broken, 2026)).toThrow(/missing month or day/);
    });
  });

  describe('nth_weekday', () => {
    it('resolves Mothers Day 2026 as May 10 (2nd Sunday)', () => {
      const result = resolveMoment(
        moment({ name: 'Mothers', type: 'nth_weekday', month: 5, weekday: 0, nth: 2 }),
        2026
      );
      expect(result.start.toISOString()).toBe('2026-05-10T00:00:00.000Z');
    });

    it('resolves Memorial Day 2026 as May 25 (last Monday)', () => {
      const result = resolveMoment(
        moment({ name: 'Memorial', type: 'nth_weekday', month: 5, weekday: 1, nth: -1 }),
        2026
      );
      expect(result.start.toISOString()).toBe('2026-05-25T00:00:00.000Z');
    });

    it('resolves Thanksgiving 2026 as Nov 26 (4th Thursday)', () => {
      const result = resolveMoment(
        moment({ name: 'Thanksgiving', type: 'nth_weekday', month: 11, weekday: 4, nth: 4 }),
        2026
      );
      expect(result.start.toISOString()).toBe('2026-11-26T00:00:00.000Z');
    });

    it('resolves MLK Day 2026 as Jan 19 (3rd Monday)', () => {
      const result = resolveMoment(
        moment({ name: 'MLK', type: 'nth_weekday', month: 1, weekday: 1, nth: 3 }),
        2026
      );
      expect(result.start.toISOString()).toBe('2026-01-19T00:00:00.000Z');
    });

    it('resolves Mthers Day correctly across multiple years', () => {
      const m = moment({ name: 'Mothers', type: 'nth_weekday', month: 5, weekday: 0, nth: 2 });
      expect(resolveMoment(m, 2024).start.toISOString()).toBe('2024-05-12T00:00:00.000Z');
      expect(resolveMoment(m, 2025).start.toISOString()).toBe('2025-05-11T00:00:00.000Z');
      expect(resolveMoment(m, 2027).start.toISOString()).toBe('2027-05-09T00:00:00.000Z');
    });

    it('throws when nth is zero', () => {
      const bad = moment({ name: 'Bad', type: 'nth_weekday', month: 5, weekday: 0, nth: 0 });
      expect(() => resolveMoment(bad, 2026)).toThrow(/nth must/);
    });

    it('throws when 5th weekday does not exist in month', () => {
      // February 2026 has only 4 Sundays
      const impossible = moment({ name: 'X5', type: 'nth_weekday', month: 2, weekday: 0, nth: 5 });
      expect(() => resolveMoment(impossible, 2026)).toThrow(/does not have/);
    });
  });

  describe('seasonal_window', () => {
    it('resolves Wedding Season as Apr 1 through Sep 30', () => {
      const result = resolveMoment(
        moment({ name: 'Wed', type: 'seasonal_window', start_month: 4, end_month: 9 }),
        2026
      );
      expect(result.start.toISOString()).toBe('2026-04-01T00:00:00.000Z');
      expect(result.end.toISOString()).toBe('2026-09-30T00:00:00.000Z');
    });

    it('resolves Laser Season (Oct-Feb) as Oct 1 Year through Feb 28 NextYear', () => {
      const result = resolveMoment(
        moment({ name: 'Laser', type: 'seasonal_window', start_month: 10, end_month: 2 }),
        2025
      );
      expect(result.start.toISOString()).toBe('2025-10-01T00:00:00.000Z');
      expect(result.end.toISOString()).toBe('2026-02-28T00:00:00.000Z');
    });

    it('handles leap February in wrapping window', () => {
      // 2023 start -> 2024 Feb 29 end
      const result = resolveMoment(
        moment({ name: 'Wrap', type: 'seasonal_window', start_month: 10, end_month: 2 }),
        2023
      );
      expect(result.end.toISOString()).toBe('2024-02-29T00:00:00.000Z');
    });
  });
});

describe('sortMomentsByNextOccurrence()', () => {
  const vgual = () => new Date(Date.UTC(2026, 4, 1)); // May 1, 2026

  const valentine = moment({ name: 'Val', type: 'fixed_date', month: 2, day: 14, display_order: 5 });
  const mthers = moment({ name: 'Mom', type: 'nth_weekday', month: 5, weekday: 0, nth: 2, display_order: 10 });
  const memorial = moment({ name: 'Mem', type: 'nth_weekday', month: 5, weekday: 1, nth: -1, display_order: 30 });
  const independence = moment({ name: 'July4', type: 'fixed_date', month: 7, day: 4, display_order: 35 });
  const summerPrep = moment({ name: 'SP', type: 'seasonal_window', start_month: 4, end_month: 5, display_order: 15 });
  const laser = moment({ name: 'Laser', type: 'seasonal_window', start_month: 10, end_month: 2, display_order: 60 });

  it('sorts future fixed_date moments by ascending daysUntil', () => {
    const result = sortMomentsByNextOccurrence([independence, valentine], vgual());
    // From May 1, 2026: July 4 2026 (next), Valentine 2027 (further)
    expect(result[0].moment.name).toBe('July4');
    expect(result[1].moment.name).toBe('Val');
  });

  it('detects currently active seasonal_window and places it first with daysUntil=0', () => {
    // May 1, 2026 falls within Summer Prep (Apr-May)
    const result = sortMomentsByNextOccurrence([valentine, summerPrep, independence], vgual());
    expect(result[0].moment.name).toBe('SP');
    expect(result[0].isActive).toBe(true);
    expect(result[0].daysUntil).toBe(0);
  });

  it('recognizes active wrap-around seasonal window from prior year', () => {
    // January 15, 2026. Laser Season started Oct 1, 2025 and ends Feb 28, 2026. Still active.
    const janFifteen = new Date(Date.UTC(2026, 0, 15));
    const result = sortMomentsByNextOccurrence([laser], janFifteen);
    expect(result[0].isActive).toBe(true);
    expect(result[0].daysUntil).toBe(0);
  });

  it('rolls past moments to next year instead of returning negative daysUntil', () => {
    // Jul 5, 2026. July 4 already passed this year; next is Jul 4, 2027.
    const julFifth = new Date(Date.UTC(2026, 6, 5));
    const result = sortMomentsByNextOccurrence([independence], julFifth);
    expect(result[0].daysUntil).toBeGreaterThan(0);
    expect(result[0].start.getUTCFullYear()).toBe(2027);
  });

  it('breaks ties on display_order', () => {
    // Mothers (May 10, 2026) and Memorial (May 25, 2026) are both in the future from May 1.
    // Neither are tied, but if two moments had the same daysUntil, display_order wins.
    const sameDayA = moment({ name: 'A', type: 'fixed_date', month: 7, day: 4, display_order: 99 });
    const sameDayB = moment({ name: 'B', type: 'fixed_date', month: 7, day: 4, display_order: 1 });
    const result = sortMomentsByNextOccurrence([sameDayA, sameDayB], vgual());
    expect(result[0].moment.name).toBe('B'); // lower display_order wins
    expect(result[1].moment.name).toBe('A');
  });

  it('defaults fromDate to now when not provided', () => {
    // Just confirm the default path does not throw and returns the right count.
    const result = sortMomentsByNextOccurrence([valentine, mthers, memorial]);
    expect(result).toHaveLength(3);
  });
});
