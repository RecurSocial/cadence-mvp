'use client';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import RoleBadge from './RoleBadge';

export default function HeaderBar() {
  const { displayName, email, role, loading } = useCurrentUser();

  if (loading) {
    return (
      <header className="h-12 bg-bone-surface border-b border-sand-border flex items-center justify-end px-6">
        <div className="h-4 w-32 bg-sand-border/40 rounded animate-pulse" />
      </header>
    );
  }

  return (
    <header className="h-12 bg-bone-surface border-b border-sand-border flex items-center justify-end px-6 gap-3">
      <span className="text-sm text-ink-muted">{displayName || email || 'Unknown user'}</span>
      <RoleBadge role={role} />
    </header>
  );
}
