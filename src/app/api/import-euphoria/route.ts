import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const PRACTITIONERS = [
  { name: 'Brianna Krug', role: 'Nurse', approval_level: 'owner' },
  { name: 'Jaimie Burkett', role: 'Nurse', approval_level: 'staff' },
  { name: 'Kim Benitez', role: 'Nurse', approval_level: 'staff' },
  { name: 'Lexy Fazzone', role: 'Nurse', approval_level: 'staff' },
  { name: 'Michelle Wilson', role: 'Nurse', approval_level: 'owner' },
  { name: 'Nadine Delia', role: 'Nurse', approval_level: 'staff' },
  { name: 'Daisy', role: 'PA', approval_level: 'staff' },
  { name: 'Jordan Land', role: 'PA', approval_level: 'staff' },
  { name: 'Nicole Roberto', role: 'Aesthetician', approval_level: 'staff' },
  { name: 'Nicole Rekus', role: 'Aesthetician', approval_level: 'staff' },
  { name: 'Tori Grant', role: 'Aesthetician', approval_level: 'staff' },
  { name: 'Aubrey Rieger', role: 'Masseuse', approval_level: 'staff' },
];

const SERVICES = [
  {
    category: 'Neurotoxins',
    name: 'Botox',
    product: 'Allergan',
    supplier: 'Varies',
    duration_minutes: 15,
    price: 'Based on units',
    practitioners: ['Brianna Krug', 'Jaimie Burkett', 'Kim Benitez', 'Lexy Fazzone', 'Michelle Wilson', 'Nadine Delia'],
  },
  {
    category: 'Facials',
    name: 'DiamondGlow',
    product: 'Aesthetics Biomedical',
    supplier: 'Aesthetics Biomedical',
    duration_minutes: 50,
    price: '$199.00',
    practitioners: ['Kim Benitez', 'Nicole Roberto', 'Nicole Rekus', 'Tori Grant'],
  },
  {
    category: 'Fillers',
    name: 'Juvederm',
    product: 'Allergan',
    supplier: 'Varies',
    duration_minutes: 30,
    price: 'Based on syringe',
    practitioners: ['Brianna Krug', 'Jaimie Burkett', 'Kim Benitez', 'Lexy Fazzone', 'Michelle Wilson', 'Nadine Delia'],
  },
  {
    category: 'Massage Therapy',
    name: 'Swedish Massage',
    product: 'N/A',
    supplier: 'N/A',
    duration_minutes: 60,
    price: '$75.00',
    practitioners: ['Aubrey Rieger'],
  },
];

async function supabaseRequest(method: string, table: string, body?: unknown, attempt: number = 1) {
  const maxAttempts = 3;
  const url = `${SUPABASE_URL}/rest/v1/${table}`;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    console.log(`[IMPORT] ${method} ${table} - Status: ${response.status}`);

    if (!response.ok) {
      const errorMsg = typeof data === 'string' ? data : JSON.stringify(data);
      console.error(`[IMPORT] Error: ${errorMsg}`);
      
      if (response.status >= 500 && attempt < maxAttempts) {
        console.log(`[IMPORT] Retrying (attempt ${attempt + 1}/${maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return supabaseRequest(method, table, body, attempt + 1);
      }
      
      throw new Error(`HTTP ${response.status}: ${errorMsg}`);
    }

    return data;
  } catch (error) {
    console.error(`[IMPORT] Request failed for ${table}:`, error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[IMPORT] Request received');
    const body = await request.json();
    const { org_id } = body;

    console.log('[IMPORT] Config check - URL:', !!SUPABASE_URL, 'Key:', !!SUPABASE_ANON_KEY);

    if (!org_id) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: 'Server not configured: Missing Supabase credentials' },
        { status: 500 }
      );
    }

    console.log(`[IMPORT] Starting import for org_id: ${org_id}`);

    // Step 1: Create organization
    try {
      console.log('[IMPORT] Step 1: Creating organization...');
      await supabaseRequest('POST', 'organizations', {
        id: org_id,
        name: 'Euphoria Esthetics & Wellness',
        slug: 'euphoria-' + Date.now(),
        plan_tier: 'starter',
      });
      console.log('[IMPORT] Organization created successfully');
    } catch (e) {
      console.log('[IMPORT] Organization already exists or error:', (e as Error).message);
    }

    // Step 2: Create practitioners
    console.log('[IMPORT] Step 2: Creating practitioners...');
    const practitionersToInsert = PRACTITIONERS.map((p) => {
      const nameParts = p.name.split(' ');
      return {
        org_id,
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(' ') || '',
        role: p.role,
        approval_level: p.approval_level,
        is_active: true,
      };
    });

    const practitionersResponse = await supabaseRequest(
      'POST',
      'practitioners',
      practitionersToInsert
    );

    if (!Array.isArray(practitionersResponse)) {
      throw new Error(`Expected array response for practitioners, got: ${typeof practitionersResponse}`);
    }

    console.log(`[IMPORT] ✓ Created ${practitionersResponse.length} practitioners`);

    const practMap: Record<string, string> = {};
    for (const pract of practitionersResponse) {
      const fullName = `${pract.first_name} ${pract.last_name}`.trim();
      practMap[fullName] = pract.id;
    }
    console.log('[IMPORT] Created practitioner name->id map');

    // Step 3: Create services
    console.log('[IMPORT] Step 3: Creating services...');
    const servicesToInsert = SERVICES.map((s) => ({
      org_id,
      category: s.category,
      name: s.name,
      product: s.product,
      supplier: s.supplier,
      duration_minutes: s.duration_minutes,
      price: s.price,
    }));

    const servicesResponse = await supabaseRequest(
      'POST',
      'services',
      servicesToInsert
    );

    if (!Array.isArray(servicesResponse)) {
      throw new Error(`Expected array response for services, got: ${typeof servicesResponse}`);
    }

    console.log(`[IMPORT] ✓ Created ${servicesResponse.length} services`);

    // Step 4: Create certifications
    console.log('[IMPORT] Step 4: Creating certifications...');
    const certifications: unknown[] = [];

    for (let i = 0; i < SERVICES.length; i++) {
      const service = SERVICES[i];
      const serviceId = servicesResponse[i]?.id;

      if (!serviceId) {
        console.warn(`[IMPORT] Service ${i} missing ID`);
        continue;
      }

      for (const practName of service.practitioners) {
        const practId = practMap[practName];
        if (practId) {
          certifications.push({
            practitioner_id: practId,
            service_id: serviceId,
            certified: true,
          });
        } else {
          console.warn(`[IMPORT] Practitioner not found: ${practName}`);
        }
      }
    }

    console.log(`[IMPORT] Certification array prepared: ${certifications.length} total`);

    if (certifications.length > 0) {
      await supabaseRequest('POST', 'practitioner_certifications', certifications);
      console.log(`[IMPORT] ✓ Created ${certifications.length} certifications`);
    }

    console.log('[IMPORT] ✅ Import complete!');

    return NextResponse.json({
      success: true,
      counts: {
        organizations: 1,
        practitioners: practitionersResponse.length,
        services: servicesResponse.length,
        certifications: certifications.length,
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[IMPORT] ❌ Fatal error:', errorMsg);
    return NextResponse.json(
      { 
        error: errorMsg,
        success: false,
      },
      { status: 500 }
    );
  }
}
