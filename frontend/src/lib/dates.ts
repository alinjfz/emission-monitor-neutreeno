/** UTC-safe parsing and display helpers for server dates and timestamps. */
const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
})

/** Parse an ISO date-only value at UTC midnight without local calendar drift. */
function parseDateOnly(value: string): Date {
  // YYYY-MM-DD has no timezone. Constructing UTC prevents the local offset from
  // shifting the calendar day for users west or east of Greenwich.
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

/** Format an ISO date-only string for the product's British display locale. */
export function formatDate(value: string): string {
  return dateFormatter.format(parseDateOnly(value))
}

/** Format a UTC timestamp, adding its missing zone marker when necessary. */
export function formatDateTime(value: string): string {
  // Backend timestamps are UTC but may arrive without an explicit Z marker.
  const hasTimeZone = /(?:z|[+-]\d{2}:\d{2})$/i.test(value)
  return dateTimeFormatter.format(new Date(hasTimeZone ? value : `${value}Z`))
}

/** Count calendar days inclusively across a validated reporting period. */
export function inclusiveDuration(start: string, end: string): number {
  // Reporting periods include both boundary dates, hence the final +1.
  const milliseconds = parseDateOnly(end).getTime() - parseDateOnly(start).getTime()
  return Math.floor(milliseconds / 86_400_000) + 1
}
