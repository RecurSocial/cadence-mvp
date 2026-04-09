import { createClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

// GET /api/certifications - Get certifications for practitioner
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const practitionerId = searchParams.get("practitioner_id");

    if (!practitionerId) {
      return NextResponse.json(
        { error: "practitioner_id is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("practitioner_certifications")
      .select("*")
      .eq("practitioner_id", practitionerId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/certifications - Add or update certification
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { practitioner_id, service_id, certified } = body;

    if (!practitioner_id || !service_id) {
      return NextResponse.json(
        { error: "Missing required fields: practitioner_id, service_id" },
        { status: 400 }
      );
    }

    // Check if certification already exists
    const { data: existing } = await supabase
      .from("practitioner_certifications")
      .select("*")
      .eq("practitioner_id", practitioner_id)
      .eq("service_id", service_id)
      .single();

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from("practitioner_certifications")
        .update({
          certified,
          certified_date: certified ? new Date().toISOString() : null,
        })
        .eq("id", existing.id)
        .select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data[0]);
    } else {
      // Create new
      const { data, error } = await supabase
        .from("practitioner_certifications")
        .insert([
          {
            practitioner_id,
            service_id,
            certified,
            certified_date: certified ? new Date().toISOString() : null,
          },
        ])
        .select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data[0], { status: 201 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/certifications - Bulk update certifications
export async function PUT(request: Request) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { practitioner_id, certifications } = body;

    if (!practitioner_id || !Array.isArray(certifications)) {
      return NextResponse.json(
        { error: "Missing required fields: practitioner_id, certifications array" },
        { status: 400 }
      );
    }

    // Update all certifications for this practitioner
    const updates = certifications.map((cert: any) => ({
      practitioner_id,
      service_id: cert.service_id,
      certified: cert.certified,
      certified_date: cert.certified ? new Date().toISOString() : null,
    }));

    // First, delete all existing certifications
    await supabase
      .from("practitioner_certifications")
      .delete()
      .eq("practitioner_id", practitioner_id);

    // Then insert new ones
    const { data, error } = await supabase
      .from("practitioner_certifications")
      .insert(updates)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
