-- =============================================================================
-- Migration: Add bg_inverse to org_brand_settings
-- Date: 2026-04-28
-- Spec: Cadence_NextSteps_April28_2026_LayerA_Refactor.docx
--       Carried over from April 27 brand kit work session wrap.
--
-- Purpose:
--   Adds the bg_inverse brand token to org_brand_settings.
--
--   This token represents the dark-surface counterpart to the org's
--   primary background color. For Euphoria, the website pairs a cool
--   off-white (#F5F5F5) with a near-black surface (#0A0A0A) for the
--   signature dark sections — practitioner spotlights, before/after
--   reveals, premium service callouts.
--
--   Without bg_inverse, the Layer B Educational, Spotlight, and Promo
--   templates would be unable to render Euphoria's signature dark-surface
--   aesthetic — they'd default to white-only and look generic.
--
--   This is the smallest migration in the batch but it unblocks three of
--   the five Layer B branded templates from looking on-brand.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Add the column with hex format validation
--    Same regex pattern used by other brand color columns.
-- -----------------------------------------------------------------------------
ALTER TABLE org_brand_settings
  ADD COLUMN bg_inverse text
    CHECK (bg_inverse IS NULL OR bg_inverse ~ '^#[0-9A-Fa-f]{6}$');

-- -----------------------------------------------------------------------------
-- 2. Backfill Euphoria's bg_inverse value
--    Sourced from euphoriaestheticswellness.com dark-section background.
-- -----------------------------------------------------------------------------
UPDATE org_brand_settings
SET bg_inverse = '#0A0A0A'
WHERE org_id = (
  SELECT id FROM organizations
  WHERE name = 'Euphoria Esthetics & Wellness'
);

-- -----------------------------------------------------------------------------
-- 3. Schema documentation
-- -----------------------------------------------------------------------------
COMMENT ON COLUMN org_brand_settings.bg_inverse IS
  'Dark-surface background color for inverse-treatment branded templates (Educational dark-mode, Spotlight, Promo). Pairs with primary bg_color. NULL means org has no inverse treatment.';

-- -----------------------------------------------------------------------------
-- 4. Verification — confirm Euphoria got the value set
--    If Euphoria org doesn't exist (test environment, etc.) this migration
--    still succeeds — the UPDATE simply affects 0 rows.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  euphoria_bg_inverse text;
  euphoria_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM organizations WHERE name = 'Euphoria Esthetics & Wellness'
  ) INTO euphoria_exists;

  IF euphoria_exists THEN
    SELECT bg_inverse INTO euphoria_bg_inverse
    FROM org_brand_settings
    WHERE org_id = (SELECT id FROM organizations WHERE name = 'Euphoria Esthetics & Wellness');

    IF euphoria_bg_inverse IS NULL THEN
      RAISE NOTICE 'Euphoria org exists but has no org_brand_settings row — bg_inverse was not set. Verify org_brand_settings was created for Euphoria during brand kit migration.';
    ELSIF euphoria_bg_inverse != '#0A0A0A' THEN
      RAISE EXCEPTION 'Euphoria bg_inverse is %, expected #0A0A0A', euphoria_bg_inverse;
    ELSE
      RAISE NOTICE 'Euphoria bg_inverse successfully set to %', euphoria_bg_inverse;
    END IF;
  ELSE
    RAISE NOTICE 'Euphoria org not found — skipping backfill verification (likely a non-production environment)';
  END IF;
END $$;