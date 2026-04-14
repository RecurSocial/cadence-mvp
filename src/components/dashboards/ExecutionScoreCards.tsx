'use client';

import { useEffect, useState, useCallback } from 'react';
import { Post } from '@/types';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

const ACTIVE_STATUSES = new Set(['scheduled', 'pending_review', 'published']);

export default function ExecutionScoreCards({ orgId }: { orgId: string }) {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);

  const fetchData = useCallback(async () => {
    if (!orgId) return;
    try {
      const weekStart = getMonday(new Date());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 5); // Saturday
      weekEnd.setHours(23, 59, 59, 999);

      const res = await fetch(
        `/api/posts?org_id=${orgId}&week_start=${encodeURIComponent(weekStart.toISOString())}&week_end=${encodeURIComponent(weekEnd.toISOString())}`
      );
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[ExecutionScoreCards] Error:', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [fetchData]);

  // Compute coverage per day (Mon=0 through Sat=5)
  const weekStart = getMonday(new Date());
  const dayCounts = new Array(6).fill(0);
  const activeCounts = new Array(6).fill(0);

  for (const post of posts) {
    if (!post.scheduled_at) continue;
    const d = new Date(post.scheduled_at);
    const dow = d.getDay(); // 0=Sun
    const idx = dow === 0 ? -1 : dow - 1; // Mon=0..Sat=5
    if (idx >= 0 && idx < 6) {
      dayCounts[idx]++;
      if (ACTIVE_STATUSES.has(post.status)) {
        activeCounts[idx]++;
      }
    }
  }

  const daysCovered = activeCounts.filter((c) => c > 0).length;
  const missingDays = DAY_FULL.filter((_, i) => activeCounts[i] === 0);
  const pendingCount = posts.filter((p) => p.status === 'pending_review').length;

  // Score color states
  const scoreColors = daysCovered >= 5
    ? { bg: 'bg-green-50', text: 'text-green-700', bar: '#10B981', border: 'border-green-200' }
    : daysCovered >= 3
    ? { bg: 'bg-yellow-50', text: 'text-yellow-700', bar: '#F59E0B', border: 'border-yellow-200' }
    : { bg: 'bg-red-50', text: 'text-red-700', bar: '#EF4444', border: 'border-red-200' };

  if (loading) {
    return (
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-8 text-center text-[#64748B]">
          Loading execution score...
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Card 1 — Weekly Execution Score (spans 2 cols on large screens) */}
      <div className={`lg:col-span-2 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border ${scoreColors.border} ${scoreColors.bg} p-6`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-1">Weekly Execution Score</p>
            <p className="text-sm text-[#64748B]">Posts covering this week</p>
          </div>
        </div>

        <div className="flex items-baseline gap-3 mb-4">
          <span className={`text-[64px] leading-none font-bold ${scoreColors.text}`}>{daysCovered}</span>
          <span className="text-3xl font-semibold text-[#64748B]">/ 6</span>
          <span className="text-sm text-[#64748B] ml-2">days covered this week</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-[#E2E8F0] mb-4">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${(daysCovered / 6) * 100}%`, backgroundColor: scoreColors.bar }}
          />
        </div>

        {/* Status line */}
        {missingDays.length === 0 ? (
          <p className="text-sm font-medium text-green-700">✅ Great week — all days covered!</p>
        ) : (
          <p className="text-sm font-medium text-[#0F172A]">
            <span className="text-yellow-700">⚠️ Missing:</span>{' '}
            <span className="text-[#64748B]">{missingDays.join(', ')}</span>
          </p>
        )}
      </div>

      {/* Card 2 — Pending Approvals */}
      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#E2E8F0] p-6">
        <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-1">Pending Approvals</p>
        <div className="flex items-baseline gap-2 mb-4 mt-2">
          <span className="text-5xl font-bold text-[#0F172A]">{pendingCount}</span>
          <span className="text-sm text-[#64748B]">posts awaiting approval</span>
        </div>
        {pendingCount > 0 ? (
          <a
            href="/approvals"
            className="inline-block px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-sm font-medium transition"
          >
            Review Now
          </a>
        ) : (
          <p className="text-sm font-medium text-green-700">✅ No posts pending approval</p>
        )}
      </div>

      {/* Card 3 — This Week at a Glance (spans full width) */}
      <div className="lg:col-span-3 bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#E2E8F0] p-6">
        <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-4">This Week at a Glance</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {DAY_LABELS.map((label, i) => {
            const cellDate = new Date(weekStart);
            cellDate.setDate(weekStart.getDate() + i);
            const count = dayCounts[i];
            const hasGap = activeCounts[i] === 0;
            const dateLabel = cellDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            return (
              <div key={i} className="flex items-center gap-3 bg-[#F8F9FB] rounded-lg px-3 py-2.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: hasGap ? '#EF4444' : '#10B981' }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#0F172A]">{DAY_FULL[i]}</p>
                  <p className="text-xs text-[#64748B]">
                    {dateLabel} · {count} post{count !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
