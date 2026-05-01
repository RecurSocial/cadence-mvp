import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

export async function getServicesForOrg(orgId: string) {
  const { data, error } = await supabase
    .from("services")
    .select(`
      id,
      name,
      category,
      appointment_type,
      is_custom,
      service_library_id,
      library:service_library!service_library_id (
        id,
        name,
        default_duration_min,
        linked_product_cat,
        notes,
        category:service_categories!category_id (
          id,
          name
        )
      )
    `)
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("name")
  if (error) throw error
  return data ?? []
}

export async function getProductsForOrg(orgId: string) {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      category,
      is_custom,
      product_library_id,
      library:product_library!product_library_id (
        id,
        manufacturer,
        brand_family,
        product_name,
        sub_category,
        fda_indication,
        has_boxed_warning,
        trademark_notation
      )
    `)
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("name")
  if (error) throw error
  return data ?? []
}

export async function getLibraryServiceById(libServiceId: string) {
  if (!libServiceId) return null
  const { data, error } = await supabase
    .from("service_library")
    .select(`
      id,
      name,
      default_duration_min,
      linked_product_cat,
      notes,
      category:service_categories!category_id (
        id,
        name
      )
    `)
    .eq("id", libServiceId)
    .single()
  if (error) throw error
  return data
}

export async function getComplianceRulesForLibraryService(libServiceId: string | null) {
  if (!libServiceId) return []
  const libService = await getLibraryServiceById(libServiceId)
  if (!libService || !libService.linked_product_cat) return []
  const productCat = libService.linked_product_cat
  const { data, error } = await supabase
    .from("compliance_rules")
    .select(`
      id,
      rule_code,
      rule_type,
      applies_to,
      description,
      guidance,
      version,
      effective_date
    `)
    .ilike("applies_to", `%${productCat}%`)
    .is("superseded_by", null)
    .order("rule_code")
  if (error) throw error
  return data ?? []
}
