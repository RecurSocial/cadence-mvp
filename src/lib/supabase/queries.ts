import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

// Query: Get all services with vendor details
export async function getServicesWithVendors(orgId: string) {
  const { data, error } = await supabase
    .from("services")
    .select(`
      *,
      vendors:vendor_id (
        id,
        name,
        website,
        coop_budget
      )
    `)
    .eq("org_id", orgId)
    .order("category, name");

  if (error) throw error;
  return data;
}

// Query: Get all practitioners with their certifications
export async function getPractitionersWithCertifications(orgId: string) {
  const { data, error } = await supabase
    .from("practitioners")
    .select(`
      *,
      practitioner_certifications (
        id,
        service_id,
        certified,
        services:service_id (
          id,
          name,
          category
        )
      )
    `)
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("role, last_name, first_name");

  if (error) throw error;
  return data;
}

// Query: Filter practitioners by role
export async function getPractitionersByRole(orgId: string, role: string) {
  const { data, error } = await supabase
    .from("practitioners")
    .select(`
      *,
      practitioner_certifications (
        service_id,
        certified
      )
    `)
    .eq("org_id", orgId)
    .eq("role", role)
    .eq("is_active", true)
    .order("last_name, first_name");

  if (error) throw error;
  return data;
}

// Query: Filter practitioners by service certification
export async function getPractitionersByCertification(orgId: string, serviceId: string) {
  const { data, error } = await supabase
    .from("practitioners")
    .select(`
      *,
      practitioner_certifications (
        service_id,
        certified
      )
    `)
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("last_name, first_name");

  if (error) throw error;

  // Filter to only those certified for this service
  return data.filter(p =>
    p.practitioner_certifications.some(
      (c: any) => c.service_id === serviceId && c.certified
    )
  );
}

// Query: Get services by vendor
export async function getServicesByVendor(orgId: string, vendorId: string) {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("org_id", orgId)
    .eq("vendor_id", vendorId)
    .order("category, name");

  if (error) throw error;
  return data;
}

// Query: Get vendors with co-op budget tracking
export async function getVendorsWithBudget(orgId: string, year?: number) {
  const filterYear = year || new Date().getFullYear();

  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("org_id", orgId)
    .eq("coop_budget_year", filterYear)
    .eq("is_active", true)
    .order("name");

  if (error) throw error;
  return data;
}

// Query: Get services by category
export async function getServicesByCategory(orgId: string, category: string) {
  const { data, error } = await supabase
    .from("services")
    .select(`
      *,
      vendors:vendor_id (
        id,
        name
      )
    `)
    .eq("org_id", orgId)
    .eq("category", category)
    .order("name");

  if (error) throw error;
  return data;
}

// Query: Get all categories for an org
export async function getServiceCategories(orgId: string) {
  const { data, error } = await supabase
    .from("services")
    .select("category")
    .eq("org_id", orgId)
    .order("category");

  if (error) throw error;
  
  // Get unique categories
  const uniqueCategories = [...new Set(data.map(d => d.category))];
  return uniqueCategories;
}

// Query: Multi-dimensional dashboard aggregation
export async function getDashboardAggregation(orgId: string) {
  // Get all services
  const { data: services } = await supabase
    .from("services")
    .select("id, category, name, vendor_id")
    .eq("org_id", orgId);

  // Get all practitioners with certifications
  const { data: practitioners } = await supabase
    .from("practitioners")
    .select(`
      id,
      first_name,
      last_name,
      role,
      practitioner_certifications (
        service_id,
        certified
      )
    `)
    .eq("org_id", orgId)
    .eq("is_active", true);

  // Get all vendors
  const { data: vendors } = await supabase
    .from("vendors")
    .select("id, name, coop_budget")
    .eq("org_id", orgId)
    .eq("is_active", true);

  return {
    services: services || [],
    practitioners: practitioners || [],
    vendors: vendors || [],
  };
}
