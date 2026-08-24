/** Exact string-decimal formatting and comparison helpers. */
/** Add thousands separators while preserving the exact fractional text. */
export function formatDecimal(value: string): string {
  // Keep financial-style decimals as strings when exact digits matter.
  // Add grouping separators without converting the API value to Number.
  const [integer, fraction] = value.split('.')
  const sign = integer.startsWith('-') ? '-' : ''
  const digits = sign ? integer.slice(1) : integer
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return fraction === undefined ? `${sign}${grouped}` : `${sign}${grouped}.${fraction}`
}

/** Shorten long display text at a word-safe end and add an ellipsis. */
export function truncate(value: string, length = 96): string {
  return value.length > length ? `${value.slice(0, length).trimEnd()}…` : value
}

/** Convert a non-negative fixed-point decimal string to a comparable scaled BigInt. */
function scaledInteger(value: string, scale: number): bigint {
  // BigInt comparison gives decimal semantics for known fixed scales.
  const [integer, rawFraction = ''] = value.split('.')
  const fraction = rawFraction.padEnd(scale, '0').slice(0, scale)
  return BigInt(integer) * 10n ** BigInt(scale) + BigInt(fraction || '0')
}

/** Compare exact non-negative decimal strings at the caller's domain scale. */
export function decimalAtLeast(value: string, threshold: string, scale = 2): boolean {
  // Compare non-floating-point decimal strings at a shared fixed scale.
  return scaledInteger(value, scale) >= scaledInteger(threshold, scale)
}
