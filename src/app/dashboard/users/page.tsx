'use client';

import { useEffect, useState, useCallback } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { canManageUsers, canChangeRoles } from '@/lib/auth/permissions';
import type { UserRole } from '@/lib/auth/permissions';
import RoleBadge from '@/components/RoleBadge';
import InviteUserModal from '@/components/InviteUserModal';

interface OrgMember {
  id: string;
  user_id: string;
  email: string;
  role: UserRole;
  practitioner_name: string | null;
  created_at: string;
}

export default function UsersPage() {
  const { userId, orgId, role: currentRole, loading: authLoading } = useCurrentUser();
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!orgId || !userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users?org_id=${orgId}`, {
        headers: { 'x-user-id': userId, 'x-org-id': orgId },
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  }, [orgId, userId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleRoleChange = async (membershipId: string, newRole: UserRole) => {
    if (!userId || !orgId) return;
    setProcessing(membershipId);
    try {
      const res = await fetch(`/api/users/${membershipId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId, 'x-org-id': orgId },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) await fetchMembers();
      else {
        const data = await res.json();
        alert(data.error || 'Failed to update role');
      }
    } catch {
      alert('Network error');
    } finally {
      setProcessing(null);
    }
  };

  const handleRemove = async (membershipId: string) => {
    if (!userId || !orgId) return;
    setProcessing(membershipId);
    try {
      const res = await fetch(`/api/users/${membershipId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId, 'x-org-id': orgId },
      });
      if (res.ok) {
        await fetchMembers();
        setConfirmRemove(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove user');
      }
    } catch {
      alert('Network error');
    } finally {
      setProcessing(null);
    }
  };

  if (authLoading) {
    return <div className="px-8 py-10 text-ink-muted">Loading...</div>;
  }

  if (!canManageUsers(currentRole)) {
    return (
      <div className="px-8 py-10">
        <div className="bg-bone-surface border border-sand-border rounded-xl p-12 text-center">
          <h2 className="font-display text-2xl text-ink-primary mb-2">Access Denied</h2>
          <p className="text-ink-muted">You don&apos;t have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const isOwner = canChangeRoles(currentRole);
  const roleOptions: UserRole[] = ['staff', 'admin', ...(isOwner ? ['owner' as UserRole] : [])];

  return (
    <div className="px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink-primary">Team</h1>
          <p className="mt-1 text-sm text-ink-muted">Manage team members and roles</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="px-4 py-2 bg-brand-gold hover:bg-gold-dark text-white rounded-lg text-sm font-medium transition"
        >
          Invite User
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-ink-muted">Loading team members...</div>
      ) : (
        <div className="border border-sand-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-bone-surface border-b border-sand-border">
                <th className="text-left px-6 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Practitioner</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member, i) => {
                const isSelf = member.user_id === userId;
                const isProcessingRow = processing === member.id;

                return (
                  <tr key={member.id} className={`${i % 2 === 1 ? 'bg-bone-surface/30' : 'bg-cream-bg'} border-b border-sand-border last:border-0 hover:bg-bone-surface transition`}>
                    <td className="px-6 py-4 text-sm text-ink-primary">
                      {member.email}
                      {isSelf && <span className="ml-2 text-xs text-ink-muted">(you)</span>}
                    </td>
                    <td className="px-6 py-4">
                      {isOwner && !isSelf ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                          disabled={isProcessingRow}
                          className="text-sm bg-cream-bg border border-sand-border rounded-lg px-2 py-1 text-ink-primary focus:ring-2 focus:ring-brand-gold focus:outline-none disabled:opacity-50"
                        >
                          {roleOptions.map((r) => (
                            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                          ))}
                        </select>
                      ) : (
                        <RoleBadge role={member.role} />
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-ink-muted">
                      {member.practitioner_name || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isSelf && (
                        <>
                          {confirmRemove === member.id ? (
                            <div className="flex gap-2 justify-end items-center">
                              <span className="text-xs text-ink-muted">Remove?</span>
                              <button
                                onClick={() => handleRemove(member.id)}
                                disabled={isProcessingRow}
                                className="px-3 py-1 bg-alert hover:bg-critical text-white text-xs rounded-lg font-medium disabled:opacity-50 transition"
                              >
                                {isProcessingRow ? '...' : 'Yes'}
                              </button>
                              <button
                                onClick={() => setConfirmRemove(null)}
                                className="px-3 py-1 border border-sand-border text-ink-primary text-xs rounded-lg hover:bg-cream-bg transition"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmRemove(member.id)}
                              className="text-xs text-alert hover:text-critical font-medium transition"
                            >
                              Remove
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showInvite && orgId && currentRole && (
        <InviteUserModal
          orgId={orgId}
          currentUserRole={currentRole}
          onClose={() => setShowInvite(false)}
          onInvited={fetchMembers}
        />
      )}
    </div>
  );
}
