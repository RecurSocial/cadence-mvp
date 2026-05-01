-- =====================================================
-- Cadence Service Library v1.3 — PATCH
-- Generated April 30, 2026
-- =====================================================
--
-- Adds 15 new service_library entries identified during the
-- Euphoria backfill safety check.
--
-- Categories represented:
--   Fillers (2):     SkinVive Lips, SkinVive 2 Syringes
--   Massage (2):     Sports Massage 60min, 90min
--   Specialized (4): Telehealth quartet (Hormone, Weight Loss, Maintenance, Blood Work)
--   Injections (3):  Vitamin D, Tri-Immune, Zofran
--   Facials (3):     SkinMedica Illuminize Peel, VI Peel Original, VI Body Peel
--   Weight Loss (1): Weight Loss Consult (New Patient Inquiry) — separate from paid Initial
--
-- BACKLOG NOTE:
--   The 4 Telehealth entries should be deprecated when 'delivery_mode'
--   column is added to services and service_library (P1 backlog —
--   slotted between Sprint 1 PostWizard refactor and Sprint 2 Practice
--   Story Elements). Until then, these are distinct library rows.
--
-- Run AFTER cadence_service_library_v1_2_patch.sql.
-- =====================================================

BEGIN;

-- Sanity check
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM service_library WHERE id = 'SVC_TOX_001') THEN
    RAISE EXCEPTION 'Library v1.1 not seeded. Run cadence_service_library_v1_1_realign.sql first.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM product_library WHERE id = 'PHARM_001') THEN
    RAISE EXCEPTION 'Library v1.2 not seeded. Run cadence_service_library_v1_2_patch.sql first.';
  END IF;
END $$;

-- =====================================================
-- Add 15 new service_library entries
-- =====================================================

INSERT INTO service_library (id, category_id, name, default_duration_min, pricing_model, appointment_type, linked_product_cat, notes) VALUES
  ('SVC_FIL_020', 'CAT_FILLER', 'SkinVive Lips', 30, 'Per syringe', 'treatment', 'Filler', 'SkinVive HA hydration applied to lip area'),
  ('SVC_FIL_021', 'CAT_FILLER', 'SkinVive 2 Syringes', 45, 'Per session', 'treatment', 'Filler', 'SkinVive double-syringe protocol for cheek microhydration'),
  ('SVC_MAS_008', 'CAT_MASSAGE', 'Sports Massage 60min', 60, 'Per session', 'treatment', NULL, 'Targeted athletic recovery massage'),
  ('SVC_MAS_009', 'CAT_MASSAGE', 'Sports Massage 90min', 90, 'Per session', 'treatment', NULL, 'Extended sports massage with deep work'),
  ('SVC_SPEC_012', 'CAT_SPEC', 'Telehealth Hormone Initial', 30, 'Per visit', 'consultation', 'Pharmaceutical', 'Remote BHRT/TRT initial consult — telehealth delivery'),
  ('SVC_SPEC_013', 'CAT_SPEC', 'Telehealth Weight Loss Initial', 30, 'Per visit', 'consultation', 'Pharmaceutical', 'Remote GLP-1 program intake — telehealth delivery'),
  ('SVC_SPEC_014', 'CAT_SPEC', 'Telehealth Maintenance Visit', 15, 'Per visit', 'consultation', 'Pharmaceutical', 'Remote hormone/weight loss maintenance — telehealth delivery'),
  ('SVC_SPEC_015', 'CAT_SPEC', 'Telehealth Blood Work Follow-up', 15, 'Per visit', 'consultation', NULL, 'Remote lab review — telehealth delivery'),
  ('SVC_INJ_010', 'CAT_INJ', 'Vitamin D Injection', 5, 'Per shot', 'treatment', 'Pharmaceutical', 'Cholecalciferol IM injection'),
  ('SVC_INJ_011', 'CAT_INJ', 'Tri-Immune IM Shot', 5, 'Per shot', 'treatment', 'Pharmaceutical', 'Glutathione + Vitamin C + Zinc combo for immune support'),
  ('SVC_INJ_012', 'CAT_INJ', 'Zofran (Anti-Nausea) Injection', 5, 'Per shot', 'treatment', 'Pharmaceutical', 'Ondansetron — Rx anti-emetic'),
  ('SVC_FAC_019', 'CAT_FACIALS', 'SkinMedica Illuminize Peel', 30, 'Per session', 'treatment', 'Skincare', 'Allergan SkinMedica branded entry-level peel'),
  ('SVC_FAC_020', 'CAT_FACIALS', 'VI Peel Original', 45, 'Per session', 'treatment', 'Skincare', 'VI Peel — entry-level facial chemical peel'),
  ('SVC_FAC_021', 'CAT_FACIALS', 'VI Body Peel', 60, 'Per session', 'treatment', 'Skincare', 'VI Body Peel — body application formulation'),
  ('SVC_WLW_009', 'CAT_WLW', 'Weight Loss Consult (New Patient Inquiry)', 20, 'Free', 'consultation', NULL, 'Top-of-funnel intake — separate from paid Initial Consultation')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- =====================================================
-- Verification
-- =====================================================
-- SELECT 'service_library' AS tbl, COUNT(*) FROM service_library;
-- Expected after v1.3: 143 (was 128, +15)
-- =====================================================
