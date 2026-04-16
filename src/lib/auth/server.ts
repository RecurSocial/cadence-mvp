import { createServerClient } from '@/lib/supabase/server';
import type { UserRole } from './permissions';

export interface RequestContext {
  userId: string;
  orgId: string;
  role: UserRole;
}

export async function getUserRole(userId: string, orgId: string): Promise<UserRole | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('user_orgs')
    .select('role')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .single();

  if (error || !data) return null;
  return data.role as UserRole;
}

export async function getRequestContext(request: Request): Promise<RequestContext | null> {
  const userId = request.headers.get('x-user-id');
  const orgId = request.headers.get('x-org-id');

  if (!userId || !orgId) {
    console.warn('[auth] Missing x-user-id or x-org-id header — allowing request (no RBAC enforced)');
    return null;
  }

  const role = await getUserRole(userId, orgId);
  if (!role) {
    console.warn(`[auth] No user_orgs row for user=${userId} org=${orgId}`);
    return null;
  }

  return { userId, orgId, role };
}

export function forbidden(message = 'Permission denied') {
  return Response.json({ error: message }, { status: 403 });
}
