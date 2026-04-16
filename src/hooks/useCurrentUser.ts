'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/lib/auth/permissions';

interface CurrentUser {
  userId: string | null;
  orgId: string | null;
  role: UserRole | null;
  email: string | null;
  loading: boolean;
}

const DEFAULT_USER_ID = 'a0000000-0000-0000-0000-000000000001'; // Brianna (owner)
const DEFAULT_ORG_ID = '74b04f56-8cf0-7427-b977-7574b183226d';

export function useCurrentUser(): CurrentUser {
  const [state, setState] = useState<CurrentUser>({
    userId: null,
    orgId: null,
    role: null,
    email: null,
    loading: true,
  });

  useEffect(() => {
    const userId = localStorage.getItem('user_id') || DEFAULT_USER_ID;
    const orgId = localStorage.getItem('org_id') || DEFAULT_ORG_ID;

    // Ensure localStorage has the values for other code that reads them
    if (!localStorage.getItem('user_id')) localStorage.setItem('user_id', userId);
    if (!localStorage.getItem('org_id')) localStorage.setItem('org_id', orgId);

    const supabase = createClient();
    supabase
      .from('user_orgs')
      .select('role, users!inner(email)')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          console.warn('[useCurrentUser] No user_orgs row found:', error?.message);
          setState({ userId, orgId, role: null, email: null, loading: false });
          return;
        }
        const userRow = data.users as unknown as { email: string };
        setState({
          userId,
          orgId,
          role: data.role as UserRole,
          email: userRow?.email || null,
          loading: false,
        });
      });
  }, []);

  return state;
}

export function switchUser(userId: string) {
  localStorage.setItem('user_id', userId);
  window.location.reload();
}
