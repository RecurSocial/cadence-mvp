'use client'
import CompliancePreview from './CompliancePreview'
import type { BranchProps } from './types'

/**
 * BeforeAfterBranch - Step 3 (Details) for the "Before & After" post type.
 *
 * Sub-paths: photo or video.
 * HIPAA consent is required regardless of sub-path - the parent wizard's
 * canProceedStep3() reads consentConfirmed before allowing advance.
 *
 * Photo upload: scaffolded as a placeholder. The real image upload component
 * will be wired in a follow-up step. This is intentional - shipping a
 * visibly-incomplete photo path is more honest than faking working UI.
 */
export default function BeforeAfterBranch({
  services,
  practitioners,
  serviceId,
  setServiceId,
  practitionerId,
  setPractitionerId,
  consentConfirmed,
  setConsentConfirmed,
  beforeAfterMode,
  setBeforeAfterMode,
  videoUrl,
  setVideoUrl,
  videoDescription,
  setVideoDescription,
}: BranchProps) {
  return (
    <div className="space-y-4">
      {/* Sub-path toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Photo or video?
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setBeforeAfterMode('photo')}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              beforeAfterMode === 'photo'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-sm">📷 Photo</div>
            <div className="text-xs text-gray-500 mt-0.5">Side-by-side or carousel</div>
          </button>
          <button
            type="button"
            onClick={() => setBeforeAfterMode('video')}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              beforeAfterMode === 'video'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray00 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-sm">🎬 Video</div>
            <div className="text-xs text-gray-500 mt-0.5">Reel or short clip</div>
          </button>
        </div>
      </div>

      {/* Service dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Which treatment? <span className="text-red-500">*</span>
        </label>
        <select
          value={serviceId}
          onChange={e => setServiceId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a service...</option>
          {services.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.category}){s.is_custom ? ' - Custom' : ''}
            </option>
          ))}
        </select>
        <CompliancePreview services={services} serviceId={serviceId} />
      </div>

      {/* Practitioner dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Which practitioner performed it?
        </label>
        <select
          value={practitionerId}
          onChange={e => setPractitionerId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a practitioner...</option>
          {practitioners.map(p => (
            <option key={p.id} value={p.id}>
              {p.first_name} {p.last_name} ({p.specialty})
            </option>
          ))}
        </select>
      </div>

      {/* Sub-path content */}
      {beforeAfterMode === 'photo' ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Before & after photos
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
            <div className="text-sm text-gray-500">
              Image upload component will mount here
            </div>
            <div className="text-xs text-gray-400 mt-1">
              (Cadence will support side-by-side and carousel layouts)
            </div>
          </div>
        </div>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="Paste a link to the video file or hosted clip"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Describe what happens in the video
            </label>
            <textarea
              value={videoDescription}
              onChange={e => setVideoDescription(e.target.value)}
              placeholder="e.g. 30-second clip showing lip filler results immediately after vs 2 weeks later..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Cadence uses this to write the caption and on-screen text
            </p>
          </div>
        </>
      )}

      {/* HIPAA consent - required for both sub-paths */}
      <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <input
          type="checkbox"
          id="ba_consent"
          checked={consentConfirmed}
          onChange={e => setConsentConfirmed(e.target.checked)}
          className="mt-0.5"
        />
        <label htmlFor="ba_consent" className="text-sm text-amber-800">
          <span className="font-semibold">I confirm client consent has been obtained</span>{' '}
          to share before & after content on social media. Required for HIPAA compliance.
        </label>
      </div>
    </div>
  )
}
