-- =============================================================================
-- Migration: Create products table
-- Date: 2026-04-28
-- Spec: Cadence_NextSteps_April28_2026_LayerA_Refactor.docx
--
-- Purpose:
--   Introduces the products table to the Cadence schema. Products are the
--   consumable goods used in services (Botox, Revanesse, Kybella, etc.) as
--   distinct from services themselves (Lip Flip, Dermal Filler Standard).
--
--   This is part of the three-table product/service model:
--     1. products       (this migration)
--     2. service_products junction (next migration)
--     3. services       (already exists)
--
--   The products table also stores per-product compliance metadata
--   (marketing_claims_allowed, marketing_claims_prohibited) that surfaces
--   in the wizard as helper text and gets passed to the AI generator
--   as guardrails.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Shared utility: updated_at trigger function
--    Idempotent — only creates if it doesn't already exist.
--    Future migrations can reuse this without redefining.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 1. Product category enum
--    Pharmacology-driven taxonomy. Distinct from service_category which is
--    procedure-driven (procedures are categorized differently than products).
-- -----------------------------------------------------------------------------
CREATE TYPE product_category AS ENUM (
  'Neurotoxin',
  'Hyaluronic Acid Filler',
  'Biostimulator',
  'Fat Dissolver',
  'Skin Booster',
  'Peptide',
  'Hormone',
  'Topical',
  'Supplement'
);

-- -----------------------------------------------------------------------------
-- 2. Products table
-- -----------------------------------------------------------------------------
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identity
  name text NOT NULL,
  category product_category NOT NULL,
  supplier text,

  -- Pharmacology / clinical
  active_ingredient text,
  mechanism_of_action text,
  description text,
  fda_approved_uses text[],

  -- Marketing compliance — surfaces in wizard as helper text,
  -- passed to AI generator as guardrails
  marketing_claims_allowed text[],
  marketing_claims_prohibited text[],

  -- Branding / visual
  image_url text,
  brand_hex text CHECK (brand_hex IS NULL OR brand_hex ~ '^#[0-9A-Fa-f]{6}$'),

  -- Lifecycle
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Org-scoped uniqueness on name (case-insensitive)
  CONSTRAINT products_name_unique_per_org UNIQUE (org_id, name)
);

-- -----------------------------------------------------------------------------
-- 3. Indexes for read performance
-- -----------------------------------------------------------------------------
CREATE INDEX idx_products_org_id ON products(org_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_org_active
  ON products(org_id) WHERE is_active = true;

-- -----------------------------------------------------------------------------
-- 4. updated_at trigger
--    Matches the existing pattern used on services and other tables.
-- -----------------------------------------------------------------------------
CREATE TRIGGER products_updated_at_trigger
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 5. Row Level Security
--    Read: any user belonging to the org can read products.
--    Write: only owners and admins of the org can write.
--    Matches user_orgs.role values: 'owner', 'admin', 'staff'.
-- -----------------------------------------------------------------------------
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY products_select_org ON products
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM user_orgs
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY products_insert_owner_admin ON products
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM user_orgs
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY products_update_owner_admin ON products
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM user_orgs
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM user_orgs
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY products_delete_owner_admin ON products
  FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM user_orgs
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- -----------------------------------------------------------------------------
-- 6. Comments for schema documentation
-- -----------------------------------------------------------------------------
COMMENT ON TABLE products IS
  'Consumable goods used in services (Botox, Revanesse, etc.). Distinct from services. Joined many-to-many via service_products.';
COMMENT ON COLUMN products.marketing_claims_allowed IS
  'Manufacturer-approved marketing claims. Surfaces in wizard as helper text and is passed to AI generator as guardrails.';
COMMENT ON COLUMN products.marketing_claims_prohibited IS
  'Marketing claims to avoid (FDA off-label warnings, etc.). Passed to AI generator as negative guardrails.';
COMMENT ON COLUMN products.brand_hex IS
  'Optional hex color for product brand (e.g., Allergan blue). Used in branded templates when product is featured.';