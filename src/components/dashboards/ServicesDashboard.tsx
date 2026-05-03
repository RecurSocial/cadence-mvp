'use client';

import { useEffect, useState } from 'react';
import { Service } from '@/types';

interface ServiceWithVendor extends Service {
  vendor_name?: string;
}

const inputClass = 'w-full px-3.5 py-2.5 bg-cream-bg border border-sand-border rounded-lg text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition';
const labelClass = 'block text-sm font-medium text-ink-primary mb-1';

export default function ServicesDashboard({ orgId }: { orgId: string }) {
  const [services, setServices] = useState<ServiceWithVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '', category: '', product: '', supplier: '', duration_minutes: '', price: '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('org_id', orgId);
      const response = await fetch('/api/import-excel', { method: 'POST', body: formData });
      const data = await response.json();
      if (response.ok) {
        setUploadMessage(data.message);
        fetchServices();
      } else {
        setUploadMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setUploadMessage(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      if (e.currentTarget) e.currentTarget.value = '';
    }
  };

  const categories = [
    'Neurotoxins','Fillers','Facials','IV Therapy','Injections','CoolSculpting','Spray Tan',
    'Laser Hair Removal','Massage Therapy','Hormone Therapy','RF Microneedling','SkinVive',
    'PRF and EZ Gel','IPL Laser','Fraxel','Microneedling','VI Peel',
    'Weight Loss and Wellness','Specialized Services',
  ];

  useEffect(() => { if (orgId) fetchServices(); }, [orgId]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/services?org_id=${orgId}`);
      const data = await response.json();
      if (Array.isArray(data)) { setServices(data); } else { setServices([]); }
    } catch (error) { console.error('Error fetching services:', error); setServices([]); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, org_id: orgId, duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null };
    try {
      const method = editingId ? 'PUT' : 'POST';
      const response = await fetch(`/api/services`, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload) });
      if (response.ok) { setFormData({ name: '', category: '', product: '', supplier: '', duration_minutes: '', price: '' }); setEditingId(null); setShowForm(false); fetchServices(); }
    } catch (error) { console.error('Error saving service:', error); }
  };

  const handleEdit = (service: ServiceWithVendor) => {
    setFormData({ name: service.name, category: service.category, product: service.product || '', supplier: service.supplier || '', duration_minutes: service.duration_minutes?.toString() || '', price: service.price || '' });
    setEditingId(service.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      try { await fetch(`/api/services?id=${id}`, { method: 'DELETE' }); fetchServices(); } catch (error) { console.error('Error deleting service:', error); }
    }
  };

  const handleCancel = () => { setFormData({ name: '', category: '', product: '', supplier: '', duration_minutes: '', price: '' }); setEditingId(null); setShowForm(false); };

  if (loading) return <div className="text-center py-12 text-ink-muted">Loading services...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-2xl text-ink-primary">Services</h2>
          <p className="mt-0.5 text-sm text-ink-muted">{services.length} services configured</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowForm(!showForm)} className="bg-brand-gold hover:bg-gold-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            {showForm ? 'Cancel' : '+ Add Service'}
          </button>
          <label className="px-4 py-2 border border-sand-border text-ink-primary hover:bg-bone-surface rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50 transition">
            {isUploading ? 'Uploading...' : 'Upload Excel'}
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleUploadExcel}
              disabled={isUploading}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {uploadMessage && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${uploadMessage.startsWith('Error') || uploadMessage.startsWith('Upload failed') ? 'bg-alert/15 text-alert' : 'bg-success/15 text-success'}`}>
          {uploadMessage}
        </div>
      )}

      {showForm && (
        <div className="bg-bone-surface border border-sand-border rounded-xl p-6">
          <h3 className="text-base font-medium text-ink-primary mb-4">{editingId ? 'Edit Service' : 'New Service'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelClass}>Service Name *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} placeholder="e.g., Botox" /></div>
            <div><label className={labelClass}>Category *</label><select required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className={inputClass}><option value="">Select category</option>{categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}</select></div>
            <div><label className={labelClass}>Product</label><input type="text" value={formData.product} onChange={(e) => setFormData({ ...formData, product: e.target.value })} className={inputClass} placeholder="e.g., Allergan" /></div>
            <div><label className={labelClass}>Supplier</label><input type="text" value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} className={inputClass} placeholder="e.g., Allergan" /></div>
            <div><label className={labelClass}>Duration (minutes)</label><input type="number" value={formData.duration_minutes} onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })} className={inputClass} placeholder="e.g., 15" /></div>
            <div><label className={labelClass}>Price</label><input type="text" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className={inputClass} placeholder="e.g., $199.00" /></div>
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
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-medium text-ink-muted">Service</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-medium text-ink-muted">Category</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-medium text-ink-muted">Product</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-medium text-ink-muted">Duration</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-medium text-ink-muted">Price</th>
                <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wider font-medium text-ink-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service, i) => (
                <tr key={service.id} className={`${i % 2 === 1 ? 'bg-bone-surface/30' : 'bg-cream-bg'} hover:bg-bone-surface transition`}>
                  <td className="px-4 py-3 font-medium text-ink-primary">{service.name}</td>
                  <td className="px-4 py-3 text-ink-muted">{service.category}</td>
                  <td className="px-4 py-3 text-ink-muted">{service.product || '-'}</td>
                  <td className="px-4 py-3 text-ink-muted">{service.duration_minutes ? `${service.duration_minutes}m` : '-'}</td>
                  <td className="px-4 py-3 text-ink-muted">{service.price || '-'}</td>
                  <td className="px-4 py-3 text-center space-x-3">
                    <button onClick={() => handleEdit(service)} className="text-gold-dark hover:text-ink-primary text-sm font-medium transition">Edit</button>
                    <button onClick={() => handleDelete(service.id)} className="text-alert hover:text-critical text-sm font-medium transition">Delete</button>
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
