import { createServerClient } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/auth/permissions';

const ROLE_LEVEL: Record<UserRole, number> = { owner: 3, admin: 2, staff: 1 };

/**
 * Get email addresses of all org members with role >= minRole.
 * Falls back to env var if DB returns empty.
 */
export async function getRecipientsByRole(orgId: string, minRole: UserRole): Promise<string[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('user_orgs')
    .select('role, users!inner(email)')
    .eq('org_id', orgId);

  if (error || !data || data.length === 0) {
    console.warn('[recipients] No user_orgs found, falling back to env vars');
    const fallback = process.env.NOTIFY_OWNER_EMAIL;
    return fallback && fallback !== 'YOUR_OWNER_EMAIL_HERE' ? [fallback] : [];
  }

  const minLevel = ROLE_LEVEL[minRole];
  return data
    .filter((row: Record<string, unknown>) => ROLE_LEVEL[row.role as UserRole] >= minLevel)
    .map((row: Record<string, unknown>) => {
      const user = row.users as { email: string };
      return user.email;
    })
    .filter(Boolean);
}

/**
 * Get a single user's email by user ID.
 */
export async function getUserEmail(userId: string): Promise<string | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single();

  return data?.email || null;
}
