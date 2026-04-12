'use client';

import { useEffect, useState, useCallback } from 'react';
import { Post } from '@/types';
import PostSlot, { postTypeConfig } from './PostSlot';
import CreatePostModal from './CreatePostModal';
import PostDetailModal from './PostDetailModal';

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
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

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

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const prevWeek = () => { setWeekStart((prev) => { const d = new Date(prev); d.setDate(d.getDate() - 7); return d; }); };
  const nextWeek = () => { setWeekStart((prev) => { const d = new Date(prev); d.setDate(d.getDate() + 7); return d; }); };
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

  const dayPosts: Post[][] = Array.from({ length: 7 }, () => []);
  for (const post of posts) {
    if (!post.scheduled_at) continue;
    const d = new Date(post.scheduled_at);
    const dayOfWeek = d.getDay();
    const idx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    dayPosts[idx].push(post);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const navBtnClass = 'px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-white hover:text-[#0F172A] transition text-sm font-medium';

  return (
    <div className="space-y-5">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className={navBtnClass}>&larr; Prev</button>
          <button onClick={goToday} className={navBtnClass}>Today</button>
          <button onClick={nextWeek} className={navBtnClass}>Next &rarr;</button>
        </div>
        <h3 className="text-base font-semibold text-[#0F172A]">{formatDateRange(weekStart)}</h3>
      </div>

      {/* Weekly summary bar */}
      {!loading && (
        <div className="bg-white border border-[#E2E8F0] rounded-lg px-4 py-3">
          {posts.length === 0 ? (
            <p className="text-sm text-[#64748B]">No posts scheduled this week — click any day to get started</p>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-[#0F172A]">{posts.length} post{posts.length !== 1 ? 's' : ''} this week</span>
              <span className="text-[#E2E8F0]">|</span>
              {Object.entries(
                posts.reduce((acc, p) => {
                  const key = p.post_type || '_none';
                  acc[key] = (acc[key] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              )
                .filter(([key]) => key !== '_none')
                .map(([type, count], i, arr) => {
                  const color = postTypeConfig[type]?.badgeColor || '#64748B';
                  return (
                    <span key={type}>
                      <span style={{ color }} className="font-medium">{count}</span>
                      <span className="text-[#64748B]"> {type}</span>
                      {i < arr.length - 1 && <span className="text-[#E2E8F0] mx-1">&middot;</span>}
                    </span>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Calendar grid */}
      {loading ? (
        <div className="text-center py-12 text-[#64748B]">Loading posts...</div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {DAY_LABELS.map((label, idx) => {
            const cellDate = new Date(weekStart);
            cellDate.setDate(weekStart.getDate() + idx);
            const isToday = cellDate.getTime() === today.getTime();

            return (
              <div key={idx} className="min-h-[180px]">
                <div
                  className={`text-center py-2 rounded-t-lg text-sm font-medium cursor-pointer transition ${
                    isToday ? 'bg-[#4F46E5] text-white hover:bg-[#4338CA]' : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                  }`}
                  onClick={() => setModalDate(cellDate)}
                >
                  <div>{label}</div>
                  <div className="text-xs">{cellDate.getDate()}</div>
                </div>

                <div
                  className="bg-white border border-t-0 border-[#E2E8F0] rounded-b-lg p-2 min-h-[140px] cursor-pointer hover:bg-[#F8F9FB] transition"
                  onClick={() => setModalDate(cellDate)}
                >
                  {dayPosts[idx].map((post) => (
                    <PostSlot key={post.id} post={post} onClick={() => setSelectedPost(post)} />
                  ))}
                  {dayPosts[idx].length === 0 && (
                    <div className="flex items-center justify-center h-full min-h-[100px] text-[#E2E8F0] text-2xl">
                      +
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalDate && (
        <CreatePostModal date={modalDate} onClose={() => setModalDate(null)} onSave={handleSavePost} />
      )}

      {selectedPost && (
        <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} onUpdate={fetchPosts} />
      )}
    </div>
  );
}
