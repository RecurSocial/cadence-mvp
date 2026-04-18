import { createServerClient } from '@/lib/supabase/server';
import { getRequestContext } from '@/lib/auth/server';
import { canApproveReject } from '@/lib/auth/permissions';
import { NextResponse } from 'next/server';

// GET /api/trend-inbox?org_id=...&status=pending
export async function GET(request: Request) {
  try {
    const ctx = await getRequestContext(request);
    const { searchParams } = new URL(request.url);
    const orgId = ctx?.orgId || searchParams.get('org_id');
    const status = searchParams.get('status') || 'pending';

    if (!orgId) {
      return NextResponse.json({ error: 'org_id required' }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('trend_inbox')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/trend-inbox] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data || [] });
  } catch (err: any) {
    console.error('[GET /api/trend-inbox] Exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/trend-inbox — submit a trend
export async function POST(request: Request) {
  try {
    const ctx = await getRequestContext(request);
    const body = await request.json();
    const { org_id, submitted_by_user_id, submitted_by_name, url, note } = body;

    const orgId = ctx?.orgId || org_id;
    const userId = ctx?.userId || submitted_by_user_id;

    if (!orgId || !userId || !submitted_by_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!url && !note) {
      return NextResponse.json({ error: 'Provide a URL or note' }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('trend_inbox')
      .insert({
        org_id: orgId,
        submitted_by_user_id: userId,
        submitted_by_name,
        url: url || null,
        note: note || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/trend-inbox] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: data }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/trend-inbox] Exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/trend-inbox — approve or pass
export async function PATCH(request: Request) {
  try {
    const ctx = await getRequestContext(request);
    const body = await request.json();
    const { id, status, reviewed_by_user_id, reviewed_by_name } = body;

    // Only owners and admins can review trends
    if (ctx && !canApproveReject(ctx.role)) {
      return NextResponse.json({ error: 'Only owners and admins can review trends' }, { status: 403 });
    }

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!['approved', 'passed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('trend_inbox')
      .update({
        status,
        reviewed_by_user_id: ctx?.userId || reviewed_by_user_id,
        reviewed_by_name,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[PATCH /api/trend-inbox] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: data });
  } catch (err: any) {
    console.error('[PATCH /api/trend-inbox] Exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}