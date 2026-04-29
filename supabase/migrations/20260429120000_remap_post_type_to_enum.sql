-- Migration 8: Remap post_type values to new 6-button wizard structure
-- and convert post_type from text to enum.
--
-- Context: PostWizard refactor reduces 8 buttons to 6 with sub-branching.
-- Existing posts at Euphoria use 8 distinct text values (plus 1 null).
-- This migration consolidates them into the 6 new canonical values
-- BEFORE the wizard refactor ships, so the calendar and BEL alerts
-- continue to render in-flight posts correctly during the cutover.
--
-- Mapping:
--   Educational           <- Educational, Service Feature
--   BeforeAfter           <- Before/After
--   Spotlight             <- Practitioner Spotlight
--   PromoEventSeasonal    <- Promotional, Event
--   TrendViral            <- Trend/Viral
--   BookNow               <- (new, no legacy mapping)
--
-- NOTE: This migration is written WITHOUT BEGIN/COMMIT and without
-- DO blocks. The Supabase SQL Editor manages transactions per-statement
-- internally, and explicit transaction wrappers can cause the entire
-- batch to silently abort. Statements run in sequence; PostgreSQL will
-- abort the batch on any error, which gives us the same atomicity in
-- practice for this case.
--
-- Pre-flight verification (manual): run this BEFORE applying to confirm
-- only the 8 expected legacy values exist. If any unexpected post_type
-- value is present, fix it manually before running the migration.
--
--   SELECT post_type, COUNT(*) FROM posts GROUP BY post_type;

-- Step 1: Delete the orphaned null row (bug data from earlier wizard version)
DELETE FROM posts WHERE post_type IS NULL;

-- Step 2: Remap legacy text values to new canonical names
UPDATE posts SET post_type = 'Educational'
  WHERE post_type IN ('Educational', 'Service Feature');

UPDATE posts SET post_type = 'BeforeAfter'
  WHERE post_type = 'Before/After';

UPDATE posts SET post_type = 'Spotlight'
  WHERE post_type = 'Practitioner Spotlight';

UPDATE posts SET post_type = 'PromoEventSeasonal'
  WHERE post_type IN ('Promotional', 'Event');

UPDATE posts SET post_type = 'TrendViral'
  WHERE post_type = 'Trend/Viral';

-- Step 3: Pre-conversion sanity check.
-- Should return zero rows. If it returns anything, the next ALTER will fail.
SELECT post_type, COUNT(*) AS row_count
FROM posts
WHERE post_type NOT IN (
  'Educational', 'BeforeAfter', 'Spotlight',
  'PromoEventSeasonal', 'BookNow', 'TrendViral'
)
GROUP BY post_type;

-- Step 4: Create the enum type
CREATE TYPE post_type_enum AS ENUM (
  'Educational',
  'BeforeAfter',
  'Spotlight',
  'PromoEventSeasonal',
  'BookNow',
  'TrendViral'
);

-- Step 5: Convert the column from text to enum.
-- The USING clause maps each text value through enum cast. Will fail
-- the entire ALTER if any row has an unexpected value (which is why
-- Steps 1-2 must run first and Step 3 must return empty).
ALTER TABLE posts
  ALTER COLUMN post_type TYPE post_type_enum
  USING post_type::post_type_enum;

-- Step 6: Add NOT NULL constraint
ALTER TABLE posts
  ALTER COLUMN post_type SET NOT NULL;
