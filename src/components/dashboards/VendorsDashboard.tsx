'use client';

import { useEffect, useState } from 'react';
import { Vendor } from '@/types';

export default function VendorsDashboard({ orgId }: { orgId: string }) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    contact_email: '',
    contact_phone: '',
    events_url: '',
    rss_feed_url: '',
    coop_budget: '',
    coop_budget_year: new Date().getFullYear().toString(),
    notes: '',
  });

  useEffect(() => {
    if (orgId) {
      fetchVendors();
    }
  }, [orgId]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/vendors?org_id=${orgId}`);
      const data = await response.json();
      setVendors(data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      org_id: orgId,
      coop_budget: formData.coop_budget ? parseFloat(formData.coop_budget) : null,
      coop_budget_year: parseInt(formData.coop_budget_year),
    };

    try {
      const method = editingId ? 'PUT' : 'POST';
      const response = await fetch(`/api/vendors`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload),
      });

      if (response.ok) {
        setFormData({
          name: '',
          website: '',
          contact_email: '',
          contact_phone: '',
          events_url: '',
          rss_feed_url: '',
          coop_budget: '',
          coop_budget_year: new Date().getFullYear().toString(),
          notes: '',
        });
        setEditingId(null);
        setShowForm(false);
        fetchVendors();
      }
    } catch (error) {
      console.error('Error saving vendor:', error);
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setFormData({
      name: vendor.name,
      website: vendor.website || '',
      contact_email: vendor.contact_email || '',
      contact_phone: vendor.contact_phone || '',
      events_url: vendor.events_url || '',
      rss_feed_url: vendor.rss_feed_url || '',
      coop_budget: vendor.coop_budget?.toString() || '',
      coop_budget_year: (vendor.coop_budget_year || new Date().getFullYear()).toString(),
      notes: vendor.notes || '',
    });
    setEditingId(vendor.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this vendor?')) {
      try {
        await fetch(`/api/vendors?id=${id}`, { method: 'DELETE' });
        fetchVendors();
      } catch (error) {
        console.error('Error deleting vendor:', error);
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      website: '',
      contact_email: '',
      contact_phone: '',
      events_url: '',
      rss_feed_url: '',
      coop_budget: '',
      coop_budget_year: new Date().getFullYear().toString(),
      notes: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="text-center py-12">Loading vendors...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vendors & Suppliers</h2>
          <p className="mt-1 text-sm text-gray-600">{vendors.length} vendors configured</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? 'Cancel' : '+ Add Vendor'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Vendor' : 'New Vendor'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Allergan"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="contact@vendor.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="(800) 555-1234"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Events/Promotions URL</label>
              <input
                type="url"
                value={formData.events_url}
                onChange={(e) => setFormData({ ...formData, events_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://vendor.com/events"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RSS Feed URL</label>
              <input
                type="url"
                value={formData.rss_feed_url}
                onChange={(e) => setFormData({ ...formData, rss_feed_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://vendor.com/feed.rss"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Co-Op Budget ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.coop_budget}
                onChange={(e) => setFormData({ ...formData, coop_budget: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 50000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Co-Op Budget Year</label>
              <input
                type="number"
                value={formData.coop_budget_year}
                onChange={(e) => setFormData({ ...formData, coop_budget_year: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add any notes about this vendor..."
                rows={3}
              />
            </div>

            <div className="md:col-span-2 flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vendors Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Vendor Name</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Contact</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Co-Op Budget</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Events URL</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{vendor.name}</td>
                  <td className="px-6 py-4 text-gray-600">
                    <div>{vendor.contact_email || '-'}</div>
                    <div className="text-xs text-gray-500">{vendor.contact_phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {vendor.coop_budget ? `$${vendor.coop_budget.toLocaleString()} (${vendor.coop_budget_year})` : '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {vendor.events_url ? (
                      <a href={vendor.events_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                        View Events
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 text-center space-x-2">
                    <button
                      onClick={() => handleEdit(vendor)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(vendor.id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Deactivate
                    </button>
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
