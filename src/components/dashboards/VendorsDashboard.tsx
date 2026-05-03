'use client';

import { useEffect, useState } from 'react';
import { Vendor } from '@/types';

const inputClass = 'w-full px-3.5 py-2.5 bg-cream-bg border border-sand-border rounded-lg text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition';
const labelClass = 'block text-sm font-medium text-ink-primary mb-1';

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

  if (loading) return <div className="text-center py-12 text-ink-muted">Loading vendors...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-2xl text-ink-primary">Vendors &amp; Suppliers</h2>
          <p className="mt-0.5 text-sm text-ink-muted">{vendors.length} vendors configured</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-brand-gold hover:bg-gold-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          {showForm ? 'Cancel' : '+ Add Vendor'}
        </button>
      </div>

      {showForm && (
        <div className="bg-bone-surface border border-sand-border rounded-xl p-6">
          <h3 className="text-base font-medium text-ink-primary mb-4">{editingId ? 'Edit Vendor' : 'New Vendor'}</h3>
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
              <button type="button" onClick={handleCancel} className="px-4 py-2 border border-sand-border rounded-lg text-ink-primary hover:bg-cream-bg text-sm font-medium transition">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-brand-gold hover:bg-gold-dark text-white rounded-lg text-sm font-medium transition">{editingId ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="border border-sand-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bone-surface border-b border-sand-border">
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-medium text-ink-muted">Vendor Name</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-medium text-ink-muted">Contact</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-medium text-ink-muted">Co-Op Budget</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-medium text-ink-muted">Events URL</th>
                <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wider font-medium text-ink-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor, i) => (
                <tr key={vendor.id} className={`${i % 2 === 1 ? 'bg-bone-surface/30' : 'bg-cream-bg'} hover:bg-bone-surface transition`}>
                  <td className="px-4 py-3 font-medium text-ink-primary">{vendor.name}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    <div>{vendor.contact_email || '-'}</div>
                    <div className="text-xs text-ink-muted/70">{vendor.contact_phone || '-'}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{vendor.coop_budget ? `$${vendor.coop_budget.toLocaleString()} (${vendor.coop_budget_year})` : '-'}</td>
                  <td className="px-4 py-3 text-ink-muted">{vendor.events_url ? (<a href={vendor.events_url} target="_blank" rel="noopener noreferrer" className="text-gold-dark hover:text-ink-primary text-xs font-medium transition">View Events</a>) : ('-')}</td>
                  <td className="px-4 py-3 text-center space-x-3">
                    <button onClick={() => handleEdit(vendor)} className="text-gold-dark hover:text-ink-primary text-sm font-medium transition">Edit</button>
                    <button onClick={() => handleDelete(vendor.id)} className="text-alert hover:text-critical text-sm font-medium transition">Deactivate</button>
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
