'use client';

import { Post, PostStatus } from '@/types';

const statusConfig: Record<PostStatus, { label: string; bg: string; text: string }> = {
  draft:          { label: 'Draft',     bg: 'bg-ink-muted/15',   text: 'text-ink-muted' },
  pending_review: { label: 'Pending',   bg: 'bg-warning/15',     text: 'text-warning' },
  scheduled:      { label: 'Scheduled', bg: 'bg-brand-gold/20',  text: 'text-gold-dark' },
  published:      { label: 'Published', bg: 'bg-success/15',     text: 'text-success' },
  rejected:       { label: 'Rejected',  bg: 'bg-alert/15',       text: 'text-alert' },
};

export const postTypeConfig: Record<string, { cardBg: string; badgeColor: string }> = {
  'Educational':       { cardBg: '#EFF6FF', badgeColor: '#2563EB' },
  'Promotional':       { cardBg: '#FFFBEB', badgeColor: '#D97706' },
  'Before/After':      { cardBg: '#ECFDF5', badgeColor: '#059669' },
  'Behind Scenes':     { cardBg: 'rgba(71,85,105,0.10)', badgeColor: '#475569' },
  'Trending/Viral':    { cardBg: '#FFF1F2', badgeColor: '#E11D48' },
  'Testimonial':       { cardBg: '#F5F3FF', badgeColor: '#7C3AED' },
  'Seasonal':          { cardBg: 'rgba(245,158,11,0.25)', badgeColor: '#B45309' },
};

const defaultPostType = { cardBg: '#FFFFFF', badgeColor: '#64748B' };

export default function PostSlot({ post, onClick }: { post: Post; onClick?: () => void }) {
  const status = statusConfig[post.status] || statusConfig.draft;
  const ptConfig = (post.post_type && postTypeConfig[post.post_type]) || defaultPostType;
  const badgeDisplayName: Record<string, string> = {
    'Behind the Scenes': 'Behind Scenes',
  };
  const displayLabel = post.post_type ? (badgeDisplayName[post.post_type] ?? post.post_type) : '';
  const time = post.scheduled_at
    ? new Date(post.scheduled_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : '';

  return (
    <div
      className="border border-sand-border rounded-lg p-2 mb-2 shadow-[0_1px_2px_rgba(42,36,25,0.06)] hover:shadow-[0_2px_6px_rgba(42,36,25,0.10)] transition cursor-pointer"
      style={{ backgroundColor: ptConfig.cardBg }}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
    >
      <div className="flex items-center gap-1.5 flex-wrap mb-1">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.bg} ${status.text}`}>
          {status.label}
        </span>
        {post.post_type && (
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
            style={{ backgroundColor: ptConfig.badgeColor + '1A', color: ptConfig.badgeColor }}
          >
            {displayLabel}
          </span>
        )}
        {time && <span className="text-[11px] text-ink-muted ml-auto">{time}</span>}
      </div>
      <p className="text-sm text-ink-primary line-clamp-2">{post.caption || 'No caption'}</p>
      {post.platforms && post.platforms.length > 0 && (
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {post.platforms.map((p) => (
            <span key={p} className="text-[11px] bg-cream-bg/70 text-ink-muted px-1.5 py-0.5 rounded font-medium">
              {p}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
