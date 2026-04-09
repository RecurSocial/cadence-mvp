import { createClient } from "@/lib/supabase/client";
import { Service } from "@/types";
import { NextResponse } from "next/server";

// GET /api/services - List all services for org
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
      .from("services")
      .select("*")
      .eq("org_id", orgId)
      .order("category, name");

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

// POST /api/services - Create new service
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { org_id, category, name, product, supplier, vendor_id, duration_minutes, price } = body;

    if (!org_id || !name || !category) {
      return NextResponse.json(
        { error: "Missing required fields: org_id, name, category" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("services")
      .insert([
        {
          org_id,
          category,
          name,
          product,
          supplier,
          vendor_id,
          duration_minutes,
          price,
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

// PUT /api/services - Update service
export async function PUT(request: Request) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { id, category, name, product, supplier, vendor_id, duration_minutes, price } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("services")
      .update({
        category,
        name,
        product,
        supplier,
        vendor_id,
        duration_minutes,
        price,
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

// DELETE /api/services - Delete service
export async function DELETE(request: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("services")
      .delete()
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
