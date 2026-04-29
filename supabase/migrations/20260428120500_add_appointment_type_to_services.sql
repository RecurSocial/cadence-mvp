-- =============================================================================
-- Migration: Add appointment_type to services
-- Date: 2026-04-28
-- Spec: Cadence_NextSteps_April28_2026_LayerA_Refactor.docx (Decision 3 lock)
--
-- Purpose:
--   Distinguishes procedures from consultations and follow-up appointments.
--
--   Why: Consultations and follow-ups are valid appointment types with
--   real value as content sources ("What to expect at your 2-week Botox
--   follow-up", "What to expect during your filler consultation"). The
--   wizard's AI prompt should branch on this flag — different question
--   shapes for procedure posts vs. consultation/follow-up posts.
--
--   The 21 'N/A' product rows in the Euphoria spreadsheet are mostly
--   consultations and follow-ups. This migration backfills them
--   accordingly so the backfill script (next file) doesn't have to.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Enum
-- -----------------------------------------------------------------------------
CREATE TYPE appointment_type AS ENUM (
  'procedure',
  'consultation',
  'follow_up'
);

-- -----------------------------------------------------------------------------
-- 2. Column — defaults to 'procedure' since most existing rows are procedures
-- -----------------------------------------------------------------------------
ALTER TABLE services
  ADD COLUMN appointment_type appointment_type NOT NULL DEFAULT 'procedure';

-- -----------------------------------------------------------------------------
-- 3. Backfill consultations and follow-ups by name pattern
--    Conservative match — anything that has "Consult" or "Follow-up" or
--    "Follow Up" in the name. Catches all known consultation/follow-up
--    services in the Euphoria matrix. Safe because procedures don't use
--    those words in their names.
-- -----------------------------------------------------------------------------
UPDATE services
SET appointment_type = 'consultation'
WHERE name ILIKE '%consult%';

UPDATE services
SET appointment_type = 'follow_up'
WHERE name ILIKE '%follow-up%' OR name ILIKE '%follow up%';

-- -----------------------------------------------------------------------------
-- 4. Index for the wizard's filter queries
--    Educational wizard needs "show only procedure services" (default)
--    or "show only consultation/follow-up services" (toggle).
-- -----------------------------------------------------------------------------
CREATE INDEX idx_services_appointment_type ON services(appointment_type);

-- -----------------------------------------------------------------------------
-- 5. Schema documentation
-- -----------------------------------------------------------------------------
COMMENT ON COLUMN services.appointment_type IS
  'Type of appointment. procedure = the service itself (Lip Flip, Botox, etc.). consultation = pre-treatment consult. follow_up = post-treatment check-in. Drives the wizards AI prompt shape.';

-- -----------------------------------------------------------------------------
-- 6. Verification — log how many of each type after backfill
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  procedure_count int;
  consultation_count int;
  follow_up_count int;
BEGIN
  SELECT COUNT(*) INTO procedure_count FROM services WHERE appointment_type = 'procedure';
  SELECT COUNT(*) INTO consultation_count FROM services WHERE appointment_type = 'consultation';
  SELECT COUNT(*) INTO follow_up_count FROM services WHERE appointment_type = 'follow_up';

  RAISE NOTICE 'appointment_type backfill complete: % procedures, % consultations, % follow-ups',
    procedure_count, consultation_count, follow_up_count;
END $$;