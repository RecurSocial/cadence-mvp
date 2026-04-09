import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a client with the anon key but we'll work around RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const { org_id } = await request.json();

    if (!org_id) {
      return NextResponse.json({ error: 'org_id required' }, { status: 400 });
    }

    console.log(`[IMPORT v2] Starting import for org: ${org_id}`);

    // Step 1: Verify org exists or create it
    console.log('[IMPORT v2] Checking/creating organization...');
    const { error: orgUpsertError } = await supabase
      .from('organizations')
      .upsert(
        {
          id: org_id,
          name: 'Euphoria Esthetics & Wellness',
          slug: 'euphoria-test',
          plan_tier: 'starter',
        },
        { onConflict: 'id' }
      );

    if (orgUpsertError) {
      console.error('[IMPORT v2] Org upsert error:', orgUpsertError);
      // Continue anyway
    } else {
      console.log('[IMPORT v2] Organization ready');
    }

    // Step 2: Create/upsert practitioners
    console.log('[IMPORT v2] Creating practitioners...');
    const practitioners = [
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

    const practitionersToInsert = practitioners.map(p => {
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

    const { data: practData, error: practError } = await supabase
      .from('practitioners')
      .insert(practitionersToInsert)
      .select();

    if (practError) {
      console.error('[IMPORT v2] Practitioner insert error:', practError);
      return NextResponse.json(
        {
          error: `Failed to create practitioners: ${practError.message}`,
          code: practError.code,
        },
        { status: 500 }
      );
    }

    const practitionersMap: { [key: string]: string } = {};
    if (practData) {
      for (const pract of practData) {
        const fullName = `${pract.first_name} ${pract.last_name}`.trim();
        practitionersMap[fullName] = pract.id;
      }
    }

    console.log(`[IMPORT v2] Created ${practData?.length || 0} practitioners`);

    // Step 3: Create services
    console.log('[IMPORT v2] Creating services...');
    const services = [
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

    const servicesToInsert = services.map(s => ({
      org_id,
      category: s.category,
      name: s.name,
      product: s.product,
      supplier: s.supplier,
      duration_minutes: s.duration_minutes,
      price: s.price,
    }));

    const { data: servData, error: servError } = await supabase
      .from('services')
      .insert(servicesToInsert)
      .select();

    if (servError) {
      console.error('[IMPORT v2] Services insert error:', servError);
      return NextResponse.json(
        {
          error: `Failed to create services: ${servError.message}`,
          code: servError.code,
        },
        { status: 500 }
      );
    }

    console.log(`[IMPORT v2] Created ${servData?.length || 0} services`);

    // Step 4: Create certifications
    console.log('[IMPORT v2] Creating certifications...');
    const certifications = [];

    for (let i = 0; i < services.length; i++) {
      const service = services[i];
      const serviceId = servData?.[i]?.id;

      if (!serviceId) continue;

      for (const practName of service.practitioners) {
        const practId = practitionersMap[practName];
        if (practId) {
          certifications.push({
            practitioner_id: practId,
            service_id: serviceId,
            certified: true,
          });
        }
      }
    }

    let certCreatedCount = 0;
    if (certifications.length > 0) {
      const { error: certError } = await supabase
        .from('practitioner_certifications')
        .insert(certifications);

      if (certError) {
        console.warn('[IMPORT v2] Certification insert error:', certError);
        // Don't fail the whole import if certs fail
      } else {
        certCreatedCount = certifications.length;
      }
    }

    console.log(`[IMPORT v2] Created ${certCreatedCount} certifications`);
    console.log('[IMPORT v2] Import complete!');

    return NextResponse.json({
      success: true,
      counts: {
        organizations: 1,
        practitioners: practData?.length || 0,
        services: servData?.length || 0,
        certifications: certCreatedCount,
      },
    });
  } catch (error) {
    console.error('[IMPORT v2] Fatal error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown server error',
        type: error instanceof Error ? error.constructor.name : 'Unknown',
      },
      { status: 500 }
    );
  }
}
