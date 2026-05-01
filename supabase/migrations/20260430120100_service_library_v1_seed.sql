-- =====================================================
-- Cadence v1 Service Library — SEED DATA ONLY
-- Generated April 30, 2026 (revised v3, sqlparse-validated)
-- Run cadence_service_library_v1_schema.sql FIRST.
-- =====================================================
--
-- Populates 4 tables created by the schema script:
--   service_categories    (11 rows)
--   service_library       (70 rows)
--   product_library       (61 rows: 32 injectables + 19 devices + 10 skincare)
--   compliance_rules      (15 rows)
--
-- Wrapped in a transaction. Idempotent via ON CONFLICT DO NOTHING.
-- =====================================================

BEGIN;

-- Sanity check: schema must exist before seeding.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'compliance_rules') THEN
    RAISE EXCEPTION 'Schema not found. Run cadence_service_library_v1_schema.sql first.';
  END IF;
END $$;

-- =====================================================
-- DATA: service_categories (11 rows)
-- =====================================================

INSERT INTO service_categories (id, name, description, display_order) VALUES
('CAT_001', 'Neuromodulators', 'Botulinum toxin injections for dynamic wrinkles', 1),
('CAT_002', 'Dermal Fillers', 'Hyaluronic acid and biostimulator fillers for volume and contour', 2),
('CAT_003', 'Skin Boosters & Bio-Remodelers', 'Hydration injectables and biostimulators', 3),
('CAT_004', 'Energy Devices', 'RF microneedling, IPL, laser resurfacing, ultrasound', 4),
('CAT_005', 'Body Contouring', 'Non-invasive fat reduction and muscle stimulation', 5),
('CAT_006', 'Facials & Skin Treatments', 'Hydrafacials, DiamondGlow, chemical peels, dermaplaning', 6),
('CAT_007', 'Laser Hair Removal', 'Long-pulse laser hair reduction', 7),
('CAT_008', 'PRP / PRF / Regenerative', 'Platelet-rich plasma and fibrin treatments', 8),
('CAT_009', 'Hormone Therapy & Weight Loss', 'BHRT, GLP-1 weight loss, IV therapy, vitamin injections', 9),
('CAT_010', 'Specialized & Wellness Services', 'O-Shot, P-Shot, IV therapy, massage, spray tan', 10),
('CAT_011', 'Retail Skincare', 'Physician-dispensed skincare lines', 11)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- DATA: service_library (70 rows)
-- =====================================================

INSERT INTO service_library (id, category_id, name, default_duration_min, pricing_model, appointment_type, linked_product_cat, notes) VALUES
-- Neuromodulators
('SVC_001', 'CAT_001', 'Botox / Neuromodulator Treatment', 15, 'Per unit', 'treatment', 'Neuromodulators', 'Brand attaches via product selection'),
('SVC_002', 'CAT_001', 'Neuromodulator Consultation', 15, 'Free / Low fee', 'consultation', NULL, NULL),
('SVC_003', 'CAT_001', 'Masseter / Jawline Slimming', 20, 'Per unit', 'treatment', 'Neuromodulators', 'Off-label use'),
('SVC_004', 'CAT_001', 'Hyperhidrosis Treatment', 30, 'Per unit', 'treatment', 'Neuromodulators', 'Underarms / hands / feet'),
('SVC_005', 'CAT_001', 'Lip Flip', 10, 'Per unit', 'treatment', 'Neuromodulators', 'Off-label use'),
('SVC_006', 'CAT_001', 'Trapezius / Trap-Tox', 30, 'Per unit', 'treatment', 'Neuromodulators', 'Off-label use'),
-- Dermal Fillers
('SVC_010', 'CAT_002', 'Lip Filler', 45, 'Per syringe', 'treatment', 'Dermal Fillers', NULL),
('SVC_011', 'CAT_002', 'Cheek Filler', 45, 'Per syringe', 'treatment', 'Dermal Fillers', NULL),
('SVC_012', 'CAT_002', 'Chin / Jawline Filler', 60, 'Per syringe', 'treatment', 'Dermal Fillers', NULL),
('SVC_013', 'CAT_002', 'Under-Eye / Tear Trough Filler', 45, 'Per syringe', 'treatment', 'Dermal Fillers', 'High-skill area; typically NP-only'),
('SVC_014', 'CAT_002', 'Nasolabial Folds', 30, 'Per syringe', 'treatment', 'Dermal Fillers', NULL),
('SVC_015', 'CAT_002', 'Marionette Lines', 30, 'Per syringe', 'treatment', 'Dermal Fillers', NULL),
('SVC_016', 'CAT_002', 'Temple Filler', 30, 'Per syringe', 'treatment', 'Dermal Fillers', NULL),
('SVC_017', 'CAT_002', 'Non-Surgical Rhinoplasty', 60, 'Per syringe', 'treatment', 'Dermal Fillers', 'High-risk; typically NP/PA only'),
('SVC_018', 'CAT_002', 'Dermal Filler Consultation', 30, 'Free / Low fee', 'consultation', NULL, NULL),
('SVC_019', 'CAT_002', 'Kybella / Submental Fat Treatment', 30, 'Per vial', 'treatment', 'Neuromodulators', 'Allergan training required'),
-- Skin Boosters
('SVC_020', 'CAT_003', 'Skinvive / Microdroplet Hydration', 30, 'Per session', 'treatment', 'Skin Boosters', 'Skinvive by Juvederm'),
('SVC_021', 'CAT_003', 'Sculptra Treatment', 60, 'Per vial', 'treatment', 'Skin Boosters', 'Series of 3 typical'),
('SVC_022', 'CAT_003', 'Radiesse Treatment', 45, 'Per syringe', 'treatment', 'Skin Boosters', 'Calcium hydroxylapatite'),
('SVC_023', 'CAT_003', 'Restylane Skinboosters', 45, 'Per session', 'treatment', 'Skin Boosters', 'Series-based'),
-- Energy Devices
('SVC_030', 'CAT_004', 'RF Microneedling — Face', 90, 'Per session', 'treatment', 'Energy Devices', 'Potenza, Morpheus8, Sylfirm'),
('SVC_031', 'CAT_004', 'RF Microneedling — Acne Scars', 90, 'Per session', 'treatment', 'Energy Devices', NULL),
('SVC_032', 'CAT_004', 'RF Microneedling — Body', 120, 'Per session', 'treatment', 'Energy Devices', NULL),
('SVC_033', 'CAT_004', 'Traditional Microneedling', 60, 'Per session', 'treatment', 'Energy Devices', 'SkinPen Precision'),
('SVC_034', 'CAT_004', 'IPL / BBL — Face', 30, 'Per session', 'treatment', 'Energy Devices', NULL),
('SVC_035', 'CAT_004', 'IPL / BBL — Body Area', 45, 'Per session', 'treatment', 'Energy Devices', NULL),
('SVC_036', 'CAT_004', 'Fractional Laser Resurfacing', 60, 'Per session', 'treatment', 'Energy Devices', 'Fraxel, CO2'),
('SVC_037', 'CAT_004', 'Ultherapy / HIFU Lift', 90, 'Per session', 'treatment', 'Energy Devices', 'Microfocused ultrasound'),
('SVC_038', 'CAT_004', 'Laser Genesis / Skin Tightening', 45, 'Per session', 'treatment', 'Energy Devices', NULL),
('SVC_039', 'CAT_004', 'Vascular Laser / Vein Removal', 30, 'Per area', 'treatment', 'Energy Devices', NULL),
-- Body Contouring
('SVC_040', 'CAT_005', 'CoolSculpting Elite — Single Area', 60, 'Per cycle', 'treatment', 'Body Contouring', NULL),
('SVC_041', 'CAT_005', 'CoolSculpting — Submental / Chin', 45, 'Per cycle', 'treatment', 'Body Contouring', NULL),
('SVC_042', 'CAT_005', 'CoolSculpting Consultation', 30, 'Free', 'consultation', NULL, NULL),
('SVC_043', 'CAT_005', 'CoolTone / Muscle Toning', 30, 'Per session', 'treatment', 'Body Contouring', NULL),
('SVC_044', 'CAT_005', 'Emsculpt NEO', 30, 'Per session', 'treatment', 'Body Contouring', 'BTL system'),
-- Facials
('SVC_050', 'CAT_006', 'DiamondGlow Facial', 50, 'Per session', 'treatment', 'Facial Devices', NULL),
('SVC_051', 'CAT_006', 'HydraFacial', 50, 'Per session', 'treatment', 'Facial Devices', NULL),
('SVC_052', 'CAT_006', 'Custom Facial', 60, 'Per session', 'treatment', NULL, NULL),
('SVC_053', 'CAT_006', 'Chemical Peel — Light', 30, 'Per session', 'treatment', 'Skincare', 'VI Peel, Glycolic, Salicylic'),
('SVC_054', 'CAT_006', 'Chemical Peel — Medium', 45, 'Per session', 'treatment', 'Skincare', 'VI Peel Precision, TCA'),
('SVC_055', 'CAT_006', 'Chemical Peel — Deep / Body', 60, 'Per session', 'treatment', 'Skincare', 'VI Body Peel'),
('SVC_056', 'CAT_006', 'Dermaplaning', 30, 'Per session', 'treatment', NULL, NULL),
('SVC_057', 'CAT_006', 'Skin Analysis / Consultation', 30, 'Free / Low fee', 'consultation', NULL, NULL),
-- Laser Hair Removal
('SVC_060', 'CAT_007', 'Laser Hair Removal — X-Small Area', 15, 'Per session / Package', 'treatment', 'Energy Devices', 'Lip, chin, sideburns'),
('SVC_061', 'CAT_007', 'Laser Hair Removal — Small Area', 20, 'Per session / Package', 'treatment', 'Energy Devices', 'Underarms, bikini line'),
('SVC_062', 'CAT_007', 'Laser Hair Removal — Medium Area', 30, 'Per session / Package', 'treatment', 'Energy Devices', 'Brazilian, half arms, half legs'),
('SVC_063', 'CAT_007', 'Laser Hair Removal — Large Area', 45, 'Per session / Package', 'treatment', 'Energy Devices', 'Full legs, back, chest'),
-- PRP / PRF
('SVC_070', 'CAT_008', 'PRF EZ Gel — Under Eye', 75, 'Per session', 'treatment', 'Regenerative', NULL),
('SVC_071', 'CAT_008', 'PRP / PRF — Hair Restoration', 60, 'Per session', 'treatment', 'Regenerative', 'Series typical'),
('SVC_072', 'CAT_008', 'PRP Microneedling / Vampire Facial', 90, 'Per session', 'treatment', 'Regenerative', NULL),
('SVC_073', 'CAT_008', 'PRF Consultation', 15, 'Free / Low fee', 'consultation', NULL, NULL),
-- Hormone & Weight Loss
('SVC_080', 'CAT_009', 'Hormone Therapy — Initial Female', 45, 'Per visit', 'consultation', 'Pharmaceuticals', 'BHRT intake'),
('SVC_081', 'CAT_009', 'Hormone Therapy — Initial Male', 45, 'Per visit', 'consultation', 'Pharmaceuticals', 'TRT intake'),
('SVC_082', 'CAT_009', 'Hormone Therapy — Follow-Up', 20, 'Per visit', 'consultation', 'Pharmaceuticals', NULL),
('SVC_083', 'CAT_009', 'Weight Loss Consultation — New', 30, 'Per visit', 'consultation', 'Pharmaceuticals', 'GLP-1 intake'),
('SVC_084', 'CAT_009', 'Weight Loss Maintenance', 20, 'Per visit', 'consultation', 'Pharmaceuticals', 'Compounded semaglutide / tirzepatide'),
('SVC_085', 'CAT_009', 'B12 Injection', 5, 'Per shot', 'treatment', 'Pharmaceuticals', NULL),
('SVC_086', 'CAT_009', 'Lipo-Mino Injection', 5, 'Per shot', 'treatment', 'Pharmaceuticals', 'Lipotropic'),
-- Specialized
('SVC_090', 'CAT_010', 'IV Therapy — Hydration', 45, 'Per session', 'treatment', 'IV Therapy', 'Banana bag, Myers cocktail'),
('SVC_091', 'CAT_010', 'IV Therapy — Beauty / Glutathione', 60, 'Per session', 'treatment', 'IV Therapy', NULL),
('SVC_092', 'CAT_010', 'IV Therapy — Performance / Recovery', 60, 'Per session', 'treatment', 'IV Therapy', NULL),
('SVC_093', 'CAT_010', 'NAD+ IV Therapy', 90, 'Per session', 'treatment', 'IV Therapy', NULL),
('SVC_094', 'CAT_010', 'O-Shot', 45, 'Per session', 'treatment', 'Regenerative', 'Female sexual wellness; trademarked protocol'),
('SVC_095', 'CAT_010', 'P-Shot', 45, 'Per session', 'treatment', 'Regenerative', 'Male sexual wellness; trademarked protocol'),
('SVC_096', 'CAT_010', 'Massage — Swedish 60min', 60, 'Per session', 'treatment', NULL, NULL),
('SVC_097', 'CAT_010', 'Massage — Deep Tissue 60min', 60, 'Per session', 'treatment', NULL, NULL),
('SVC_098', 'CAT_010', 'Massage — Hot Stone', 75, 'Per session', 'treatment', NULL, NULL),
('SVC_099', 'CAT_010', 'Spray Tan', 20, 'Per session', 'treatment', NULL, NULL),
-- Retail
('SVC_100', 'CAT_011', 'Skincare Consultation', 20, 'Free', 'retail', NULL, NULL),
('SVC_101', 'CAT_011', 'Retail Product Sale', 0, 'Per product', 'retail', 'Skincare', NULL)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- DATA: product_library — Injectables (32 rows)
-- =====================================================

INSERT INTO product_library (id, product_class, manufacturer, brand_family, product_name, sub_category, fda_indication, has_boxed_warning, trademark_notation) VALUES
-- Neuromodulators
('PRD_N001', 'injectable', 'Allergan / AbbVie', 'Botox', 'BOTOX Cosmetic', 'Neuromodulator', 'Glabellar, lateral canthal, forehead, platysma lines', TRUE, 'BOTOX® (onabotulinumtoxinA)'),
('PRD_N002', 'injectable', 'Galderma', 'Dysport', 'Dysport', 'Neuromodulator', 'Glabellar lines', TRUE, 'Dysport® (abobotulinumtoxinA)'),
('PRD_N003', 'injectable', 'Merz Aesthetics', 'Xeomin', 'Xeomin', 'Neuromodulator', 'Glabellar lines', TRUE, 'Xeomin® (incobotulinumtoxinA)'),
('PRD_N004', 'injectable', 'Evolus', 'Jeuveau', 'Jeuveau', 'Neuromodulator', 'Glabellar lines', TRUE, 'Jeuveau® (prabotulinumtoxinA-xvfs)'),
('PRD_N005', 'injectable', 'Revance', 'Daxxify', 'DAXXIFY', 'Neuromodulator', 'Glabellar lines (long-lasting)', TRUE, 'DAXXIFY® (daxibotulinumtoxinA-lanm)'),
-- Juvederm
('PRD_F001', 'injectable', 'Allergan / AbbVie', 'Juvederm', 'JUVÉDERM VOLUMA XC', 'Dermal Filler — HA', 'Cheek, chin, temple', FALSE, 'JUVÉDERM® VOLUMA® XC'),
('PRD_F002', 'injectable', 'Allergan / AbbVie', 'Juvederm', 'JUVÉDERM VOLBELLA XC', 'Dermal Filler — HA', 'Lips, perioral lines, infraorbital', FALSE, 'JUVÉDERM® VOLBELLA® XC'),
('PRD_F003', 'injectable', 'Allergan / AbbVie', 'Juvederm', 'JUVÉDERM VOLLURE XC', 'Dermal Filler — HA', 'Nasolabial folds', FALSE, 'JUVÉDERM® VOLLURE™ XC'),
('PRD_F004', 'injectable', 'Allergan / AbbVie', 'Juvederm', 'JUVÉDERM VOLUX XC', 'Dermal Filler — HA', 'Jawline contour', FALSE, 'JUVÉDERM® VOLUX® XC'),
('PRD_F005', 'injectable', 'Allergan / AbbVie', 'Juvederm', 'JUVÉDERM Ultra Plus XC', 'Dermal Filler — HA', 'Lip augmentation, perioral lines', FALSE, 'JUVÉDERM® Ultra Plus XC'),
('PRD_F006', 'injectable', 'Allergan / AbbVie', 'Juvederm', 'JUVÉDERM Ultra XC', 'Dermal Filler — HA', 'Lip augmentation', FALSE, 'JUVÉDERM® Ultra XC'),
('PRD_F007', 'injectable', 'Allergan / AbbVie', 'Skinvive', 'SKINVIVE by JUVÉDERM', 'Skin Booster — HA', 'Cheek smoothness (intradermal hydration)', FALSE, 'SKINVIVE by JUVÉDERM®'),
-- Kybella
('PRD_K001', 'injectable', 'Allergan / AbbVie', 'Kybella', 'KYBELLA', 'Fat Reduction Injectable', 'Submental fat', FALSE, 'KYBELLA® (deoxycholic acid)'),
-- Restylane
('PRD_F010', 'injectable', 'Galderma', 'Restylane', 'Restylane', 'Dermal Filler — HA', 'Nasolabial folds, lips', FALSE, 'Restylane®'),
('PRD_F011', 'injectable', 'Galderma', 'Restylane', 'Restylane Lyft', 'Dermal Filler — HA', 'Cheek, hands, nasolabial folds', FALSE, 'Restylane® Lyft'),
('PRD_F012', 'injectable', 'Galderma', 'Restylane', 'Restylane Refyne', 'Dermal Filler — HA', 'Nasolabial folds, marionette lines', FALSE, 'Restylane® Refyne'),
('PRD_F013', 'injectable', 'Galderma', 'Restylane', 'Restylane Defyne', 'Dermal Filler — HA', 'Deep nasolabial folds, chin', FALSE, 'Restylane® Defyne'),
('PRD_F014', 'injectable', 'Galderma', 'Restylane', 'Restylane Kysse', 'Dermal Filler — HA', 'Lip augmentation', FALSE, 'Restylane® Kysse'),
('PRD_F015', 'injectable', 'Galderma', 'Restylane', 'Restylane Contour', 'Dermal Filler — HA', 'Cheek contour', FALSE, 'Restylane® Contour'),
('PRD_F016', 'injectable', 'Galderma', 'Restylane', 'Restylane Eyelight', 'Dermal Filler — HA', 'Under-eye / tear trough', FALSE, 'Restylane® Eyelight'),
('PRD_F017', 'injectable', 'Galderma', 'Restylane', 'Restylane Skinboosters', 'Skin Booster — HA', 'Skin quality, hydration', FALSE, 'Restylane® Skinboosters'),
-- Sculptra
('PRD_F020', 'injectable', 'Galderma', 'Sculptra', 'Sculptra Aesthetic', 'Biostimulator', 'Nasolabial folds, facial volume restoration', FALSE, 'Sculptra® Aesthetic (poly-L-lactic acid)'),
-- Merz Fillers
('PRD_F030', 'injectable', 'Merz Aesthetics', 'Radiesse', 'Radiesse', 'Biostimulator / Filler', 'Nasolabial folds, jawline, hands, décolleté', FALSE, 'Radiesse® (calcium hydroxylapatite)'),
('PRD_F031', 'injectable', 'Merz Aesthetics', 'Belotero', 'Belotero Balance', 'Dermal Filler — HA', 'Nasolabial folds, fine lines', FALSE, 'Belotero Balance®'),
-- Revance / RHA
('PRD_F040', 'injectable', 'Revance / Teoxane', 'RHA Collection', 'RHA 2', 'Dermal Filler — HA (Dynamic)', 'Moderate dynamic facial wrinkles', FALSE, 'RHA® 2'),
('PRD_F041', 'injectable', 'Revance / Teoxane', 'RHA Collection', 'RHA 3', 'Dermal Filler — HA (Dynamic)', 'Moderate-severe dynamic wrinkles, lip augmentation', FALSE, 'RHA® 3'),
('PRD_F042', 'injectable', 'Revance / Teoxane', 'RHA Collection', 'RHA 4', 'Dermal Filler — HA (Dynamic)', 'Severe dynamic facial wrinkles', FALSE, 'RHA® 4'),
('PRD_F043', 'injectable', 'Revance / Teoxane', 'RHA Collection', 'RHA Redensity', 'Dermal Filler — HA (Dynamic)', 'Perioral rhytids', FALSE, 'RHA Redensity®'),
('PRD_F044', 'injectable', 'Revance / Teoxane', 'RHA Collection', 'RHA Dynamic Volume', 'Dermal Filler — HA', 'Midface volume', FALSE, 'RHA® Dynamic Volume'),
-- Evolysse
('PRD_F050', 'injectable', 'Evolus', 'Evolysse', 'Evolysse Smooth', 'Dermal Filler — HA', 'Dynamic facial wrinkles (NLFs)', FALSE, 'EVOLYSSE® Smooth'),
('PRD_F051', 'injectable', 'Evolus', 'Evolysse', 'Evolysse Form', 'Dermal Filler — HA', 'Dynamic facial wrinkles (NLFs)', FALSE, 'EVOLYSSE® Form'),
-- Revanesse
('PRD_F060', 'injectable', 'Prollenium / Revanesse', 'Revanesse', 'Revanesse Versa+', 'Dermal Filler — HA', 'Moderate-severe facial wrinkles, NLFs', FALSE, 'Revanesse® Versa™+'),
('PRD_F061', 'injectable', 'Prollenium / Revanesse', 'Revanesse', 'Revanesse Lips+', 'Dermal Filler — HA', 'Lip augmentation', FALSE, 'Revanesse® Lips™+')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- DATA: product_library — Devices (19 rows)
-- =====================================================

INSERT INTO product_library (id, product_class, manufacturer, brand_family, product_name, sub_category, fda_indication, has_boxed_warning, trademark_notation) VALUES
('DEV_001', 'device', 'Allergan / AbbVie', 'CoolSculpting', 'CoolSculpting Elite', 'Cryolipolysis', 'Visible fat bulges (multiple body areas)', FALSE, 'CoolSculpting® Elite'),
('DEV_002', 'device', 'Allergan / AbbVie', 'CoolTone', 'CoolTone', 'Magnetic muscle stimulation', 'Strengthening abdomen, buttocks, thighs', FALSE, 'CoolTone®'),
('DEV_003', 'device', 'BTL Aesthetics', 'Emsculpt', 'Emsculpt NEO', 'HIFEM + RF muscle/fat', 'Muscle toning, fat reduction', FALSE, 'Emsculpt NEO®'),
('DEV_010', 'device', 'Cynosure / Lutronic', 'Potenza', 'Potenza', 'RF Microneedling', 'Skin tightening, scars, texture', FALSE, 'Potenza®'),
('DEV_011', 'device', 'InMode', 'Morpheus8', 'Morpheus8', 'RF Microneedling', 'Skin tightening, body contouring', FALSE, 'Morpheus8®'),
('DEV_012', 'device', 'Benev', 'Sylfirm X', 'Sylfirm X', 'Pulsed-wave RF Microneedling', 'Skin remodeling, melasma, redness', FALSE, 'Sylfirm X™'),
('DEV_020', 'device', 'Crown Aesthetics / Revance', 'SkinPen', 'SkinPen Precision', 'Microneedling', 'Acne scars (face), neck wrinkles', FALSE, 'SkinPen® Precision'),
('DEV_030', 'device', 'Sciton', 'BBL', 'BBL HERO', 'Broadband Light', 'Sun damage, redness, pigmentation', FALSE, 'BBL HERO™'),
('DEV_031', 'device', 'Lumenis', 'M22', 'IPL M22', 'Intense Pulsed Light', 'Pigmentation, vascular lesions', FALSE, 'M22™ IPL'),
('DEV_040', 'device', 'Solta Medical / Bausch', 'Fraxel', 'Fraxel', 'Fractional Laser', 'Texture, pigmentation, scars', FALSE, 'Fraxel®'),
('DEV_041', 'device', 'Lumenis', 'UltraPulse', 'UltraPulse CO2', 'Ablative CO2 Laser', 'Deep facial resurfacing', FALSE, 'UltraPulse®'),
('DEV_050', 'device', 'Merz Aesthetics', 'Ultherapy', 'Ultherapy PRIME', 'Microfocused Ultrasound', 'Lift, brow, neck, décolleté', FALSE, 'Ultherapy PRIME®'),
('DEV_051', 'device', 'Sofwave Medical', 'Sofwave', 'Sofwave', 'Synchronous Ultrasound', 'Lift, fine lines', FALSE, 'Sofwave™'),
('DEV_060', 'device', 'Cynosure', 'Elite iQ', 'Elite iQ', 'Alexandrite + Nd:YAG laser', 'Hair removal — all skin types', FALSE, 'Elite iQ™'),
('DEV_061', 'device', 'Candela', 'GentleMax Pro', 'GentleMax Pro', 'Alexandrite + Nd:YAG laser', 'Hair removal — all skin types', FALSE, 'GentleMax Pro®'),
('DEV_070', 'device', 'Cutera', 'Excel V+', 'Excel V+', 'Vascular Laser', 'Vessels, redness, pigmentation', FALSE, 'Excel V+®'),
('DEV_071', 'device', 'Cutera', 'Laser Genesis', 'Laser Genesis', 'Non-ablative 1064nm', 'Skin tightening, redness', FALSE, 'Laser Genesis®'),
('DEV_080', 'device', 'Allergan / AbbVie', 'DiamondGlow', 'DiamondGlow', 'Dermabrasion + Serum Infusion', 'Exfoliation + topical delivery', FALSE, 'DiamondGlow®'),
('DEV_081', 'device', 'HydraFacial / BeautyHealth', 'HydraFacial', 'HydraFacial', 'Hydradermabrasion', 'Cleanse, extract, hydrate', FALSE, 'HydraFacial®')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- DATA: product_library — Skincare (10 rows)
-- =====================================================

INSERT INTO product_library (id, product_class, manufacturer, brand_family, product_name, sub_category, fda_indication, has_boxed_warning, trademark_notation) VALUES
('SKN_001', 'skincare', 'Allergan / AbbVie', 'SkinMedica', 'SkinMedica (full line)', 'Anti-aging / Brightening / SPF', NULL, FALSE, 'SkinMedica®'),
('SKN_002', 'skincare', 'L''Oréal Dermatological Beauty', 'SkinBetter Science', 'SkinBetter Science (full line)', 'Retinoid alternatives / Antioxidants / SPF', NULL, FALSE, 'skinbetter science®'),
('SKN_003', 'skincare', 'Galderma', 'Alastin Skincare', 'Alastin (full line)', 'Pre/Post-procedure / Skin barrier', NULL, FALSE, 'Alastin Skincare®'),
('SKN_004', 'skincare', 'Merz Aesthetics', 'Neocutis', 'Neocutis (full line)', 'PSP biotechnology / Anti-aging', NULL, FALSE, 'Neocutis®'),
('SKN_005', 'skincare', 'Crown Aesthetics / Revance', 'BIOJUVE', 'BIOJUVE (full line)', 'Live microbe biotechnology', NULL, FALSE, 'BIOJUVE®'),
('SKN_006', 'skincare', 'ZO Skin Health', 'ZO Skin Health', 'ZO Skin Health (full line)', 'Anti-aging / Pigmentation / Retinol', NULL, FALSE, 'ZO® Skin Health'),
('SKN_007', 'skincare', 'Obagi Medical', 'Obagi', 'Obagi (full line)', 'Hydroquinone / Vitamin C', NULL, FALSE, 'Obagi®'),
('SKN_008', 'skincare', 'Revision Skincare', 'Revision Skincare', 'Revision Skincare (full line)', 'Anti-aging / Neck / Brightening', NULL, FALSE, 'Revision Skincare®'),
('SKN_009', 'skincare', 'iS Clinical', 'iS Clinical', 'iS Clinical (full line)', 'Botanical actives / Brightening', NULL, FALSE, 'iS Clinical®'),
('SKN_010', 'skincare', 'Crown Aesthetics', 'PCA Skin', 'PCA Skin (full line)', 'Pigmentation / Daily care', NULL, FALSE, 'PCA SKIN®')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- DATA: compliance_rules (15 rows)
-- =====================================================

INSERT INTO compliance_rules (id, applies_to, rule_type, required_behavior, source) VALUES
('CMP_001', 'All neuromodulators', 'boxed_warning', 'Post copy must NOT minimize distant spread of toxin effect risk. Cannot claim safe or risk-free. Must direct to provider for full safety information.', 'FDA Boxed Warning (all botulinum toxin products)'),
('CMP_002', 'All neuromodulators', 'trademark', 'Use full trademark on first reference. Subsequent references can use brand name.', 'Manufacturer brand guidelines'),
('CMP_003', 'All neuromodulators', 'off_label', 'Off-label uses (masseter, lip flip, trap-tox, hyperhidrosis cosmetic) must NOT be promoted as FDA-approved indications. Educational framing only.', 'FDA promotional regulations'),
('CMP_004', 'All HA dermal fillers', 'other', 'Cannot claim no risk or completely safe. Posts mentioning safety must reference vascular occlusion / blindness as known risks.', 'FDA filler safety labeling'),
('CMP_005', 'All injectables', 'before_after', 'Same lighting, angle, makeup state required. Must be actual patients (or licensed stock with disclosure). Cannot edit results.', 'FTC truth-in-advertising'),
('CMP_006', 'All injectables', 'testimonial', 'Disclosure required if patient was compensated. Results may vary or equivalent must appear with testimonial.', 'FTC endorsement guidelines'),
('CMP_007', 'Kybella', 'off_label', 'Must use KYBELLA® (deoxycholic acid) on first reference. Indication is moderate-to-severe submental fat ONLY. No off-label promotion.', 'Allergan brand guidelines + FDA'),
('CMP_008', 'Sculptra', 'other', 'Posts must clarify that Sculptra requires a series of treatments (typically 3) for optimal results. Cannot show single-treatment results without context.', 'Galderma indication'),
('CMP_009', 'GLP-1 weight loss services', 'drug_claim', 'If compounded semaglutide / tirzepatide, must NOT use FDA-approved brand names (Ozempic, Wegovy, Mounjaro, Zepbound) in promotional material.', 'FDA compounding regulations'),
('CMP_010', 'PRP / PRF / O-Shot / P-Shot', 'trademark', 'O-Shot® and P-Shot® are trademarked protocols. Use trademark on first reference. Cannot claim FDA approval.', 'Trademark + FDA'),
('CMP_011', 'CoolSculpting', 'other', 'Cannot claim no side effects or risk-free fat reduction. Posts about results must not omit known rare side effects (paradoxical adipose hyperplasia).', 'FDA labeling + class-action history'),
('CMP_012', 'Hormone Therapy / BHRT', 'drug_claim', 'Compounded BHRT is NOT FDA-approved. Cannot claim natural is safer or imply equivalence to FDA-approved hormone therapies.', 'FDA + FTC'),
('CMP_013', 'Laser Hair Removal', 'other', 'Cannot claim works for all skin types without specifying device. Different lasers have different Fitzpatrick range.', 'FDA device labeling'),
('CMP_014', 'Daxxify', 'other', 'May reference 6 months median duration from clinical trial. Cannot claim lasts longer than Botox without comparator data context.', 'Revance prescribing information'),
('CMP_015', 'All retail skincare (cosmetic class)', 'drug_claim', 'Cosmetic skincare cannot claim to treat, cure, prevent disease, or change skin structure. Use appearance of language.', 'FDA cosmetic vs drug rules')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- =====================================================
-- Verification queries (uncomment and run after the script above succeeds)
-- =====================================================
-- SELECT 'service_categories' AS tbl, COUNT(*) FROM service_categories
-- UNION ALL SELECT 'service_library', COUNT(*) FROM service_library
-- UNION ALL SELECT 'product_library', COUNT(*) FROM product_library
-- UNION ALL SELECT 'compliance_rules', COUNT(*) FROM compliance_rules;
--
-- Expected:
--   service_categories  | 11
--   service_library     | 70
--   product_library     | 61
--   compliance_rules    | 15
-- =====================================================
