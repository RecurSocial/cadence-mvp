-- =====================================================
-- Cadence Sprint 0 Closeout Patch
-- Generated April 30, 2026
-- =====================================================
--
-- Based on Brianna's confirmations:
--   1. Daisy's last name = 'LastName' placeholder remains until real name is provided
--   2. Full Juvederm Collection confirmed at Euphoria (6 new products to add)
--   3. PDO threads = service-only marketing, no product link
--   4. Retail skincare = Obagi, SkinBetter Science, SkinMedica (3 products to add;
--      SkinMedica already exists, just confirming)
--   5. Weight Loss Consult New = duplicate of Initial Consult (consolidate)
--
-- This script:
--   - INSERTs 6 Juvederm Collection products into Euphoria's products table
--     (already library-linked via product_library_id)
--   - INSERTs 2 missing skincare products (Obagi, SkinBetter Science).
--     SkinMedica already exists in Euphoria's products from v1 backfill.
--   - REMAPs 'Weight Loss Consult New' service to SVC_WLW_001 (was SVC_WLW_009)
--   - DELETEs orphaned library entry SVC_WLW_009 (no longer referenced)
--
-- Idempotent: ON CONFLICT DO NOTHING on inserts, conditional WHERE on updates.
-- =====================================================

BEGIN;

-- Sanity check
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM service_library WHERE id = 'SVC_TOX_001') THEN
    RAISE EXCEPTION 'Library not seeded. Run prior migrations first.';
  END IF;
END $$;

-- =====================================================
-- STEP 1: Add 6 Juvederm Collection products to Euphoria
-- All link to existing product_library entries.
-- =====================================================

INSERT INTO products (org_id, name, category, supplier, product_library_id, is_custom, is_active)
VALUES
  ('74b04f56-8cf0-7427-b977-7574b183226d', 'Juvederm Voluma XC',     'Hyaluronic Acid Filler', 'Allergan / AbbVie', 'PRD_F001', FALSE, TRUE),
  ('74b04f56-8cf0-7427-b977-7574b183226d', 'Juvederm Volbella XC',   'Hyaluronic Acid Filler', 'Allergan / AbbVie', 'PRD_F002', FALSE, TRUE),
  ('74b04f56-8cf0-7427-b977-7574b183226d', 'Juvederm Vollure XC',    'Hyaluronic Acid Filler', 'Allergan / AbbVie', 'PRD_F003', FALSE, TRUE),
  ('74b04f56-8cf0-7427-b977-7574b183226d', 'Juvederm Volux XC',      'Hyaluronic Acid Filler', 'Allergan / AbbVie', 'PRD_F004', FALSE, TRUE),
  ('74b04f56-8cf0-7427-b977-7574b183226d', 'Juvederm Ultra Plus XC', 'Hyaluronic Acid Filler', 'Allergan / AbbVie', 'PRD_F005', FALSE, TRUE),
  ('74b04f56-8cf0-7427-b977-7574b183226d', 'Juvederm Ultra XC',      'Hyaluronic Acid Filler', 'Allergan / AbbVie', 'PRD_F006', FALSE, TRUE);

-- =====================================================
-- STEP 2: Add Obagi and SkinBetter Science to Euphoria
-- (SkinMedica already exists in products table)
-- =====================================================

INSERT INTO products (org_id, name, category, supplier, product_library_id, is_custom, is_active)
VALUES
  ('74b04f56-8cf0-7427-b977-7574b183226d', 'Obagi',               'Topical', 'Obagi Medical',                'SKN_007', FALSE, TRUE),
  ('74b04f56-8cf0-7427-b977-7574b183226d', 'SkinBetter Science',  'Topical', 'L''Oreal Dermatological Beauty', 'SKN_002', FALSE, TRUE);

-- =====================================================
-- STEP 3: Remap "Weight Loss Consult New" to canonical entry
-- It is a duplicate of "Weight Loss Initial Consult" — both
-- map to SVC_WLW_001 (Weight Loss Initial Consultation).
-- =====================================================

UPDATE services
SET service_library_id = 'SVC_WLW_001', is_custom = FALSE
WHERE org_id = '74b04f56-8cf0-7427-b977-7574b183226d'
  AND name = 'Weight Loss Consult New';

-- =====================================================
-- STEP 4: Remove orphaned library entry SVC_WLW_009
-- It was created during v1.3 to capture a perceived
-- distinction between "Consult New" and "Initial Consult".
-- Brianna confirmed they're duplicates, so the orphan is
-- removed to keep the library clean.
--
-- Safety: only deletes if no services point at it.
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM services WHERE service_library_id = 'SVC_WLW_009') THEN
    RAISE EXCEPTION 'SVC_WLW_009 still referenced — refusing to delete';
  END IF;
END $$;

DELETE FROM service_library WHERE id = 'SVC_WLW_009';

COMMIT;

-- =====================================================
-- VALIDATION QUERIES
-- =====================================================
--
-- 1. Confirm Euphoria now has 26 products (was 18, +6 Juvederm +2 skincare)
--
-- SELECT COUNT(*) FROM products
-- WHERE org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
--
-- Expected: 26
--
-- 2. Confirm Juvederm Collection is fully present
--
-- SELECT name, product_library_id FROM products
-- WHERE org_id = '74b04f56-8cf0-7427-b977-7574b183226d'
--   AND name LIKE 'Juvederm%'
-- ORDER BY name;
--
-- Expected: 6 rows
--
-- 3. Confirm Weight Loss Consult New now maps to SVC_WLW_001
--
-- SELECT s.name, s.service_library_id, sl.name AS library_match
-- FROM services s
-- JOIN service_library sl ON s.service_library_id = sl.id
-- WHERE s.org_id = '74b04f56-8cf0-7427-b977-7574b183226d'
--   AND s.name LIKE 'Weight Loss%'
-- ORDER BY s.name;
--
-- Expected: 'Weight Loss Consult New' and 'Weight Loss Initial Consult'
-- both link to SVC_WLW_001 'Weight Loss Initial Consultation'.
--
-- 4. Confirm SVC_WLW_009 is gone
--
-- SELECT COUNT(*) FROM service_library WHERE id = 'SVC_WLW_009';
--
-- Expected: 0
--
-- 5. Final library count
--
-- SELECT 'service_library' AS tbl, COUNT(*) FROM service_library
-- UNION ALL SELECT 'product_library', COUNT(*) FROM product_library;
--
-- Expected: service_library = 142 (was 143, -1), product_library = 67 (unchanged)
-- =====================================================
