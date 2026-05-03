'use client';

import { usePathname } from 'next/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { canManageUsers } from '@/lib/auth/permissions';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Office Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1' },
  { href: '/calendar', label: 'Content Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { href: '/approvals', label: 'Approvals', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
];

const TEAM_ITEM = {
  href: '/dashboard/users',
  label: 'Team',
  icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
};

export default function Sidebar() {
  const pathname = usePathname();
  const { role } = useCurrentUser();

  const items = [...NAV_ITEMS];
  if (canManageUsers(role)) {
    items.push(TEAM_ITEM);
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-cream-bg border-r border-sand-border flex flex-col z-40">
      {/* Wordmark */}
      <div className="px-6 py-6 border-b border-sand-border">
        <p className="font-display text-2xl text-ink-primary leading-none">Cadence</p>
        <p className="mt-1.5 text-[10px] uppercase tracking-[0.18em] text-ink-muted">
          by RecurSocial
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-bone-surface text-ink-primary'
                  : 'text-ink-muted hover:bg-bone-surface hover:text-ink-primary'
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-sand-border">
        <p className="text-xs text-ink-muted">Euphoria Esthetics &amp; Wellness</p>
      </div>
    </aside>
  );
}
