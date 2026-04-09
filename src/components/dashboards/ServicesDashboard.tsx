'use client';

import { useEffect, useState } from 'react';
import { Service } from '@/types';

interface ServiceWithVendor extends Service {
  vendor_name?: string;
}

export default function ServicesDashboard({ orgId }: { orgId: string }) {
  const [services, setServices] = useState<ServiceWithVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    product: '',
    supplier: '',
    duration_minutes: '',
    price: '',
  });

  const categories = [
    'Neurotoxins',
    'Fillers',
    'Facials',
    'IV Therapy',
    'Injections',
    'CoolSculpting',
    'Spray Tan',
    'Laser Hair Removal',
    'Massage Therapy',
    'Hormone Therapy',
    'RF Microneedling',
    'SkinVive',
    'PRF and EZ Gel',
    'IPL Laser',
    'Fraxel',
    'Microneedling',
    'VI Peel',
    'Weight Loss and Wellness',
    'Specialized Services',
  ];

  useEffect(() => {
    if (orgId) {
      fetchServices();
    }
  }, [orgId]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/services?org_id=${orgId}`);
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      org_id: orgId,
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
    };

    try {
      const method = editingId ? 'PUT' : 'POST';
      const endpoint = editingId ? `/api/services` : `/api/services`;

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload),
      });

      if (response.ok) {
        setFormData({ name: '', category: '', product: '', supplier: '', duration_minutes: '', price: '' });
        setEditingId(null);
        setShowForm(false);
        fetchServices();
      }
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const handleEdit = (service: ServiceWithVendor) => {
    setFormData({
      name: service.name,
      category: service.category,
      product: service.product || '',
      supplier: service.supplier || '',
      duration_minutes: service.duration_minutes?.toString() || '',
      price: service.price || '',
    });
    setEditingId(service.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      try {
        await fetch(`/api/services?id=${id}`, { method: 'DELETE' });
        fetchServices();
      } catch (error) {
        console.error('Error deleting service:', error);
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', category: '', product: '', supplier: '', duration_minutes: '', price: '' });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="text-center py-12">Loading services...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Services</h2>
          <p className="mt-1 text-sm text-gray-600">{services.length} services configured</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? 'Cancel' : '+ Add Service'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Service' : 'New Service'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Botox"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
              <input
                type="text"
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Allergan"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Allergan"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 15"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <input
                type="text"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., $199.00"
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

      {/* Services Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Service</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Category</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Product</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Duration</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Price</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{service.name}</td>
                  <td className="px-6 py-4 text-gray-600">{service.category}</td>
                  <td className="px-6 py-4 text-gray-600">{service.product || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{service.duration_minutes ? `${service.duration_minutes}m` : '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{service.price || '-'}</td>
                  <td className="px-6 py-4 text-center space-x-2">
                    <button
                      onClick={() => handleEdit(service)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Delete
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
