import { createServerClient } from '@/lib/supabase/server';
import { getRequestContext, forbidden } from '@/lib/auth/server';
import { canChangeRoles, canInviteRole } from '@/lib/auth/permissions';
import { NextResponse } from 'next/server';
import type { UserRole } from '@/lib/auth/permissions';

// PATCH /api/users/[id]/role — change a member's role
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getRequestContext(request);
    if (ctx && !canChangeRoles(ctx.role)) {
      return forbidden('Only owners can change roles');
    }

    const { id } = await params;
    const { role } = await request.json();

    if (!role || !['owner', 'admin', 'staff'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (ctx && !canInviteRole(ctx.role, role as UserRole)) {
      return forbidden('Only owners can promote to owner');
    }

    const supabase = createServerClient();

    // Get current membership
    const { data: membership, error: fetchError } = await supabase
      .from('user_orgs')
      .select('id, user_id, org_id, role')
      .eq('id', id)
      .single();

    if (fetchError || !membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
    }

    // Prevent demoting the last owner
    if (membership.role === 'owner' && role !== 'owner') {
      const { count } = await supabase
        .from('user_orgs')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', membership.org_id)
        .eq('role', 'owner');

      if ((count || 0) <= 1) {
        return NextResponse.json({ error: 'Cannot demote the last owner' }, { status: 400 });
      }
    }

    const { data, error } = await supabase
      .from('user_orgs')
      .update({ role })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[PATCH /api/users/[id]/role] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Keep users.role in sync
    await supabase.from('users').update({ role }).eq('id', membership.user_id);

    return NextResponse.json(data);
  } catch (err) {
    console.error('[PATCH /api/users/[id]/role] Exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
