/**
 * Shared types for PostWizard branch components.
 *
 * Architecture: state lives in PostWizard/index.tsx (the parent).
 * Branch components receive the relevant slice of state and the matching
 * setters as props. This keeps a single source of truth for form data,
 * preserves selections across branch switches, and lets the parent handle
 * validation + the unified Generate button.
 */

export interface LibraryServiceRef {
  id: string
  name: string
  default_duration_min: number | null
  linked_product_cat: string | null
  notes: string | null
  category: { id: string; name: string } | null
}

export interface ServiceOption {
  id: string
  name: string
  category: string
  appointment_type?: string | null
  is_custom?: boolean
  service_library_id?: string | null
  library?: LibraryServiceRef | null
}

export interface PractitionerOption {
  id: string
  first_name: string
  last_name: string
  specialty: string
}

export interface BranchProps {
  services: ServiceOption[]
  practitioners: PractitionerOption[]

  serviceId: string
  setServiceId: (v: string) => void
  practitionerId: string
  setPractitionerId: (v: string) => void

  consentConfirmed: boolean
  setConsentConfirmed: (v: boolean) => void

  targetConcern: string
  setTargetConcern: (v: string) => void

  patientQuote: string
  setPatientQuote: (v: string) => void

  beforeAfterMode: 'photo' | 'video'
  setBeforeAfterMode: (v: 'photo' | 'video') => void
  videoUrl: string
  setVideoUrl: (v: string) => void
  videoDescription: string
  setVideoDescription: (v: string) => void

  spotlightMode: 'practitioner' | 'testimonial'
  setSpotlightMode: (v: 'practitioner' | 'testimonial') => void
}
