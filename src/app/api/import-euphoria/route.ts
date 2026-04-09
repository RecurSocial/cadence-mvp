import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
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

    console.log(`Starting Euphoria data import for org: ${org_id}`);

    // Step 1: Ensure organization exists
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', org_id)
      .single();

    if (orgError) {
      console.log(`Creating organization: ${org_id}`);
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

      if (createError) throw createError;
    }

    // Step 2: Create practitioners
    const practitionersMap: { [key: string]: string } = {};

    for (const [name, { role, approval_level }] of Object.entries(PRACTITIONERS)) {
      const nameParts = name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

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

      if (practError && !practError.message.includes('duplicate')) {
        console.error(`Error creating practitioner ${name}:`, practError);
      } else if (practData && practData.length > 0) {
        practitionersMap[name] = practData[0].id;
        console.log(`Created practitioner: ${name} (${role})`);
      }
    }

    // Step 3: Read Excel and import services
    let servicesCount = 0;
    let certificationsCount = 0;

    // For now, we'll use static data instead of reading the file
    // (since file system access is limited in Next.js)
    // In production, you'd upload the file and process it
    
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

    // Create services and link practitioners
    for (const service of serviceData) {
      const { data: serviceData, error: serviceError } = await supabase
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
        console.error(`Error creating service ${service.name}:`, serviceError);
        continue;
      }

      if (serviceData && serviceData.length > 0) {
        const serviceId = serviceData[0].id;
        servicesCount++;

        // Create certifications
        for (const practName of service.practitioners) {
          const practId = practitionersMap[practName];
          if (practId) {
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
            }
          }
        }
      }
    }

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
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
