'use client';

import { useEffect, useState } from 'react';
import ServicesDashboard from '@/components/dashboards/ServicesDashboard';
import PractitionersDashboard from '@/components/dashboards/PractitionersDashboard';
import VendorsDashboard from '@/components/dashboards/VendorsDashboard';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('services');
  const [orgId, setOrgId] = useState<string>('');

  useEffect(() => {
    // Get org_id from localStorage or from URL params
    // For MVP, we'll use a hardcoded org_id for testing
    // In production, this comes from Supabase auth
    const testOrgId = localStorage.getItem('org_id') || 'test-org-1';
    setOrgId(testOrgId);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Cadence Office Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">Manage Services, Practitioners, and Vendors</p>
        </div>
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
