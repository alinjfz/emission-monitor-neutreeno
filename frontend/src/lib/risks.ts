import { decimalAtLeast } from "./format"

export const HIGH_EMISSIONS_THRESHOLD = "30.000000"
export const HIGH_UNCERTAINTY_THRESHOLD = "20.00"

export function isHighEmissions(value: string): boolean {
  return decimalAtLeast(value, HIGH_EMISSIONS_THRESHOLD, 6)
}

export function isHighUncertainty(value: string): boolean {
  return decimalAtLeast(value, HIGH_UNCERTAINTY_THRESHOLD, 2)
}
