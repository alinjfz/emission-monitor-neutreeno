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

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

export function formatDate(value: string): string {
  return dateFormatter.format(parseDateOnly(value))
}

export function formatDateTime(value: string): string {
  const hasTimeZone = /(?:z|[+-]\d{2}:\d{2})$/i.test(value)
  return dateTimeFormatter.format(new Date(hasTimeZone ? value : `${value}Z`))
}

export function inclusiveDuration(start: string, end: string): number {
  const milliseconds = parseDateOnly(end).getTime() - parseDateOnly(start).getTime()
  return Math.floor(milliseconds / 86_400_000) + 1
}
