-- =====================================================
-- Cadence Service Library v1.1 — REALIGNMENT
-- Generated April 30, 2026
-- Replaces v1 categories/services with Euphoria-aligned naming.
-- =====================================================
--
-- This script:
--   1. Empties service_categories and service_library tables
--   2. Re-seeds with 16 Euphoria-aligned categories
--   3. Re-seeds with services restructured under those categories
--
-- Safe to run because:
--   - No services from any tenant reference service_library yet (backfill not done)
--   - product_library is unchanged (separate concern)
--   - compliance_rules unchanged (separate concern)
-- =====================================================

BEGIN;

-- Sanity check: schema must exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'service_library') THEN
    RAISE EXCEPTION 'Schema missing. Run cadence_service_library_v1_schema.sql first.';
  END IF;
END $$;

-- Wipe out v1 categories and services (no FKs from tenants yet)
TRUNCATE service_library, service_categories RESTART IDENTITY CASCADE;

-- =====================================================
-- Categories v1.1 (Euphoria-aligned)
-- =====================================================

INSERT INTO service_categories (id, name, description, display_order) VALUES
  ('CAT_NEURO', 'Neurotoxins', 'Botulinum toxin injections (Botox, Dysport, Xeomin, Jeuveau, Daxxify)', 1),
  ('CAT_FILLER', 'Fillers', 'Hyaluronic acid, biostimulator, and fat-dissolving fillers (Juvederm, Restylane, Radiesse, Sculptra, Kybella)', 2),
  ('CAT_FACIALS', 'Facials', 'DiamondGlow, custom facials, dermaplaning, chemical peels, add-ons', 3),
  ('CAT_RFMN', 'RF Microneedling', 'Radiofrequency microneedling (Potenza, Morpheus8, Sylfirm)', 4),
  ('CAT_MN', 'Microneedling', 'Traditional microneedling without RF (SkinPen, Eclipse)', 5),
  ('CAT_FRAXEL', 'Fraxel', 'Fractional laser resurfacing (Fraxel, CO2)', 6),
  ('CAT_IPL', 'IPL Laser', 'Intense Pulsed Light treatments for sun damage, redness, pigmentation (BBL, M22)', 7),
  ('CAT_LHR', 'Laser Hair Removal', 'Laser hair reduction by treatment area size', 8),
  ('CAT_COOL', 'CoolSculpting', 'Cryolipolysis fat reduction, CoolTone muscle stimulation', 9),
  ('CAT_INJ', 'Injections', 'B12, NAD, glutathione, lipotropic, MICC, vitamin shots', 10),
  ('CAT_IV', 'IV Therapy', 'Hydration, beauty, recovery, NAD+ IV infusions', 11),
  ('CAT_PRF', 'PRF and EZ Gel', 'Platelet-rich fibrin and EZ Gel treatments (under-eye, microneedling)', 12),
  ('CAT_HORM', 'Hormone Therapy', 'BHRT, sermorelin, peptide therapy, hormone consultations', 13),
  ('CAT_WLW', 'Weight Loss and Wellness', 'GLP-1 programs (semaglutide, tirzepatide), gut health, body composition', 14),
  ('CAT_MASSAGE', 'Massage Therapy', 'Swedish, deep tissue, hot stone, add-ons (cupping, CBD, dermaplaning)', 15),
  ('CAT_SPEC', 'Specialized Services', 'PRP hair restoration, O-Shot, P-Shot, PDO threads, blood work', 16);

-- =====================================================
-- Services v1.1
-- =====================================================

INSERT INTO service_library (id, category_id, name, default_duration_min, pricing_model, appointment_type, linked_product_cat, notes) VALUES
  ('SVC_TOX_001', 'CAT_NEURO', 'Botox Treatment', 15, 'Per unit', 'treatment', 'Neurotoxin', 'Generic name; brand attaches via product'),
  ('SVC_TOX_002', 'CAT_NEURO', 'Dysport Treatment', 15, 'Per unit', 'treatment', 'Neurotoxin', NULL),
  ('SVC_TOX_003', 'CAT_NEURO', 'Xeomin Treatment', 15, 'Per unit', 'treatment', 'Neurotoxin', NULL),
  ('SVC_TOX_004', 'CAT_NEURO', 'Jeuveau Treatment', 15, 'Per unit', 'treatment', 'Neurotoxin', NULL),
  ('SVC_TOX_005', 'CAT_NEURO', 'Daxxify Treatment', 15, 'Per unit', 'treatment', 'Neurotoxin', NULL),
  ('SVC_TOX_006', 'CAT_NEURO', 'Neurotoxin Consultation', 30, 'Free / Low fee', 'consultation', NULL, NULL),
  ('SVC_TOX_007', 'CAT_NEURO', 'Lip Flip', 10, 'Per unit', 'treatment', 'Neurotoxin', 'Off-label use'),
  ('SVC_TOX_008', 'CAT_NEURO', 'Masseter / Jawline Slimming', 20, 'Per unit', 'treatment', 'Neurotoxin', 'Off-label use'),
  ('SVC_TOX_009', 'CAT_NEURO', 'Trapezius / Trap-Tox', 30, 'Per unit', 'treatment', 'Neurotoxin', 'Off-label use'),
  ('SVC_TOX_010', 'CAT_NEURO', 'Hyperhidrosis Treatment', 30, 'Per unit', 'treatment', 'Neurotoxin', 'Underarms / hands / feet'),
  ('SVC_TOX_011', 'CAT_NEURO', 'Gummy Smile', 15, 'Per unit', 'treatment', 'Neurotoxin', 'Off-label use'),
  ('SVC_TOX_012', 'CAT_NEURO', 'Migraine Tox', 15, 'Per treatment', 'treatment', 'Neurotoxin', 'FDA-approved for chronic migraine'),
  ('SVC_TOX_013', 'CAT_NEURO', 'Neurotoxin Follow-up 2 Week Post', 10, 'Free', 'follow_up', NULL, NULL),
  ('SVC_TOX_014', 'CAT_NEURO', 'Injector Fee (BYO Neurotoxin)', 20, 'Flat fee', 'treatment', NULL, 'Patient supplies own product'),
  ('SVC_FIL_001', 'CAT_FILLER', 'Dermal Filler Standard', 60, 'Per syringe', 'treatment', 'Filler', 'Catch-all; brand via product'),
  ('SVC_FIL_002', 'CAT_FILLER', 'Dermal Filler Consultation', 30, 'Free / Low fee', 'consultation', NULL, NULL),
  ('SVC_FIL_003', 'CAT_FILLER', 'Dermal Filler Dissolve', 30, 'Per session', 'treatment', 'Filler', 'Hyaluronidase'),
  ('SVC_FIL_004', 'CAT_FILLER', 'Lip Filler', 45, 'Per syringe', 'treatment', 'Filler', NULL),
  ('SVC_FIL_005', 'CAT_FILLER', 'Cheek Filler', 45, 'Per syringe', 'treatment', 'Filler', NULL),
  ('SVC_FIL_006', 'CAT_FILLER', 'Chin / Jawline Filler', 60, 'Per syringe', 'treatment', 'Filler', NULL),
  ('SVC_FIL_007', 'CAT_FILLER', 'Under-Eye / Tear Trough Filler', 45, 'Per syringe', 'treatment', 'Filler', 'High-skill area'),
  ('SVC_FIL_008', 'CAT_FILLER', 'Nasolabial Folds', 30, 'Per syringe', 'treatment', 'Filler', NULL),
  ('SVC_FIL_009', 'CAT_FILLER', 'Marionette Lines', 30, 'Per syringe', 'treatment', 'Filler', NULL),
  ('SVC_FIL_010', 'CAT_FILLER', 'Temple Filler', 30, 'Per syringe', 'treatment', 'Filler', NULL),
  ('SVC_FIL_011', 'CAT_FILLER', 'Non-Surgical Rhinoplasty', 60, 'Per syringe', 'treatment', 'Filler', 'High-risk; NP/PA only'),
  ('SVC_FIL_012', 'CAT_FILLER', 'Bio Stimulator Filler', 60, 'Per vial', 'treatment', 'Filler', 'Sculptra, Radiesse'),
  ('SVC_FIL_013', 'CAT_FILLER', 'Biostimulator Follow-up', 15, 'Free', 'follow_up', NULL, NULL),
  ('SVC_FIL_014', 'CAT_FILLER', 'Radiesse BBL', 60, 'Per session', 'treatment', 'Filler', 'Brazilian Butt Lift application'),
  ('SVC_FIL_015', 'CAT_FILLER', 'Kybella / Submental Fat', 30, 'Per vial', 'treatment', 'Filler', 'Deoxycholic acid'),
  ('SVC_FIL_016', 'CAT_FILLER', 'PDGF', 45, 'Per session', 'treatment', 'Filler', 'Platelet-derived growth factor'),
  ('SVC_FIL_017', 'CAT_FILLER', 'PDGF Follow-up', 15, 'Free', 'follow_up', NULL, NULL),
  ('SVC_FIL_018', 'CAT_FILLER', 'Filler Follow-up 2 Week Post', 10, 'Free', 'follow_up', NULL, NULL),
  ('SVC_FIL_019', 'CAT_FILLER', 'Kybella Follow-up 4 Week Post', 10, 'Free', 'follow_up', NULL, NULL),
  ('SVC_FAC_001', 'CAT_FACIALS', 'DiamondGlow Facial', 50, 'Per session', 'treatment', 'Facial Device', NULL),
  ('SVC_FAC_002', 'CAT_FACIALS', 'HydraFacial', 50, 'Per session', 'treatment', 'Facial Device', NULL),
  ('SVC_FAC_003', 'CAT_FACIALS', 'Custom / Signature Facial', 60, 'Per session', 'treatment', NULL, NULL),
  ('SVC_FAC_004', 'CAT_FACIALS', 'Anti-Aging Facial', 50, 'Per session', 'treatment', NULL, NULL),
  ('SVC_FAC_005', 'CAT_FACIALS', 'Illuminating Facial', 50, 'Per session', 'treatment', NULL, NULL),
  ('SVC_FAC_006', 'CAT_FACIALS', 'Glow / Signature Glow Facial', 50, 'Per session', 'treatment', NULL, NULL),
  ('SVC_FAC_007', 'CAT_FACIALS', 'Back Facial', 40, 'Per session', 'treatment', NULL, NULL),
  ('SVC_FAC_008', 'CAT_FACIALS', 'Back DiamondGlow Facial', 40, 'Per session', 'treatment', 'Facial Device', NULL),
  ('SVC_FAC_009', 'CAT_FACIALS', 'Dermaplaning Facial', 50, 'Per session', 'treatment', NULL, NULL),
  ('SVC_FAC_010', 'CAT_FACIALS', 'Chemical Peel', 45, 'Per session', 'treatment', 'Skincare', 'VI Peel, TCA, Glycolic'),
  ('SVC_FAC_011', 'CAT_FACIALS', 'LED Light Therapy Treatment', 30, 'Per session', 'treatment', NULL, NULL),
  ('SVC_FAC_012', 'CAT_FACIALS', 'Skin Analysis / Consultation', 30, 'Free / Low fee', 'consultation', NULL, NULL),
  ('SVC_FAC_013', 'CAT_FACIALS', 'Dermaplane Add-on', 20, 'Add-on fee', 'treatment', NULL, NULL),
  ('SVC_FAC_014', 'CAT_FACIALS', 'Jelly Mask Add-on', 15, 'Add-on fee', 'treatment', NULL, NULL),
  ('SVC_FAC_015', 'CAT_FACIALS', 'LED Add-on', 30, 'Add-on fee', 'treatment', NULL, NULL),
  ('SVC_FAC_016', 'CAT_FACIALS', 'PRP Add-on', 35, 'Add-on fee', 'treatment', 'Regenerative', NULL),
  ('SVC_FAC_017', 'CAT_FACIALS', 'PDRN Add-on', 5, 'Add-on fee', 'treatment', NULL, 'Polydeoxyribonucleotide'),
  ('SVC_RFMN_001', 'CAT_RFMN', 'RF Microneedling Face and Neck', 90, 'Per session', 'treatment', 'Energy Device', NULL),
  ('SVC_RFMN_002', 'CAT_RFMN', 'RF Microneedling Acne Scars', 90, 'Per session', 'treatment', 'Energy Device', NULL),
  ('SVC_RFMN_003', 'CAT_RFMN', 'RF Microneedling Decollete', 90, 'Per session', 'treatment', 'Energy Device', NULL),
  ('SVC_RFMN_004', 'CAT_RFMN', 'RF Microneedling Abdomen', 90, 'Per session', 'treatment', 'Energy Device', NULL),
  ('SVC_RFMN_005', 'CAT_RFMN', 'RF Microneedling Arms', 90, 'Per session', 'treatment', 'Energy Device', NULL),
  ('SVC_RFMN_006', 'CAT_RFMN', 'RF Microneedling Other Body Area', 120, 'Per session', 'treatment', 'Energy Device', NULL),
  ('SVC_MN_001', 'CAT_MN', 'Microneedling Face and Neck', 60, 'Per session', 'treatment', 'Energy Device', NULL),
  ('SVC_MN_002', 'CAT_MN', 'Neck Add-on Microneedling', 15, 'Add-on fee', 'treatment', NULL, NULL),
  ('SVC_FRX_001', 'CAT_FRAXEL', 'Fraxel Treatment', 60, 'Per session', 'treatment', 'Energy Device', NULL),
  ('SVC_FRX_002', 'CAT_FRAXEL', 'Fraxel Consultation', 15, 'Free', 'consultation', NULL, NULL),
  ('SVC_FRX_003', 'CAT_FRAXEL', 'Fraxel Follow-up', 15, 'Free', 'follow_up', NULL, NULL),
  ('SVC_IPL_001', 'CAT_IPL', 'IPL Laser Full Face', 20, 'Per session', 'treatment', 'Energy Device', NULL),
  ('SVC_IPL_002', 'CAT_IPL', 'IPL Laser Face and Neck', 30, 'Per session', 'treatment', 'Energy Device', NULL),
  ('SVC_IPL_003', 'CAT_IPL', 'IPL Laser Decollete', 35, 'Per session', 'treatment', 'Energy Device', NULL),
  ('SVC_IPL_004', 'CAT_IPL', 'IPL Laser Full Face Neck Decollete', 60, 'Per session', 'treatment', 'Energy Device', NULL),
  ('SVC_IPL_005', 'CAT_IPL', 'Add-on IPL Full Face', 15, 'Add-on fee', 'treatment', NULL, NULL),
  ('SVC_LHR_001', 'CAT_LHR', 'Laser Hair X-Small Area', 20, 'Per session', 'treatment', 'Energy Device', 'Lip, chin, sideburns'),
  ('SVC_LHR_002', 'CAT_LHR', 'Laser Hair Small Area', 20, 'Per session', 'treatment', 'Energy Device', 'Underarms, bikini line'),
  ('SVC_LHR_003', 'CAT_LHR', 'Laser Hair Medium Area', 30, 'Per session', 'treatment', 'Energy Device', 'Brazilian, half arms, half legs'),
  ('SVC_LHR_004', 'CAT_LHR', 'Laser Hair Large Area', 35, 'Per session', 'treatment', 'Energy Device', 'Full legs, back, chest'),
  ('SVC_LHR_005', 'CAT_LHR', 'Laser Hair X-Large Area', 45, 'Per session', 'treatment', 'Energy Device', 'Full body / multiple large areas'),
  ('SVC_COOL_001', 'CAT_COOL', 'CoolSculpting Elite Treatment', 60, 'Per cycle', 'treatment', 'Body Device', NULL),
  ('SVC_COOL_002', 'CAT_COOL', 'CoolSculpting Elite Consultation', 30, 'Free', 'consultation', NULL, NULL),
  ('SVC_COOL_003', 'CAT_COOL', 'CoolSculpting Elite Follow-up', 30, 'Free', 'follow_up', NULL, NULL),
  ('SVC_COOL_004', 'CAT_COOL', 'CoolTone', 30, 'Per session', 'treatment', 'Body Device', NULL),
  ('SVC_INJ_001', 'CAT_INJ', 'B12 Injection', 5, 'Per shot', 'treatment', 'Pharmaceutical', NULL),
  ('SVC_INJ_002', 'CAT_INJ', 'Lipo-Mino Injection', 5, 'Per shot', 'treatment', 'Pharmaceutical', NULL),
  ('SVC_INJ_003', 'CAT_INJ', 'MICC / Lipotropic Skinny Shot', 5, 'Per shot', 'treatment', 'Pharmaceutical', 'Methionine, Inositol, Choline, Cyanocobalamin'),
  ('SVC_INJ_004', 'CAT_INJ', 'Glutathione IM or IV Push', 10, 'Per shot', 'treatment', 'Pharmaceutical', NULL),
  ('SVC_INJ_005', 'CAT_INJ', 'NAD IM Injection 25mg', 15, 'Per shot', 'treatment', 'Pharmaceutical', NULL),
  ('SVC_INJ_006', 'CAT_INJ', 'NAD IM Injection 50mg', 15, 'Per shot', 'treatment', 'Pharmaceutical', NULL),
  ('SVC_INJ_007', 'CAT_INJ', 'NAD IM Injection 75mg', 15, 'Per shot', 'treatment', 'Pharmaceutical', NULL),
  ('SVC_INJ_008', 'CAT_INJ', 'NAD IM Injection 100mg', 15, 'Per shot', 'treatment', 'Pharmaceutical', NULL),
  ('SVC_INJ_009', 'CAT_INJ', 'Add-on Vitamins', 5, 'Add-on fee', 'treatment', 'Pharmaceutical', NULL),
  ('SVC_IV_001', 'CAT_IV', 'Hydrate IV (Basic)', 55, 'Per session', 'treatment', 'IV Therapy', NULL),
  ('SVC_IV_002', 'CAT_IV', 'Meyers Cocktail', 55, 'Per session', 'treatment', 'IV Therapy', NULL),
  ('SVC_IV_003', 'CAT_IV', 'HydraGlow / Beauty IV', 55, 'Per session', 'treatment', 'IV Therapy', NULL),
  ('SVC_IV_004', 'CAT_IV', 'HydraGO / Express IV', 55, 'Per session', 'treatment', 'IV Therapy', NULL),
  ('SVC_IV_005', 'CAT_IV', 'HydraLean / Weight-Support IV', 55, 'Per session', 'treatment', 'IV Therapy', NULL),
  ('SVC_IV_006', 'CAT_IV', 'HydraMunity / Immune IV', 55, 'Per session', 'treatment', 'IV Therapy', NULL),
  ('SVC_IV_007', 'CAT_IV', 'HydraRecovery / Athletic IV', 55, 'Per session', 'treatment', 'IV Therapy', NULL),
  ('SVC_IV_008', 'CAT_IV', 'HydraCure / Premium IV', 60, 'Per session', 'treatment', 'IV Therapy', NULL),
  ('SVC_IV_009', 'CAT_IV', 'NAD+ IV Therapy 250mg', 90, 'Per session', 'treatment', 'IV Therapy', NULL),
  ('SVC_IV_010', 'CAT_IV', 'NAD+ IV Therapy 500mg', 120, 'Per session', 'treatment', 'IV Therapy', NULL),
  ('SVC_PRF_001', 'CAT_PRF', 'PRF EZ Gel Under Eye', 75, 'Per session', 'treatment', 'Regenerative', NULL),
  ('SVC_PRF_002', 'CAT_PRF', 'PRF EZ Gel Consultation', 15, 'Free', 'consultation', NULL, NULL),
  ('SVC_HORM_001', 'CAT_HORM', 'Initial Female Hormone Therapy', 45, 'Per visit', 'consultation', 'Pharmaceutical', 'BHRT intake'),
  ('SVC_HORM_002', 'CAT_HORM', 'Initial Male Hormone Therapy', 45, 'Per visit', 'consultation', 'Pharmaceutical', 'TRT intake'),
  ('SVC_HORM_003', 'CAT_HORM', 'Hormone Therapy Maintenance', 20, 'Per visit', 'consultation', 'Pharmaceutical', NULL),
  ('SVC_HORM_004', 'CAT_HORM', 'Hormone Consultation', 20, 'Free', 'consultation', NULL, NULL),
  ('SVC_HORM_005', 'CAT_HORM', 'Sermorelin Therapy', 10, 'Per visit', 'treatment', 'Pharmaceutical', NULL),
  ('SVC_WLW_001', 'CAT_WLW', 'Weight Loss Initial Consultation', 45, 'Per visit', 'consultation', 'Pharmaceutical', 'GLP-1 intake'),
  ('SVC_WLW_002', 'CAT_WLW', 'Weight Loss Maintenance', 20, 'Per visit', 'consultation', 'Pharmaceutical', 'Compounded GLP-1 follow-up'),
  ('SVC_WLW_003', 'CAT_WLW', 'NovoCare / Branded GLP-1 Monthly', 15, 'Per visit', 'consultation', 'Pharmaceutical', 'Wegovy/Ozempic via NovoCare'),
  ('SVC_WLW_004', 'CAT_WLW', 'Zepbound / Mounjaro Monthly', 15, 'Per visit', 'consultation', 'Pharmaceutical', 'Tirzepatide branded'),
  ('SVC_WLW_005', 'CAT_WLW', 'Compounded Semaglutide Monthly', 15, 'Per visit', 'consultation', 'Pharmaceutical', 'Compounded — different rules apply'),
  ('SVC_WLW_006', 'CAT_WLW', '3D Body Scan', 10, 'Per scan', 'procedure', NULL, 'Body composition tracking'),
  ('SVC_WLW_007', 'CAT_WLW', 'Gut Repair Program', 30, 'Program fee', 'treatment', NULL, NULL),
  ('SVC_WLW_008', 'CAT_WLW', 'Gut Health Follow-up', 20, 'Free', 'follow_up', NULL, NULL),
  ('SVC_MAS_001', 'CAT_MASSAGE', 'Swedish Massage 60min', 60, 'Per session', 'treatment', NULL, NULL),
  ('SVC_MAS_002', 'CAT_MASSAGE', 'Swedish Massage 90min', 90, 'Per session', 'treatment', NULL, NULL),
  ('SVC_MAS_003', 'CAT_MASSAGE', 'Deep Tissue 60min', 60, 'Per session', 'treatment', NULL, NULL),
  ('SVC_MAS_004', 'CAT_MASSAGE', 'Deep Tissue 90min', 90, 'Per session', 'treatment', NULL, NULL),
  ('SVC_MAS_005', 'CAT_MASSAGE', 'Hot Stone Massage', 75, 'Per session', 'treatment', NULL, NULL),
  ('SVC_MAS_006', 'CAT_MASSAGE', 'Cupping Add-on', 15, 'Add-on fee', 'treatment', NULL, NULL),
  ('SVC_MAS_007', 'CAT_MASSAGE', 'CBD Oil Add-on', 5, 'Add-on fee', 'treatment', NULL, NULL),
  ('SVC_SPEC_001', 'CAT_SPEC', 'PRP Hair Restoration / Microneedling', 60, 'Per session', 'treatment', 'Regenerative', NULL),
  ('SVC_SPEC_002', 'CAT_SPEC', 'PRP / PRF Hair Restoration', 60, 'Per session', 'treatment', 'Regenerative', NULL),
  ('SVC_SPEC_003', 'CAT_SPEC', 'PRP Microneedling / Vampire Facial', 90, 'Per session', 'treatment', 'Regenerative', NULL),
  ('SVC_SPEC_004', 'CAT_SPEC', 'O-Shot', 45, 'Per session', 'treatment', 'Regenerative', 'Trademarked protocol'),
  ('SVC_SPEC_005', 'CAT_SPEC', 'P-Shot', 45, 'Per session', 'treatment', 'Regenerative', 'Trademarked protocol'),
  ('SVC_SPEC_006', 'CAT_SPEC', 'PDO Thread Lift', 60, 'Per area', 'treatment', NULL, NULL),
  ('SVC_SPEC_007', 'CAT_SPEC', 'PDO Thread Consultation', 15, 'Free', 'consultation', NULL, NULL),
  ('SVC_SPEC_008', 'CAT_SPEC', 'PDO Thread Follow-up', 15, 'Free', 'follow_up', NULL, NULL),
  ('SVC_SPEC_009', 'CAT_SPEC', 'Blood Work / Lab Draw', 15, 'Per visit', 'procedure', NULL, NULL),
  ('SVC_SPEC_010', 'CAT_SPEC', 'Spray Tan', 20, 'Per session', 'treatment', NULL, NULL),
  ('SVC_SPEC_011', 'CAT_SPEC', 'Glow Society Salt Upgrade', 5, 'Upgrade fee', 'treatment', NULL, 'Branded Euphoria-style upgrade');

COMMIT;

-- =====================================================
-- Verification
-- =====================================================
-- SELECT 'categories' AS tbl, COUNT(*) FROM service_categories
-- UNION ALL SELECT 'services', COUNT(*) FROM service_library;
-- Expected: categories = 16, services = 127
-- =====================================================