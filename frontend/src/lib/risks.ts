/** Product-level warning rules expressed with exact decimal thresholds. */
import { decimalAtLeast } from './format'

export const HIGH_EMISSIONS_THRESHOLD = '30.000000'
export const HIGH_UNCERTAINTY_THRESHOLD = '20.00'

/** Return whether an exact footprint reaches the product warning threshold. */
export function isHighEmissions(value: string): boolean {
  return decimalAtLeast(value, HIGH_EMISSIONS_THRESHOLD, 6)
}

/** Return whether an exact uncertainty reaches the product warning threshold. */
export function isHighUncertainty(value: string): boolean {
  return decimalAtLeast(value, HIGH_UNCERTAINTY_THRESHOLD, 2)
}
