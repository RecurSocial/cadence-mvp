'use client';

import { useState, useEffect } from 'react';
import { Post, PostReview } from '@/types';
import { postTypeConfig } from './PostSlot';

const PLATFORMS = ['Instagram', 'Facebook', 'TikTok', 'GBP'];
const POST_TYPES = ['Educational', 'Before/After', 'Promotional', 'Behind Scenes', 'Trending/Viral', 'Testimonial', 'Seasonal'];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = ['00', '15', '30', '45'];

const POST_TYPE_TIMES: Record<string, { hour: number; minute: string; ampm: string }> = {
  'Educational':        { hour: 11, minute: '00', ampm: 'AM' },
  'Promotional':        { hour: 12, minute: '00', ampm: 'PM' },
  'Before/After':       { hour: 6,  minute: '00', ampm: 'PM' },
  'Behind Scenes':      { hour: 9,  minute: '00', ampm: 'AM' },
  'Trending/Viral':     { hour: 9,  minute: '00', ampm: 'AM' },
  'Testimonial':        { hour: 11, minute: '00', ampm: 'AM' },
  'Seasonal':           { hour: 11, minute: '00', ampm: 'AM' },
};

const inputClass = 'w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition';
const labelClass = 'block text-sm font-medium text-[#0F172A] mb-1';

function parse12Hour(date: Date): { hour: number; minute: string; ampm: string } {
  let h = date.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const mins = date.getMinutes();
  const snapped = String(Math.round(mins / 15) * 15 % 60).padStart(2, '0');
  return { hour: h, minute: snapped, ampm };
}

interface PostDetailModalProps {
  post: Post;
  onClose: () => void;
  onUpdate: () => Promise<void>;
}

export default function PostDetailModal({ post, onClose, onUpdate }: PostDetailModalProps) {
  const [mode, setMode] = useState<'view' | 'edit' | 'confirmDelete'>('view');
  const [saving, setSaving] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState<string | null>(null);
  const [isRevising, setIsRevising] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const scheduledDate = post.scheduled_at ? new Date(post.scheduled_at) : new Date();
  const parsed = parse12Hour(scheduledDate);

  const [caption, setCaption] = useState(post.caption || '');
  const [hashtags, setHashtags] = useState(post.hashtags || '');
  const [postType, setPostType] = useState(post.post_type || '');
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [ampm, setAmpm] = useState(parsed.ampm);
  const [platforms, setPlatforms] = useState<string[]>(post.platforms || []);

  const ptConfig = (post.post_type && postTypeConfig[post.post_type]) || { cardBg: '#FFFFFF', badgeColor: '#64748B' };

  const dateLabel = scheduledDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeLabel = scheduledDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  // Fetch rejection notes if status is rejected
  useEffect(() => {
    if (post.status === 'rejected') {
      fetch(`/api/posts/${post.id}/reviews`)
        .then((r) => r.json())
        .then((reviews: PostReview[]) => {
          const rejection = reviews.find((r) => r.action === 'rejected');
          setRejectionNotes(rejection?.notes || null);
        })
        .catch(() => setRejectionNotes(null));
    }
  }, [post.id, post.status]);

  const handlePostTypeChange = (type: string) => {
    setPostType(type);
    const defaults = POST_TYPE_TIMES[type];
    if (defaults) { setHour(defaults.hour); setMinute(defaults.minute); setAmpm(defaults.ampm); }
  };

  const togglePlatform = (platform: string) => {
    setPlatforms((prev) => prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let h24 = hour % 12;
      if (ampm === 'PM') h24 += 12;
      const timeStr = `${String(h24).padStart(2, '0')}:${minute}`;
      const dateStr = scheduledDate.toISOString().split('T')[0];
      const scheduled_at = new Date(`${dateStr}T${timeStr}:00`).toISOString();

      const wasScheduled = post.status === 'scheduled';
      const putBody: Record<string, unknown> = { caption, hashtags, scheduled_at, platforms, post_type: postType };
      if (wasScheduled) putBody.status = 'pending_review';

      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(putBody),
      });
      if (!res.ok) throw new Error('Failed to update');

      if (wasScheduled) {
        // Insert resubmitted_after_edit review record
        await fetch(`/api/posts/${post.id}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'resubmitted_after_edit', notes: 'Post edited after scheduling — returned to approval queue' }),
        }).catch(() => {});
        await onUpdate();
        setStatusMessage('This post has been returned to the approval queue for review.');
        setMode('view');
        return;
      }

      await onUpdate();
      onClose();
    } catch (err) {
      console.error('Error updating post:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await onUpdate();
      onClose();
    } catch (err) {
      console.error('Error deleting post:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/submit`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to submit');
      await onUpdate();
      onClose();
    } catch (err) {
      console.error('Error submitting post:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReviseAndResubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'draft' }),
      });
      if (!res.ok) throw new Error('Failed to revert to draft');
      await onUpdate();
      setIsRevising(true);
      setMode('edit');
    } catch (err) {
      console.error('Error reverting post:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndSubmitForReview = async () => {
    setSaving(true);
    try {
      let h24 = hour % 12;
      if (ampm === 'PM') h24 += 12;
      const timeStr = `${String(h24).padStart(2, '0')}:${minute}`;
      const dateStr = scheduledDate.toISOString().split('T')[0];
      const scheduled_at = new Date(`${dateStr}T${timeStr}:00`).toISOString();

      const putRes = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption, hashtags, scheduled_at, platforms, post_type: postType }),
      });
      if (!putRes.ok) throw new Error('Failed to update');

      const submitRes = await fetch(`/api/posts/${post.id}/submit`, { method: 'POST' });
      if (!submitRes.ok) throw new Error('Failed to submit');

      await onUpdate();
      onClose();
    } catch (err) {
      console.error('Error saving & submitting:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setCaption(post.caption || '');
    setHashtags(post.hashtags || '');
    setPostType(post.post_type || '');
    setHour(parsed.hour);
    setMinute(parsed.minute);
    setAmpm(parsed.ampm);
    setPlatforms(post.platforms || []);
    setMode('view');
  };

  // Status label config
  const statusDisplay: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: 'Draft', color: '#64748B', bg: 'bg-[#64748B]/15' },
    pending_review: { label: 'Awaiting Approval', color: '#D97706', bg: 'bg-[#F59E0B]/15' },
    scheduled: { label: 'Scheduled', color: '#059669', bg: 'bg-[#10B981]/15' },
    published: { label: 'Published', color: '#059669', bg: 'bg-[#10B981]/15' },
    rejected: { label: 'Rejected', color: '#DC2626', bg: 'bg-[#EF4444]/15' },
  };
  const statusInfo = statusDisplay[post.status] || statusDisplay.draft;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="rounded-t-xl px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between" style={{ borderTop: `3px solid ${ptConfig.badgeColor}` }}>
          <div>
            <h3 className="text-base font-semibold text-[#0F172A]">
              {mode === 'edit' ? 'Edit Post' : mode === 'confirmDelete' ? 'Delete Post' : 'Post Details'}
            </h3>
            <p className="text-sm text-[#64748B] mt-0.5">{dateLabel} at {timeLabel}</p>
          </div>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#64748B] text-xl leading-none transition">&times;</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Confirm Delete */}
          {mode === 'confirmDelete' && (
            <div className="space-y-4">
              <p className="text-sm text-[#0F172A]">Are you sure you want to delete this post? This action cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setMode('view')} className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-[#F8F9FB] text-sm font-medium transition">Cancel</button>
                <button onClick={handleDelete} disabled={saving} className="px-4 py-2 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-lg text-sm font-medium disabled:opacity-50 transition">
                  {saving ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          )}

          {/* View Mode */}
          {mode === 'view' && (
            <div className="space-y-4">
              {/* Status badge */}
              <div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusInfo.bg}`} style={{ color: statusInfo.color }}>
                  {statusInfo.label}
                </span>
              </div>

              {/* Rejection notes */}
              {post.status === 'rejected' && rejectionNotes && (
                <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg px-4 py-3">
                  <p className="text-xs font-medium text-[#DC2626] uppercase tracking-wider mb-1">Rejection Reason</p>
                  <p className="text-sm text-[#0F172A]">{rejectionNotes}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-1">Caption</p>
                <p className="text-sm text-[#0F172A] whitespace-pre-wrap">{post.caption || 'No caption'}</p>
              </div>
              {post.hashtags && (
                <div>
                  <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-1">Hashtags</p>
                  <p className="text-sm text-[#4F46E5]">{post.hashtags}</p>
                </div>
              )}
              <div className="flex gap-8">
                <div>
                  <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-1">Post Type</p>
                  {post.post_type ? (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: ptConfig.badgeColor + '1A', color: ptConfig.badgeColor }}>{post.post_type}</span>
                  ) : (
                    <p className="text-sm text-[#94A3B8]">None</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-1">Status</p>
                  <p className="text-sm text-[#0F172A] capitalize">{post.status.replace('_', ' ')}</p>
                </div>
              </div>
              {post.platforms && post.platforms.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-1">Platforms</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {post.platforms.map((p) => (
                      <span key={p} className="text-xs bg-[#F1F5F9] text-[#64748B] px-2 py-1 rounded font-medium">{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Status message */}
              {statusMessage && (
                <div className="bg-[#4F46E5]/10 border border-[#4F46E5]/20 rounded-lg px-4 py-3">
                  <p className="text-sm text-[#4F46E5] font-medium">{statusMessage}</p>
                </div>
              )}

              {/* Footer actions — status-aware */}
              <div className="flex gap-3 justify-end pt-2 border-t border-[#E2E8F0]">
                {post.status === 'draft' && (
                  <>
                    <button onClick={() => setMode('confirmDelete')} className="px-4 py-2 border border-[#EF4444] rounded-lg text-[#EF4444] hover:bg-[#EF4444]/10 text-sm font-medium transition">Delete</button>
                    <button onClick={() => setMode('edit')} className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-[#F8F9FB] text-sm font-medium transition">Edit</button>
                    <button onClick={handleSubmitForReview} disabled={saving} className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-sm font-medium disabled:opacity-50 transition">
                      {saving ? 'Submitting...' : 'Submit for Review'}
                    </button>
                  </>
                )}
                {post.status === 'rejected' && (
                  <>
                    <button onClick={() => setMode('confirmDelete')} className="px-4 py-2 border border-[#EF4444] rounded-lg text-[#EF4444] hover:bg-[#EF4444]/10 text-sm font-medium transition">Delete</button>
                    <button onClick={handleReviseAndResubmit} disabled={saving} className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-sm font-medium disabled:opacity-50 transition">
                      {saving ? 'Reverting...' : 'Revise & Resubmit'}
                    </button>
                  </>
                )}
                {post.status === 'scheduled' && (
                  <button onClick={() => setMode('edit')} className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-sm font-medium transition">Edit</button>
                )}
                {/* pending_review shows no action buttons */}
              </div>
            </div>
          )}

          {/* Edit Mode */}
          {mode === 'edit' && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Caption</label>
                <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={4} className={inputClass + ' resize-none'} placeholder="Write your post caption..." />
              </div>
              <div>
                <label className={labelClass}>Hashtags</label>
                <input type="text" value={hashtags} onChange={(e) => setHashtags(e.target.value)} className={inputClass} placeholder="#medspa #beauty #skincare" />
              </div>
              <div>
                <label className={labelClass}>Post Type</label>
                <select value={postType} onChange={(e) => handlePostTypeChange(e.target.value)} className={inputClass}>
                  <option value="">Select post type</option>
                  {POST_TYPES.map((type) => (<option key={type} value={type}>{type}</option>))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Scheduled Time</label>
                <div className="flex gap-2">
                  <select value={hour} onChange={(e) => setHour(Number(e.target.value))} className={'flex-1 ' + inputClass}>
                    {HOURS.map((h) => (<option key={h} value={h}>{h}</option>))}
                  </select>
                  <select value={minute} onChange={(e) => setMinute(e.target.value)} className={'flex-1 ' + inputClass}>
                    {MINUTES.map((m) => (<option key={m} value={m}>{m}</option>))}
                  </select>
                  <select value={ampm} onChange={(e) => setAmpm(e.target.value)} className={'flex-1 ' + inputClass}>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-2">Platforms</label>
                <div className="flex flex-wrap gap-3">
                  {PLATFORMS.map((platform) => (
                    <label key={platform} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={platforms.includes(platform)} onChange={() => togglePlatform(platform)} className="rounded border-[#E2E8F0] text-[#4F46E5] focus:ring-[#4F46E5]" />
                      <span className="text-sm text-[#0F172A]">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2 border-t border-[#E2E8F0]">
                <button onClick={handleCancel} className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-[#F8F9FB] text-sm font-medium transition">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 border border-[#E2E8F0] rounded-lg text-[#0F172A] hover:bg-[#F8F9FB] text-sm font-medium disabled:opacity-50 transition">
                  {saving ? 'Saving...' : 'Save as Draft'}
                </button>
                <button onClick={handleSaveAndSubmitForReview} disabled={saving} className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-sm font-medium disabled:opacity-50 transition">
                  {saving ? 'Submitting...' : 'Save & Submit for Review'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
