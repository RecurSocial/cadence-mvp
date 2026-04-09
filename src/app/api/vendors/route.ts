import { createClient } from "@/lib/supabase/client";
import { Vendor } from "@/types";
import { NextResponse } from "next/server";

// GET /api/vendors - List all vendors for org
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
      .from("vendors")
      .select("*")
      .eq("org_id", orgId)
      .eq("is_active", true)
      .order("name");

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

// POST /api/vendors - Create new vendor
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const {
      org_id,
      name,
      website,
      contact_email,
      contact_phone,
      events_url,
      rss_feed_url,
      coop_budget,
      coop_budget_year,
      notes,
    } = body;

    if (!org_id || !name) {
      return NextResponse.json(
        { error: "Missing required fields: org_id, name" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("vendors")
      .insert([
        {
          org_id,
          name,
          website,
          contact_email,
          contact_phone,
          events_url,
          rss_feed_url,
          coop_budget,
          coop_budget_year: coop_budget_year || new Date().getFullYear(),
          notes,
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

// PUT /api/vendors - Update vendor
export async function PUT(request: Request) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const {
      id,
      name,
      website,
      contact_email,
      contact_phone,
      events_url,
      rss_feed_url,
      coop_budget,
      coop_budget_year,
      coop_budget_spent,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("vendors")
      .update({
        name,
        website,
        contact_email,
        contact_phone,
        events_url,
        rss_feed_url,
        coop_budget,
        coop_budget_year,
        coop_budget_spent,
        notes,
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

// DELETE /api/vendors - Soft delete vendor
export async function DELETE(request: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("vendors")
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
