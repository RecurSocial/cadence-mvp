-- =====================================================
-- Cadence v1 Service Library — SCHEMA ONLY
-- Generated April 30, 2026 (revised)
-- Run this FIRST. Run cadence_service_library_v1_seed.sql AFTER.
-- =====================================================

-- This script creates 4 new tables for the Service Library.
-- It does NOT touch organizations, services, or products tables.
-- Those are altered in a separate backfill migration.
--
-- Wrapped in a transaction: either all 4 tables get created, or none do.
-- =====================================================

BEGIN;

-- 1. Service categories (top-level taxonomy)
CREATE TABLE IF NOT EXISTS service_categories (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT,
  display_order   INT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Service library (master list of common med spa services)
CREATE TABLE IF NOT EXISTS service_library (
  id                    TEXT PRIMARY KEY,
  category_id           TEXT NOT NULL REFERENCES service_categories(id) ON DELETE RESTRICT,
  name                  TEXT NOT NULL,
  default_duration_min  INT,
  pricing_model         TEXT,
  appointment_type      TEXT,
  linked_product_cat    TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_library_category ON service_library(category_id);

-- 3. Product library (master list of injectables, devices, skincare)
CREATE TABLE IF NOT EXISTS product_library (
  id                    TEXT PRIMARY KEY,
  product_class         TEXT NOT NULL CHECK (product_class IN ('injectable','device','skincare')),
  manufacturer          TEXT NOT NULL,
  brand_family          TEXT,
  product_name          TEXT NOT NULL,
  sub_category          TEXT,
  fda_indication        TEXT,
  has_boxed_warning     BOOLEAN NOT NULL DEFAULT FALSE,
  trademark_notation    TEXT NOT NULL,
  -- Verification tracking (for future cron job)
  last_verified_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_source   TEXT NOT NULL DEFAULT 'manufacturer-website-april-2026',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_library_class ON product_library(product_class);
CREATE INDEX IF NOT EXISTS idx_product_library_brand ON product_library(brand_family);
CREATE INDEX IF NOT EXISTS idx_product_library_subcat ON product_library(sub_category);

-- 4. Compliance rules (BEL guardrails inherited per product)
CREATE TABLE IF NOT EXISTS compliance_rules (
  id                    TEXT PRIMARY KEY,
  applies_to            TEXT NOT NULL,
  rule_type             TEXT NOT NULL CHECK (rule_type IN ('boxed_warning','trademark','off_label','testimonial','before_after','drug_claim','other')),
  required_behavior     TEXT NOT NULL,
  source                TEXT,
  -- Versioning (for tracking rule changes over time)
  version               INT NOT NULL DEFAULT 1,
  superseded_by         TEXT REFERENCES compliance_rules(id),
  effective_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_rules_active ON compliance_rules(superseded_by) WHERE superseded_by IS NULL;

COMMIT;

-- =====================================================
-- Verification: Run these queries to confirm success
-- =====================================================
-- SELECT tablename FROM pg_tables WHERE tablename IN
--   ('service_categories', 'service_library', 'product_library', 'compliance_rules');
-- Expected: 4 rows
-- =====================================================
