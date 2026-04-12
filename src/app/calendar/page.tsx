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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Content Calendar</h1>
            <p className="mt-2 text-sm text-gray-600">Plan and schedule social media posts</p>
          </div>
          <a
            href="/dashboard"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
          >
            &larr; Dashboard
          </a>
        </div>
      </div>

      {/* Nav tabs matching dashboard style */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <a
              href="/dashboard"
              className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
            >
              <span className="mr-2">⚙️</span>
              Office Dashboard
            </a>
            <span className="py-4 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm">
              <span className="mr-2">📅</span>
              Content Calendar
            </span>
          </nav>
        </div>
      </div>

      {/* Calendar content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {orgId ? (
          <WeeklyCalendarView orgId={orgId} />
        ) : (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        )}
      </div>
    </div>
  );
}
