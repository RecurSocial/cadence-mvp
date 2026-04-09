import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Practitioner mapping
const PRACTITIONERS = {
  'Brianna Krug': { role: 'Nurse', approval_level: 'owner' },
  'Jaimie Burkett': { role: 'Nurse', approval_level: 'staff' },
  'Kim Benitez': { role: 'Nurse', approval_level: 'staff' },
  'Lexy Fazzone': { role: 'Nurse', approval_level: 'staff' },
  'Michelle Wilson': { role: 'Nurse', approval_level: 'owner' },
  'Nadine Delia': { role: 'Nurse', approval_level: 'staff' },
  'Daisy': { role: 'PA', approval_level: 'staff' },
  'Jordan Land': { role: 'PA', approval_level: 'staff' },
  'Nicole Roberto': { role: 'Aesthetician', approval_level: 'staff' },
  'Nicole Rekus': { role: 'Aesthetician', approval_level: 'staff' },
  'Tori Grant': { role: 'Aesthetician', approval_level: 'staff' },
  'Aubrey Rieger': { role: 'Masseuse', approval_level: 'staff' },
};

const serviceData = [
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

async function supabaseRequest(method: string, table: string, query: string = '', body?: any) {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error(`[SUPABASE] ${method} ${table}${query} failed:`, response.status, errorData);
    throw new Error(`Supabase request failed: ${response.statusText} - ${errorData}`);
  }

  const data = await response.json();
  return data;
}

export async function POST(request: NextRequest) {
  try {
    const { org_id } = await request.json();

    if (!org_id) {
      return NextResponse.json({ error: 'org_id required' }, { status: 400 });
    }

    console.log(`[IMPORT] Starting Euphoria data import for org: ${org_id}`);

    // Step 1: Create organization
    try {
      console.log(`[IMPORT] Creating organization...`);
      await supabaseRequest('POST', 'organizations', '', {
        id: org_id,
        name: 'Euphoria Esthetics & Wellness',
        slug: 'euphoria-test',
        plan_tier: 'starter',
      });
      console.log(`[IMPORT] ✓ Organization created`);
    } catch (orgError) {
      console.log(`[IMPORT] Organization may already exist, continuing...`, orgError);
    }

    // Step 2: Create practitioners
    console.log(`[IMPORT] Creating practitioners...`);
    const practitionersMap: { [key: string]: string } = {};

    for (const [name, { role, approval_level }] of Object.entries(PRACTITIONERS)) {
      const nameParts = name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      try {
        const response = await supabaseRequest('POST', 'practitioners', '', {
          org_id,
          first_name: firstName,
          last_name: lastName,
          role,
          approval_level,
          is_active: true,
        });

        if (Array.isArray(response) && response.length > 0) {
          practitionersMap[name] = response[0].id;
          console.log(`[IMPORT] ✓ Created practitioner: ${name}`);
        }
      } catch (practError) {
        console.log(`[IMPORT] Practitioner ${name} may exist:`, practError);
      }
    }

    console.log(`[IMPORT] Found/created ${Object.keys(practitionersMap).length} practitioners`);

    // Step 3: Create services and link practitioners
    console.log(`[IMPORT] Creating services...`);
    let servicesCount = 0;
    let certificationsCount = 0;

    for (const service of serviceData) {
      try {
        const response = await supabaseRequest('POST', 'services', '', {
          org_id,
          category: service.category,
          name: service.name,
          product: service.product,
          supplier: service.supplier,
          duration_minutes: service.duration_minutes,
          price: service.price,
        });

        if (Array.isArray(response) && response.length > 0) {
          const serviceId = response[0].id;
          servicesCount++;
          console.log(`[IMPORT] ✓ Created service: ${service.name}`);

          // Create certifications
          for (const practName of service.practitioners) {
            const practId = practitionersMap[practName];
            if (practId) {
              try {
                await supabaseRequest('POST', 'practitioner_certifications', '', {
                  practitioner_id: practId,
                  service_id: serviceId,
                  certified: true,
                });
                certificationsCount++;
              } catch (certError) {
                console.log(`[IMPORT] Cert for ${practName}:`, certError);
              }
            }
          }
        }
      } catch (serviceError) {
        console.error(`[IMPORT] Error creating service ${service.name}:`, serviceError);
      }
    }

    console.log(`[IMPORT] ✓ Complete: ${servicesCount} services, ${certificationsCount} certifications`);

    return NextResponse.json({
      success: true,
      message: `Imported ${servicesCount} services with ${certificationsCount} certifications`,
      counts: {
        services: servicesCount,
        certifications: certificationsCount,
        practitioners: Object.keys(practitionersMap).length,
      },
    });
  } catch (error) {
    console.error('[IMPORT] Fatal error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
