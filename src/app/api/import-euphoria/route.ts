import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for admin operations (bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Fallback to anon key if service role not available
const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? supabaseAdmin
  : createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

// Practitioner mapping from Excel
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

export async function POST(request: NextRequest) {
  try {
    const { org_id } = await request.json();

    if (!org_id) {
      return NextResponse.json({ error: 'org_id required' }, { status: 400 });
    }

    console.log(`[IMPORT] Starting Euphoria data import for org: ${org_id}`);

    // Step 1: Ensure organization exists
    console.log(`[IMPORT] Checking organization...`);
    let orgExists = false;
    try {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', org_id)
        .single();

      if (!orgError) {
        orgExists = true;
        console.log(`[IMPORT] Organization exists`);
      }
    } catch (e) {
      console.log(`[IMPORT] Org check error (may be normal):`, e);
    }

    if (!orgExists) {
      console.log(`[IMPORT] Creating organization...`);
      const { error: createError } = await supabase
        .from('organizations')
        .insert([
          {
            id: org_id,
            name: 'Euphoria Esthetics & Wellness',
            slug: 'euphoria-test',
            plan_tier: 'starter',
          },
        ]);

      if (createError) {
        console.error(`[IMPORT] Org creation error:`, createError);
        // Don't throw, continue anyway
      } else {
        console.log(`[IMPORT] Organization created`);
      }
    }

    // Step 2: Create practitioners
    console.log(`[IMPORT] Creating practitioners...`);
    const practitionersMap: { [key: string]: string } = {};
    let practCreatedCount = 0;

    for (const [name, { role, approval_level }] of Object.entries(PRACTITIONERS)) {
      const nameParts = name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      try {
        const { data: practData, error: practError } = await supabase
          .from('practitioners')
          .insert([
            {
              org_id,
              first_name: firstName,
              last_name: lastName,
              role,
              approval_level,
              is_active: true,
            },
          ])
          .select();

        if (practError) {
          console.warn(`[IMPORT] Practitioner ${name} error:`, practError.message);
        } else if (practData && practData.length > 0) {
          practitionersMap[name] = practData[0].id;
          practCreatedCount++;
          console.log(`[IMPORT] Created practitioner: ${name}`);
        }
      } catch (e) {
        console.error(`[IMPORT] Unexpected error for ${name}:`, e);
      }
    }

    // Step 3: Create services and certifications
    console.log(`[IMPORT] Creating services and certifications...`);
    let servicesCount = 0;
    let certificationsCount = 0;

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

    for (const service of serviceData) {
      try {
        const { data: serviceInsertData, error: serviceError } = await supabase
          .from('services')
          .insert([
            {
              org_id,
              category: service.category,
              name: service.name,
              product: service.product,
              supplier: service.supplier,
              duration_minutes: service.duration_minutes,
              price: service.price,
            },
          ])
          .select();

        if (serviceError) {
          console.warn(`[IMPORT] Service ${service.name} error:`, serviceError.message);
          continue;
        }

        if (serviceInsertData && serviceInsertData.length > 0) {
          const serviceId = serviceInsertData[0].id;
          servicesCount++;
          console.log(`[IMPORT] Created service: ${service.name}`);

          // Create certifications
          for (const practName of service.practitioners) {
            const practId = practitionersMap[practName];
            if (practId) {
              try {
                const { error: certError } = await supabase
                  .from('practitioner_certifications')
                  .insert([
                    {
                      practitioner_id: practId,
                      service_id: serviceId,
                      certified: true,
                    },
                  ]);

                if (!certError) {
                  certificationsCount++;
                } else {
                  console.warn(`[IMPORT] Cert error for ${practName}/${service.name}:`, certError.message);
                }
              } catch (e) {
                console.error(`[IMPORT] Unexpected cert error:`, e);
              }
            }
          }
        }
      } catch (e) {
        console.error(`[IMPORT] Unexpected service error:`, e);
      }
    }

    console.log(`[IMPORT] Import complete - Services: ${servicesCount}, Certs: ${certificationsCount}, Practs: ${practCreatedCount}`);

    return NextResponse.json({
      success: true,
      message: `Imported ${servicesCount} services with ${certificationsCount} certifications`,
      counts: {
        services: servicesCount,
        certifications: certificationsCount,
        practitioners: practCreatedCount,
      },
    });
  } catch (error) {
    console.error('[IMPORT] Unexpected error:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: `Import failed: ${errorMsg}`,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
