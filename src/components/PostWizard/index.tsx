'use client'
import { useState } from 'react'
import BeforeAfterBranch from './BeforeAfterBranch'
import SpotlightBranch from './SpotlightBranch'

const ORG_ID = '74b04f56-8cf0-7427-b977-7574b183226d'

const PLATFORMS = ['instagram', 'facebook', 'tiktok']
const FORMATS = ['post', 'reel', 'story', 'carousel']
const POST_TYPES = [
  { value: 'educational', label: '📚 Educational', description: 'Educate your audience about a service, product, or your practice' },
  { value: 'before_after', label: '✨ Before & After', description: 'Showcase a client transformation with photo or video' },
  { value: 'spotlight', label: '👩‍⚕️ Spotlight', description: 'Highlight a practitioner or share a patient testimonial' },
  { value: 'promo_event_seasonal', label: '🏷️ Promo / Event / Seasonal', description: 'Announce an offer, promote an event, or tie content to a season' },
  { value: 'book_now', label: '📅 Book Now', description: 'Drive bookings with a direct call-to-action post' },
  { value: 'trend_viral', label: '🔥 Trend / Viral', description: 'Ride a trend to reach new audiences fast' },
]
const TONES = [
  { value: 'warm', label: '🤗 Warm & Approachable', description: 'Friendly, like a trusted expert' },
  { value: 'professional', label: '🏥 Professional & Clinical', description: 'Authoritative, credibility-forward' },
  { value: 'bold', label: '⚡ Bold & Direct', description: 'Confident, punchy, no fluff' },
  { value: 'playful', label: '😄 Fun & Playful', description: 'Light-hearted and relatable' },
]

interface WizardProps {
  services: { id: string; name: string; category: string }[]
  practitioners: { id: string; first_name: string; last_name: string; specialty: string }[]
  onComplete: (postData: any) => void
  onCancel: () => void
}

export default function PostWizard({ services, practitioners, onComplete, onCancel }: WizardProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram'])
  const [selectedFormat, setSelectedFormat] = useState('post')

  // Step 2
  const [postType, setPostType] = useState('')

  // Step 3 — branch fields
  const [serviceId, setServiceId] = useState('')
  const [practitionerId, setPractitionerId] = useState('')
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [offerDetails, setOfferDetails] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [targetConcern, setTargetConcern] = useState('')
  const [occasion, setOccasion] = useState('')
  const [trendDescription, setTrendDescription] = useState('')
  const [trendUrl, setTrendUrl] = useState('')
  const [keyBenefit, setKeyBenefit] = useState('')
  const [consentConfirmed, setConsentConfirmed] = useState(false)
  const [isEventCampaign, setIsEventCampaign] = useState(false)

  // Step 3 — new fields for refactored branches (Sprint 1)
  const [patientQuote, setPatientQuote] = useState('')
  const [beforeAfterMode, setBeforeAfterMode] = useState<'photo' | 'video'>('photo')
  const [videoUrl, setVideoUrl] = useState('')
  const [videoDescription, setVideoDescription] = useState('')
  const [spotlightMode, setSpotlightMode] = useState<'practitioner' | 'testimonial'>('practitioner')

  // Step 4
  const [tone, setTone] = useState('warm')

  const togglePlatform = (p: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )
  }

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    try {
      if (postType === 'event' && isEventCampaign) {
        const res = await fetch('/api/generate-event-campaign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            org_id: ORG_ID,
            event_name: eventName,
            event_date: eventDate,
            event_time: eventTime,
            service_ids: serviceId ? [serviceId] : [],
            tone,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        onComplete({ type: 'campaign', campaign: data.campaign, event_name: eventName, event_date: eventDate })
      } else {
        const res = await fetch('/api/generate-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            org_id: ORG_ID,
            post_type: postType,
            platforms: selectedPlatforms,
            format: selectedFormat,
            tone,
            service_id: serviceId || undefined,
            practitioner_id: practitionerId || undefined,
            event_name: eventName || undefined,
            event_date: eventDate || undefined,
            event_time: eventTime || undefined,
            offer_details: offerDetails || undefined,
            expiration_date: expirationDate || undefined,
            target_concern: targetConcern || undefined,
            occasion: occasion || undefined,
            trend_description: trendDescription || undefined,
            trend_url: trendUrl || undefined,
            key_benefit: keyBenefit || undefined,
            consent_confirmed: consentConfirmed,
            patient_quote: patientQuote || undefined,
            before_after_mode: postType === 'before_after' ? beforeAfterMode : undefined,
            video_url: videoUrl || undefined,
            video_description: videoDescription || undefined,
            spotlight_mode: postType === 'spotlight' ? spotlightMode : undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        onComplete({ type: 'single', generated: data.generated, platforms: selectedPlatforms, format: selectedFormat, post_type: postType })
      }
    } catch (err: any) {
      setError(err.message || 'Generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const canProceedStep1 = selectedPlatforms.length > 0 && selectedFormat
  const canProceedStep2 = postType !== ''
  const canProceedStep3 = () => {
    if (postType === 'event') return eventName && eventDate
    if (postType === 'before_after') {
      const baseValid = serviceId && consentConfirmed
      if (beforeAfterMode === 'video') return baseValid && videoUrl
      return baseValid
    }
    if (postType === 'spotlight') {
      if (spotlightMode === 'practitioner') return !!practitionerId
      return !!serviceId && consentConfirmed
    }
    if (postType === 'trend_viral') return trendDescription || trendUrl
    return true
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Where are you posting? (select all that apply)</h3>
        <div className="flex gap-3">
          {PLATFORMS.map(p => (
            <button
              key={p}
              onClick={() => togglePlatform(p)}
              className={`px-4 py-2 rounded-lg border-2 text-sm font-medium capitalize transition-all ${
                selectedPlatforms.includes(p)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {p === 'instagram' ? '📸' : p === 'facebook' ? '👍' : '🎵'} {p}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">What format?</h3>
        <div className="grid grid-cols-2 gap-3">
          {FORMATS.map(f => {
            const icons: Record<string, string> = { post: '🖼️', reel: '🎬', story: '📱', carousel: '🎠' }
            const descs: Record<string, string> = {
              post: 'Standard feed image/video',
              reel: 'Short-form video with script',
              story: 'Disappears in 24 hours',
              carousel: 'Swipeable multi-image',
            }
            return (
              <button
                key={f}
                onClick={() => setSelectedFormat(f)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  selectedFormat === f
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-sm capitalize">{icons[f]} {f}</div>
                <div className="text-xs text-gray-500 mt-0.5">{descs[f]}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="grid grid-cols-2 gap-3">
      {POST_TYPES.map(pt => (
        <button
          key={pt.value}
          onClick={() => setPostType(pt.value)}
          className={`p-4 rounded-lg border-2 text-left transition-all ${
            postType === pt.value
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="font-medium text-sm">{pt.label}</div>
          <div className="text-xs text-gray-500 mt-1">{pt.description}</div>
        </button>
      ))}
    </div>
  )

  const renderStep3 = () => {
    const serviceSelect = (label = 'Which service?') => (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select
          value={serviceId}
          onChange={e => setServiceId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a service...</option>
          {services.map(s => (
            <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
          ))}
        </select>
      </div>
    )

    const practitionerSelect = (label = 'Which practitioner?') => (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select
          value={practitionerId}
          onChange={e => setPractitionerId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a practitioner...</option>
          {practitioners.map(p => (
            <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.specialty})</option>
          ))}
        </select>
      </div>
    )

    if (postType === 'educational') return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Topic or service category</label>
          <input
            type="text"
            value={targetConcern}
            onChange={e => setTargetConcern(e.target.value)}
            placeholder="e.g. Neurotoxins, Facial Balancing, Lip Filler, Skin Texture, Weight Loss..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">Type any topic — broad categories like "Neurotoxins" or specific services both work</p>
        </div>
        {serviceSelect('Pin to a specific service (optional)')}
      </div>
    )

    if (postType === 'promotional') return (
      <div className="space-y-4">
        {serviceSelect()}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">What's the offer?</label>
          <input
            type="text"
            value={offerDetails}
            onChange={e => setOfferDetails(e.target.value)}
            placeholder="e.g. 20% off, buy 2 get 1 free, $199 intro package..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expiration date (optional)</label>
          <input
            type="date"
            value={expirationDate}
            onChange={e => setExpirationDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    )

    if (postType === 'before_after') return (
      <BeforeAfterBranch
        services={services}
        practitioners={practitioners}
        serviceId={serviceId}
        setServiceId={setServiceId}
        practitionerId={practitionerId}
        setPractitionerId={setPractitionerId}
        consentConfirmed={consentConfirmed}
        setConsentConfirmed={setConsentConfirmed}
        targetConcern={targetConcern}
        setTargetConcern={setTargetConcern}
        patientQuote={patientQuote}
        setPatientQuote={setPatientQuote}
        beforeAfterMode={beforeAfterMode}
        setBeforeAfterMode={setBeforeAfterMode}
        videoUrl={videoUrl}
        setVideoUrl={setVideoUrl}
        videoDescription={videoDescription}
        setVideoDescription={setVideoDescription}
        spotlightMode={spotlightMode}
        setSpotlightMode={setSpotlightMode}
      />
    )

    if (postType === 'spotlight') return (
      <SpotlightBranch
        services={services}
        practitioners={practitioners}
        serviceId={serviceId}
        setServiceId={setServiceId}
        practitionerId={practitionerId}
        setPractitionerId={setPractitionerId}
        consentConfirmed={consentConfirmed}
        setConsentConfirmed={setConsentConfirmed}
        targetConcern={targetConcern}
        setTargetConcern={setTargetConcern}
        patientQuote={patientQuote}
        setPatientQuote={setPatientQuote}
        beforeAfterMode={beforeAfterMode}
        setBeforeAfterMode={setBeforeAfterMode}
        videoUrl={videoUrl}
        setVideoUrl={setVideoUrl}
        videoDescription={videoDescription}
        setVideoDescription={setVideoDescription}
        spotlightMode={spotlightMode}
        setSpotlightMode={setSpotlightMode}
      />
    )

    if (postType === 'service_feature') return (
      <div className="space-y-4">
        {serviceSelect()}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">What's the key benefit to highlight?</label>
          <input
            type="text"
            value={keyBenefit}
            onChange={e => setKeyBenefit(e.target.value)}
            placeholder="e.g. zero downtime, immediate results, long-lasting..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    )

    if (postType === 'seasonal') return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">What's the occasion or season?</label>
          <input
            type="text"
            value={occasion}
            onChange={e => setOccasion(e.target.value)}
            placeholder="e.g. Mother's Day, summer, back to school..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {serviceSelect('Tie-in service (optional)')}
      </div>
    )

    if (postType === 'event') return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event name <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={eventName}
            onChange={e => setEventName(e.target.value)}
            placeholder="e.g. Moms & Mimosas, Pearls & Prosecco..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event date <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={eventDate}
              onChange={e => setEventDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start time</label>
            <input
              type="time"
              value={eventTime}
              onChange={e => {
                const [h, m] = e.target.value.split(':')
                const mins = ['00','15','30','45']
                const rounded = mins.reduce((a, b) => Math.abs(parseInt(b) - parseInt(m)) < Math.abs(parseInt(a) - parseInt(m)) ? b : a)
                setEventTime(h + ':' + rounded)
              }}
              step="900"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {serviceSelect('Featured service (optional)')}
        <div className="flex items-start gap-3 p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
          <input
            type="checkbox"
            id="campaign_mode"
            checked={isEventCampaign}
            onChange={e => setIsEventCampaign(e.target.checked)}
            className="mt-0.5"
          />
          <label htmlFor="campaign_mode" className="text-sm text-blue-800">
            <span className="font-semibold">Generate full event campaign</span>
            <span className="block text-xs mt-0.5 text-blue-600">Cadence will create a complete posting schedule from now through the day of the event — you review and approve each post individually.</span>
          </label>
        </div>
      </div>
    )

    if (postType === 'trend_viral') return (
      <div className="space-y-4">
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-800">
          <strong>⚡ Trend tip:</strong> Trend content has a 48–72 hour window before it peaks. Consider posting today or tomorrow for maximum reach. Cadence will default this to Reels + TikTok, not Story.
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Paste the trend URL (optional)</label>
          <input
            type="url"
            value={trendUrl}
            onChange={e => setTrendUrl(e.target.value)}
            placeholder="https://www.tiktok.com/... or https://www.instagram.com/..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Describe the trend or concept <span className="text-red-500">*</span></label>
          <textarea
            value={trendDescription}
            onChange={e => setTrendDescription(e.target.value)}
            placeholder="e.g. 'POV you just got your first Botox' trend, or 'things that just make sense at a med spa' relatable format..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    )

    return <p className="text-gray-500 text-sm">Select a post type in step 2.</p>
  }

  const renderStep4 = () => (
    <div className="space-y-3">
      {TONES.map(t => (
        <button
          key={t.value}
          onClick={() => setTone(t.value)}
          className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
            tone === t.value
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="font-medium text-sm">{t.label}</div>
          <div className="text-xs text-gray-500 mt-0.5">{t.description}</div>
        </button>
      ))}
    </div>
  )

  const stepTitles = ['Platform & Format', 'Post Type', 'Details', 'Tone & Voice']
  const canProceed = [canProceedStep1, canProceedStep2, canProceedStep3(), true]

  return (
    <div className="fixed inset-0 bg-ink-primary/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bone-surface border border-sand-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-sand-border">
          <div>
            <h2 className="font-display text-xl text-ink-primary">Create Post with AI</h2>
            <p className="text-sm text-ink-muted mt-0.5">Step {step} of 4 — {stepTitles[step - 1]}</p>
          </div>
          <button onClick={onCancel} className="text-ink-muted hover:text-ink-primary text-xl leading-none transition">×</button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-sand-border/40">
          <div
            className="h-full bg-brand-gold transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Step content (wizard internals — not restyled in this scope; taxonomy refactor will replace) */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-2 p-3 bg-alert/10 border border-alert/30 rounded-lg text-sm text-alert">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-sand-border bg-cream-bg rounded-b-xl">
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : onCancel()}
            className="px-4 py-2 text-sm text-ink-muted hover:text-ink-primary transition"
          >
            {step > 1 ? '← Back' : 'Cancel'}
          </button>
          {step < 4 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed[step - 1]}
              className="px-6 py-2 bg-brand-gold hover:bg-gold-dark text-white text-sm font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-6 py-2 bg-brand-gold hover:bg-gold-dark text-white text-sm font-medium rounded-lg disabled:opacity-40 flex items-center gap-2 transition"
            >
              {loading ? (
                <><span className="animate-spin">⟳</span> Generating...</>
              ) : (
                'Generate Post'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}