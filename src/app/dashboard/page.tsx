'use client';

import { useEffect, useState } from 'react';
import ServicesDashboard from '@/components/dashboards/ServicesDashboard';
import PractitionersDashboard from '@/components/dashboards/PractitionersDashboard';
import VendorsDashboard from '@/components/dashboards/VendorsDashboard';
import ExecutionScoreCards from '@/components/dashboards/ExecutionScoreCards';
import TrendInbox from '@/components/TrendInbox';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { canManagePractitioners, canApproveReject } from '@/lib/auth/permissions';

export default function Dashboard() {
  const { role, userId, displayName } = useCurrentUser();
  const [activeTab, setActiveTab] = useState('services');
  const [orgId, setOrgId] = useState<string>('');

  const canViewTabs = canManagePractitioners(role);
  const canReview = canApproveReject(role);

  useEffect(() => {
    const testOrgId = localStorage.getItem('org_id') || '74b04f56-8cf0-7427-b977-7574b183226d';
    setOrgId(testOrgId);
  }, []);

  return (
    <div className="px-8 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">Office Dashboard</h1>
        <p className="mt-1 text-sm text-[#64748B]">Your morning briefing — execution score, pending approvals, and the week at a glance</p>
      </div>

      {orgId && <ExecutionScoreCards orgId={orgId} />}

      <div className="mt-8">
        <TrendInbox
          currentUserId={userId || ''}
          currentUserName={displayName || 'Team Member'}
          canReview={canReview}
          onApprove={function(item) {
            window.location.href = '/calendar?trend_url=' + encodeURIComponent(item.url || '') + '&trend_note=' + encodeURIComponent(item.note || '');
          }}
        />
      </div>

      {canViewTabs && (
        <>
          <div className="border-b border-[#E2E8F0] mt-8 mb-8">
            <nav className="flex gap-6" aria-label="Tabs">
              {[
                { id: 'services', label: 'Services' },
                { id: 'practitioners', label: 'Practitioners' },
                { id: 'vendors', label: 'Vendors' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={'pb-3 text-sm font-medium border-b-2 transition ' + (
                    activeTab === tab.id
                      ? 'border-[#4F46E5] text-[#4F46E5]'
                      : 'border-transparent text-[#64748B] hover:text-[#0F172A] hover:border-[#E2E8F0]'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {activeTab === 'services' && <ServicesDashboard orgId={orgId} />}
          {activeTab === 'practitioners' && <PractitionersDashboard orgId={orgId} />}
          {activeTab === 'vendors' && <VendorsDashboard orgId={orgId} />}
        </>
      )}
    </div>
  );
}
