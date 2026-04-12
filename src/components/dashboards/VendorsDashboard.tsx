'use client';

import { useEffect, useState } from 'react';
import { Vendor } from '@/types';

const inputClass = 'w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition';
const labelClass = 'block text-sm font-medium text-[#0F172A] mb-1';

export default function VendorsDashboard({ orgId }: { orgId: string }) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '', website: '', contact_email: '', contact_phone: '', events_url: '', rss_feed_url: '', coop_budget: '', coop_budget_year: new Date().getFullYear().toString(), notes: '',
  });

  useEffect(() => { if (orgId) fetchVendors(); }, [orgId]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/vendors?org_id=${orgId}`);
      const data = await response.json();
      if (Array.isArray(data)) { setVendors(data); } else { setVendors([]); }
    } catch (error) { console.error('Error fetching vendors:', error); setVendors([]); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, org_id: orgId, coop_budget: formData.coop_budget ? parseFloat(formData.coop_budget) : null, coop_budget_year: parseInt(formData.coop_budget_year) };
    try {
      const method = editingId ? 'PUT' : 'POST';
      const response = await fetch(`/api/vendors`, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload) });
      if (response.ok) { setFormData({ name: '', website: '', contact_email: '', contact_phone: '', events_url: '', rss_feed_url: '', coop_budget: '', coop_budget_year: new Date().getFullYear().toString(), notes: '' }); setEditingId(null); setShowForm(false); fetchVendors(); }
    } catch (error) { console.error('Error saving vendor:', error); }
  };

  const handleEdit = (vendor: Vendor) => {
    setFormData({ name: vendor.name, website: vendor.website || '', contact_email: vendor.contact_email || '', contact_phone: vendor.contact_phone || '', events_url: vendor.events_url || '', rss_feed_url: vendor.rss_feed_url || '', coop_budget: vendor.coop_budget?.toString() || '', coop_budget_year: (vendor.coop_budget_year || new Date().getFullYear()).toString(), notes: vendor.notes || '' });
    setEditingId(vendor.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this vendor?')) {
      try { await fetch(`/api/vendors?id=${id}`, { method: 'DELETE' }); fetchVendors(); } catch (error) { console.error('Error deleting vendor:', error); }
    }
  };

  const handleCancel = () => { setFormData({ name: '', website: '', contact_email: '', contact_phone: '', events_url: '', rss_feed_url: '', coop_budget: '', coop_budget_year: new Date().getFullYear().toString(), notes: '' }); setEditingId(null); setShowForm(false); };

  if (loading) return <div className="text-center py-12 text-[#64748B]">Loading vendors...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-[#0F172A]">Vendors & Suppliers</h2>
          <p className="mt-0.5 text-sm text-[#64748B]">{vendors.length} vendors configured</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          {showForm ? 'Cancel' : '+ Add Vendor'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
          <h3 className="text-base font-semibold text-[#0F172A] mb-4">{editingId ? 'Edit Vendor' : 'New Vendor'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelClass}>Vendor Name *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} placeholder="e.g., Allergan" /></div>
            <div><label className={labelClass}>Website</label><input type="url" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className={inputClass} placeholder="https://example.com" /></div>
            <div><label className={labelClass}>Contact Email</label><input type="email" value={formData.contact_email} onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} className={inputClass} placeholder="contact@vendor.com" /></div>
            <div><label className={labelClass}>Contact Phone</label><input type="tel" value={formData.contact_phone} onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} className={inputClass} placeholder="(800) 555-1234" /></div>
            <div><label className={labelClass}>Events/Promotions URL</label><input type="url" value={formData.events_url} onChange={(e) => setFormData({ ...formData, events_url: e.target.value })} className={inputClass} placeholder="https://vendor.com/events" /></div>
            <div><label className={labelClass}>RSS Feed URL</label><input type="url" value={formData.rss_feed_url} onChange={(e) => setFormData({ ...formData, rss_feed_url: e.target.value })} className={inputClass} placeholder="https://vendor.com/feed.rss" /></div>
            <div><label className={labelClass}>Co-Op Budget ($)</label><input type="number" step="0.01" value={formData.coop_budget} onChange={(e) => setFormData({ ...formData, coop_budget: e.target.value })} className={inputClass} placeholder="e.g., 50000" /></div>
            <div><label className={labelClass}>Co-Op Budget Year</label><input type="number" value={formData.coop_budget_year} onChange={(e) => setFormData({ ...formData, coop_budget_year: e.target.value })} className={inputClass} /></div>
            <div className="md:col-span-2"><label className={labelClass}>Notes</label><textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className={inputClass + ' resize-none'} placeholder="Add any notes about this vendor..." rows={3} /></div>
            <div className="md:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={handleCancel} className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-[#F8F9FB] text-sm font-medium transition">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-sm font-medium transition">{editingId ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F1F5F9]">
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-[#64748B]">Vendor Name</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-[#64748B]">Contact</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-[#64748B]">Co-Op Budget</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-semibold text-[#64748B]">Events URL</th>
                <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wider font-semibold text-[#64748B]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor, i) => (
                <tr key={vendor.id} className={`${i % 2 === 1 ? 'bg-[#F8F9FB]' : 'bg-white'} hover:bg-[#F1F5F9] transition`}>
                  <td className="px-4 py-3 font-medium text-[#0F172A]">{vendor.name}</td>
                  <td className="px-4 py-3 text-[#64748B]">
                    <div>{vendor.contact_email || '-'}</div>
                    <div className="text-xs text-[#94A3B8]">{vendor.contact_phone || '-'}</div>
                  </td>
                  <td className="px-4 py-3 text-[#64748B]">{vendor.coop_budget ? `$${vendor.coop_budget.toLocaleString()} (${vendor.coop_budget_year})` : '-'}</td>
                  <td className="px-4 py-3 text-[#64748B]">{vendor.events_url ? (<a href={vendor.events_url} target="_blank" rel="noopener noreferrer" className="text-[#4F46E5] hover:text-[#4338CA] text-xs font-medium transition">View Events</a>) : ('-')}</td>
                  <td className="px-4 py-3 text-center space-x-3">
                    <button onClick={() => handleEdit(vendor)} className="text-[#4F46E5] hover:text-[#4338CA] text-sm font-medium transition">Edit</button>
                    <button onClick={() => handleDelete(vendor.id)} className="text-[#EF4444] hover:text-[#DC2626] text-sm font-medium transition">Deactivate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
