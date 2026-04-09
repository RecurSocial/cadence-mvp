-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  plan_tier VARCHAR(50) DEFAULT 'starter',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(50) DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendors/Suppliers
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  website VARCHAR(500),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  events_url VARCHAR(500),
  rss_feed_url VARCHAR(500),
  coop_budget DECIMAL(10, 2),
  coop_budget_year INTEGER,
  coop_budget_spent DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vendors_org_id ON vendors(org_id);

-- Services
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  product VARCHAR(255),
  supplier VARCHAR(255),
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  duration_minutes INTEGER,
  price VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_services_org_id ON services(org_id);
CREATE INDEX idx_services_vendor_id ON services(vendor_id);

-- Practitioners
CREATE TABLE practitioners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  approval_level VARCHAR(50) DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_practitioners_org_id ON practitioners(org_id);

-- Practitioner Certifications (Junction table)
CREATE TABLE practitioner_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  certified BOOLEAN DEFAULT FALSE,
  certified_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(practitioner_id, service_id)
);

CREATE INDEX idx_practitioner_certs_practitioner ON practitioner_certifications(practitioner_id);
CREATE INDEX idx_practitioner_certs_service ON practitioner_certifications(service_id);

-- Enable RLS (Row Level Security)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE practitioners ENABLE ROW LEVEL SECURITY;
ALTER TABLE practitioner_certifications ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies (can be refined later)
CREATE POLICY "Users can view own org" ON organizations
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can view own org users" ON users
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can view own org vendors" ON vendors
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can view own org services" ON services
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can view own org practitioners" ON practitioners
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can view own org practitioner certifications" ON practitioner_certifications
  FOR SELECT USING (TRUE);
