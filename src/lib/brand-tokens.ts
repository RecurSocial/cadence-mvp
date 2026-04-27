/**
 * Brand Tokens — Cadence two-layer brand model
 *
 * Layer 1 (Cadence chrome): immutable. Defined in `cadenceChrome` below.
 *   These tokens drive the application UI — sidebar, calendar, dashboard,
 *   Cadence Brief card, settings pages. Never customer-customizable.
 *
 *   IMPORTANT (April 26, 2026): The cadenceChrome values below represent
 *   the LUXURY palette that Cadence chrome is migrating TO on May 1, 2026.
 *   The current live app still renders in indigo/slate. Pages built today
 *   should reference semantic CSS variables (var(--background), etc.) and
 *   Tailwind utility classes (bg-background, text-foreground), NOT these
 *   hex values directly. When the May 1 chrome repaint updates globals.css,
 *   pages using semantic variables inherit the new look automatically.
 *
 * Layer 2 (Customer brand): per-org. Fetched from `org_brand_settings`.
 *   These tokens drive content template output only — generated social
 *   posts, before/after cards, story templates. Never used in chrome.
 *
 * Semantic colors (success/warning/alert/critical) are part of Layer 1.
 * They are aligned with the Cadence palette to avoid traffic-light loudness.
 *
 * Locked April 26, 2026.
 */

import { createServerClient } from './supabase/server';

// ============================================================
// TYPES
// ============================================================

export interface BrandTokens {
  /** Page background (lightest surface) */
  bgPrimary: string;
  /** Cards, secondary surfaces */
  bgSecondary: string;
  /** Subtle dividers and rules */
  borderSubtle: string;
  /** Stronger dividers on bone surfaces */
  borderStrong: string;
  /** Eyebrows, metadata, captions */
  textTertiary: string;
  /** Secondary copy and supporting text */
  textSecondary: string;
  /** Primary body copy and headlines */
  textPrimary: string;
  /** Mid-tone accent highlight */
  accentLight: string;
  /** Primary brand accent */
  accent: string;
  /** Hover/pressed accent state */
  accentDeep: string;
  /** Headline serif typeface */
  fontSerif: string;
  /** Body sans typeface */
  fontSans: string;
  /** Customer logo URL (nullable until uploaded) */
  logoUrl: string | null;
}

export interface SemanticColors {
  /** On track, completed, healthy */
  success: string;
  /** Pay attention, gap forming */
  warning: string;
  /** Problem, decay starting */
  alert: string;
  /** Severe — bookings stalled, posting decay confirmed */
  critical: string;
}

// ============================================================
// CADENCE CHROME (Layer 1 — immutable, target palette)
// ============================================================

/**
 * The Cadence application UI palette — TARGET state after May 1 repaint.
 * Do not consume these values directly in components today. Use semantic
 * Tailwind classes and CSS variables instead, which will automatically
 * resolve to these values once globals.css is updated on May 1.
 *
 * Exposed here for reference, documentation, and future programmatic uses
 * (e.g., generating brand-aware OG images server-side).
 */
export const cadenceChrome: BrandTokens = {
  bgPrimary:      '#FAF7F2',  // cream
  bgSecondary:    '#F2ECE2',  // bone
  borderSubtle:   '#E8DFD0',  // sand
  borderStrong:   '#DCCDB4',  // sand-warm
  textTertiary:   '#A89B87',  // stone
  textSecondary:  '#2A2824',  // graphite
  textPrimary:    '#151412',  // ink
  accentLight:    '#D4B896',  // champagne
  accent:         '#B8925E',  // gold
  accentDeep:     '#8B6B3D',  // gold-deep
  fontSerif:      'Playfair Display',
  fontSans:       'Inter',
  logoUrl:        null,       // chrome doesn't carry a customer logo
};

// ============================================================
// SEMANTIC COLORS (Layer 1 — immutable, aligned to palette)
// ============================================================

/**
 * Status colors used in Cadence chrome only. NEVER appear in
 * customer-rendered template output.
 *
 * Hard rule: semantic colors live on chrome surfaces (sidebar,
 * calendar status pills, dashboard scorecard, Cadence Brief
 * banner). They never render in generated social posts.
 *
 * Color philosophy: same severity scale as a traffic light, but
 * desaturated and warmed to live next to champagne and bone.
 */
export const semanticColors: SemanticColors = {
  success:   '#7A8C5C',  // olive-sage
  warning:   '#C4923D',  // deep honey
  alert:     '#B85C3F',  // terracotta
  critical:  '#8B3A2E',  // oxblood
};

// ============================================================
// CUSTOMER BRAND (Layer 2 — fetched from DB)
// ============================================================

/**
 * Fetch a customer's brand tokens for content template rendering.
 *
 * Returns null if no brand settings exist (org has not completed
 * onboarding yet). Callers should fall back to a default brand
 * or block template rendering until brand is set.
 *
 * Brand changes apply forward only. We do not snapshot brand per
 * post — Instagram already holds the historical posts.
 *
 * IMPORTANT: This uses the anon-key Supabase client which respects
 * RLS. RLS policies on org_brand_settings require the caller to be
 * a member of the org (via user_orgs). Pages calling this MUST be
 * authenticated, or the query will return null due to RLS.
 */
export async function getOrgBrandTokens(orgId: string): Promise<BrandTokens | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('org_brand_settings')
    .select(`
      bg_primary,
      bg_secondary,
      border_subtle,
      border_strong,
      text_tertiary,
      text_secondary,
      text_primary,
      accent_light,
      accent,
      accent_deep,
      font_serif,
      font_sans,
      logo_url
    `)
    .eq('org_id', orgId)
    .single();

  if (error) {
    console.error(`[brand-tokens] Failed to fetch brand for org ${orgId}:`, error.message);
    return null;
  }
  if (!data) return null;

  return {
    bgPrimary:      data.bg_primary,
    bgSecondary:    data.bg_secondary,
    borderSubtle:   data.border_subtle,
    borderStrong:   data.border_strong,
    textTertiary:   data.text_tertiary,
    textSecondary:  data.text_secondary,
    textPrimary:    data.text_primary,
    accentLight:    data.accent_light,
    accent:         data.accent,
    accentDeep:     data.accent_deep,
    fontSerif:      data.font_serif,
    fontSans:       data.font_sans,
    logoUrl:        data.logo_url,
  };
}

// ============================================================
// CSS VARIABLE BRIDGE
// ============================================================

/**
 * Convert a BrandTokens object into a CSS custom property record,
 * suitable for spreading into a React style prop.
 *
 * Example:
 *   <div style={tokensToCssVars(tokens)}>...template...</div>
 *
 * Templates reference these variables via var(--brand-accent), etc.
 * The same template renders in any customer's brand by swapping
 * the tokens object passed in.
 *
 * Returns Record<string, string> instead of React.CSSProperties so
 * this file stays React-import-free (usable from server components,
 * route handlers, edge functions, OG image generators).
 */
export function tokensToCssVars(tokens: BrandTokens): Record<string, string> {
  return {
    '--brand-bg-primary':     tokens.bgPrimary,
    '--brand-bg-secondary':   tokens.bgSecondary,
    '--brand-border-subtle':  tokens.borderSubtle,
    '--brand-border-strong':  tokens.borderStrong,
    '--brand-text-tertiary':  tokens.textTertiary,
    '--brand-text-secondary': tokens.textSecondary,
    '--brand-text-primary':   tokens.textPrimary,
    '--brand-accent-light':   tokens.accentLight,
    '--brand-accent':         tokens.accent,
    '--brand-accent-deep':    tokens.accentDeep,
    '--brand-font-serif':     `'${tokens.fontSerif}', Georgia, serif`,
    '--brand-font-sans':      `'${tokens.fontSans}', -apple-system, sans-serif`,
  };
}

/**
 * Server-side variant — returns a string of CSS custom property
 * declarations for use in server-rendered templates (e.g., social
 * post image generation via @vercel/og or similar).
 */
export function tokensToCssString(tokens: BrandTokens): string {
  return `
    --brand-bg-primary: ${tokens.bgPrimary};
    --brand-bg-secondary: ${tokens.bgSecondary};
    --brand-border-subtle: ${tokens.borderSubtle};
    --brand-border-strong: ${tokens.borderStrong};
    --brand-text-tertiary: ${tokens.textTertiary};
    --brand-text-secondary: ${tokens.textSecondary};
    --brand-text-primary: ${tokens.textPrimary};
    --brand-accent-light: ${tokens.accentLight};
    --brand-accent: ${tokens.accent};
    --brand-accent-deep: ${tokens.accentDeep};
    --brand-font-serif: '${tokens.fontSerif}', Georgia, serif;
    --brand-font-sans: '${tokens.fontSans}', -apple-system, sans-serif;
  `.trim();
}
