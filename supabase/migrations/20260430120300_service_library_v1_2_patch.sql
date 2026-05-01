-- =====================================================
-- Cadence Service Library v1.2 — PATCH
-- Generated April 30, 2026
-- =====================================================
--
-- Adds 5 products + 1 service + 2 compliance rules.
-- Identified during Euphoria backfill mapping review.
--
-- Run AFTER cadence_service_library_v1_1_realign.sql.
-- Idempotent via ON CONFLICT DO NOTHING.
-- =====================================================

BEGIN;

-- Sanity check
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'product_library') THEN
    RAISE EXCEPTION 'Schema missing. Run cadence_service_library_v1_schema.sql first.';
  END IF;
END $$;

-- =====================================================
-- Schema change: extend product_class CHECK constraint
-- to include 'pharmaceutical' for compounded peptides
-- and branded prescription products.
-- =====================================================

ALTER TABLE product_library
  DROP CONSTRAINT IF EXISTS product_library_product_class_check;

ALTER TABLE product_library
  ADD CONSTRAINT product_library_product_class_check
  CHECK (product_class IN ('injectable', 'device', 'skincare', 'pharmaceutical'));

-- =====================================================
-- Add new service: SaltMed Facial
-- (others already exist in v1.1: SVC_WLW_005, SVC_HORM_005,
--  SVC_WLW_004, SVC_FAC_010)
-- =====================================================

INSERT INTO service_library (id, category_id, name, default_duration_min, pricing_model, appointment_type, linked_product_cat, notes) VALUES
  ('SVC_FAC_018', 'CAT_FACIALS', 'SaltMed Facial', 60, 'Per session', 'treatment', 'Facial Device', 'Halotherapy facial — antimicrobial / anti-inflammatory claims regulated under FTC')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Add 5 products to product_library
-- =====================================================

INSERT INTO product_library (id, product_class, manufacturer, brand_family, product_name, sub_category, fda_indication, has_boxed_warning, trademark_notation) VALUES
  -- SaltMed (device)
  ('DEV_090', 'device', 'SaltMed Technologies', 'SaltMed', 'SaltMed', 'Halotherapy / Salt Facial', 'Wellness device — pharmaceutical-grade salt aerosol; not FDA-cleared as medical device for treatment claims', FALSE, 'SaltMed®'),
  -- Compounded Semaglutide (pharmaceutical)
  ('PHARM_001', 'pharmaceutical', 'Various Compounding Pharmacies', 'Compounded Semaglutide', 'Compounded Semaglutide', 'GLP-1 receptor agonist (compounded)', 'Off-label / compounded — not FDA-approved; falls under FDA compounding regulations', FALSE, 'Compounded semaglutide (generic name only — no trademark)'),
  -- Sermorelin (pharmaceutical)
  ('PHARM_002', 'pharmaceutical', 'Various Compounding Pharmacies', 'Sermorelin', 'Sermorelin', 'Compounded Peptide / GHRH analog', 'Compounded growth hormone-releasing peptide — not FDA-approved branded product', FALSE, 'Sermorelin acetate (generic name)'),
  -- Zepbound (pharmaceutical, branded)
  ('PHARM_003', 'pharmaceutical', 'Eli Lilly', 'Zepbound', 'Zepbound', 'Dual GIP/GLP-1 receptor agonist (tirzepatide)', 'Chronic weight management in adults with BMI ≥30 or BMI ≥27 with weight-related comorbidity', FALSE, 'Zepbound® (tirzepatide)'),
  -- VI Peel (skincare)
  ('SKN_011', 'skincare', 'VI Aesthetics', 'VI Peel', 'VI Peel (Original, Body, Precision, Purify)', 'Medium-depth chemical peel', NULL, FALSE, 'VI Peel®')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Add 2 new compliance rules
-- =====================================================

INSERT INTO compliance_rules (id, applies_to, rule_type, required_behavior, source) VALUES
  -- Halotherapy claims
  ('CMP_016', 'Halotherapy / SaltMed devices', 'drug_claim', 'Cannot claim halotherapy treats, cures, or prevents respiratory disease, asthma, eczema, or skin conditions. Must use wellness language only (relaxation, skin appearance, breathing comfort). Avoid medical-sounding endpoints.', 'FTC + FDA wellness device guidance'),
  -- Branded GLP-1 (Zepbound, Wegovy, Ozempic, Mounjaro)
  ('CMP_017', 'Branded GLP-1 medications (Zepbound, Wegovy, Ozempic, Mounjaro)', 'trademark', 'Use full trademark on first reference. Cannot show patient before/after photos with brand-name attribution unless patient was on documented FDA-approved indication. Off-label use (cosmetic weight loss in non-eligible BMI) requires careful framing — cannot promote brand for off-label use.', 'FDA promotional + trademark')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- =====================================================
-- Verification
-- =====================================================
-- SELECT 'service_categories' AS tbl, COUNT(*) FROM service_categories
-- UNION ALL SELECT 'service_library', COUNT(*) FROM service_library
-- UNION ALL SELECT 'product_library', COUNT(*) FROM product_library
-- UNION ALL SELECT 'compliance_rules', COUNT(*) FROM compliance_rules;
--
-- Expected after v1.2 patch:
--   service_categories  | 16
--   service_library     | 128  (was 127, +1 SaltMed Facial)
--   product_library     | 67   (was 62, +5)
--   compliance_rules    | 17   (was 15, +2)
-- =====================================================
