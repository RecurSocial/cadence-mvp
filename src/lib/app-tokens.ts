/**
 * Cadence application shell tokens. Universal across all customers.
 * Do not source values from org_brand_settings.
 *
 * For per-customer content brand tokens, see brand-tokens.ts.
 *
 * These tokens drive every Cadence application surface — sidebar, header,
 * calendar, dashboards, modals, settings pages. Every customer sees the
 * same shell. Values are locked to Cadence Product Spec v1.2 §1.3 (palette)
 * and §1.4 (typography).
 */

// ============================================================
// PALETTE (Spec v1.2 §1.3)
// ============================================================

/**
 * The seven Cadence app shell colors. Universal across all customers.
 * Hex values are locked to the spec; do not edit without a spec change.
 */
export const palette = {
  /** Page background, app shell */
  creamBg:      '#FAF7F2',
  /** Card surfaces, secondary panels */
  boneSurface:  '#F2EDE2',
  /** Borders, dividers, soft separators */
  sandBorder:   '#D8CFB9',
  /** Primary CTAs, premium accents, active states */
  brandGold:    '#C9A961',
  /** Hover states for gold elements, headings on cream */
  goldDark:     '#9E8240',
  /** Body text, headings, primary content */
  inkPrimary:   '#2A2419',
  /** Secondary text, descriptions, metadata */
  inkMuted:     '#6B6357',
} as const;

export type PaletteToken = keyof typeof palette;

// ============================================================
// SEMANTIC COLORS
// ============================================================

/**
 * Status colors used on Cadence app shell surfaces only — calendar
 * status pills, execution score, Cadence Brief banners. Aligned to
 * the cream-and-gold palette so they don't read as traffic-light loud.
 *
 * Never appears in customer-rendered content output.
 */
export const semanticColors = {
  /** On track, completed, healthy */
  success:   '#7A8C5C',  // olive-sage
  /** Pay attention, gap forming */
  warning:   '#C4923D',  // deep honey
  /** Problem, decay starting */
  alert:     '#B85C3F',  // terracotta
  /** Severe — bookings stalled, posting decay confirmed */
  critical:  '#8B3A2E',  // oxblood
} as const;

export type SemanticToken = keyof typeof semanticColors;

// ============================================================
// TYPOGRAPHY (Spec v1.2 §1.4)
// ============================================================

/**
 * Font families for the Cadence app shell.
 *
 * Display/serif: Playfair Display — Cadence wordmark, page titles,
 *   editorial moments. Loaded from Google Fonts in globals.css.
 * UI/sans: Inter — body, labels, controls, all functional UI text.
 *
 * Two weights only: Regular (400) and Medium (500). Avoid Bold (700);
 * it reads heavy on cream.
 */
export const fonts = {
  display: "'Playfair Display', Georgia, serif",
  sans:    "'Inter', system-ui, -apple-system, sans-serif",
} as const;

export const fontWeights = {
  regular: 400,
  medium:  500,
} as const;

// ============================================================
// POST TYPE COLORS (Spec v1.2 §3.1)
// ============================================================

/**
 * Color tokens for the seven post types defined in Spec v1.2 §3.1.
 *
 * Each type has a `tint` (soft card background) and a `mark` (badge,
 * dot, or accent) value. Picked to read as the spec-stated color family
 * (Educational blue, Before/After green, etc.) while sitting gracefully
 * next to the cream-and-gold shell.
 *
 * NOT consumed in this scope. Defined now for use by the future
 * post taxonomy refactor (Spec §3) and the calendar PostSlot redesign.
 * Hex values may be tuned when consumers ship.
 *
 * Spotlight has only one color even though it has three sub-types
 * (Practitioner, Testimonial, New Launch) — sub-types inherit the
 * parent Spotlight color.
 */
export const postTypeColors = {
  /** Educational — blue. Teaching content. */
  educational: {
    tint: '#E8EEF4',
    mark: '#4A6B8A',
  },
  /** Before & After — green. Transformation visuals. */
  beforeAfter: {
    tint: '#ECF1EA',
    mark: '#5C7D5A',
  },
  /** Promo / Event / Seasonal — amber. Time-bound hooks. */
  promoEventSeasonal: {
    tint: '#F8EFD9',
    mark: '#C4923D',
  },
  /** Book Now — coral. Time-sensitive open slots. */
  bookNow: {
    tint: '#F5E4DD',
    mark: '#C97560',
  },
  /** Behind the Scenes — slate. Training, team, day-in-the-life. */
  behindTheScenes: {
    tint: '#E8EAEC',
    mark: '#5C6470',
  },
  /** Trend / Viral — pink. Audio- or format-driven trends. */
  trendViral: {
    tint: '#F4E0E5',
    mark: '#C46887',
  },
  /** Spotlight — purple. Practitioner / Testimonial / New Launch. */
  spotlight: {
    tint: '#ECE6F0',
    mark: '#7B6090',
  },
} as const;

export type PostTypeToken = keyof typeof postTypeColors;
