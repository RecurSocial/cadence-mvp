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
      <div key={item.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-1">
              from <strong>{item.submitted_by_name}</strong>
            </p>
            {item.url ? (
              <span className="text-sm text-blue-600 truncate block">
                {item.url}
              </span>
            ) : null}
            {item.note ? (
              <p className="text-sm text-gray-700 mt-1">{item.note}</p>
            ) : null}
          </div>
          {canReview ? (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={function() { handleReview(item.id, 'approved', item) }}
                className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"
              >
                Create Post
              </button>
              <button
                onClick={function() { handleReview(item.id, 'passed') }}
                className="px-3 py-1.5 border border-gray-300 text-gray-600 text-xs rounded-lg hover:bg-gray-50"
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
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">
            Trend Inbox
            {items.length > 0 ? (
              <span className="ml-2 bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            ) : null}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Viral content ideas waiting for review</p>
        </div>
        <button
          onClick={function() { setShowSubmitForm(function(s) { return !s }) }}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          + Submit Trend
        </button>
      </div>
      {showSubmitForm ? (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
          <input
            type="url"
            value={url}
            onChange={function(e) { setUrl(e.target.value) }}
            placeholder="Paste Instagram or TikTok URL..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            value={note}
            onChange={function(e) { setNote(e.target.value) }}
            placeholder="What is the angle? Why is this relevant for us?"
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={submitting || (!url && !note)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-40"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
            <button
              onClick={function() { setShowSubmitForm(false) }}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No pending trends. Submit one above!</p>
      ) : (
        <div className="space-y-3">
          {items.map(function(item) { return renderItem(item) })}
        </div>
      )}
    </div>
  )
}
