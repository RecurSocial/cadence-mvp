import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Practitioners data
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

// Services data
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

async function supabaseRequest(
  method: string,
  table: string,
  body?: unknown
) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;

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

  if (!response.ok) {
    console.error(`[API] ${method} ${table} failed:`, response.status, data);
    throw new Error(`Supabase error (${response.status}): ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  }

  return data;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Import request received');
    const { org_id } = await request.json();

    if (!org_id) {
      return NextResponse.json({ error: 'org_id required' }, { status: 400 });
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('[API] Missing Supabase configuration');
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }

    console.log(`[API] Starting import for org: ${org_id}`);

    // Step 1: Create organization
    try {
      await supabaseRequest('POST', 'organizations', {
        id: org_id,
        name: 'Euphoria Esthetics & Wellness',
        slug: 'euphoria-test',
        plan_tier: 'starter',
      });
      console.log('[API] Organization created');
    } catch (e) {
      console.log('[API] Organization create error (might exist already)');
    }

    // Step 2: Create practitioners
    console.log('[API] Creating practitioners...');
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
      throw new Error('Practitioners response is not an array');
    }

    console.log(`[API] Created ${practitionersResponse.length} practitioners`);

    // Create map of name -> id
    const practMap: { [key: string]: string } = {};
    for (const pract of practitionersResponse) {
      const fullName = `${pract.first_name} ${pract.last_name}`.trim();
      practMap[fullName] = pract.id;
    }

    // Step 3: Create services
    console.log('[API] Creating services...');
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
      throw new Error('Services response is not an array');
    }

    console.log(`[API] Created ${servicesResponse.length} services`);

    // Step 4: Create certifications
    console.log('[API] Creating certifications...');
    const certifications = [];

    for (let i = 0; i < SERVICES.length; i++) {
      const service = SERVICES[i];
      const serviceId = servicesResponse[i]?.id;

      if (!serviceId) continue;

      for (const practName of service.practitioners) {
        const practId = practMap[practName];
        if (practId) {
          certifications.push({
            practitioner_id: practId,
            service_id: serviceId,
            certified: true,
          });
        }
      }
    }

    if (certifications.length > 0) {
      await supabaseRequest('POST', 'practitioner_certifications', certifications);
      console.log(`[API] Created ${certifications.length} certifications`);
    }

    console.log('[API] Import successful!');

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
    console.error('[API] Fatal error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Import failed: ${errorMsg}` },
      { status: 500 }
    );
  }
}
