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
    const { data, error } = await supabase
      .from('user_orgs')
      .select(`
        id,
        role,
        practitioner_id,
        created_at,
        users!inner(id, email),
        practitioners(first_name, last_name)
      `)
      .eq('org_id', orgId)
      .order('created_at');

    if (error) {
      console.error('[GET /api/users] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const members = (data || []).map((row: Record<string, unknown>) => {
      const user = row.users as { id: string; email: string };
      const practitioner = row.practitioners as { first_name: string; last_name: string } | null;
      return {
        id: row.id,
        user_id: user.id,
        email: user.email,
        role: row.role,
        practitioner_name: practitioner ? `${practitioner.first_name} ${practitioner.last_name}` : null,
        created_at: row.created_at,
      };
    });

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
