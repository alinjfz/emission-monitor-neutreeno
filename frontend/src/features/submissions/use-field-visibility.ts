import { useCallback, useState } from 'react'

export const OPTIONAL_FIELDS = [
  'supplier',
  'status',
  'footprint',
  'uncertainty',
  'period',
  'duration',
  'submitted',
  'last_modified',
  'methodology',
  'latest_review',
] as const

export type OptionalField = (typeof OPTIONAL_FIELDS)[number]
export type FieldVisibility = Record<OptionalField, boolean>

export const FIELD_LABELS: Record<OptionalField, string> = {
  supplier: 'Supplier',
  status: 'Status',
  footprint: 'Footprint',
  uncertainty: 'Uncertainty',
  period: 'Period',
  duration: 'Duration',
  submitted: 'Submitted',
  last_modified: 'Last modified',
  methodology: 'Methodology',
  latest_review: 'Latest review',
}

const STORAGE_KEY = 'emissions-monitor-field-visibility'
const defaults: FieldVisibility = {
  supplier: true,
  status: true,
  footprint: true,
  uncertainty: true,
  period: true,
  duration: false,
  submitted: false,
  last_modified: true,
  methodology: false,
  latest_review: false,
}

function initialVisibility(): FieldVisibility {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<FieldVisibility>
    return { ...defaults, ...stored }
  } catch {
    return defaults
  }
}

export function useFieldVisibility() {
  const [visibility, setVisibility] = useState<FieldVisibility>(initialVisibility)

  const setFieldVisible = useCallback((field: OptionalField, visible: boolean) => {
    setVisibility((current) => {
      const next = { ...current, [field]: visible }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { visibility, setFieldVisible }
}
