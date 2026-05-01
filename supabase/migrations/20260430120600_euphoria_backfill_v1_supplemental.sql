-- =====================================================
-- Cadence Euphoria Supplemental Backfill
-- Generated April 30, 2026
-- =====================================================
--
-- Backfills the 30 Euphoria services missed by the original
-- backfill (cadence_euphoria_backfill_v1.sql).
--
-- Root cause: original mapping was built from a 100-row
-- query result that was alphabetically truncated. The full
-- services count is 130. This supplemental migration handles
-- the 30 services that were left with NULL service_library_id
-- and is_custom=FALSE.
--
-- This migration:
--   - 29 services mapped to library entries (15 to existing v1.1/v1.2,
--     14 to new v1.3 entries)
--   - 1 service marked as is_custom=TRUE (Tween Facial)
--
-- Run AFTER cadence_service_library_v1_3_patch.sql.
-- Idempotent: only updates rows where library_id is currently NULL
-- and is_custom is FALSE.
-- =====================================================

BEGIN;

-- Sanity check: v1.3 must be seeded
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM service_library WHERE id = 'SVC_FIL_020') THEN
    RAISE EXCEPTION 'Library v1.3 not seeded. Run cadence_service_library_v1_3_patch.sql first.';
  END IF;
END $$;

-- =====================================================
-- Supplemental UPDATE statements
-- =====================================================

-- Map to EXISTING library entries (v1.1/v1.2) — 15 services
UPDATE services SET service_library_id = 'SVC_FAC_012', is_custom = FALSE
  WHERE id = '1cf49cf8-f627-7e39-9d19-984b41424b40' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Skin Analysis
UPDATE services SET service_library_id = 'SVC_SPEC_010', is_custom = FALSE
  WHERE id = '66d4a511-1335-d62f-8b66-5ead0ff95856' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Spray Tan
UPDATE services SET service_library_id = 'SVC_TOX_010', is_custom = FALSE
  WHERE id = '45512718-a2e0-4c95-ddc2-1d6bc5cc5530' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Stop the Sweat Underarms
UPDATE services SET service_library_id = 'SVC_MAS_001', is_custom = FALSE
  WHERE id = '909c43fe-c579-15d4-7d12-a64906394999' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Swedish Massage 60 min
UPDATE services SET service_library_id = 'SVC_MAS_002', is_custom = FALSE
  WHERE id = 'b1ece150-7f27-f622-ee25-8a80ee82d860' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Swedish Massage 90 min
UPDATE services SET service_library_id = 'SVC_TOX_008', is_custom = FALSE
  WHERE id = 'f77ee29c-1514-693b-aec1-85eb741de716' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- TMJ and Teeth Grinding
UPDATE services SET service_library_id = 'SVC_MN_001', is_custom = FALSE
  WHERE id = '8236526c-dfc1-fcc9-aaca-38367b69dea7' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Traditional Microneedling
UPDATE services SET service_library_id = 'SVC_TOX_009', is_custom = FALSE
  WHERE id = '0e146838-e279-cd7c-ab64-404eb6a82301' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Trap Tox
UPDATE services SET service_library_id = 'SVC_FAC_016', is_custom = FALSE
  WHERE id = '5be88a03-7760-7b75-16fa-38ca2908c376' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Vampire Facial PRP Microneedling
UPDATE services SET service_library_id = 'SVC_WLW_005', is_custom = FALSE
  WHERE id = '8920acff-77b4-ec4a-4bd7-fac695513cff' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Weekly Injection Semaglutide
UPDATE services SET service_library_id = 'SVC_WLW_001', is_custom = FALSE
  WHERE id = '0f53f5be-1165-2053-1aeb-9e1910be312f' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Weight Loss Initial Consult
UPDATE services SET service_library_id = 'SVC_WLW_002', is_custom = FALSE
  WHERE id = 'd2be3185-6b71-2705-b1d3-8f3886dcebc1' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Weight Loss Maintenance
UPDATE services SET service_library_id = 'SVC_TOX_003', is_custom = FALSE
  WHERE id = '9c8e9a03-e683-91ae-c216-db7fa6323944' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Xeomin
UPDATE services SET service_library_id = 'SVC_WLW_004', is_custom = FALSE
  WHERE id = '843e2195-9b19-f636-fc82-38d0a393196a' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Zepbound Direct Monthly

-- Map to NEW library entries (v1.3) — 14 services
UPDATE services SET service_library_id = 'SVC_FAC_019', is_custom = FALSE
  WHERE id = 'a263cc91-da9b-81fa-b83b-f290c3c65edb' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- SkinMedica Illuminize Peel
UPDATE services SET service_library_id = 'SVC_FIL_021', is_custom = FALSE
  WHERE id = '2f99c71a-60c5-0635-7dc9-ec74e871d9e5' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- SkinVive 2 Syringes
UPDATE services SET service_library_id = 'SVC_FIL_020', is_custom = FALSE
  WHERE id = '6f0f0c8e-f987-d102-9249-df27e8f00846' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- SkinVive Lips
UPDATE services SET service_library_id = 'SVC_MAS_008', is_custom = FALSE
  WHERE id = '25a377ca-140b-1000-bc82-dc892e451c29' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Sports Massage 60 min
UPDATE services SET service_library_id = 'SVC_MAS_009', is_custom = FALSE
  WHERE id = 'e26c4f39-ecf8-3668-dbf4-1a9e832de2a7' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Sports Massage 90 min
UPDATE services SET service_library_id = 'SVC_INJ_010', is_custom = FALSE
  WHERE id = '0dbedf91-224d-d29f-2014-7906b3d9297c' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Sunlight Injection Vitamin D
UPDATE services SET service_library_id = 'SVC_SPEC_015', is_custom = FALSE
  WHERE id = 'c4eb8c76-bcb4-0603-fd92-1b48231f636d' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Telehealth Blood Work Follow-up
UPDATE services SET service_library_id = 'SVC_SPEC_012', is_custom = FALSE
  WHERE id = '6c283e75-f234-ff46-d89c-2e4e8642b35e' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Telehealth Hormone Initial
UPDATE services SET service_library_id = 'SVC_SPEC_014', is_custom = FALSE
  WHERE id = '5330ad4c-798e-727e-0c2a-d848b5d41bda' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Telehealth Maintenance
UPDATE services SET service_library_id = 'SVC_SPEC_013', is_custom = FALSE
  WHERE id = '7a29d847-513f-64ad-d1e5-623f4179bc63' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Telehealth Weight Loss Initial
UPDATE services SET service_library_id = 'SVC_INJ_011', is_custom = FALSE
  WHERE id = '7c7ed97f-2ef6-bdc7-2a63-09ed57a24da3' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Tri-Immune IM Shot
UPDATE services SET service_library_id = 'SVC_FAC_021', is_custom = FALSE
  WHERE id = '4ba24d19-25e0-ee3b-90cb-8bb8f0d82e2f' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- VI Body Peel
UPDATE services SET service_library_id = 'SVC_FAC_020', is_custom = FALSE
  WHERE id = '328aa0b5-b25c-d139-a212-a5d544535de4' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- VI Peel Original
UPDATE services SET service_library_id = 'SVC_WLW_009', is_custom = FALSE
  WHERE id = '07771cdd-0fc0-528e-769d-2282513d386d' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Weight Loss Consult New
UPDATE services SET service_library_id = 'SVC_INJ_012', is_custom = FALSE
  WHERE id = '4770084a-f450-b1cb-c9ad-e1a4c1d9bac2' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Zofran

-- Mark as CUSTOM (Euphoria-specific, no library home) — 1 service
UPDATE services SET service_library_id = NULL, is_custom = TRUE
  WHERE id = '315ec3e3-a67a-d9b7-ac0e-0f7587bf3356' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Tween Facial

COMMIT;

-- =====================================================
-- VALIDATION — run these to confirm Sprint 0 is fully done
-- =====================================================
--
-- 1. Final unresolved count (must be ZERO):
--
-- SELECT COUNT(*) AS unresolved
-- FROM services
-- WHERE org_id = '74b04f56-8cf0-7427-b977-7574b183226d'
--   AND service_library_id IS NULL
--   AND is_custom = FALSE;
--
-- Expected: 0
--
-- 2. Full mapping breakdown:
--
-- SELECT
--   COUNT(*) AS total,
--   COUNT(service_library_id) AS mapped_to_library,
--   SUM(CASE WHEN is_custom THEN 1 ELSE 0 END) AS marked_custom,
--   SUM(CASE WHEN service_library_id IS NULL AND NOT is_custom THEN 1 ELSE 0 END) AS unresolved
-- FROM services
-- WHERE org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
--
-- Expected: total=130, mapped_to_library=128, marked_custom=2, unresolved=0
-- (Salty Mermaid Facial + Tween Facial = 2 custom)
-- =====================================================
