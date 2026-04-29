-- =============================================================================
-- Backfill: products + service_products from Euphoria Service Matrix
-- Date: 2026-04-28
-- Spec: Cadence_NextSteps_April28_2026_LayerA_Refactor.docx
-- Source: /mnt/project/Euphoria_Service_Matrix.xlsx (130 service rows)
--
-- Decisions applied (all locked April 28, 2026):
--   1. Service is the actual procedure (Lip Flip, Botox, etc.) — not category.
--      Product is the consumable good (Botox, Restylane, Sermorelin, etc.).
--      Supplier is the manufacturer (Allergan, Galderma, Eli Lilly, etc.).
--   2. Junction rows for branded cases. None for generic injectables.
--   3. Consultations and follow-ups handled by services.appointment_type
--      (Migration 6). No junction rows for those.
--   4. marketing_claims_allowed and marketing_claims_prohibited left NULL.
--      Owner-curated later or sourced from manufacturer research.
--
-- Data corrections applied:
--   - Zepbound is Eli Lilly, not Novo Nordisk (spreadsheet had this wrong).
--     Wegovy and Ozempic are Novo Nordisk (semaglutide).
--   - Aubrey Rieger's role was "Masseuse" → corrected to Massage Therapist
--     in Migration 4 (already applied).
--
-- Idempotency:
--   This script can be re-run safely. ON CONFLICT DO NOTHING on products.
--   service_products is wiped first to avoid stale junction rows from
--   prior runs, then rebuilt. This is safe because no production data
--   exists in service_products yet (count = 0 confirmed).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Capture the Euphoria org_id once so it can be reused below
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_euphoria_id uuid;
BEGIN
  SELECT id INTO v_euphoria_id FROM organizations WHERE name = 'Euphoria Esthetics & Wellness';
  IF v_euphoria_id IS NULL THEN
    RAISE EXCEPTION 'Euphoria org not found — cannot run backfill';
  END IF;
  RAISE NOTICE 'Euphoria org_id: %', v_euphoria_id;
END $$;

-- -----------------------------------------------------------------------------
-- 1. Insert products
--    Organized by category. Suppliers normalized to manufacturer names.
-- -----------------------------------------------------------------------------

-- Neurotoxins (5 branded products)
INSERT INTO products (org_id, name, category, supplier, active_ingredient, mechanism_of_action, description) VALUES
  ((SELECT id FROM organizations WHERE name = 'Euphoria Esthetics & Wellness'),
    'Botox', 'Neurotoxin', 'Allergan',
    'OnabotulinumtoxinA',
    'Temporarily blocks acetylcholine release at neuromuscular junctions, relaxing targeted muscles.',
    'Original FDA-approved neurotoxin. Industry standard with longest safety record.'),
  ((SELECT id FROM organizations WHERE name = 'Euphoria Esthetics & Wellness'),
    'Xeomin', 'Neurotoxin', 'Merz Aesthetics',
    'IncobotulinumtoxinA',
    'Naked neurotoxin without complexing proteins. Same mechanism as other neurotoxins.',
    'Pure-form neurotoxin. May be preferred for patients with antibody resistance to other brands.'),
  ((SELECT id FROM organizations WHERE name = 'Euphoria Esthetics & Wellness'),
    'Jeuveau', 'Neurotoxin', 'Evolus',
    'PrabotulinumtoxinA',
    'Same mechanism as other neurotoxins. Often called "Newtox" — newest on the market.',
    'Specifically developed for aesthetic use. Often positioned as a value-priced premium option.'),
  ((SELECT id FROM organizations WHERE name = 'Euphoria Esthetics & Wellness'),
    'Dysport', 'Neurotoxin', 'Galderma',
    'AbobotulinumtoxinA',
    'Same mechanism as other neurotoxins. Different unit dosing — not 1:1 with Botox.',
    'Often noted for faster onset (2-3 days) and broader diffusion. Good for larger treatment areas.'),
  ((SELECT id FROM organizations WHERE name = 'Euphoria Esthetics & Wellness'),
    'Daxxify', 'Neurotoxin', 'Revance',
    'DaxibotulinumtoxinA-lanm',
    'Peptide-stabilized neurotoxin. Mechanism is the same — peptide replaces human serum albumin.',
    'Marketed for longer duration (up to 6 months) versus the 3-4 month standard. Premium pricing.')
ON CONFLICT (org_id, name) DO NOTHING;

-- Hyaluronic Acid Fillers (Restylane is the only branded HA Euphoria currently lists)
INSERT INTO products (org_id, name, category, supplier, active_ingredient, mechanism_of_action, description) VALUES
  ((SELECT id FROM organizations WHERE name = 'Euphoria Esthetics & Wellness'),
    'Restylane', 'Hyaluronic Acid Filler', 'Galderma',
    'Hyaluronic acid (NASHA technology)',
    'Cross-linked HA gel that adds volume and integrates with surrounding tissue.',
    'Family of HA fillers (Lyft, Refyne, Defyne, Kysse, Eyelight, SkinVive). Different formulations for different facial zones.')
ON CONFLICT (org_id, name) DO NOTHING;

-- Biostimulators
INSERT INTO products (org_id, name, category, supplier, active_ingredient, mechanism_of_action, description) VALUES
  ((SELECT id FROM organizations WHERE name = 'Euphoria Esthetics & Wellness'),
    'Radiesse', 'Biostimulator', 'Merz Aesthetics',
    'Calcium hydroxylapatite (CaHA) microspheres in gel carrier',
    'CaHA microspheres stimulate the bodys own collagen production over months following injection.',
    'Dual action: immediate volume from gel carrier, long-term collagen stimulation. Used for cheek, jawline, hand rejuvenation, BBL-style augmentation.')
ON CONFLICT (org_id, name) DO NOTHING;

-- Fat Dissolvers
INSERT INTO products (org_id, name, category, supplier, active_ingredient, mechanism_of_action, description) VALUES
  ((SELECT id FROM organizations WHERE name = 'Euphoria Esthetics & Wellness'),
    'Kybella', 'Fat Dissolver', 'Allergan',
    'Deoxycholic acid',
    'Naturally occurring molecule that destroys fat cells on contact. Dead cells are cleared by lymphatic system.',
    'Only FDA-approved injectable for submental fat (double chin). Permanent reduction once cells are destroyed.')
ON CONFLICT (org_id, name) DO NOTHING;

-- Hormones / Weight Loss
INSERT INTO products (org_id, name, category, supplier, active_ingredient, mechanism_of_action, description) VALUES
  ((SELECT id FROM organizations WHERE name = 'Euphoria Esthetics & Wellness'),
    'Sermorelin', 'Hormone', 'Various Compounding Pharmacies',
    'Sermorelin acetate (synthetic GHRH)',
    'Stimulates the pituitary to release the bodys own growth hormone in a natural pulsatile pattern.',
    'Growth hormone secretagogue. Used for anti-aging, recovery, sleep quality, body composition.'),
  ((SELECT id FROM organizations WHERE name = 'Euphoria Esthetics & Wellness'),
    'Semaglutide', 'Peptide', 'Various Compounding Pharmacies',
    'Semaglutide',
    'GLP-1 receptor agonist. Slows gastric emptying, increases satiety, improves insulin sensitivity.',
    'Compounded weight loss peptide. Same molecule as Wegovy/Ozempic when sourced from compounding pharmacies.'),
  ((SELECT id FROM organizations WHERE name = 'Euphoria Esthetics & Wellness'),
    'Zepbound', 'Peptide', 'Eli Lilly',
    'Tirzepatide',
    'Dual GIP and GLP-1 receptor agonist. Acts on two appetite pathways simultaneously.',
    'FDA-approved for weight management. Branded tirzepatide. Note: Wegovy/Ozempic are Novo Nordisk semaglutide; Zepbound/Mounjaro are Eli Lilly tirzepatide.')
ON CONFLICT (org_id, name) DO NOTHING;

-- Equipment-based products (laser, microneedling devices)
INSERT INTO products (org_id, name, category, supplier, active_ingredient, mechanism_of_action, description) VALUES
  ((SELECT id FROM organizations WHERE name = 'Euphoria Esthetics & Wellness'),
    'Cynosure Potenza', 'Topical', 'Cynosure',
    'Radiofrequency microneedling device',
    'Combines microneedling depth with radiofrequency energy delivered at the needle tips.',
    'RF microneedling platform. Treats acne scars, texture, laxity. Multi-tip configurations.'),
  ((SELECT id FROM organizations WHERE name = 'Euphoria Esthetics & Wellness'),
    'CoolTone', 'Topical', 'Allergan',
    'Magnetic muscle stimulation (MMS)',
    'Electromagnetic energy stimulates rapid involuntary muscle contractions to strengthen and tone.',
    'Body contouring device. Builds and tones muscle in abdomen, glutes, thighs.'),
  ((SELECT id FROM organizations WHERE name = 'Euphoria Esthetics & Wellness'),
    'Fraxel', 'Topical', 'Solta Medical',
    'Fractional laser resurfacing',
    'Non-ablative fractional laser creates microscopic treatment zones, triggering collagen response.',
    'Skin resurfacing for texture, tone, sun damage, scars. Multiple treatment sessions standard.')
ON CONFLICT (org_id, name) DO NOTHING;

-- Topicals / Specialty
INSERT INTO products (org_id, name, category, supplier, active_ingredient, mechanism_of_action, description) VALUES
  ((SELECT id FROM organizations WHERE name = 'Euphoria Esthetics & Wellness'),
    'DiamondGlow', 'Topical', 'Aesthetics Biomedical',
    'Patented Skin Resurfacing serum infusion',
    'Three-in-one resurfacing, extracting, and infusing serums via diamond-tip wand.',
    'Medical-grade facial system. SkinMedica serums delivered into freshly resurfaced skin.'),
  ((SELECT id FROM organizations WHERE name = 'Euphoria Esthetics & Wellness'),
    'SkinMedica', 'Topical', 'Allergan',
    'Topical skincare formulations',
    'Medical-grade topicals — peels, growth factor serums, retinols, vitamin C.',
    'Professional skincare line. Used in DiamondGlow and standalone treatments.'),
  ((SELECT id FROM organizations WHERE name = 'Euphoria Esthetics & Wellness'),
    'VI Peel', 'Topical', 'VI Aesthetics',
    'TCA, salicylic acid, phenol, vitamin C blend',
    'Medium-depth chemical peel. Resurfaces top layers, stimulates collagen, evens pigment.',
    'Branded chemical peel. Multiple formulations (Original, Body, Precision, Purify).'),
  ((SELECT id FROM organizations WHERE name = 'Euphoria Esthetics & Wellness'),
    'SaltMed', 'Topical', 'SaltMed',
    'Pharmaceutical-grade salt aerosol (halotherapy)',
    'Dry salt particles inhaled or applied topically. Anti-inflammatory and antimicrobial properties.',
    'Halotherapy device. Used in salt facials and respiratory wellness add-ons.')
ON CONFLICT (org_id, name) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. Wipe and rebuild service_products junction
--    Safe because no production junction rows exist yet.
-- -----------------------------------------------------------------------------
DELETE FROM service_products
WHERE service_id IN (
  SELECT id FROM services WHERE org_id = (SELECT id FROM organizations WHERE name = 'Euphoria Esthetics & Wellness')
);

-- -----------------------------------------------------------------------------
-- 3. Junction rows: Neurotoxin services → Neurotoxin products
--
--    "Botox" the service is sold as Botox specifically (primary).
--    But Lip Flip, Trap Tox, Migraine Tox, Gummy Smile, TMJ, Stop the Sweat
--    can use ANY neurotoxin — junction to all 5 with Botox as primary
--    (most commonly used at Euphoria per spreadsheet pattern).
-- -----------------------------------------------------------------------------

-- Helper: a function that links a service to a product with is_primary
CREATE OR REPLACE FUNCTION link_service_product(
  p_service_name text,
  p_product_name text,
  p_is_primary boolean DEFAULT false,
  p_notes text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_org_id uuid;
  v_service_id uuid;
  v_product_id uuid;
BEGIN
  SELECT id INTO v_org_id FROM organizations WHERE name = 'Euphoria Esthetics & Wellness';

  SELECT id INTO v_service_id FROM services
    WHERE org_id = v_org_id AND name = p_service_name;
  SELECT id INTO v_product_id FROM products
    WHERE org_id = v_org_id AND name = p_product_name;

  IF v_service_id IS NULL THEN
    RAISE NOTICE 'SKIP: service "%" not found', p_service_name;
    RETURN;
  END IF;
  IF v_product_id IS NULL THEN
    RAISE NOTICE 'SKIP: product "%" not found', p_product_name;
    RETURN;
  END IF;

  INSERT INTO service_products (service_id, product_id, is_primary, notes)
  VALUES (v_service_id, v_product_id, p_is_primary, p_notes)
  ON CONFLICT (service_id, product_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- "As-product" services: the service IS the named product
SELECT link_service_product('Botox', 'Botox', true);
SELECT link_service_product('Xeomin', 'Xeomin', true);
SELECT link_service_product('Jeuveau', 'Jeuveau', true);
SELECT link_service_product('Dysport', 'Dysport', true);
SELECT link_service_product('Daxxify', 'Daxxify', true);

-- Functional neurotoxin services (any neurotoxin can be used)
-- Botox is primary at Euphoria per spreadsheet pattern (Allergan defaults)
SELECT link_service_product('Lip Flip', 'Botox', true, 'Most common at Euphoria. Patient may request alternative neurotoxin.');
SELECT link_service_product('Lip Flip', 'Xeomin');
SELECT link_service_product('Lip Flip', 'Jeuveau');
SELECT link_service_product('Lip Flip', 'Dysport');
SELECT link_service_product('Lip Flip', 'Daxxify');

SELECT link_service_product('Trap Tox', 'Botox', true);
SELECT link_service_product('Trap Tox', 'Xeomin');
SELECT link_service_product('Trap Tox', 'Jeuveau');
SELECT link_service_product('Trap Tox', 'Dysport');
SELECT link_service_product('Trap Tox', 'Daxxify');

SELECT link_service_product('Migraine Tox', 'Botox', true, 'Botox has FDA approval for chronic migraine.');
SELECT link_service_product('Migraine Tox', 'Xeomin');
SELECT link_service_product('Migraine Tox', 'Jeuveau');
SELECT link_service_product('Migraine Tox', 'Dysport');
SELECT link_service_product('Migraine Tox', 'Daxxify');

SELECT link_service_product('Gummy Smile', 'Botox', true);
SELECT link_service_product('Gummy Smile', 'Xeomin');
SELECT link_service_product('Gummy Smile', 'Jeuveau');
SELECT link_service_product('Gummy Smile', 'Dysport');
SELECT link_service_product('Gummy Smile', 'Daxxify');

SELECT link_service_product('TMJ and Teeth Grinding', 'Botox', true, 'Allergan stocked specifically for TMJ per spreadsheet.');
SELECT link_service_product('TMJ and Teeth Grinding', 'Xeomin');
SELECT link_service_product('TMJ and Teeth Grinding', 'Jeuveau');
SELECT link_service_product('TMJ and Teeth Grinding', 'Dysport');
SELECT link_service_product('TMJ and Teeth Grinding', 'Daxxify');

SELECT link_service_product('Stop the Sweat Underarms', 'Botox', true, 'Botox FDA-approved for hyperhidrosis. Allergan stocked specifically per spreadsheet.');
SELECT link_service_product('Stop the Sweat Underarms', 'Xeomin');
SELECT link_service_product('Stop the Sweat Underarms', 'Jeuveau');
SELECT link_service_product('Stop the Sweat Underarms', 'Dysport');
SELECT link_service_product('Stop the Sweat Underarms', 'Daxxify');

-- -----------------------------------------------------------------------------
-- 4. Filler services
--    Dermal Filler Standard / Dissolve: only Restylane in current Euphoria
--    inventory. When Brianna confirms additional brands (Juvederm, RHA, etc.),
--    add those products and link.
-- -----------------------------------------------------------------------------
SELECT link_service_product('Dermal Filler Standard', 'Restylane', true,
  'Only HA filler currently confirmed at Euphoria. Add Juvederm/RHA/etc. when confirmed.');
SELECT link_service_product('Dermal Filler Dissolve', 'Restylane', true,
  'Hylenex/hyaluronidase used to dissolve — link to Restylane for now since dissolution is HA-related.');

-- Kybella: only Kybella
SELECT link_service_product('Kybella', 'Kybella', true);

-- Radiesse BBL: only Radiesse
SELECT link_service_product('Radiesse BBL', 'Radiesse', true);

-- Bio Stimulator Fillers: Radiesse is the confirmed biostimulator at Euphoria
-- Sculptra would be added separately when confirmed
SELECT link_service_product('Bio Stimulator Fillers', 'Radiesse', true,
  'Only biostimulator currently confirmed. Add Sculptra/PLLA when confirmed.');

-- -----------------------------------------------------------------------------
-- 5. SkinVive services (Restylane SkinVive is a specific Galderma product)
-- -----------------------------------------------------------------------------
SELECT link_service_product('SkinVive Lips', 'Restylane', true, 'SkinVive is part of Restylane family.');
SELECT link_service_product('SkinVive 2 Syringes', 'Restylane', true);

-- -----------------------------------------------------------------------------
-- 6. CoolSculpting / CoolTone
-- -----------------------------------------------------------------------------
SELECT link_service_product('CoolTone', 'CoolTone', true);

-- -----------------------------------------------------------------------------
-- 7. RF Microneedling — all use Cynosure Potenza
-- -----------------------------------------------------------------------------
SELECT link_service_product('RF Microneedling Acne Scars', 'Cynosure Potenza', true);
SELECT link_service_product('RF Microneedling Face and Neck', 'Cynosure Potenza', true);
SELECT link_service_product('RF Microneedling Decollete', 'Cynosure Potenza', true);
SELECT link_service_product('RF Microneedling Arms', 'Cynosure Potenza', true);
SELECT link_service_product('RF Microneedling Abdomen', 'Cynosure Potenza', true);

-- -----------------------------------------------------------------------------
-- 8. DiamondGlow / SkinMedica facials
-- -----------------------------------------------------------------------------
SELECT link_service_product('DiamondGlow', 'DiamondGlow', true);
SELECT link_service_product('SkinMedica Illuminize Peel', 'SkinMedica', true);

-- -----------------------------------------------------------------------------
-- 9. SaltMed
-- -----------------------------------------------------------------------------
SELECT link_service_product('SaltMed Facial', 'SaltMed', true);

-- -----------------------------------------------------------------------------
-- 10. VI Peel (both variants)
-- -----------------------------------------------------------------------------
SELECT link_service_product('VI Peel Original', 'VI Peel', true);
SELECT link_service_product('VI Body Peel', 'VI Peel', true);

-- -----------------------------------------------------------------------------
-- 11. Hormone & Weight Loss
-- -----------------------------------------------------------------------------
SELECT link_service_product('Sermorelin', 'Sermorelin', true);
SELECT link_service_product('Weekly Injection Semaglutide', 'Semaglutide', true);
SELECT link_service_product('Zepbound Direct Monthly', 'Zepbound', true);
SELECT link_service_product('NovoCare Monthly', 'Zepbound', true,
  'NovoCare is a Lilly direct-pay program for Zepbound. Note: prior spreadsheet listed supplier as Novo Nordisk — corrected to Eli Lilly here.');

-- -----------------------------------------------------------------------------
-- 12. Drop the helper function — was only needed during this backfill
-- -----------------------------------------------------------------------------
DROP FUNCTION link_service_product(text, text, boolean, text);

-- -----------------------------------------------------------------------------
-- 13. Verification — log final counts and any anomalies
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_org_id uuid;
  v_product_count int;
  v_junction_count int;
  v_services_with_junction int;
  v_total_procedures int;
BEGIN
  SELECT id INTO v_org_id FROM organizations WHERE name = 'Euphoria Esthetics & Wellness';

  SELECT COUNT(*) INTO v_product_count FROM products WHERE org_id = v_org_id;
  SELECT COUNT(*) INTO v_junction_count FROM service_products
    WHERE service_id IN (SELECT id FROM services WHERE org_id = v_org_id);
  SELECT COUNT(DISTINCT service_id) INTO v_services_with_junction FROM service_products
    WHERE service_id IN (SELECT id FROM services WHERE org_id = v_org_id);
  SELECT COUNT(*) INTO v_total_procedures FROM services
    WHERE org_id = v_org_id AND appointment_type = 'procedure';

  RAISE NOTICE '----- Backfill summary -----';
  RAISE NOTICE 'Products created: %', v_product_count;
  RAISE NOTICE 'Junction rows created: %', v_junction_count;
  RAISE NOTICE 'Procedure services with at least one product link: % of % total procedures',
    v_services_with_junction, v_total_procedures;
  RAISE NOTICE 'Procedure services with no product link (expected for generic injectables, IV, hormone visits, massage): %',
    v_total_procedures - v_services_with_junction;
END $$;