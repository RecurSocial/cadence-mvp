'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/lib/auth/permissions';

interface CurrentUser {
  userId: string | null;
  orgId: string | null;
  role: UserRole | null;
  email: string | null;
  displayName: string | null;
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
    displayName: null,
    loading: true,
  });

  useEffect(() => {
    const userId = localStorage.getItem('user_id') || DEFAULT_USER_ID;
    const orgId = localStorage.getItem('org_id') || DEFAULT_ORG_ID;

    // Ensure localStorage has the values for other code that reads them
    if (!localStorage.getItem('user_id')) localStorage.setItem('user_id', userId);
    if (!localStorage.getItem('org_id')) localStorage.setItem('org_id', orgId);

    const supabase = createClient();

    // Two separate queries to avoid ambiguous FK join issues
    // (user_orgs has both user_id and created_by referencing users)
    Promise.all([
      supabase
        .from('user_orgs')
        .select('role, practitioner_id')
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .single(),
      supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single(),
    ]).then(async ([orgResult, userResult]) => {
      if (orgResult.error || !orgResult.data) {
        console.warn('[useCurrentUser] No user_orgs row found:', orgResult.error?.message);
        setState({ userId, orgId, role: null, email: userResult.data?.email || null, displayName: null, loading: false });
        return;
      }

      const role = orgResult.data.role as UserRole;
      const email = userResult.data?.email || null;
      let displayName: string | null = null;

      // Try to get display name from linked practitioner
      if (orgResult.data.practitioner_id) {
        const { data: pract } = await supabase
          .from('practitioners')
          .select('first_name, last_name')
          .eq('id', orgResult.data.practitioner_id)
          .single();
        if (pract) {
          displayName = `${pract.first_name} ${pract.last_name}`;
        }
      }

      // Fall back to email username as display name
      if (!displayName && email) {
        const localPart = email.split('@')[0];
        // Capitalize first letter
        displayName = localPart.charAt(0).toUpperCase() + localPart.slice(1);
      }

      setState({ userId, orgId, role, email, displayName, loading: false });
    });
  }, []);

  return state;
}

export function switchUser(userId: string) {
  localStorage.setItem('user_id', userId);
  window.location.reload();
}
