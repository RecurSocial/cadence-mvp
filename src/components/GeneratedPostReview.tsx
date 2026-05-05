'use client'
import { useState } from 'react'

interface GeneratedPost {
  caption: string
  hashtags: string[]
  script: string | null
  media_guidance: string
  urgency_note: string | null
  slide_copy: { slide: number; text: string }[] | null
}

interface Props {
  generated: GeneratedPost
  platforms: string[]
  format: string
  post_type: string
  onUse: (caption: string, hashtags: string[]) => void
  onRegenerate: () => void
  onCancel: () => void
}

export default function GeneratedPostReview({ generated, platforms, format, post_type, onUse, onRegenerate, onCancel }: Props) {
  const [caption, setCaption] = useState(generated.caption)
  const [hashtagStr, setHashtagStr] = useState(generated.hashtags.join(' '))

  const fullCaption = caption + (hashtagStr ? '\n\n' + hashtagStr : '')

  return (
    <div className="fixed inset-0 bg-ink-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bone-surface border border-sand-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-sand-border">
          <div>
            <h2 className="font-display text-xl text-ink-primary">AI-Generated Draft</h2>
            <p className="text-sm text-ink-muted mt-0.5">
              {platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' + ')} • {format.charAt(0).toUpperCase() + format.slice(1)}
            </p>
          </div>
          <button onClick={onCancel} className="text-ink-muted hover:text-ink-primary text-xl leading-none transition">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Urgency note for trends — content surface, not restyled (post-creation internals) */}
          {generated.urgency_note && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
              ⚡ {generated.urgency_note}
            </div>
          )}

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-ink-primary mb-2">Caption (edit freely)</label>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              rows={6}
              className="w-full bg-cream-bg border border-sand-border rounded-lg px-3 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition"
            />
            <p className="text-xs text-ink-muted mt-1">{caption.length} characters</p>
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-sm font-medium text-ink-primary mb-2">Hashtags</label>
            <input
              type="text"
              value={hashtagStr}
              onChange={e => setHashtagStr(e.target.value)}
              className="w-full bg-cream-bg border border-sand-border rounded-lg px-3 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition"
            />
          </div>

          {/* Teleprompter script */}
          {generated.script && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🎬 Teleprompter Script
                <span className="ml-2 text-xs font-normal text-gray-400">(read this on camera — word for word)</span>
              </label>
              <div className="bg-gray-900 text-green-400 rounded-lg p-4 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                {generated.script}
              </div>
            </div>
          )}

          {/* Carousel slides */}
          {generated.slide_copy && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">🎠 Carousel Slide Copy</label>
              <div className="space-y-2">
                {generated.slide_copy.map(slide => (
                  <div key={slide.slide} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
                    <span className="text-xs font-bold text-gray-400 bg-white border rounded px-2 py-0.5 shrink-0">Slide {slide.slide}</span>
                    <span className="text-sm text-gray-700">{slide.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Media guidance */}
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-xs font-semibold text-blue-700 mb-1">📸 Media Guidance</p>
            <p className="text-sm text-blue-800">{generated.media_guidance}</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-sand-border bg-cream-bg rounded-b-xl">
          <div className="flex gap-3">
            <button onClick={onCancel} className="px-4 py-2 text-sm text-ink-muted hover:text-ink-primary transition">
              Cancel
            </button>
            <button onClick={onRegenerate} className="px-4 py-2 text-sm border border-sand-border text-ink-primary rounded-lg hover:bg-bone-surface transition">
              ↺ Regenerate
            </button>
          </div>
          <button
            onClick={() => onUse(fullCaption, generated.hashtags)}
            className="px-6 py-2 bg-brand-gold hover:bg-gold-dark text-white text-sm font-medium rounded-lg transition"
          >
            Use This Draft →
          </button>
        </div>
      </div>
    </div>
  )
}