'use client';

import { Post, PostStatus } from '@/types';

const statusConfig: Record<PostStatus, { label: string; bg: string; text: string }> = {
  draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-700' },
  pending_review: { label: 'Pending', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  scheduled: { label: 'Scheduled', bg: 'bg-blue-100', text: 'text-blue-800' },
  published: { label: 'Published', bg: 'bg-green-100', text: 'text-green-800' },
  rejected: { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-800' },
};

export default function PostSlot({ post }: { post: Post }) {
  const status = statusConfig[post.status] || statusConfig.draft;
  const time = post.scheduled_at
    ? new Date(post.scheduled_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : '';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-2 mb-2 shadow-sm hover:shadow transition">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
          {status.label}
        </span>
        {time && <span className="text-xs text-gray-400">{time}</span>}
      </div>
      <p className="text-sm text-gray-800 line-clamp-2">{post.caption || 'No caption'}</p>
      {post.platforms && post.platforms.length > 0 && (
        <div className="flex gap-1 mt-1 flex-wrap">
          {post.platforms.map((p) => (
            <span key={p} className="text-xs bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded">
              {p}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
