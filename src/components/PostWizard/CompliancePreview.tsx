'use client'
import { useEffect, useState } from 'react'
import { getComplianceRulesForLibraryService } from '@/lib/library-queries'
import type { ServiceOption } from './types'

interface ComplianceRule {
  id: string
  rule_code: string
  rule_type: string | null
  applies_to: string | null
  description: string | null
  guidance: string | null
  version: string | null
  effective_date: string | null
}

interface Props {
  services: ServiceOption[]
  serviceId: string
}

/**
 * CompliancePreview - shows the compliance rules Cadence will inject
 * into the post prompt for the selected service.
 *
 * Three states:
 *   1. No service selected: render nothing (zero noise)
 *   2. Custom service (is_custom): gray "no automatic rules" notice
 *   3. Library-linked service: blue panel listing inherited rules
 *
 * This is the moat made visible. Sprint 0 built the inheritance system;
 * this component is what the user actually sees.
 */
export default function CompliancePreview({ services, serviceId }: Props) {
  const [rules, setRules] = useState<ComplianceRule[]>([])
  const [loading, setLoading] = useState(false)
  const [errored, setErrored] = useState(false)

  const service = services.find(s => s.id === serviceId)
  const libServiceId = service?.library?.id ?? null
  const isCustom = service?.is_custom === true || !libServiceId

  useEffect(() => {
    if (!serviceId || isCustom || !libServiceId) {
      setRules([])
      setErrored(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setErrored(false)
    getComplianceRulesForLibraryService(libServiceId)
      .then(data => {
        if (cancelled) return
        setRules((data ?? []) as ComplianceRule[])
      })
      .catch(() => {
        if (cancelled) return
        setErrored(true)
        setRules([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [serviceId, libServiceId, isCustom])

  if (!serviceId) return null

  if (isCustom) {
    return (
      <div className="mt-3 p-3 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-600">
        <div className="font-semibold text-gray-700 mb-0.5">Custom service</div>
        No automatic compliance rules apply to this service. Review the generated post manually before publishing.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mt-3 p-3 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-500">
        Checking compliance rules...
      </div>
    )
  }

  if (errored) {
    return (
      <div className="mt-3 p-3 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-800">
        Could not load compliance rules. Cadence will still attempt to generate, but you should review the output manually.
      </div>
    )
  }

  if (rules.length === 0) {
    return (
      <div className="mt-3 p-3 rounded-lg border border-blue-200 bg-blue-50 text-xs text-blue-800">
        <div className="font-semibold mb-0.5">Library service</div>
        No compliance rules currently apply to this service.
      </div>
    )
  }

  return (
    <div className="mt-3 p-3 rounded-lg border border-blue-200 bg-blue-50">
      <div className="text-xs font-semibold text-blue-900 mb-1.5">
        Cadence is enforcing {rules.length} compliance rule{rules.length === 1 ? '' : 's'} for this post:
      </div>
      <ul className="space-y-1">
        {rules.map(r => (
          <li key={r.id} className="text-xs text-blue-800 flex items-start gap-1.5">
            <span className="text-blue-500 mt-0.5">•</span>
            <span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-blue-600 mr-1">{r.rule_code}</span>
              {r.description ?? r.rule_code}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
