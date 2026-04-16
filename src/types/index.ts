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
  post_type: string | null;
  status: PostStatus;
  upload_post_id: string | null;
  upload_post_status: 'pending' | 'completed' | 'failed' | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Post Reviews
export type ReviewAction = 'submitted' | 'approved' | 'rejected';

export interface PostReview {
  id: string;
  post_id: string;
  reviewer_id: string | null;
  action: ReviewAction;
  notes: string | null;
  created_at: string;
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

// Roles
export type UserRole = 'owner' | 'admin' | 'staff';

// User
export interface User {
  id: string;
  org_id: string;
  email: string;
  /** @deprecated Use user_orgs.role instead */
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// User-Org membership (authoritative source for role)
export interface UserOrg {
  id: string;
  user_id: string;
  org_id: string;
  role: UserRole;
  practitioner_id: string | null;
  created_at: string;
  created_by: string | null;
}

// Org Platforms (Upload-Post connection config)
export interface OrgPlatform {
  id: string;
  org_id: string;
  upload_post_username: string;
  facebook_page_id: string | null;
  connected_platforms: string[];
  created_at: string;
  updated_at: string;
}
