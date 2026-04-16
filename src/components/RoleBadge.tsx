import type { UserRole } from '@/lib/auth/permissions';

const ROLE_CONFIG: Record<UserRole, { label: string; bg: string; text: string }> = {
  owner: { label: 'Owner', bg: 'bg-purple-100', text: 'text-purple-700' },
  admin: { label: 'Admin', bg: 'bg-teal-100', text: 'text-teal-700' },
  staff: { label: 'Staff', bg: 'bg-amber-100', text: 'text-amber-700' },
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
