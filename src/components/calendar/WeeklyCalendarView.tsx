'use client';

import { useEffect, useState, useCallback } from 'react';
import { Post } from '@/types';
import PostSlot from './PostSlot';
import CreatePostModal from './CreatePostModal';

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getSunday(monday: Date): Date {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

function formatDateRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${monday.toLocaleDateString('en-US', opts)} - ${sunday.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WeeklyCalendarView({ orgId }: { orgId: string }) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalDate, setModalDate] = useState<Date | null>(null);

  const fetchPosts = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const start = weekStart.toISOString();
      const end = getSunday(weekStart).toISOString();
      const res = await fetch(
        `/api/posts?org_id=${orgId}&week_start=${encodeURIComponent(start)}&week_end=${encodeURIComponent(end)}`
      );
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [orgId, weekStart]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const prevWeek = () => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const nextWeek = () => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const goToday = () => setWeekStart(getMonday(new Date()));

  const handleSavePost = async (data: {
    caption: string;
    hashtags: string;
    scheduled_at: string;
    platforms: string[];
    post_type: string;
  }) => {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, ...data }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save post');
    }
    await fetchPosts();
  };

  // Build a map of day-index (0=Mon) to posts for that day
  const dayPosts: Post[][] = Array.from({ length: 7 }, () => []);
  for (const post of posts) {
    if (!post.scheduled_at) continue;
    const d = new Date(post.scheduled_at);
    const dayOfWeek = d.getDay(); // 0=Sun
    const idx = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // convert to 0=Mon
    dayPosts[idx].push(post);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={prevWeek}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm"
          >
            &larr; Prev
          </button>
          <button
            onClick={goToday}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm"
          >
            Today
          </button>
          <button
            onClick={nextWeek}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm"
          >
            Next &rarr;
          </button>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{formatDateRange(weekStart)}</h3>
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading posts...</div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {DAY_LABELS.map((label, idx) => {
            const cellDate = new Date(weekStart);
            cellDate.setDate(weekStart.getDate() + idx);
            const isToday = cellDate.getTime() === today.getTime();

            return (
              <div key={idx} className="min-h-[180px]">
                {/* Day header */}
                <div
                  className={`text-center py-2 rounded-t-lg text-sm font-medium ${
                    isToday ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <div>{label}</div>
                  <div className="text-xs">{cellDate.getDate()}</div>
                </div>

                {/* Day body */}
                <div
                  className="bg-gray-50 border border-t-0 border-gray-200 rounded-b-lg p-2 min-h-[140px] cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => setModalDate(cellDate)}
                >
                  {dayPosts[idx].map((post) => (
                    <PostSlot key={post.id} post={post} />
                  ))}
                  {dayPosts[idx].length === 0 && (
                    <div className="flex items-center justify-center h-full min-h-[100px] text-gray-300 text-2xl">
                      +
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create post modal */}
      {modalDate && (
        <CreatePostModal
          date={modalDate}
          onClose={() => setModalDate(null)}
          onSave={handleSavePost}
        />
      )}
    </div>
  );
}
