'use client'
import { useState } from 'react'

interface CampaignPost {
  slot_label: string
  days_before: number
  suggested_date: string
  suggested_time: string
  platform: string
  format: string
  caption: string
  hashtags: string[]
  media_guidance: string
}

interface Props {
  event_name: string
  event_date: string
  campaign_posts: CampaignPost[]
  onApprove: (selectedPosts: CampaignPost[]) => void
  onCancel: () => void
}

export default function EventCampaignReview({ event_name, event_date, campaign_posts, onApprove, onCancel }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set(campaign_posts.map((_, i) => i)))
  const [expanded, setExpanded] = useState<number | null>(0)

  const toggle = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const platformIcon: Record<string, string> = { instagram: '📸', facebook: '👍', tiktok: '🎵' }
  const formatIcon: Record<string, string> = { post: '🖼️', reel: '🎬', story: '📱', carousel: '🎠' }

  return (
    <div className="fixed inset-0 bg-ink-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bone-surface border border-sand-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-sand-border">
          <div>
            <h2 className="font-display text-xl text-ink-primary">{event_name} — Campaign</h2>
            <p className="text-sm text-ink-muted mt-0.5">
              {campaign_posts.length} posts proposed • {selected.size} selected • Event: {new Date(event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button onClick={onCancel} className="text-ink-muted hover:text-ink-primary text-xl leading-none transition">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="p-3 bg-brand-gold/10 border border-brand-gold/30 rounded-lg text-sm text-gold-dark">
            <strong className="font-medium">Review your campaign.</strong> Check the posts you want to schedule — each approved post will enter your normal approval workflow. Uncheck any you want to skip.
          </div>

          {campaign_posts.map((post, i) => (
            <div
              key={i}
              className={`border-2 rounded-lg transition-all ${selected.has(i) ? 'border-brand-gold bg-cream-bg' : 'border-sand-border bg-bone-surface/40 opacity-60'}`}
            >
              <div className="flex items-start gap-3 p-4">
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => toggle(i)}
                  className="mt-0.5 rounded border-sand-border text-brand-gold focus:ring-brand-gold"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-ink-muted bg-bone-surface border border-sand-border px-2 py-0.5 rounded">{post.slot_label}</span>
                    <span className="text-xs text-ink-muted">{platformIcon[post.platform]} {post.platform} {formatIcon[post.format]} {post.format}</span>
                    <span className="text-xs text-ink-muted">{new Date(post.suggested_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {post.suggested_time}</span>
                  </div>
                  <p className="text-sm text-ink-primary mt-2 line-clamp-2">{post.caption}</p>
                  <button
                    onClick={() => setExpanded(expanded === i ? null : i)}
                    className="text-xs text-gold-dark hover:text-ink-primary mt-1 transition"
                  >
                    {expanded === i ? 'Hide details ↑' : 'Show full post ↓'}
                  </button>
                  {expanded === i && (
                    <div className="mt-3 space-y-2">
                      <div>
                        <p className="text-xs font-medium text-ink-muted mb-1 uppercase tracking-wider">Full caption:</p>
                        <p className="text-sm text-ink-primary whitespace-pre-wrap">{post.caption}</p>
                      </div>
                      {post.hashtags?.length > 0 && (
                        <p className="text-xs text-gold-dark">{post.hashtags.join(' ')}</p>
                      )}
                      <div className="p-2 bg-brand-gold/10 border border-brand-gold/20 rounded text-xs text-gold-dark">
                        📸 {post.media_guidance}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-sand-border bg-cream-bg rounded-b-xl">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-ink-muted hover:text-ink-primary transition">Cancel</button>
          <button
            onClick={() => onApprove(campaign_posts.filter((_, i) => selected.has(i)))}
            disabled={selected.size === 0}
            className="px-6 py-2 bg-brand-gold hover:bg-gold-dark text-white text-sm font-medium rounded-lg disabled:opacity-40 transition"
          >
            Schedule {selected.size} Post{selected.size !== 1 ? 's' : ''} →
          </button>
        </div>
      </div>
    </div>
  )
}