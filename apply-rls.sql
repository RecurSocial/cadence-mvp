-- CRITICAL: Drop and recreate all RLS policies to ensure they are applied
-- This must be run in Supabase SQL Editor as a privileged user

-- Drop existing policies first
DROP POLICY IF EXISTS "Allow all on organizations" ON organizations;
DROP POLICY IF EXISTS "Allow all on users" ON users;
DROP POLICY IF EXISTS "Allow all on vendors" ON vendors;
DROP POLICY IF EXISTS "Allow all on services" ON services;
DROP POLICY IF EXISTS "Allow all on practitioners" ON practitioners;
DROP POLICY IF EXISTS "Allow all on practitioner_certifications" ON practitioner_certifications;

-- Disable and re-enable RLS to force refresh
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE practitioners DISABLE ROW LEVEL SECURITY;
ALTER TABLE practitioner_certifications DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE practitioners ENABLE ROW LEVEL SECURITY;
ALTER TABLE practitioner_certifications ENABLE ROW LEVEL SECURITY;

-- Create new policies with ALL operations allowed
CREATE POLICY "Allow all on organizations" ON organizations
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Allow all on users" ON users
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Allow all on vendors" ON vendors
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Allow all on services" ON services
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Allow all on practitioners" ON practitioners
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Allow all on practitioner_certifications" ON practitioner_certifications
  FOR ALL USING (TRUE) WITH CHECK (TRUE);
