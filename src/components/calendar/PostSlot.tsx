'use client';

import { Post, PostStatus } from '@/types';

const statusConfig: Record<PostStatus, { label: string; bg: string; text: string }> = {
  draft: { label: 'Draft', bg: 'bg-[#64748B]/15', text: 'text-[#64748B]' },
  pending_review: { label: 'Pending', bg: 'bg-[#F59E0B]/15', text: 'text-[#D97706]' },
  scheduled: { label: 'Scheduled', bg: 'bg-[#4F46E5]/15', text: 'text-[#4F46E5]' },
  published: { label: 'Published', bg: 'bg-[#10B981]/15', text: 'text-[#059669]' },
  rejected: { label: 'Rejected', bg: 'bg-[#EF4444]/15', text: 'text-[#DC2626]' },
};

export const postTypeConfig: Record<string, { cardBg: string; badgeColor: string }> = {
  'Educational':       { cardBg: '#EEF2FF', badgeColor: '#4F46E5' },
  'Promotional':       { cardBg: '#FFFBEB', badgeColor: '#D97706' },
  'Before/After':      { cardBg: '#ECFDF5', badgeColor: '#059669' },
  'Behind Scenes':     { cardBg: '#F0F9FF', badgeColor: '#0284C7' },
  'Trending/Viral':    { cardBg: '#FFF1F2', badgeColor: '#E11D48' },
  'Testimonial':       { cardBg: '#F5F3FF', badgeColor: '#7C3AED' },
  'Seasonal':          { cardBg: '#FFF7ED', badgeColor: '#EA580C' },
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
      className="border border-[#E2E8F0] rounded-lg p-2 mb-2 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-md transition cursor-pointer"
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
            style={{ backgroundColor: ptConfig.badgeColor + '26', color: ptConfig.badgeColor }}
          >
            {displayLabel}
          </span>
        )}
        {time && <span className="text-[11px] text-[#94A3B8] ml-auto">{time}</span>}
      </div>
      <p className="text-sm text-[#0F172A] line-clamp-2">{post.caption || 'No caption'}</p>
      {post.platforms && post.platforms.length > 0 && (
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {post.platforms.map((p) => (
            <span key={p} className="text-[11px] bg-white/60 text-[#64748B] px-1.5 py-0.5 rounded font-medium">
              {p}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
