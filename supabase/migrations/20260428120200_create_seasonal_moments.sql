-- =============================================================================
-- Migration: Create seasonal_moments table
-- Date: 2026-04-28
-- Spec: Cadence_NextSteps_April28_2026_LayerA_Refactor.docx
--
-- Purpose:
--   Stores cultural moments, holidays, and seasonal windows that drive
--   the Seasonal sub-branch of the Promo / Event / Seasonal post type.
--
--   Critical design decision: store RULES, not specific dates.
--
--   - Mother's Day is "2nd Sunday of May" — not "May 10, 2026"
--   - Memorial Day is "Last Monday of May"
--   - Wedding Season is "April through September"
--
--   A helper function (seasonal-moments.ts in the app layer) resolves
--   any moment to its actual date for any given year. This makes Cadence
--   correct forever, not just for the year the table was seeded.
--
--   Three moment types:
--     - fixed_date: month + day (Valentine's, Christmas Eve)
--     - nth_weekday: month + weekday + nth position (Mother's Day, MLK Day)
--     - seasonal_window: start_month + end_month (Wedding Season)
--
--   Seasonal windows can wrap year-end (Laser Season = Oct-Feb) — the
--   helper function handles wraparound by treating end_year = year + 1
--   when end_month < start_month.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Moment type enum
-- -----------------------------------------------------------------------------
CREATE TYPE moment_type AS ENUM (
  'fixed_date',
  'nth_weekday',
  'seasonal_window'
);

-- -----------------------------------------------------------------------------
-- 2. Seasonal moments table
--    Most fields are nullable because different moment types use different
--    fields. The CHECK constraint enforces the right combination per type.
-- -----------------------------------------------------------------------------
CREATE TABLE seasonal_moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  name text NOT NULL,
  type moment_type NOT NULL,

  -- fixed_date uses: month + day
  -- nth_weekday uses: month + weekday + nth
  month int CHECK (month BETWEEN 1 AND 12),
  day int CHECK (day BETWEEN 1 AND 31),
  weekday int CHECK (weekday BETWEEN 0 AND 6),  -- 0 = Sunday, 6 = Saturday
  nth int CHECK (nth BETWEEN -1 AND 5 AND nth != 0),  -- -1 = last; 1-5 = ordinal

  -- seasonal_window uses: start_month + end_month
  start_month int CHECK (start_month BETWEEN 1 AND 12),
  end_month int CHECK (end_month BETWEEN 1 AND 12),

  -- Targeting and filtering
  vertical text NOT NULL DEFAULT 'all',  -- 'all' | 'medical_spa' | etc.
  is_us_only boolean NOT NULL DEFAULT true,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now(),

  -- -------------------------------------------------------------------------
  -- Type-specific field requirements enforced at the row level
  -- -------------------------------------------------------------------------
  CONSTRAINT seasonal_moments_fixed_date_fields CHECK (
    type != 'fixed_date' OR (
      month IS NOT NULL AND day IS NOT NULL
      AND weekday IS NULL AND nth IS NULL
      AND start_month IS NULL AND end_month IS NULL
    )
  ),
  CONSTRAINT seasonal_moments_nth_weekday_fields CHECK (
    type != 'nth_weekday' OR (
      month IS NOT NULL AND weekday IS NOT NULL AND nth IS NOT NULL
      AND day IS NULL
      AND start_month IS NULL AND end_month IS NULL
    )
  ),
  CONSTRAINT seasonal_moments_seasonal_window_fields CHECK (
    type != 'seasonal_window' OR (
      start_month IS NOT NULL AND end_month IS NOT NULL
      AND month IS NULL AND day IS NULL
      AND weekday IS NULL AND nth IS NULL
    )
  ),

  -- Names should be unique to prevent accidental duplicate seeds
  CONSTRAINT seasonal_moments_name_unique UNIQUE (name)
);

-- -----------------------------------------------------------------------------
-- 3. Indexes
-- -----------------------------------------------------------------------------
CREATE INDEX idx_seasonal_moments_active
  ON seasonal_moments(is_active) WHERE is_active = true;
CREATE INDEX idx_seasonal_moments_vertical ON seasonal_moments(vertical);
CREATE INDEX idx_seasonal_moments_display_order ON seasonal_moments(display_order);

-- -----------------------------------------------------------------------------
-- 4. Row Level Security
--
--    seasonal_moments is global reference data — every authenticated user
--    can read it. Only platform admins can write (managed via seed
--    migrations rather than runtime UI for v1).
--
--    No INSERT/UPDATE/DELETE policies are created because no policies
--    means no one can write at runtime. Writes happen via migration
--    only (seed data in next step), which bypasses RLS as the migration
--    runs with elevated privileges.
-- -----------------------------------------------------------------------------
ALTER TABLE seasonal_moments ENABLE ROW LEVEL SECURITY;

CREATE POLICY seasonal_moments_select_all ON seasonal_moments
  FOR SELECT
  USING (true);

-- -----------------------------------------------------------------------------
-- 5. Seed data — 16 standard cultural moments
--    Sourced from US calendar conventions and med spa industry patterns.
--    Custom seasonal angles created by individual orgs are stored
--    separately in org_brand_settings.themes.custom_seasonal_angles.
-- -----------------------------------------------------------------------------

-- Floating Nth-weekday holidays
INSERT INTO seasonal_moments (name, type, month, weekday, nth, description, display_order) VALUES
  ('Mother''s Day', 'nth_weekday', 5, 0, 2,
    'Second Sunday in May. Major med spa moment — Botox, fillers, gift cards, mother-daughter bookings.', 10),
  ('Father''s Day', 'nth_weekday', 6, 0, 3,
    'Third Sunday in June. Growing male aesthetics market — trap tox, masseter, hair restoration.', 20),
  ('Memorial Day', 'nth_weekday', 5, 1, -1,
    'Last Monday in May. Summer kickoff — body contouring, laser hair removal push.', 30),
  ('Labor Day', 'nth_weekday', 9, 1, 1,
    'First Monday in September. Pre-fall pivot — laser season opens, IPL becomes safe again.', 40),
  ('Thanksgiving', 'nth_weekday', 11, 4, 4,
    'Fourth Thursday in November. Pre-holiday glow-up window opens for the year-end push.', 50);

-- Fixed-date holidays
INSERT INTO seasonal_moments (name, type, month, day, description, display_order) VALUES
  ('New Year''s Day', 'fixed_date', 1, 1,
    'January 1. Resolution-driven services peak — weight loss, body contouring, skin reset.', 1),
  ('Valentine''s Day', 'fixed_date', 2, 14,
    'February 14. Couples treatments, lip enhancement, gift card promotions.', 5),
  ('Independence Day', 'fixed_date', 7, 4,
    'July 4. Summer skin focus — sunscreen, post-sun recovery, body treatments.', 35),
  ('Halloween', 'fixed_date', 10, 31,
    'October 31. Lead-in to holiday season — laser season is now safe.', 45),
  ('Christmas Eve', 'fixed_date', 12, 24,
    'December 24. Last-minute gift card push.', 55);

-- Seasonal windows
INSERT INTO seasonal_moments (name, type, start_month, end_month, description, display_order) VALUES
  ('Bridal Season', 'seasonal_window', 1, 3,
    'January through March. Engagement spike, wedding-planning window — bridal packages, skin prep timelines.', 7),
  ('Summer Prep', 'seasonal_window', 4, 5,
    'April-May. Body contouring, laser hair removal, skin prep before sun exposure.', 15),
  ('Wedding Season', 'seasonal_window', 4, 9,
    'April through September. Bridal parties, mother-of-bride, wedding-day glow.', 25),
  ('Back to School', 'seasonal_window', 7, 8,
    'July-August. Self-care reset for parents getting their time back.', 38),
  ('Pre-Holiday', 'seasonal_window', 10, 12,
    'October-December. The biggest revenue window of the year — gift cards, holiday party prep.', 48),
  ('Laser Season', 'seasonal_window', 10, 2,
    'October-February. Low-UV months — laser hair removal, IPL, Fraxel are safest done now. Spans year-end.', 60);

-- -----------------------------------------------------------------------------
-- 6. Schema documentation
-- -----------------------------------------------------------------------------
COMMENT ON TABLE seasonal_moments IS
  'Rule-based storage for cultural moments and seasonal windows. Resolves to actual dates per year via app-layer helper (seasonal-moments.ts). Custom org-specific seasonal angles are stored in org_brand_settings.themes.';
COMMENT ON COLUMN seasonal_moments.type IS
  'fixed_date (month+day), nth_weekday (month+weekday+nth), or seasonal_window (start_month+end_month).';
COMMENT ON COLUMN seasonal_moments.weekday IS
  '0=Sunday, 1=Monday, ... 6=Saturday. Used only for nth_weekday moments.';
COMMENT ON COLUMN seasonal_moments.nth IS
  '1-5 for ordinal position in month, -1 for last weekday of month. Used only for nth_weekday moments.';
COMMENT ON COLUMN seasonal_moments.start_month IS
  'Used only for seasonal_window. If end_month < start_month, the window wraps year-end (e.g., Laser Season = Oct-Feb).';
COMMENT ON COLUMN seasonal_moments.display_order IS
  'Default sort order for the dropdown. The app layer overrides this with sort-by-next-occurrence based on todays date.';