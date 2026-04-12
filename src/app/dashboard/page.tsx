'use client';

import { useEffect, useState } from 'react';
import ServicesDashboard from '@/components/dashboards/ServicesDashboard';
import PractitionersDashboard from '@/components/dashboards/PractitionersDashboard';
import VendorsDashboard from '@/components/dashboards/VendorsDashboard';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('services');
  const [orgId, setOrgId] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  useEffect(() => {
    const testOrgId = localStorage.getItem('org_id') || '74b04f56-8cf0-7427-b977-7574b183226d';
    setOrgId(testOrgId);
  }, []);

  const handleImportEuphoria = async () => {
    setIsImporting(true);
    setImportMessage(null);
    try {
      console.log('[Dashboard] Starting import...');
      const response = await fetch('/api/import-euphoria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId }),
      });

      console.log('[Dashboard] API response status:', response.status);
      const data = await response.json();
      console.log('[Dashboard] API response data:', data);

      if (response.ok) {
        setImportMessage(`Imported ${data.counts.services} services, ${data.counts.certifications} certifications, ${data.counts.practitioners} practitioners`);
        setTimeout(() => window.location.reload(), 2000);
      } else {
        console.error('[Dashboard] API error response:', data);
        setImportMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('[Dashboard] Import exception:', error);
      setImportMessage(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportMessage(null);

    try {
      console.log('[Dashboard] Uploading Excel file:', file.name);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('org_id', orgId);

      const response = await fetch('/api/import-excel', {
        method: 'POST',
        body: formData,
      });

      console.log('[Dashboard] Upload response status:', response.status);
      const data = await response.json();
      console.log('[Dashboard] Upload response:', data);

      if (response.ok) {
        setImportMessage(data.message);
        setTimeout(() => window.location.reload(), 2000);
      } else {
        console.error('[Dashboard] Upload error:', data);
        setImportMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('[Dashboard] Upload exception:', error);
      setImportMessage(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
      if (e.currentTarget) {
        e.currentTarget.value = '';
      }
    }
  };

  const isSuccess = importMessage && !importMessage.startsWith('Error') && !importMessage.startsWith('Import failed') && !importMessage.startsWith('Upload failed');

  return (
    <div className="px-8 py-10">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Office Dashboard</h1>
          <p className="mt-1 text-sm text-[#64748B]">Manage Services, Practitioners, and Vendors</p>
        </div>
        <div className="flex gap-2">
          <label className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg text-sm font-medium cursor-pointer transition">
            Upload Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleUploadExcel}
              disabled={isImporting}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {/* Import message */}
      {importMessage && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium ${isSuccess ? 'bg-[#10B981]/15 text-[#059669]' : 'bg-[#EF4444]/15 text-[#DC2626]'}`}>
          {importMessage}
        </div>
      )}

      {/* Sub-tabs */}
      <div className="border-b border-[#E2E8F0] mb-8">
        <nav className="flex gap-6" aria-label="Tabs">
          {[
            { id: 'services', label: 'Services' },
            { id: 'practitioners', label: 'Practitioners' },
            { id: 'vendors', label: 'Vendors' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-[#4F46E5] text-[#4F46E5]'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A] hover:border-[#E2E8F0]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'services' && <ServicesDashboard orgId={orgId} />}
      {activeTab === 'practitioners' && <PractitionersDashboard orgId={orgId} />}
      {activeTab === 'vendors' && <VendorsDashboard orgId={orgId} />}
    </div>
  );
}
