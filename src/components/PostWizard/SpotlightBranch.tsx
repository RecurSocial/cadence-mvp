'use client'
import CompliancePreview from './CompliancePreview'
import type { BranchProps } from './types'

/**
 * SpotlightBranch - Step 3 (Details) for the "Spotlight" post type.
 *
 * Sub-paths:
 *   - practitioner: highlight a team member. Cadence pulls their
 *     certifications and role from the practitioners table on the API side;
 *     the component only needs to send practitioner_id.
 *   - testimonial: share a patient experience tied to a service. Optional
 *     direct quote, with a required consent checkbox if a quote is provided.
 *
 * Validation note: the parent's canProceedStep3() does not currently gate
 * on this branch. We rely on per-field "required" indicators in the UI and
 * the consent checkbox is enforced in handleGenerate's payload. If we want
 * hard validation later, add a spotlight case to canProceedStep3().
 */
export default function SpotlightBranch({
  services,
  practitioners,
  serviceId,
  setServiceId,
  practitionerId,
  setPractitionerId,
  consentConfirmed,
  setConsentConfirmed,
  patientQuote,
  setPatientQuote,
  spotlightMode,
  setSpotlightMode,
}: BranchProps) {
  return (
    <div className="space-y-4">
      {/* Sub-path toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What kind of spotlight?
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setSpotlightMode('practitioner')}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              spotlightMode === 'practitioner'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-sm">👩‍⚕️ Practitioner</div>
            <div className="text-xs text-gray-500 mt-0.5">Highlight a team member</div>
          </button>
          <button
            type="button"
            onClick={() => setSpotlightMode('testimonial')}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              spotlightMode === 'testimonial'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-sm">💬 Testimonial</div>
            <div className="text-xs text-gray-500 mt-0.5">Share a patient experience</div>
          </button>
        </div>
      </div>

      {/* Practitioner sub-path */}
      {spotlightMode === 'practitioner' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Who are we spotlighting? <span className="text-red-500">*</span>
            </label>
            <select
              value={practitionerId}
              onChange={e => setPractitionerId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-noneocus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a practitioner...</option>
              {practitioners.map(p => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name} ({p.specialty})
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-500">
            Cadence will automatically pull their certifications and role from your database to personalize the content.
          </p>
        </>
      )}

      {/* Testimonial sub-path */}
      {spotlightMode === 'testimonial' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Which service? <span className="text-red-500">*</span>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient quote (optional)
            </label>
            <textarea
              value={patientQuote}
              onChange={e => setPatientQuote(e.target.value)}
              placeholder='e.g. "I was nervous about my first treatment, but the team made me feel completely at ease..."'
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              If provided, Cadence will weave this into the post. Leave blank to let Cadence generate a representative quote.
            </p>
          </div>

          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <input
              type="checkbox"
              id="spotlight_consent"
              checked={consentConfirmed}
              onChange={e => setConsentConfirmed(e.target.checked)}
              className="mt-0.5"
            />
            <label htmlFor="spotlight_consent" className="text-sm text-amber-800">
              <span className="font-semibold">I confirm consent has been obtained</span>{' '}
              to share this patient&apos;s experience{patientQuote ? ' and quote' : ''} on social media. Required for HIPAA compliance.
            </label>
          </div>
        </>
      )}
    </div>
  )
}
