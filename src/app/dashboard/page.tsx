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
    // Get org_id from localStorage or from URL params
    // For MVP, we'll use a hardcoded org_id for testing
    // In production, this comes from Supabase auth
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
        setImportMessage(`✓ Imported ${data.counts.services} services, ${data.counts.certifications} certifications, ${data.counts.practitioners} practitioners`);
        // Reload page after 2 seconds
        setTimeout(() => window.location.reload(), 2000);
      } else {
        console.error('[Dashboard] API error response:', data);
        setImportMessage(`✗ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('[Dashboard] Import exception:', error);
      setImportMessage(`✗ Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        setImportMessage(`✓ ${data.message}`);
        setTimeout(() => window.location.reload(), 2000);
      } else {
        console.error('[Dashboard] Upload error:', data);
        setImportMessage(`✗ Error: ${data.error}`);
      }
    } catch (error) {
      console.error('[Dashboard] Upload exception:', error);
      setImportMessage(`✗ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
      // Reset file input
      if (e.currentTarget) {
        e.currentTarget.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cadence Office Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">Manage Services, Practitioners, and Vendors</p>
          </div>
          <div className="flex gap-2">
            <label className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              📤 Upload Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleUploadExcel}
                disabled={isImporting}
                style={{ display: 'none' }}
              />
            </label>
            <button
              onClick={handleImportEuphoria}
              disabled={isImporting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? 'Importing...' : '📥 Import Sample Data'}
            </button>
          </div>
        </div>
        {importMessage && (
          <div className={`max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 ${importMessage.startsWith('✓') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {importMessage}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: 'services', label: 'Services', icon: '⚙️' },
              { id: 'practitioners', label: 'Practitioners', icon: '👤' },
              { id: 'vendors', label: 'Vendors', icon: '🏢' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'services' && <ServicesDashboard orgId={orgId} />}
        {activeTab === 'practitioners' && <PractitionersDashboard orgId={orgId} />}
        {activeTab === 'vendors' && <VendorsDashboard orgId={orgId} />}
      </div>
    </div>
  );
}
