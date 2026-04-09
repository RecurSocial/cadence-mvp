'use client';

import { useEffect, useState } from 'react';
import { Practitioner, PractitionerRole } from '@/types';

export default function PractitionersDashboard({ orgId }: { orgId: string }) {
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    role: 'Aesthetician' as PractitionerRole,
    email: '',
    phone: '',
    approval_level: 'staff',
  });

  const roles: PractitionerRole[] = ['Nurse', 'PA', 'Aesthetician', 'Masseuse'];
  const approvalLevels = ['staff', 'manager', 'owner', 'auto_approve'];

  useEffect(() => {
    if (orgId) {
      fetchPractitioners();
    }
  }, [orgId]);

  const fetchPractitioners = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/practitioners?org_id=${orgId}`);
      const data = await response.json();
      setPractitioners(data);
    } catch (error) {
      console.error('Error fetching practitioners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      org_id: orgId,
    };

    try {
      const method = editingId ? 'PUT' : 'POST';
      const response = await fetch(`/api/practitioners`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload),
      });

      if (response.ok) {
        setFormData({
          first_name: '',
          last_name: '',
          role: 'Aesthetician',
          email: '',
          phone: '',
          approval_level: 'staff',
        });
        setEditingId(null);
        setShowForm(false);
        fetchPractitioners();
      }
    } catch (error) {
      console.error('Error saving practitioner:', error);
    }
  };

  const handleEdit = (practitioner: Practitioner) => {
    setFormData({
      first_name: practitioner.first_name,
      last_name: practitioner.last_name,
      role: practitioner.role,
      email: practitioner.email || '',
      phone: practitioner.phone || '',
      approval_level: practitioner.approval_level,
    });
    setEditingId(practitioner.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this practitioner?')) {
      try {
        await fetch(`/api/practitioners?id=${id}`, { method: 'DELETE' });
        fetchPractitioners();
      } catch (error) {
        console.error('Error deleting practitioner:', error);
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: '',
      last_name: '',
      role: 'Aesthetician',
      email: '',
      phone: '',
      approval_level: 'staff',
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Group practitioners by role
  const groupedPractitioners = roles.reduce((acc, role) => {
    acc[role] = practitioners.filter((p) => p.role === role);
    return acc;
  }, {} as Record<PractitionerRole, Practitioner[]>);

  if (loading) {
    return <div className="text-center py-12">Loading practitioners...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Practitioners</h2>
          <p className="mt-1 text-sm text-gray-600">{practitioners.length} practitioners active</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? 'Cancel' : '+ Add Practitioner'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit Practitioner' : 'New Practitioner'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Brianna"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Krug"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as PractitionerRole })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Approval Level</label>
              <select
                value={formData.approval_level}
                onChange={(e) => setFormData({ ...formData, approval_level: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {approvalLevels.map((level) => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., brianna@euphoria.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., (609) 555-1234"
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

      {/* Practitioners by Role */}
      <div className="space-y-6">
        {roles.map((role) => (
          <div key={role}>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {role}s ({groupedPractitioners[role].length})
            </h3>
            {groupedPractitioners[role].length > 0 ? (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">Name</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">Email</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">Phone</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">Approval Level</th>
                        <th className="px-6 py-3 text-center font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {groupedPractitioners[role].map((practitioner) => (
                        <tr key={practitioner.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {practitioner.first_name} {practitioner.last_name}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{practitioner.email || '-'}</td>
                          <td className="px-6 py-4 text-gray-600">{practitioner.phone || '-'}</td>
                          <td className="px-6 py-4 text-gray-600">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {practitioner.approval_level}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center space-x-2">
                            <button
                              onClick={() => handleEdit(practitioner)}
                              className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(practitioner.id)}
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
            ) : (
              <p className="text-gray-600 text-sm">No {role.toLowerCase()}s added yet</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
