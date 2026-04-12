// Services
export interface Service {
  id: string;
  org_id: string;
  category: string;
  name: string;
  product: string;
  supplier: string;
  duration_minutes: number | null;
  price: string;
  created_at: string;
  updated_at: string;
}

// Practitioners
export type PractitionerRole = "Nurse" | "PA" | "Aesthetician" | "Masseuse";

export interface PractitionerCertification {
  practitioner_id: string;
  service_id: string;
  certified: boolean;
  certified_date?: string;
}

export interface Practitioner {
  id: string;
  org_id: string;
  first_name: string;
  last_name: string;
  role: PractitionerRole;
  email?: string;
  phone?: string;
  is_active: boolean;
  approval_level: "staff" | "manager" | "owner" | "auto_approve";
  created_at: string;
  updated_at: string;
}

// Vendors/Suppliers
export interface Vendor {
  id: string;
  org_id: string;
  name: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  events_url?: string;
  rss_feed_url?: string;
  coop_budget?: number;
  coop_budget_year?: number;
  coop_budget_spent?: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Posts
export type PostStatus = 'draft' | 'pending_review' | 'scheduled' | 'published' | 'rejected';

export interface Post {
  id: string;
  org_id: string;
  caption: string | null;
  hashtags: string | null;
  scheduled_at: string | null;
  platforms: string[];
  status: PostStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Organization
export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan_tier: "starter" | "standard" | "pro" | "enterprise";
  created_at: string;
  updated_at: string;
}

// User
export interface User {
  id: string;
  org_id: string;
  email: string;
  role: "owner" | "staff" | "admin";
  created_at: string;
  updated_at: string;
}
