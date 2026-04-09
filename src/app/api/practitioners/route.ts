import { createClient } from "@/lib/supabase/client";
import { Practitioner } from "@/types";
import { NextResponse } from "next/server";

// GET /api/practitioners - List all practitioners for org
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("org_id");

    if (!orgId) {
      return NextResponse.json(
        { error: "org_id is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("practitioners")
      .select("*")
      .eq("org_id", orgId)
      .eq("is_active", true)
      .order("role, last_name, first_name");

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

// GET /api/practitioners/:id - Get practitioner with certifications
export async function GET_DETAIL(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const id = params.id;

    const { data: practitioner, error: practError } = await supabase
      .from("practitioners")
      .select("*")
      .eq("id", id)
      .single();

    if (practError) {
      return NextResponse.json({ error: practError.message }, { status: 500 });
    }

    const { data: certifications, error: certError } = await supabase
      .from("practitioner_certifications")
      .select("*")
      .eq("practitioner_id", id);

    if (certError) {
      return NextResponse.json({ error: certError.message }, { status: 500 });
    }

    return NextResponse.json({
      ...practitioner,
      certifications,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/practitioners - Create new practitioner
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { org_id, first_name, last_name, role, email, phone, approval_level } = body;

    if (!org_id || !first_name || !last_name || !role) {
      return NextResponse.json(
        { error: "Missing required fields: org_id, first_name, last_name, role" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("practitioners")
      .insert([
        {
          org_id,
          first_name,
          last_name,
          role,
          email,
          phone,
          approval_level: approval_level || "staff",
          is_active: true,
        },
      ])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/practitioners - Update practitioner
export async function PUT(request: Request) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { id, first_name, last_name, role, email, phone, approval_level } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Practitioner ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("practitioners")
      .update({
        first_name,
        last_name,
        role,
        email,
        phone,
        approval_level,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0]);
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/practitioners - Soft delete practitioner
export async function DELETE(request: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Practitioner ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("practitioners")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
