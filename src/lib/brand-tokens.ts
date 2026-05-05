/**
 * Per-customer content brand tokens. Sourced from org_brand_settings.
 * Used exclusively for rendering generated content (post visuals,
 * templates) — never for the Cadence application shell.
 *
 * For app shell tokens see app-tokens.ts.
 *
 * Brand changes apply forward only. We do not snapshot brand per post —
 * the platform (Instagram, etc.) already holds the historical record.
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

// ============================================================
// CUSTOMER BRAND (fetched from DB)
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
