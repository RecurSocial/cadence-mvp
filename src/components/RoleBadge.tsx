import type { UserRole } from '@/lib/auth/permissions';

const ROLE_CONFIG: Record<UserRole, { label: string; bg: string; text: string }> = {
  owner:   { label: 'Owner',   bg: 'bg-brand-gold/20',  text: 'text-gold-dark' },
  admin:   { label: 'Admin',   bg: 'bg-sand-border/40', text: 'text-ink-primary' },
  manager: { label: 'Manager', bg: 'bg-sand-border/40', text: 'text-ink-primary' },
  staff:   { label: 'Staff',   bg: 'bg-success/15',     text: 'text-success' },
  viewer:  { label: 'Viewer',  bg: 'bg-bone-surface',   text: 'text-ink-muted' },
};

export default function RoleBadge({ role }: { role: UserRole | null }) {
  if (!role) return null;
  const config = ROLE_CONFIG[role];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
