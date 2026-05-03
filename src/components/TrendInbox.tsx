'use client'
import { useState, useEffect } from 'react'

const ORG_ID = '74b04f56-8cf0-7427-b977-7574b183226d'

interface TrendItem {
  id: string
  submitted_by_name: string
  url: string | null
  note: string | null
  created_at: string
  status: string
}

interface Props {
  currentUserName: string
  currentUserId: string
  canReview: boolean
  onApprove: (item: TrendItem) => void
}

export default function TrendInbox({ currentUserName, currentUserId, canReview, onApprove }: Props) {
  const [items, setItems] = useState<TrendItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/trend-inbox?org_id=' + ORG_ID + '&status=pending')
      const data = await res.json()
      setItems(data.items || [])
    } catch (err) {
      console.error('Failed to fetch trend inbox:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(function() { fetchItems() }, [])

  const handleSubmit = async () => {
    if (!url && !note) return
    setSubmitting(true)
    try {
      await fetch('/api/trend-inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: ORG_ID,
          submitted_by_user_id: currentUserId,
          submitted_by_name: currentUserName,
          url: url || null,
          note: note || null,
        }),
      })
      setUrl('')
      setNote('')
      setShowSubmitForm(false)
      fetchItems()
    } catch (err) {
      console.error('Failed to submit trend:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReview = async (id: string, status: 'approved' | 'passed', item?: TrendItem) => {
    try {
      await fetch('/api/trend-inbox', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          reviewed_by_user_id: currentUserId,
          reviewed_by_name: currentUserName,
        }),
      })
      if (status === 'approved' && item) onApprove(item)
      fetchItems()
    } catch (err) {
      console.error('Failed to review trend:', err)
    }
  }

  function renderItem(item: TrendItem) {
    return (
      <div key={item.id} className="p-3 border border-sand-border rounded-lg hover:bg-cream-bg transition">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-ink-muted mb-1">
              from <strong className="text-ink-primary font-medium">{item.submitted_by_name}</strong>
            </p>
            {item.url ? (
              <span className="text-sm text-gold-dark truncate block">
                {item.url}
              </span>
            ) : null}
            {item.note ? (
              <p className="text-sm text-ink-primary mt-1">{item.note}</p>
            ) : null}
          </div>
          {canReview ? (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={function() { handleReview(item.id, 'approved', item) }}
                className="px-3 py-1.5 bg-brand-gold hover:bg-gold-dark text-white text-xs rounded-lg font-medium transition"
              >
                Create Post
              </button>
              <button
                onClick={function() { handleReview(item.id, 'passed') }}
                className="px-3 py-1.5 border border-sand-border text-ink-muted hover:bg-cream-bg hover:text-ink-primary text-xs rounded-lg font-medium transition"
              >
                Pass
              </button>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-bone-surface border border-sand-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-ink-primary">
            Trend Inbox
            {items.length > 0 ? (
              <span className="ml-2 bg-brand-gold/20 text-gold-dark text-xs font-medium px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            ) : null}
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">Viral content ideas waiting for review</p>
        </div>
        <button
          onClick={function() { setShowSubmitForm(function(s) { return !s }) }}
          className="text-sm text-gold-dark hover:text-ink-primary font-medium transition"
        >
          + Submit Trend
        </button>
      </div>
      {showSubmitForm ? (
        <div className="mb-4 p-4 bg-cream-bg rounded-lg border border-sand-border space-y-3">
          <input
            type="url"
            value={url}
            onChange={function(e) { setUrl(e.target.value) }}
            placeholder="Paste Instagram or TikTok URL..."
            className="w-full bg-cream-bg border border-sand-border rounded-lg px-3 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition"
          />
          <textarea
            value={note}
            onChange={function(e) { setNote(e.target.value) }}
            placeholder="What is the angle? Why is this relevant for us?"
            rows={2}
            className="w-full bg-cream-bg border border-sand-border rounded-lg px-3 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-gold focus:border-transparent transition"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={submitting || (!url && !note)}
              className="px-4 py-2 bg-brand-gold hover:bg-gold-dark text-white text-sm rounded-lg font-medium disabled:opacity-40 transition"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
            <button
              onClick={function() { setShowSubmitForm(false) }}
              className="px-4 py-2 text-sm text-ink-muted hover:text-ink-primary transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
      {loading ? (
        <p className="text-sm text-ink-muted">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-ink-muted text-center py-4">No pending trends. Submit one above.</p>
      ) : (
        <div className="space-y-3">
          {items.map(function(item) { return renderItem(item) })}
        </div>
      )}
    </div>
  )
}
