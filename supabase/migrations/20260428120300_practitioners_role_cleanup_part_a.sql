-- =============================================================================
-- Migration: practitioners role cleanup (Part A of 2)
-- Date: 2026-04-28
-- Spec: Cadence_NextSteps_April28_2026_LayerA_Refactor.docx
--
-- Purpose:
--   Cleans up the practitioners.role column from inconsistent text values
--   to a controlled enum that matches real medical/aesthetic credentials.
--
--   Current data (from DB query 2026-04-28):
--     - 6 'Nurse'        — but Brianna and Kim are actually NPs
--     - 4 'Aesthetician' — but Jordan is actually an MA who also does aesthetic work
--     - 1 'MA'           — Daisy (correct, but uses abbreviated form)
--     - 1 'Masseuse'     — Aubrey (should be Massage Therapist)
--
--   This migration introduces:
--     1. practitioner_role enum (6 values)
--     2. role_v2 column with correct values backfilled per practitioner
--     3. additional_capabilities text[] for dual-role practitioners (Jordan)
--     4. can_inject_aesthetic boolean (Botox, fillers, biostimulators)
--     5. can_inject_medical boolean (B12, GLP-1, IV, blood draws)
--
--   Two-part rollout:
--     Part A (this file): Add new columns alongside the old ones, backfill,
--                         verify. Old role column is left untouched and
--                         continues to work.
--     Part B (later):     After wizard refactor is complete and verified,
--                         drop role, rename role_v2 → role. Run only after
--                         confirming no code references the old column.
--
--   Why two parts:
--     - Atomic single-migration approach risks partial failure that would
--       leave practitioners in an unusable state.
--     - This approach keeps the system fully functional during transition.
--     - Rollback for Part A is trivial (just drop the new columns).
--
--   Practitioner role mapping (locked April 28, 2026):
--     Brianna Krug      → Nurse Practitioner
--     Kim Benitez       → Nurse Practitioner
--     Jaimie Burkett    → Nurse
--     Lexy Fazzone      → Nurse
--     Michelle Wilson   → Nurse
--     Nadine Delia      → Nurse
--     Daisy             → Medical Assistant
--     Jordan Land       → Medical Assistant + ['Aesthetician'] capability
--     Nicole Roberto    → Aesthetician
--     Nicole Rekus      → Aesthetician
--     Tori Grant        → Aesthetician
--     Aubrey Rieger     → Massage Therapist
--
--   Injection capabilities:
--     can_inject_aesthetic = true  for: Brianna, Kim (NPs only)
--                                       (Jaimie, Lexy, Michelle, Nadine TBD —
--                                        defaulted to false; Kevin to confirm
--                                        which RNs are certified injectors)
--     can_inject_medical   = true  for: All NPs, all Nurses, both MAs
--                                       (false only for Aestheticians and
--                                        Massage Therapists)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Practitioner role enum
--    Named explicitly to avoid colliding with user_orgs.role enum
--    (which uses owner/admin/staff for app-level permissions).
-- -----------------------------------------------------------------------------
CREATE TYPE practitioner_role AS ENUM (
  'Nurse Practitioner',
  'Nurse',
  'Physician Assistant',
  'Medical Assistant',
  'Aesthetician',
  'Massage Therapist'
);

-- -----------------------------------------------------------------------------
-- 2. New columns on practitioners
--    role_v2 is nullable initially because we add the column before
--    backfilling. After backfill, we'll add a NOT NULL constraint.
-- -----------------------------------------------------------------------------
ALTER TABLE practitioners
  ADD COLUMN role_v2 practitioner_role,
  ADD COLUMN additional_capabilities text[] NOT NULL DEFAULT '{}',
  ADD COLUMN can_inject_aesthetic boolean NOT NULL DEFAULT false,
  ADD COLUMN can_inject_medical boolean NOT NULL DEFAULT false;

-- -----------------------------------------------------------------------------
-- 3. Backfill — by first_name + last_name pair
--    Hardcoded mappings based on confirmed Euphoria roster.
--    Uses LOWER() comparison to be tolerant of casing differences.
-- -----------------------------------------------------------------------------

-- Nurse Practitioners
UPDATE practitioners
SET role_v2 = 'Nurse Practitioner',
    can_inject_aesthetic = true,
    can_inject_medical = true
WHERE LOWER(first_name) = 'brianna' AND LOWER(last_name) = 'krug';

UPDATE practitioners
SET role_v2 = 'Nurse Practitioner',
    can_inject_aesthetic = true,
    can_inject_medical = true
WHERE LOWER(first_name) = 'kim' AND LOWER(last_name) = 'benitez';

-- Nurses (all four — can_inject_aesthetic defaulted to false pending confirmation)
UPDATE practitioners
SET role_v2 = 'Nurse',
    can_inject_medical = true
WHERE LOWER(first_name) = 'jaimie' AND LOWER(last_name) = 'burkett';

UPDATE practitioners
SET role_v2 = 'Nurse',
    can_inject_medical = true
WHERE LOWER(first_name) = 'lexy' AND LOWER(last_name) = 'fazzone';

UPDATE practitioners
SET role_v2 = 'Nurse',
    can_inject_medical = true
WHERE LOWER(first_name) = 'michelle' AND LOWER(last_name) = 'wilson';

UPDATE practitioners
SET role_v2 = 'Nurse',
    can_inject_medical = true
WHERE LOWER(first_name) = 'nadine' AND LOWER(last_name) = 'delia';

-- Medical Assistants
-- Daisy: MA only, no aesthetic capability, but can give general injections
UPDATE practitioners
SET role_v2 = 'Medical Assistant',
    can_inject_medical = true
WHERE LOWER(first_name) = 'daisy';
-- Note: matched on first_name only because last_name is currently blank
-- pending Brianna confirmation

-- Jordan: MA primary + Aesthetician capability + general injection (B12/GLP-1)
-- This is the dual-role case that prompted the additional_capabilities design
UPDATE practitioners
SET role_v2 = 'Medical Assistant',
    additional_capabilities = ARRAY['Aesthetician'],
    can_inject_medical = true
WHERE LOWER(first_name) = 'jordan' AND LOWER(last_name) = 'land';

-- Aestheticians
UPDATE practitioners
SET role_v2 = 'Aesthetician'
WHERE LOWER(first_name) = 'nicole' AND LOWER(last_name) = 'roberto';

UPDATE practitioners
SET role_v2 = 'Aesthetician'
WHERE LOWER(first_name) = 'nicole' AND LOWER(last_name) = 'rekus';

UPDATE practitioners
SET role_v2 = 'Aesthetician'
WHERE LOWER(first_name) = 'tori' AND LOWER(last_name) = 'grant';

-- Massage Therapist (correcting "Masseuse" terminology)
UPDATE practitioners
SET role_v2 = 'Massage Therapist'
WHERE LOWER(first_name) = 'aubrey' AND LOWER(last_name) = 'rieger';

-- -----------------------------------------------------------------------------
-- 4. Verification — fail the migration if any row is left without role_v2
--    This catches typos, missing practitioners, or unexpected DB state.
--    If this raises, the entire migration rolls back.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  unbackfilled_count int;
  unbackfilled_names text;
BEGIN
  SELECT COUNT(*) INTO unbackfilled_count
  FROM practitioners
  WHERE role_v2 IS NULL;

  IF unbackfilled_count > 0 THEN
    SELECT string_agg(
      first_name || ' ' || COALESCE(last_name, '(no last name)') || ' (role: ' || role || ')',
      ', '
    ) INTO unbackfilled_names
    FROM practitioners
    WHERE role_v2 IS NULL;

    RAISE EXCEPTION 'Backfill incomplete: % practitioner(s) have NULL role_v2: %',
      unbackfilled_count, unbackfilled_names;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 5. Now that backfill is verified, enforce NOT NULL on role_v2
-- -----------------------------------------------------------------------------
ALTER TABLE practitioners
  ALTER COLUMN role_v2 SET NOT NULL;

-- -----------------------------------------------------------------------------
-- 6. Indexes for the new role-based query patterns
--    Book Now team-role dropdown queries:
--      "show all practitioners where role_v2 = 'Nurse Practitioner'
--       OR 'Nurse Practitioner' = ANY(additional_capabilities)"
-- -----------------------------------------------------------------------------
CREATE INDEX idx_practitioners_role_v2 ON practitioners(role_v2);
CREATE INDEX idx_practitioners_additional_capabilities
  ON practitioners USING GIN (additional_capabilities);
CREATE INDEX idx_practitioners_can_inject_aesthetic
  ON practitioners(can_inject_aesthetic) WHERE can_inject_aesthetic = true;
CREATE INDEX idx_practitioners_can_inject_medical
  ON practitioners(can_inject_medical) WHERE can_inject_medical = true;

-- -----------------------------------------------------------------------------
-- 7. Schema documentation
-- -----------------------------------------------------------------------------
COMMENT ON COLUMN practitioners.role_v2 IS
  'Primary credential / license. Governs default scope of practice. Will replace the legacy role column in Part B migration.';
COMMENT ON COLUMN practitioners.additional_capabilities IS
  'Functional capabilities beyond primary role. Rare — most practitioners will have empty array. Example: Jordan Land is a Medical Assistant primary with Aesthetician training.';
COMMENT ON COLUMN practitioners.can_inject_aesthetic IS
  'Certified to perform aesthetic injections (Botox, fillers, biostimulators). Required for Book Now eligibility for those services. Defaults to false — must be explicitly confirmed per practitioner.';
COMMENT ON COLUMN practitioners.can_inject_medical IS
  'Certified to perform general medical injections (B12, GLP-1, IV therapy, blood draws). Required for Book Now eligibility for weight loss and IV services.';