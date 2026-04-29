-- =============================================================================
-- Migration: Create service_products junction table
-- Date: 2026-04-28
-- Spec: Cadence_NextSteps_April28_2026_LayerA_Refactor.docx
--
-- Purpose:
--   Creates the many-to-many junction between services and products.
--
--   Real-world cases this enables:
--     - Botox (product) → Lip Flip, Trap Tox, Migraine Tox, TMJ, Stop the
--       Sweat, Gummy Smile (services it can be used in)
--     - Lip Flip (service) → Botox, Xeomin, Dysport, Jeuveau, Daxxify
--       (any neurotoxin product)
--     - Dermal Filler Standard (service) → Revanesse, Restylane, Juvederm,
--       RHA, Versa, Belotero (any HA filler product)
--
--   The is_primary flag identifies the most common product used for
--   a given service (e.g., Botox is primary for most neurotoxin services
--   at Euphoria). Used by the AI generator to pick a default when the
--   wizard doesn't specify.
--
--   The notes field captures clinical context like "for resistant
--   patients" or "preferred for first-timers".
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Junction table
-- -----------------------------------------------------------------------------
CREATE TABLE service_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Most common product for this service (defaults the wizard dropdown)
  is_primary boolean NOT NULL DEFAULT false,

  -- Clinical or operational context
  notes text,

  created_at timestamptz NOT NULL DEFAULT now(),

  -- Same product can't be linked to the same service twice
  CONSTRAINT service_products_unique_pair UNIQUE (service_id, product_id)
);

-- -----------------------------------------------------------------------------
-- 2. Indexes for read performance
--    Both directions get indexed because we query both ways:
--      - "What services use this product?" (Educational Product wizard branch)
--      - "What products can perform this service?" (Educational Service branch)
-- -----------------------------------------------------------------------------
CREATE INDEX idx_service_products_service ON service_products(service_id);
CREATE INDEX idx_service_products_product ON service_products(product_id);

-- Partial index for the common "find primary product for service" query
CREATE INDEX idx_service_products_service_primary
  ON service_products(service_id) WHERE is_primary = true;

-- -----------------------------------------------------------------------------
-- 3. Constraint: only one primary product per service
--    Enforced via partial unique index. Multiple non-primary rows allowed,
--    but only one row per service can have is_primary = true.
-- -----------------------------------------------------------------------------
CREATE UNIQUE INDEX idx_service_products_one_primary
  ON service_products(service_id) WHERE is_primary = true;

-- -----------------------------------------------------------------------------
-- 4. Row Level Security
--
--    Read: any user belonging to the org that owns the service can read.
--    Write: only owners and admins can write.
--
--    RLS is enforced via the parent service's org membership. The product
--    side is not separately checked because products and services are
--    org-scoped on the same org_id (a service cannot link to a product
--    from a different org — enforced by the backfill and wizard, not by
--    schema CHECK because RLS on services already prevents cross-org
--    visibility).
-- -----------------------------------------------------------------------------
ALTER TABLE service_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_products_select_org ON service_products
  FOR SELECT
  USING (
    service_id IN (
      SELECT id FROM services
      WHERE org_id IN (
        SELECT org_id FROM user_orgs WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY service_products_insert_owner_admin ON service_products
  FOR INSERT
  WITH CHECK (
    service_id IN (
      SELECT id FROM services
      WHERE org_id IN (
        SELECT org_id FROM user_orgs
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin')
      )
    )
  );

CREATE POLICY service_products_update_owner_admin ON service_products
  FOR UPDATE
  USING (
    service_id IN (
      SELECT id FROM services
      WHERE org_id IN (
        SELECT org_id FROM user_orgs
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin')
      )
    )
  )
  WITH CHECK (
    service_id IN (
      SELECT id FROM services
      WHERE org_id IN (
        SELECT org_id FROM user_orgs
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin')
      )
    )
  );

CREATE POLICY service_products_delete_owner_admin ON service_products
  FOR DELETE
  USING (
    service_id IN (
      SELECT id FROM services
      WHERE org_id IN (
        SELECT org_id FROM user_orgs
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin')
      )
    )
  );

-- -----------------------------------------------------------------------------
-- 5. Schema documentation
-- -----------------------------------------------------------------------------
COMMENT ON TABLE service_products IS
  'Many-to-many junction between services and products. A service can use multiple products (Lip Flip can use any neurotoxin) and a product can be used in multiple services (Botox is used in Lip Flip, Trap Tox, TMJ, etc.).';
COMMENT ON COLUMN service_products.is_primary IS
  'True if this product is the most commonly used for this service. Only one primary product allowed per service (enforced by partial unique index). Used to default the wizard dropdown.';
COMMENT ON COLUMN service_products.notes IS
  'Clinical or operational context (e.g., "for resistant patients", "first-time patient default", "Brianna prefers for sensitive skin").';