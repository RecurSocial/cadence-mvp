'use client';

import { useEffect, useState, useCallback } from 'react';
import { Post } from '@/types';
import { postTypeConfig } from '@/components/calendar/PostSlot';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { canApproveReject } from '@/lib/auth/permissions';

const PLATFORMS = ['Instagram', 'Facebook', 'TikTok', 'GBP'];
const POST_TYPES = ['Educational', 'Before/After', 'Promotional', 'Behind Scenes', 'Trending/Viral', 'Testimonial', 'Seasonal'];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = ['00', '15', '30', '45'];

const POST_TYPE_TIMES: Record<string, { hour: number; minute: string; ampm: string }> = {
  'Educational':   { hour: 11, minute: '00', ampm: 'AM' },
  'Promotional':   { hour: 12, minute: '00', ampm: 'PM' },
  'Before/After':  { hour: 6,  minute: '00', ampm: 'PM' },
  'Behind Scenes': { hour: 9,  minute: '00', ampm: 'AM' },
  'Trending/Viral':{ hour: 9,  minute: '00', ampm: 'AM' },
  'Testimonial':   { hour: 11, minute: '00', ampm: 'AM' },
  'Seasonal':      { hour: 11, minute: '00', ampm: 'AM' },
};

const inputClass = 'w-full px-3.5 py-2.5 bg-cream-bg border border-sand-border rounded-lg text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition';
const labelClass = 'block text-sm font-medium text-ink-primary mb-1';

function parse12Hour(date: Date) {
  let h = date.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const snapped = String(Math.round(date.getMinutes() / 15) * 15 % 60).padStart(2, '0');
  return { hour: h, minute: snapped, ampm };
}

export default function ApprovalsPage() {
  const { orgId: ctxOrgId, role: userRole } = useCurrentUser();
  const [orgId, setOrgId] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    caption: string; hashtags: string; post_type: string;
    hour: number; minute: string; ampm: string; platforms: string[];
  } | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const isReviewer = canApproveReject(userRole);

  useEffect(() => {
    const id = ctxOrgId || localStorage.getItem('org_id') || '74b04f56-8cf0-7427-b977-7574b183226d';
    setOrgId(id);
  }, [ctxOrgId]);

  const fetchPendingPosts = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/posts?org_id=${orgId}&week_start=2000-01-01T00:00:00.000Z&week_end=2099-12-31T23:59:59.999Z`);
      const data = await res.json();
      const pending = Array.isArray(data) ? data.filter((p: Post) => p.status === 'pending_review') : [];
      setPosts(pending);
    } catch (err) {
      console.error('Error fetching pending posts:', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { fetchPendingPosts(); }, [fetchPendingPosts]);

  const handleApprove = async (postId: string) => {
    setProcessing(postId);
    try {
      const res = await fetch(`/api/posts/${postId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approved' }),
      });
      if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) { console.error('Error approving post:', err); }
    finally { setProcessing(null); }
  };

  const handleReject = async (postId: string) => {
    if (!rejectNotes.trim()) return;
    setProcessing(postId);
    try {
      const res = await fetch(`/api/posts/${postId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rejected', notes: rejectNotes.trim() }),
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        setRejectingId(null);
        setRejectNotes('');
      }
    } catch (err) { console.error('Error rejecting post:', err); }
    finally { setProcessing(null); }
  };

  const startEditing = (post: Post) => {
    const d = post.scheduled_at ? new Date(post.scheduled_at) : new Date();
    const parsed = parse12Hour(d);
    setEditForm({
      caption: post.caption || '',
      hashtags: post.hashtags || '',
      post_type: post.post_type || '',
      hour: parsed.hour,
      minute: parsed.minute,
      ampm: parsed.ampm,
      platforms: post.platforms || [],
    });
    setEditingId(post.id);
    setRejectingId(null);
  };

  const handleEditSave = async (post: Post) => {
    if (!editForm) return;
    setProcessing(post.id);
    try {
      let h24 = editForm.hour % 12;
      if (editForm.ampm === 'PM') h24 += 12;
      const timeStr = `${String(h24).padStart(2, '0')}:${editForm.minute}`;
      const dateStr = (post.scheduled_at ? new Date(post.scheduled_at) : new Date()).toISOString().split('T')[0];
      const scheduled_at = new Date(`${dateStr}T${timeStr}:00`).toISOString();

      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: editForm.caption,
          hashtags: editForm.hashtags,
          post_type: editForm.post_type || null,
          scheduled_at,
          platforms: editForm.platforms,
        }),
      });
      if (res.ok) {
        await fetchPendingPosts();
        setEditingId(null);
        setEditForm(null);
      }
    } catch (err) { console.error('Error saving edit:', err); }
    finally { setProcessing(null); }
  };

  const toggleEditPlatform = (platform: string) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      platforms: editForm.platforms.includes(platform)
        ? editForm.platforms.filter((p) => p !== platform)
        : [...editForm.platforms, platform],
    });
  };

  const handleEditPostTypeChange = (type: string) => {
    if (!editForm) return;
    const defaults = POST_TYPE_TIMES[type];
    setEditForm({
      ...editForm,
      post_type: type,
      ...(defaults ? { hour: defaults.hour, minute: defaults.minute, ampm: defaults.ampm } : {}),
    });
  };

  return (
    <div className="px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-ink-primary">Approvals</h1>
        <p className="mt-1 text-sm text-ink-muted">Review and approve pending posts</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-ink-muted">Loading pending posts...</div>
      ) : posts.length === 0 ? (
        <div className="bg-bone-surface border border-sand-border rounded-xl p-12 text-center">
          <p className="text-ink-primary">No posts pending review</p>
          <p className="text-sm text-ink-muted mt-1">Posts submitted for review will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const ptConfig = (post.post_type && postTypeConfig[post.post_type]) || { cardBg: '#FFFFFF', badgeColor: '#64748B' };
            const scheduledDate = post.scheduled_at
              ? new Date(post.scheduled_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
              : '';
            const scheduledTime = post.scheduled_at
              ? new Date(post.scheduled_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
              : '';
            const isProcessing = processing === post.id;
            const isRejecting = rejectingId === post.id;
            const isEditing = editingId === post.id;

            return (
              <div key={post.id} className="bg-bone-surface border border-sand-border rounded-xl overflow-hidden" style={{ borderLeftWidth: '4px', borderLeftColor: ptConfig.badgeColor }}>
                <div className="p-6">
                  {/* Header row */}
                  <div className="flex items-center gap-2 mb-3">
                    {post.post_type && (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap" style={{ backgroundColor: ptConfig.badgeColor + '1A', color: ptConfig.badgeColor }}>
                        {post.post_type}
                      </span>
                    )}
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-warning/15 text-warning">Pending Review</span>
                    {scheduledDate && <span className="text-xs text-ink-muted ml-auto">{scheduledDate} at {scheduledTime}</span>}
                  </div>

                  {!isEditing ? (
                    <>
                      {/* View mode — full detail */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-1">Caption</p>
                          <p className="text-sm text-ink-primary whitespace-pre-wrap">{post.caption || 'No caption'}</p>
                        </div>
                        {post.hashtags && (
                          <div>
                            <p className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-1">Hashtags</p>
                            <div className="flex gap-1.5 flex-wrap">
                              {post.hashtags.split(/\s+/).filter(Boolean).map((tag) => (
                                <span key={tag} className="text-xs bg-brand-gold/15 text-gold-dark px-2 py-1 rounded-full font-medium">{tag}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {post.platforms && post.platforms.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-1">Platforms</p>
                            <div className="flex gap-1.5 flex-wrap">
                              {post.platforms.map((p) => (
                                <span key={p} className="text-xs bg-cream-bg border border-sand-border text-ink-muted px-2 py-1 rounded font-medium">{p}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-4 pt-4 border-t border-sand-border">
                        {!isReviewer ? (
                          <p className="text-sm text-ink-muted text-right">Waiting for owner or admin review</p>
                        ) : !isRejecting ? (
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => startEditing(post)} disabled={isProcessing} className="px-4 py-2 border border-sand-border rounded-lg text-ink-primary hover:bg-cream-bg text-sm font-medium disabled:opacity-50 transition">Edit</button>
                            <button onClick={() => { setRejectingId(post.id); setRejectNotes(''); }} disabled={isProcessing} className="px-4 py-2 border border-alert text-alert hover:bg-alert/10 rounded-lg text-sm font-medium disabled:opacity-50 transition">Reject</button>
                            <button onClick={() => handleApprove(post.id)} disabled={isProcessing} className="px-4 py-2 bg-brand-gold hover:bg-gold-dark text-white rounded-lg text-sm font-medium disabled:opacity-50 transition">{isProcessing ? 'Approving...' : 'Approve'}</button>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm font-medium text-ink-primary mb-1">Rejection reason (required)</label>
                            <textarea value={rejectNotes} onChange={(e) => setRejectNotes(e.target.value)} rows={3} className={inputClass + ' resize-none'} placeholder="Explain why this post is being rejected..." />
                            <div className="flex gap-2 justify-end mt-2">
                              <button onClick={() => { setRejectingId(null); setRejectNotes(''); }} className="px-4 py-2 border border-sand-border rounded-lg text-ink-primary hover:bg-cream-bg text-sm font-medium transition">Cancel</button>
                              <button onClick={() => handleReject(post.id)} disabled={!rejectNotes.trim() || isProcessing} className="px-4 py-2 bg-alert hover:bg-critical text-white rounded-lg text-sm font-medium disabled:opacity-50 transition">{isProcessing ? 'Rejecting...' : 'Confirm Reject'}</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Edit mode */}
                      {editForm && (
                        <div className="space-y-4 mt-3">
                          <div><label className={labelClass}>Caption</label><textarea value={editForm.caption} onChange={(e) => setEditForm({ ...editForm, caption: e.target.value })} rows={4} className={inputClass + ' resize-none'} /></div>
                          <div><label className={labelClass}>Hashtags</label><input type="text" value={editForm.hashtags} onChange={(e) => setEditForm({ ...editForm, hashtags: e.target.value })} className={inputClass} placeholder="#medspa #beauty" /></div>
                          <div><label className={labelClass}>Post Type</label><select value={editForm.post_type} onChange={(e) => handleEditPostTypeChange(e.target.value)} className={inputClass}><option value="">Select post type</option>{POST_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}</select></div>
                          <div>
                            <label className={labelClass}>Scheduled Time</label>
                            <div className="flex gap-2">
                              <select value={editForm.hour} onChange={(e) => setEditForm({ ...editForm, hour: Number(e.target.value) })} className={'flex-1 ' + inputClass}>{HOURS.map((h) => (<option key={h} value={h}>{h}</option>))}</select>
                              <select value={editForm.minute} onChange={(e) => setEditForm({ ...editForm, minute: e.target.value })} className={'flex-1 ' + inputClass}>{MINUTES.map((m) => (<option key={m} value={m}>{m}</option>))}</select>
                              <select value={editForm.ampm} onChange={(e) => setEditForm({ ...editForm, ampm: e.target.value })} className={'flex-1 ' + inputClass}><option value="AM">AM</option><option value="PM">PM</option></select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-ink-primary mb-2">Platforms</label>
                            <div className="flex flex-wrap gap-3">
                              {PLATFORMS.map((platform) => (
                                <label key={platform} className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" checked={editForm.platforms.includes(platform)} onChange={() => toggleEditPlatform(platform)} className="rounded border-sand-border text-brand-gold focus:ring-brand-gold" />
                                  <span className="text-sm text-ink-primary">{platform}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end pt-2 border-t border-sand-border">
                            <button onClick={() => { setEditingId(null); setEditForm(null); }} className="px-4 py-2 border border-sand-border rounded-lg text-ink-primary hover:bg-cream-bg text-sm font-medium transition">Cancel</button>
                            <button onClick={() => handleEditSave(post)} disabled={isProcessing} className="px-4 py-2 bg-brand-gold hover:bg-gold-dark text-white rounded-lg text-sm font-medium disabled:opacity-50 transition">{isProcessing ? 'Saving...' : 'Save Changes'}</button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
