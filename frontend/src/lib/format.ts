export function formatDecimal(value: string): string {
  const [integer, fraction] = value.split(".")
  const sign = integer.startsWith("-") ? "-" : ""
  const digits = sign ? integer.slice(1) : integer
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return fraction === undefined
    ? `${sign}${grouped}`
    : `${sign}${grouped}.${fraction}`
}

export function truncate(value: string, length = 96): string {
  return value.length > length ? `${value.slice(0, length).trimEnd()}…` : value
}

function scaledInteger(value: string, scale: number): bigint {
  const [integer, rawFraction = ""] = value.split(".")
  const fraction = rawFraction.padEnd(scale, "0").slice(0, scale)
  return BigInt(integer) * 10n ** BigInt(scale) + BigInt(fraction || "0")
}

export function decimalAtLeast(
  value: string,
  threshold: string,
  scale = 2
): boolean {
  return scaledInteger(value, scale) >= scaledInteger(threshold, scale)
}
