import { createServerClient } from '@/lib/supabase/server';
import { getRequestContext, forbidden } from '@/lib/auth/server';
import { canManageUsers, canInviteRole } from '@/lib/auth/permissions';
import { NextResponse } from 'next/server';
import type { UserRole } from '@/lib/auth/permissions';

// GET /api/users?org_id=... — list org members
export async function GET(request: Request) {
  try {
    const ctx = await getRequestContext(request);
    if (ctx && !canManageUsers(ctx.role)) {
      return forbidden('Only owners and admins can view team members');
    }

    const { searchParams } = new URL(request.url);
    const orgId = ctx?.orgId || searchParams.get('org_id');

    if (!orgId) {
      return NextResponse.json({ error: 'org_id is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Separate queries to avoid ambiguous FK join
    // (user_orgs has both user_id and created_by referencing users)
    const { data: orgRows, error } = await supabase
      .from('user_orgs')
      .select('id, user_id, role, practitioner_id, created_at')
      .eq('org_id', orgId)
      .order('created_at');

    if (error) {
      console.error('[GET /api/users] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!orgRows || orgRows.length === 0) {
      return NextResponse.json([]);
    }

    // Batch-fetch user emails
    const userIds = orgRows.map((r) => r.user_id);
    const { data: users } = await supabase
      .from('users')
      .select('id, email')
      .in('id', userIds);

    const emailMap = new Map((users || []).map((u) => [u.id, u.email]));

    // Batch-fetch linked practitioners
    const practIds = orgRows.map((r) => r.practitioner_id).filter(Boolean) as string[];
    let practMap = new Map<string, string>();
    if (practIds.length > 0) {
      const { data: practitioners } = await supabase
        .from('practitioners')
        .select('id, first_name, last_name')
        .in('id', practIds);

      practMap = new Map(
        (practitioners || []).map((p) => [p.id, `${p.first_name} ${p.last_name}`])
      );
    }

    const members = orgRows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      email: emailMap.get(row.user_id) || null,
      role: row.role,
      practitioner_name: row.practitioner_id ? (practMap.get(row.practitioner_id) || null) : null,
      created_at: row.created_at,
    }));

    return NextResponse.json(members);
  } catch (err) {
    console.error('[GET /api/users] Exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/users — invite a user to the org
export async function POST(request: Request) {
  try {
    const ctx = await getRequestContext(request);
    if (ctx && !canManageUsers(ctx.role)) {
      return forbidden('Only owners and admins can invite users');
    }

    const body = await request.json();
    const { email, role, practitioner_id, org_id: bodyOrgId } = body;
    const orgId = ctx?.orgId || bodyOrgId;

    if (!email || !role || !orgId) {
      return NextResponse.json({ error: 'email, role, and org_id are required' }, { status: 400 });
    }

    if (!['owner', 'admin', 'staff'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (ctx && !canInviteRole(ctx.role, role as UserRole)) {
      return forbidden('Only owners can invite other owners');
    }

    const supabase = createServerClient();

    // Create or find the user
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({ email, org_id: orgId, role })
        .select('id')
        .single();

      if (createError || !newUser) {
        console.error('[POST /api/users] Create user error:', createError);
        return NextResponse.json({ error: createError?.message || 'Failed to create user' }, { status: 500 });
      }
      userId = newUser.id;
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('user_orgs')
      .select('id')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'User is already a member of this organization' }, { status: 409 });
    }

    // Create user_orgs membership
    const { data: membership, error: memberError } = await supabase
      .from('user_orgs')
      .insert({
        user_id: userId,
        org_id: orgId,
        role,
        practitioner_id: practitioner_id || null,
        created_by: ctx?.userId || null,
      })
      .select()
      .single();

    if (memberError) {
      console.error('[POST /api/users] Membership error:', memberError);
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    return NextResponse.json({ ...membership, email }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/users] Exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
