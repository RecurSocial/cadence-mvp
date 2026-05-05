'use client';

import { useEffect, useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Practitioner, PractitionerRole } from '@/types';

const inputClass = 'w-full px-3.5 py-2.5 bg-cream-bg border border-sand-border rounded-lg text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition';
const labelClass = 'block text-sm font-medium text-ink-primary mb-1';

const ROLES: PractitionerRole[] = ['Nurse', 'PA', 'Aesthetician', 'Masseuse'];
const APPROVAL_LEVELS = ['staff', 'manager', 'owner', 'auto_approve'];

export default function PractitionersPage() {
  const { orgId } = useCurrentUser();
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', role: 'Aesthetician' as PractitionerRole, email: '', phone: '', approval_level: 'staff',
  });

  useEffect(() => { if (orgId) fetchPractitioners(); }, [orgId]);

  const fetchPractitioners = async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/practitioners?org_id=${orgId}`);
      const data = await response.json();
      if (Array.isArray(data)) { setPractitioners(data); } else { setPractitioners([]); }
    } catch (error) { console.error('Error fetching practitioners:', error); setPractitioners([]); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    const payload = { ...formData, org_id: orgId };
    try {
      const method = editingId ? 'PUT' : 'POST';
      const response = await fetch(`/api/practitioners`, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload) });
      if (response.ok) { setFormData({ first_name: '', last_name: '', role: 'Aesthetician', email: '', phone: '', approval_level: 'staff' }); setEditingId(null); setShowForm(false); fetchPractitioners(); }
    } catch (error) { console.error('Error saving practitioner:', error); }
  };

  const handleEdit = (p: Practitioner) => {
    setFormData({ first_name: p.first_name, last_name: p.last_name, role: p.role, email: p.email || '', phone: p.phone || '', approval_level: p.approval_level });
    setEditingId(p.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this practitioner?')) {
      try { await fetch(`/api/practitioners?id=${id}`, { method: 'DELETE' }); fetchPractitioners(); } catch (error) { console.error('Error deleting practitioner:', error); }
    }
  };

  const handleCancel = () => { setFormData({ first_name: '', last_name: '', role: 'Aesthetician', email: '', phone: '', approval_level: 'staff' }); setEditingId(null); setShowForm(false); };

  const groupedPractitioners = ROLES.reduce((acc, role) => {
    acc[role] = practitioners.filter((p) => p.role === role);
    return acc;
  }, {} as Record<PractitionerRole, Practitioner[]>);

  return (
    <div className="px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink-primary">Practitioners</h1>
          <p className="mt-1 text-sm text-ink-muted">{practitioners.length} practitioners active</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-brand-gold hover:bg-gold-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          {showForm ? 'Cancel' : '+ Add Practitioner'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-bone-surface border border-sand-border rounded-xl p-6">
          <h3 className="text-base font-medium text-ink-primary mb-4">{editingId ? 'Edit Practitioner' : 'New Practitioner'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelClass}>First Name *</label><input type="text" required value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className={inputClass} placeholder="e.g., Brianna" /></div>
            <div><label className={labelClass}>Last Name *</label><input type="text" required value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className={inputClass} placeholder="e.g., Krug" /></div>
            <div><label className={labelClass}>Role *</label><select required value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as PractitionerRole })} className={inputClass}>{ROLES.map((role) => (<option key={role} value={role}>{role}</option>))}</select></div>
            <div><label className={labelClass}>Approval Level</label><select value={formData.approval_level} onChange={(e) => setFormData({ ...formData, approval_level: e.target.value })} className={inputClass}>{APPROVAL_LEVELS.map((level) => (<option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>))}</select></div>
            <div><label className={labelClass}>Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputClass} placeholder="e.g., brianna@euphoria.com" /></div>
            <div><label className={labelClass}>Phone</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputClass} placeholder="e.g., (609) 555-1234" /></div>
            <div className="md:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={handleCancel} className="px-4 py-2 border border-sand-border rounded-lg text-ink-primary hover:bg-cream-bg text-sm font-medium transition">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-brand-gold hover:bg-gold-dark text-white rounded-lg text-sm font-medium transition">{editingId ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-ink-muted">Loading practitioners...</div>
      ) : (
        <div className="space-y-6">
          {ROLES.map((role) => (
            <div key={role}>
              <h3 className="text-base font-medium text-ink-primary mb-3">{role}s ({groupedPractitioners[role].length})</h3>
              {groupedPractitioners[role].length > 0 ? (
                <div className="border border-sand-border rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-bone-surface border-b border-sand-border">
                          <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-medium text-ink-muted">Name</th>
                          <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-medium text-ink-muted">Email</th>
                          <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-medium text-ink-muted">Phone</th>
                          <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-medium text-ink-muted">Approval Level</th>
                          <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wider font-medium text-ink-muted">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedPractitioners[role].map((p, i) => (
                          <tr key={p.id} className={`${i % 2 === 1 ? 'bg-bone-surface/30' : 'bg-cream-bg'} hover:bg-bone-surface transition`}>
                            <td className="px-4 py-3 font-medium text-ink-primary">{p.first_name} {p.last_name}</td>
                            <td className="px-4 py-3 text-ink-muted">{p.email || '-'}</td>
                            <td className="px-4 py-3 text-ink-muted">{p.phone || '-'}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-brand-gold/20 text-gold-dark">
                                {p.approval_level}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center space-x-3">
                              <button onClick={() => handleEdit(p)} className="text-gold-dark hover:text-ink-primary text-sm font-medium transition">Edit</button>
                              <button onClick={() => handleDelete(p.id)} className="text-alert hover:text-critical text-sm font-medium transition">Deactivate</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-ink-muted text-sm">No {role.toLowerCase()}s added yet</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
