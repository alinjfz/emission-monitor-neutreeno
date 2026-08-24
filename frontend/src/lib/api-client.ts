/** Single fetch boundary for cookies, JSON decoding, and the API error envelope. */
import type { ApiErrorBody, SubmissionDetail } from '@/types/api'

export class ApiError extends Error {
  /** Structured failure that lets forms and conflicts respond without parsing text. */
  status: number
  code: string
  fieldErrors: Record<string, string[]>
  latestSubmission?: SubmissionDetail

  /** Normalize an optional server error body into predictable client fields. */
  constructor(status: number, body?: ApiErrorBody) {
    super(body?.error.message ?? 'The request could not be completed.')
    this.name = 'ApiError'
    this.status = status
    this.code = body?.error.code ?? 'request_failed'
    this.fieldErrors = body?.error.field_errors ?? {}
    this.latestSubmission = body?.error.latest_submission
  }
}

/** Send an authenticated API request and decode success or structured failure. */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Callers pass JSON strings, but do not need to repeat the content type everywhere.
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(path, {
    ...options,
    headers,
    // HTTP-only blocks JavaScript reads, not browser-managed sending.
    credentials: 'include',
  })

  if (response.status === 204) {
    // A 204 has no JSON body; callers express that result as void.
    return undefined as T
  }

  // Error pages or proxies may return non-JSON, so decoding failure remains safe.
  const body = (await response.json().catch(() => undefined)) as T | ApiErrorBody | undefined
  if (!response.ok) {
    throw new ApiError(response.status, body as ApiErrorBody | undefined)
  }
  return body as T
}
