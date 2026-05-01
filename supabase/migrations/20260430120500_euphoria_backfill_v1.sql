-- =====================================================
-- Cadence Euphoria Backfill — Sprint 0 Final Migration
-- Generated April 30, 2026
-- =====================================================
--
-- This migration:
--   1. Alters services and products to add library FK columns
--   2. Adds is_custom flag for explicit custom-marker semantics
--   3. Backfills Euphoria's 100 services with library mappings (99 mapped + 1 custom)
--   4. Backfills Euphoria's 18 products with library mappings (all 18 mapped)
--
-- Wrapped in a transaction. Idempotent on re-run via guards.
--
-- After this migration, the compliance inheritance chain is active:
--   service → service_library → linked_product_cat → product_library → compliance_rules
--   (and direct: product → product_library → compliance_rules)
--
-- Test query (after migration):
--   SELECT s.name, sl.name AS library_match, sl.linked_product_cat
--   FROM services s
--   LEFT JOIN service_library sl ON s.service_library_id = sl.id
--   WHERE s.org_id = '74b04f56-8cf0-7427-b977-7574b183226d'
--   ORDER BY s.name;
-- =====================================================

BEGIN;

-- Sanity check: library tables must exist with v1.1 + v1.2 seeded
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
-- STEP 1: ALTER services to add library FK + is_custom
-- =====================================================

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS service_library_id TEXT REFERENCES service_library(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS is_custom BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_services_library_id ON services(service_library_id);

-- =====================================================
-- STEP 2: ALTER products to add library FK + is_custom
-- =====================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_library_id TEXT REFERENCES product_library(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS is_custom BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_products_library_id ON products(product_library_id);

-- =====================================================
-- STEP 3: Backfill Euphoria services with library mappings
-- =====================================================
UPDATE services SET service_library_id = 'SVC_TOX_013', is_custom = FALSE
WHERE id = '347ef369-1dc4-48a0-117a-1708d1896ead' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_FIL_018', is_custom = FALSE
WHERE id = '14917a06-0320-30c2-7702-aa6dd6865f1b' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_FAC_018', is_custom = FALSE
WHERE id = 'f750f779-a38c-2e7a-6f77-3ef88666118e' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_WLW_006', is_custom = FALSE
WHERE id = '225e2ac9-f902-319d-a73e-48a629ee38e0' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_IPL_005', is_custom = FALSE
WHERE id = '2bebb84e-a0a1-cc12-1a87-3e52a6f4099c' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_INJ_009', is_custom = FALSE
WHERE id = '1a6b3ed9-c394-618a-2b4c-942a2315b52d' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_FAC_004', is_custom = FALSE
WHERE id = '00792526-ab73-3893-2866-d59f4346deb0' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_INJ_001', is_custom = FALSE
WHERE id = '425dcab4-72e7-7c09-595f-15107474d93c' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_FAC_008', is_custom = FALSE
WHERE id = '7f24f110-14a3-c826-3ec6-cbd85670187d' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_FAC_007', is_custom = FALSE
WHERE id = 'e7d164e4-3570-5f0d-a0dc-30dcbe7b607b' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_FIL_012', is_custom = FALSE
WHERE id = '2c03408d-d7b9-4a9f-1175-c0f49160e900' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_FIL_013', is_custom = FALSE
WHERE id = '621b3408-cbd2-233e-e660-2f45216c1d7e' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_SPEC_009', is_custom = FALSE
WHERE id = '971b50b8-b893-dd0b-25e1-44c70d3e7158' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_TOX_001', is_custom = FALSE
WHERE id = 'cb05110f-70f1-4838-7b81-eae558348703' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_MAS_007', is_custom = FALSE
WHERE id = '36703794-29f5-9e1d-e26a-03f6052aa860' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_COOL_002', is_custom = FALSE
WHERE id = '24774d05-5693-3073-0c23-7bc4e417e579' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_COOL_003', is_custom = FALSE
WHERE id = '4e89d8cc-52eb-36e0-2724-6d8ac8d201ef' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_COOL_004', is_custom = FALSE
WHERE id = '0297fd75-d251-6d25-46b6-8b2864d369f5' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_MAS_006', is_custom = FALSE
WHERE id = 'e3a9f390-3954-f1c1-8f2f-a66208228f76' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_TOX_005', is_custom = FALSE
WHERE id = '85ecd8bd-ffc0-de70-0c21-d399816ec3af' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_MAS_003', is_custom = FALSE
WHERE id = '217dda0f-5a8c-1cae-3700-1c1bc41949b2' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_MAS_004', is_custom = FALSE
WHERE id = 'fd8533c2-2596-85ba-3952-0c241d0831fc' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_FIL_002', is_custom = FALSE
WHERE id = 'be0b45f2-aebc-626c-ebc4-e7c6c20704ec' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_FIL_003', is_custom = FALSE
WHERE id = '1b17d349-9eb9-0bd5-30b5-6f46a9035483' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_FIL_001', is_custom = FALSE
WHERE id = 'cc4e3a88-a606-0c09-7be5-1b0b628ceaed' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_FAC_013', is_custom = FALSE
WHERE id = '79a822d0-899f-97b8-d65d-d50cdd1261a5' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_FAC_009', is_custom = FALSE
WHERE id = 'a115e888-7e2a-64ab-7ccb-b4e8187dfe85' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_FAC_001', is_custom = FALSE
WHERE id = '0f1f72aa-82b0-d257-7cb1-c48296c2381d' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_TOX_002', is_custom = FALSE
WHERE id = 'd856f98e-07e9-8ba1-6d16-e3f4134a0772' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_FIL_019', is_custom = FALSE
WHERE id = '87816bcd-8eea-8a88-6d93-de9cf9f3dbd5' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_FRX_002', is_custom = FALSE
WHERE id = '6eab0878-4686-1c78-df69-83200acb8abd' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_FRX_003', is_custom = FALSE
WHERE id = 'ab554e5d-bd53-8744-a3e7-fff2e56a2145' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_FAC_006', is_custom = FALSE
WHERE id = 'ce537ad1-3343-483a-f399-f5ddb2857e75' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_SPEC_011', is_custom = FALSE
WHERE id = '2aaf9f82-21c8-a8d4-9861-02dcd92153e5' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_INJ_004', is_custom = FALSE
WHERE id = '39ade302-5f99-044a-a226-1b9b49775389' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_TOX_011', is_custom = FALSE
WHERE id = '4aa7f3c9-dd5b-dc4a-4e7e-8b7aa4eb8f44' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_WLW_008', is_custom = FALSE
WHERE id = '065bd30e-de2e-a513-c325-7c403b3121c0' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_WLW_007', is_custom = FALSE
WHERE id = 'c15f3d5a-0278-c7ed-e574-ea25f6719610' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_SPEC_001', is_custom = FALSE
WHERE id = '4d014674-cdf8-8f8c-f81e-df10be313bff' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_SPEC_002', is_custom = FALSE
WHERE id = '049128e8-bf66-4e9b-be0c-870643d9312d' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_HORM_004', is_custom = FALSE
WHERE id = 'bb386b5e-a872-8b18-9b01-63c69879113f' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_IV_008', is_custom = FALSE
WHERE id = '44c6f0ef-ff41-5de4-1a09-78097b4c6cb1' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_IV_003', is_custom = FALSE
WHERE id = '6793f429-00b0-c37a-0f30-5b4e25190099' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_IV_004', is_custom = FALSE
WHERE id = '64377359-fe36-846c-bbb8-ac3814c912f3' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_IV_005', is_custom = FALSE
WHERE id = '2213b2bd-d900-73ca-8c42-a87c1d2a4e96' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_IV_006', is_custom = FALSE
WHERE id = '5aa32ab1-a0c8-0b06-321a-cfa8fbe196f4' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_IV_007', is_custom = FALSE
WHERE id = 'b76f2224-53f9-8409-d8ea-259f7d5d9d3d' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_IV_001', is_custom = FALSE
WHERE id = 'df8cc152-7541-9e27-e36b-dab175a7df39' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_FAC_005', is_custom = FALSE
WHERE id = 'a6b47c39-e88b-4d2f-6688-0c4faa4ce3a6' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_HORM_001', is_custom = FALSE
WHERE id = '4e50bfbc-b81e-2009-79ee-9a254ce61f26' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_HORM_002', is_custom = FALSE
WHERE id = '76c6e345-ebee-6112-f94f-6e3f3e463b61' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_TOX_014', is_custom = FALSE
WHERE id = '697b3514-15cd-c2d2-4ae9-a91a7cff701c' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_IPL_003', is_custom = FALSE
WHERE id = 'cda0b11b-e633-e559-3bbf-e208fdab02d1' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_IPL_002', is_custom = FALSE
WHERE id = '0ce8a71e-4904-0175-9d0a-548ba3ce54d3' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_IPL_001', is_custom = FALSE
WHERE id = '773015c8-6119-3cd4-a513-3f88f8f01b32' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_IPL_004', is_custom = FALSE
WHERE id = 'a7f9d9a5-99bb-e244-310c-fe271f60c085' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_FAC_014', is_custom = FALSE
WHERE id = 'bb014fff-151e-2701-0c4f-168ab44460d3' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_TOX_004', is_custom = FALSE
WHERE id = 'fd163f60-62c0-4256-ef62-36d696c5153c' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_FIL_015', is_custom = FALSE
WHERE id = '4afb50de-83c8-46b5-835e-c5743b2f6d3f' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_LHR_004', is_custom = FALSE
WHERE id = '842ae17c-e07d-b5d0-1ac2-d11dbb28183e' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_LHR_003', is_custom = FALSE
WHERE id = '974d5b2b-17fb-43df-4dd6-729d2b100198' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_LHR_002', is_custom = FALSE
WHERE id = '27e932b9-848d-df59-e7d7-baab0d0f8acd' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_LHR_005', is_custom = FALSE
WHERE id = '8c376f74-4897-e798-83fe-72ec57656215' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_LHR_001', is_custom = FALSE
WHERE id = 'd8d3bb8d-4a8e-1bd8-c17d-ccbb889f25ca' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_FAC_015', is_custom = FALSE
WHERE id = 'e784f5e1-4bbe-028e-4d81-5baace86f333' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_FAC_011', is_custom = FALSE
WHERE id = '83e20732-706a-8a30-8135-69690ad368a9' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_TOX_007', is_custom = FALSE
WHERE id = 'ae684627-532e-9b57-aec9-8e48855d8d24' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_INJ_002', is_custom = FALSE
WHERE id = '86e76f4e-3413-4c55-2f93-5ad04b431458' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_HORM_003', is_custom = FALSE
WHERE id = '28dfd60e-193f-b204-9099-d7ce63405379' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_IV_002', is_custom = FALSE
WHERE id = '613bf12e-98bd-4def-c6b7-0828227f3b97' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_INJ_003', is_custom = FALSE
WHERE id = 'a0db5adb-a800-8e07-f349-ccf4b4590aff' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_MN_001', is_custom = FALSE
WHERE id = 'ffaff664-3b42-4189-a2be-27418a8c3990' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_TOX_012', is_custom = FALSE
WHERE id = 'ad2aed49-6910-bba5-68f8-83e374c13e3e' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_INJ_008', is_custom = FALSE
WHERE id = 'f39b37cd-de89-6d29-4ac6-d688624d78fe' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_INJ_005', is_custom = FALSE
WHERE id = '5433458a-d3b5-b5c4-9da8-9186b077ddc1' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_INJ_006', is_custom = FALSE
WHERE id = 'a5ad661e-41bd-328b-fd03-2208b10c1d89' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_INJ_007', is_custom = FALSE
WHERE id = '514a24ba-c195-79aa-8674-e510e8f39bf6' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_IV_009', is_custom = FALSE
WHERE id = '4635591e-6af7-7fca-6af3-ae87367cc540' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_IV_010', is_custom = FALSE
WHERE id = '2c26ab88-4dd4-f93d-4979-e54f11e694b8' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_MN_002', is_custom = FALSE
WHERE id = '1eb91ca9-a81f-a6f7-4696-4b02dff70567' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_TOX_006', is_custom = FALSE
WHERE id = '5f09daf7-dceb-1722-4e15-6717f0cab589' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_WLW_003', is_custom = FALSE
WHERE id = 'e72e7f69-8851-59fc-c570-9c1a5ef881e9' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_SPEC_004', is_custom = FALSE
WHERE id = '0dbc216a-000a-4abf-9864-3c3d3315943b' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_SPEC_005', is_custom = FALSE
WHERE id = '82e589f0-2603-0350-0d6d-530c0caf2758' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_FIL_016', is_custom = FALSE
WHERE id = '6e8db1e4-4033-80d1-8d5e-bf462e8cf422' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_FIL_017', is_custom = FALSE
WHERE id = '09532b2a-a35f-59ce-2e49-5db333f9988c' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_SPEC_008', is_custom = FALSE
WHERE id = '426d3e09-5122-4c26-93d0-31375911fdfe' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_SPEC_007', is_custom = FALSE
WHERE id = 'e80820b0-4885-4ded-7668-f8d32873ced3' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_FAC_017', is_custom = FALSE
WHERE id = '57724232-fecc-9329-40a4-303f846ad53d' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_PRF_002', is_custom = FALSE
WHERE id = '2dd65b8e-22d6-9cc6-db5f-352cbbc161cf' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_PRF_001', is_custom = FALSE
WHERE id = '00b32221-1815-6c9b-5dd4-b74e15d497e0' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_FAC_016', is_custom = FALSE
WHERE id = 'b6ffa655-1a77-dca2-7640-db5fd2ed849e' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_FIL_014', is_custom = FALSE
WHERE id = '338b021c-a8aa-9e74-497b-cbda61e40256' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_RFMN_004', is_custom = FALSE
WHERE id = '3297e827-825b-067d-57e1-cfa76d8269e6' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_RFMN_002', is_custom = FALSE
WHERE id = 'bd5dfe60-311b-5b33-7d68-2f889b35e91e' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_RFMN_005', is_custom = FALSE
WHERE id = '7cffb6ba-1cbe-b566-e6b6-c2df28f007b6' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_RFMN_003', is_custom = FALSE
WHERE id = '56f3d719-8448-9a5b-9979-5f5d481ff3ed' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_RFMN_001', is_custom = FALSE
WHERE id = '04cd6ebf-4311-96a2-7cec-c9502610cb81' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
UPDATE services SET service_library_id = 'SVC_HORM_005', is_custom = FALSE
WHERE id = '583307ca-8ccc-dba8-b7b8-f54d627c5313' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';

-- =====================================================
-- STEP 4: Mark custom services (Salty Mermaid Facial)
-- =====================================================
UPDATE services SET service_library_id = NULL, is_custom = TRUE
WHERE id = '1c91b473-f3ca-9a40-4e9e-5c92706364a1' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Salty Mermaid Facial

-- =====================================================
-- STEP 5: Backfill Euphoria products with library mappings
-- =====================================================
UPDATE products SET product_library_id = 'PRD_N001', is_custom = FALSE
WHERE id = '9e188741-8328-44d3-9a71-3cc2c62ab909' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Botox
UPDATE products SET product_library_id = 'DEV_002', is_custom = FALSE
WHERE id = '4857d039-f80d-4b07-a094-83a244f33171' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- CoolTone
UPDATE products SET product_library_id = 'DEV_010', is_custom = FALSE
WHERE id = 'cf7a5785-cef4-49de-b1c2-5dd5073b86b8' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Cynosure Potenza
UPDATE products SET product_library_id = 'PRD_N005', is_custom = FALSE
WHERE id = '408232ea-1bf4-46f7-aebf-9e4232c74033' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Daxxify
UPDATE products SET product_library_id = 'DEV_080', is_custom = FALSE
WHERE id = 'b0ac8ff8-8d2a-4e2b-8240-8ec3af4707fe' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- DiamondGlow
UPDATE products SET product_library_id = 'PRD_N002', is_custom = FALSE
WHERE id = 'ec1ec397-edaf-4093-83cc-c994ffc5f32b' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Dysport
UPDATE products SET product_library_id = 'DEV_040', is_custom = FALSE
WHERE id = 'dbd1453a-9756-4721-97a8-9d6124c0789d' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Fraxel
UPDATE products SET product_library_id = 'PRD_N004', is_custom = FALSE
WHERE id = 'f7a76281-bbe5-4488-b374-13fa7b28bf3f' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Jeuveau
UPDATE products SET product_library_id = 'PRD_K001', is_custom = FALSE
WHERE id = 'c607bc99-5e07-402e-aee7-2d44b3781b00' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Kybella
UPDATE products SET product_library_id = 'PRD_F030', is_custom = FALSE
WHERE id = '3f4119d5-d2a3-4f95-845d-315f6ee1ca29' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Radiesse
UPDATE products SET product_library_id = 'PRD_F010', is_custom = FALSE
WHERE id = '76e2761b-21d9-4ee0-9842-79ea7de2874e' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Restylane
UPDATE products SET product_library_id = 'DEV_090', is_custom = FALSE
WHERE id = '18f0fadb-3e47-477d-8292-19154285fb3c' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- SaltMed
UPDATE products SET product_library_id = 'PHARM_001', is_custom = FALSE
WHERE id = 'ed8eb8be-c008-45a0-b27c-7b0ac0b98748' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Semaglutide
UPDATE products SET product_library_id = 'PHARM_002', is_custom = FALSE
WHERE id = 'a8def004-aa61-4598-9542-49b9354722c6' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Sermorelin
UPDATE products SET product_library_id = 'SKN_001', is_custom = FALSE
WHERE id = 'e863c877-e68a-4d89-a502-662b1e5484b1' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- SkinMedica
UPDATE products SET product_library_id = 'SKN_011', is_custom = FALSE
WHERE id = 'd5dcf2a2-b8ce-448e-9840-fe78218b280b' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- VI Peel
UPDATE products SET product_library_id = 'PRD_N003', is_custom = FALSE
WHERE id = '5c4172e7-af73-4845-adfc-9cfd50f12780' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Xeomin
UPDATE products SET product_library_id = 'PHARM_003', is_custom = FALSE
WHERE id = '9d50628c-d055-4a87-b4dc-6d307724d49b' AND org_id = '74b04f56-8cf0-7427-b977-7574b183226d';  -- Zepbound

COMMIT;

-- =====================================================
-- VALIDATION QUERIES (run these to confirm success)
-- =====================================================
--
-- 1. Verify all Euphoria services have either a library FK or is_custom=TRUE:
--
-- SELECT
--   COUNT(*) AS total,
--   COUNT(service_library_id) AS mapped_to_library,
--   SUM(CASE WHEN is_custom THEN 1 ELSE 0 END) AS custom,
--   SUM(CASE WHEN service_library_id IS NULL AND NOT is_custom THEN 1 ELSE 0 END) AS unresolved
-- FROM services
-- WHERE org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
--
-- Expected: total=100, mapped_to_library=99, custom=1, unresolved=0
--
-- 2. Same check for products:
--
-- SELECT
--   COUNT(*) AS total,
--   COUNT(product_library_id) AS mapped_to_library,
--   SUM(CASE WHEN is_custom THEN 1 ELSE 0 END) AS custom,
--   SUM(CASE WHEN product_library_id IS NULL AND NOT is_custom THEN 1 ELSE 0 END) AS unresolved
-- FROM products
-- WHERE org_id = '74b04f56-8cf0-7427-b977-7574b183226d';
--
-- Expected: total=18, mapped_to_library=18, custom=0, unresolved=0
--
-- 3. SMOKE TEST: Botox post should inherit boxed warning rule
--
-- SELECT
--   p.name AS product,
--   pl.trademark_notation,
--   pl.has_boxed_warning,
--   cr.id AS rule_id,
--   cr.required_behavior
-- FROM products p
-- JOIN product_library pl ON p.product_library_id = pl.id
-- LEFT JOIN compliance_rules cr ON cr.applies_to ILIKE '%neuromodulator%'
-- WHERE p.org_id = '74b04f56-8cf0-7427-b977-7574b183226d'
--   AND p.name = 'Botox';
--
-- Expected: 1+ rows with CMP_001 (boxed warning) and CMP_002 (trademark) inherited.
--
-- 4. SMOKE TEST: All neurotoxin services correctly link to library
--
-- SELECT s.name, s.product, sl.name AS library_match
-- FROM services s
-- LEFT JOIN service_library sl ON s.service_library_id = sl.id
-- WHERE s.org_id = '74b04f56-8cf0-7427-b977-7574b183226d'
--   AND s.category = 'Neurotoxins'
-- ORDER BY s.name;
-- =====================================================
