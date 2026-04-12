'use client';

import { useEffect, useState } from 'react';
import { Practitioner, PractitionerRole } from '@/types';

const inputClass = 'w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition';
const labelClass = 'block text-sm font-medium text-[#0F172A] mb-1';

export default function PractitionersDashboard({ orgId }: { orgId: string }) {
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', role: 'Aesthetician' as PractitionerRole, email: '', phone: '', approval_level: 'staff',
  });

  const roles: PractitionerRole[] = ['Nurse', 'PA', 'Aesthetician', 'Masseuse'];
  const approvalLevels = ['staff', 'manager', 'owner', 'auto_approve'];

  useEffect(() => { if (orgId) fetchPractitioners(); }, [orgId]);

  const fetchPractitioners = async () => {
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

  const groupedPractitioners = roles.reduce((acc, role) => {
    acc[role] = practitioners.filter((p) => p.role === role);
    return acc;
  }, {} as Record<PractitionerRole, Practitioner[]>);

  if (loading) return <div className="text-center py-12 text-[#64748B]">Loading practitioners...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-[#0F172A]">Practitioners</h2>
          <p className="mt-0.5 text-sm text-[#64748B]">{practitioners.length} practitioners active</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          {showForm ? 'Cancel' : '+ Add Practitioner'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
          <h3 className="text-base font-semibold text-[#0F172A] mb-4">{editingId ? 'Edit Practitioner' : 'New Practitioner'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelClass}>First Name *</label><input type="text" required value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className={inputClass} placeholder="e.g., Brianna" /></div>
            <div><label className={labelClass}>Last Name *</label><input type="text" required value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className={inputClass} placeholder="e.g., Krug" /></div>
            <div><label className={labelClass}>Role *</label><select required value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as PractitionerRole })} className={inputClass}>{roles.map((role) => (<option key={role} value={role}>{role}</option>))}</select></div>
            <div><label className={labelClass}>Approval Level</label><select value={formData.approval_level} onChange={(e) => setFormData({ ...formData, approval_level: e.target.value })} className={inputClass}>{approvalLevels.map((level) => (<option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>))}</select></div>
            <div><label className={labelClass}>Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputClass} placeholder="e.g., brianna@euphoria.com" /></div>
            <div><label className={labelClass}>Phone</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputClass} placeholder="e.g., (609) 555-1234" /></div>
            <div className="md:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={handleCancel} className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-[#F8F9FB] text-sm font-medium transition">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-sm font-medium transition">{editingId ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {roles.map((role) => (
          <div key={role}>
            <h3 className="text-base font-semibold text-[#0F172A] mb-3">{role}s ({groupedPractitioners[role].length})</h3>
            {groupedPractitioners[role].length > 0 ? (
              <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#F1F5F9]">
                        <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-[#64748B]">Name</th>
                        <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-[#64748B]">Email</th>
                        <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-[#64748B]">Phone</th>
                        <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-[#64748B]">Approval Level</th>
                        <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wider font-semibold text-[#64748B]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedPractitioners[role].map((p, i) => (
                        <tr key={p.id} className={`${i % 2 === 1 ? 'bg-[#F8F9FB]' : 'bg-white'} hover:bg-[#F1F5F9] transition`}>
                          <td className="px-4 py-3 font-medium text-[#0F172A]">{p.first_name} {p.last_name}</td>
                          <td className="px-4 py-3 text-[#64748B]">{p.email || '-'}</td>
                          <td className="px-4 py-3 text-[#64748B]">{p.phone || '-'}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#4F46E5]/15 text-[#4F46E5]">
                              {p.approval_level}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center space-x-3">
                            <button onClick={() => handleEdit(p)} className="text-[#4F46E5] hover:text-[#4338CA] text-sm font-medium transition">Edit</button>
                            <button onClick={() => handleDelete(p.id)} className="text-[#EF4444] hover:text-[#DC2626] text-sm font-medium transition">Deactivate</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-[#64748B] text-sm">No {role.toLowerCase()}s added yet</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
