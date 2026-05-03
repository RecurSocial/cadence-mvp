'use client';

import { useEffect, useState } from 'react';
import WeeklyCalendarView from '@/components/calendar/WeeklyCalendarView';

export default function CalendarPage() {
  const [orgId, setOrgId] = useState<string>('');

  useEffect(() => {
    const testOrgId =
      localStorage.getItem('org_id') || '74b04f56-8cf0-7427-b977-7574b183226d';
    setOrgId(testOrgId);
  }, []);

  return (
    <div className="px-8 py-10">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink-primary">Content Calendar</h1>
          <p className="mt-1 text-sm text-ink-muted">Plan and schedule social media posts</p>
        </div>
      </div>

      {/* Calendar content */}
      {orgId ? (
        <WeeklyCalendarView orgId={orgId} />
      ) : (
        <div className="text-center py-12 text-ink-muted">Loading...</div>
      )}
    </div>
  );
}
