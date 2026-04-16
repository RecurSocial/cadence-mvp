-- 005: Role-Based Permissions (Owner / Admin / Staff)
-- Creates user_orgs junction table with role enum, helper function, and seeds Euphoria users.

-- 1. Create role enum
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner', 'admin', 'staff');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create user_orgs junction table
CREATE TABLE IF NOT EXISTS user_orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'staff',
  practitioner_id UUID REFERENCES practitioners(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(id),
  UNIQUE(user_id, org_id)
);

CREATE INDEX IF NOT EXISTS idx_user_orgs_user ON user_orgs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_orgs_org ON user_orgs(org_id);
CREATE INDEX IF NOT EXISTS idx_user_orgs_role ON user_orgs(role);

-- 3. RLS on user_orgs (permissive for now — tighten when Supabase Auth is integrated)
ALTER TABLE user_orgs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on user_orgs" ON user_orgs
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- 4. Helper function: get a user's role in an org
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID, p_org_id UUID)
RETURNS user_role AS $$
  SELECT role FROM user_orgs
  WHERE user_id = p_user_id AND org_id = p_org_id
  LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- 5. Seed Euphoria users
-- Org ID: 74b04f56-8cf0-7427-b977-7574b183226d

-- Brianna (Owner)
INSERT INTO users (id, org_id, email, role)
VALUES ('a0000000-0000-0000-0000-000000000001', '74b04f56-8cf0-7427-b977-7574b183226d', 'brianna@euphoriaesthetics.com', 'owner')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;

-- Michelle (Owner)
INSERT INTO users (id, org_id, email, role)
VALUES ('a0000000-0000-0000-0000-000000000002', '74b04f56-8cf0-7427-b977-7574b183226d', 'michelle@euphoriaesthetics.com', 'owner')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;

-- Christine (Admin — Office Manager)
INSERT INTO users (id, org_id, email, role)
VALUES ('a0000000-0000-0000-0000-000000000003', '74b04f56-8cf0-7427-b977-7574b183226d', 'christine@euphoriaesthetics.com', 'admin')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;

-- Ashley (Staff — Social Media)
INSERT INTO users (id, org_id, email, role)
VALUES ('a0000000-0000-0000-0000-000000000004', '74b04f56-8cf0-7427-b977-7574b183226d', 'ashley@euphoriaesthetics.com', 'staff')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;

-- user_orgs rows
INSERT INTO user_orgs (user_id, org_id, role)
VALUES
  ('a0000000-0000-0000-0000-000000000001', '74b04f56-8cf0-7427-b977-7574b183226d', 'owner'),
  ('a0000000-0000-0000-0000-000000000002', '74b04f56-8cf0-7427-b977-7574b183226d', 'owner'),
  ('a0000000-0000-0000-0000-000000000003', '74b04f56-8cf0-7427-b977-7574b183226d', 'admin'),
  ('a0000000-0000-0000-0000-000000000004', '74b04f56-8cf0-7427-b977-7574b183226d', 'staff')
ON CONFLICT (user_id, org_id) DO UPDATE SET role = EXCLUDED.role;
