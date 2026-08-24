/** Human-readable labels for the API's stable unit codes. */
import type { UnitCode } from '@/types/api'

export const UNIT_LABELS: Record<UnitCode, string> = {
  per_item: 'kg CO₂e / item',
  per_kg: 'kg CO₂e / kg',
}
