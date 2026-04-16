import { createServerClient } from '@/lib/supabase/server';
import { getRequestContext, forbidden } from '@/lib/auth/server';
import { canManageUsers } from '@/lib/auth/permissions';
import { NextResponse } from 'next/server';

// DELETE /api/users/[id] — remove a user from the org
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getRequestContext(request);
    if (ctx && !canManageUsers(ctx.role)) {
      return forbidden('Only owners and admins can remove users');
    }

    const { id } = await params;
    const supabase = createServerClient();

    // Get the membership being removed
    const { data: membership, error: fetchError } = await supabase
      .from('user_orgs')
      .select('id, user_id, org_id, role')
      .eq('id', id)
      .single();

    if (fetchError || !membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
    }

    // Admin cannot remove owners or other admins
    if (ctx && ctx.role === 'admin' && (membership.role === 'owner' || membership.role === 'admin')) {
      return forbidden('Admins cannot remove owners or other admins');
    }

    // Cannot remove the last owner
    if (membership.role === 'owner') {
      const { count } = await supabase
        .from('user_orgs')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', membership.org_id)
        .eq('role', 'owner');

      if ((count || 0) <= 1) {
        return NextResponse.json({ error: 'Cannot remove the last owner' }, { status: 400 });
      }
    }

    // Cannot remove yourself
    if (ctx && membership.user_id === ctx.userId) {
      return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_orgs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[DELETE /api/users/[id]] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/users/[id]] Exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
