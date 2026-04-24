'use client';

import { useCurrentUser, switchUser } from '@/hooks/useCurrentUser';
import RoleBadge from './RoleBadge';
import { useState } from 'react';

const SEED_USERS = [
  { id: 'a0000000-0000-0000-0000-000000000001', label: 'Brianna (Owner)' },
  { id: 'a0000000-0000-0000-0000-000000000002', label: 'Michelle (Owner)' },
  { id: 'a0000000-0000-0000-0000-000000000003', label: 'Christine (Admin)' },
  { id: 'a0000000-0000-0000-0000-000000000004', label: 'Ashley (Staff)' },
];

export default function HeaderBar() {
  const { userId, displayName, email, role, loading } = useCurrentUser();
  const [showSwitcher, setShowSwitcher] = useState(false);

  if (loading) {
    return (
      <header className="h-12 bg-white border-b border-[#E2E8F0] flex items-center justify-end px-6">
        <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
      </header>
    );
  }

  return (
    <header className="h-12 bg-white border-b border-[#E2E8F0] flex items-center justify-end px-6 gap-3 relative">
      <span className="text-sm text-[#64748B]">{displayName || email || 'Unknown user'}</span>
      <RoleBadge role={role} />

{/* Dev user switcher (only renders when env var is set on localhost) */}
{process.env.NEXT_PUBLIC_SHOW_DEV_SWITCHER === 'true' && (
          <div className="relative">
            <button
              onClick={() => setShowSwitcher(!showSwitcher)}
              className="text-xs text-[#94A3B8] hover:text-[#64748B] border border-dashed border-[#CBD5E1] rounded px-2 py-0.5 transition"
              title="Switch user (dev only)"
            >
              Switch
            </button>
            {showSwitcher && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-[#E2E8F0] rounded-lg shadow-lg py-1 z-50 min-w-[200px]">
                {SEED_USERS.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => switchUser(u.id)}
                    className={`block w-full text-left px-3 py-2 text-sm hover:bg-[#F8F9FB] transition ${
                      u.id === userId ? 'text-[#4F46E5] font-medium' : 'text-[#0F172A]'
                    }`}
                  >
                    {u.label}
                    {u.id === userId && ' ✓'}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
    </header>
  );
  }