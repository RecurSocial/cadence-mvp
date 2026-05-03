'use client';

import { useState, useEffect } from 'react';
import type { UserRole } from '@/lib/auth/permissions';
import { canInviteRole } from '@/lib/auth/permissions';

interface InviteUserModalProps {
  orgId: string;
  currentUserRole: UserRole;
  onClose: () => void;
  onInvited: () => void;
}

const inputClass = 'w-full px-3.5 py-2.5 bg-cream-bg border border-sand-border rounded-lg text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition';
const labelClass = 'block text-sm font-medium text-ink-primary mb-1';

interface Practitioner {
  id: string;
  first_name: string;
  last_name: string;
}

export default function InviteUserModal({ orgId, currentUserRole, onClose, onInvited }: InviteUserModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [practitionerId, setPractitionerId] = useState('');
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/practitioners?org_id=${orgId}`)
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setPractitioners(data); })
      .catch(() => {});
  }, [orgId]);

  const roleOptions: UserRole[] = ['staff', 'admin'];
  if (currentUserRole === 'owner') roleOptions.push('owner');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('Email is required'); return; }
    if (!canInviteRole(currentUserRole, role)) { setError('You cannot invite users with that role'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('user_id') || '',
          'x-org-id': orgId,
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          role,
          practitioner_id: practitionerId || null,
          org_id: orgId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to invite user');
        return;
      }

      onInvited();
      onClose();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-primary/40 backdrop-blur-sm">
      <div className="bg-bone-surface border border-sand-border rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-sand-border">
          <h3 className="font-display text-xl text-ink-primary">Invite User</h3>
          <button onClick={onClose} className="text-ink-muted hover:text-ink-primary text-xl leading-none transition">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-3 py-2 bg-alert/10 border border-alert/30 rounded-lg text-sm text-alert">
              {error}
            </div>
          )}

          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="user@example.com"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className={inputClass}>
              {roleOptions.map((r) => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Link to Practitioner (optional)</label>
            <select value={practitionerId} onChange={(e) => setPractitionerId(e.target.value)} className={inputClass}>
              <option value="">None</option>
              {practitioners.map((p) => (
                <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-sand-border rounded-lg text-ink-primary hover:bg-cream-bg text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-brand-gold hover:bg-gold-dark text-white rounded-lg text-sm font-medium disabled:opacity-50 transition"
            >
              {saving ? 'Inviting...' : 'Invite User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
