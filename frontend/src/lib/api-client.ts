import type { ApiErrorBody, SubmissionDetail } from "@/types/api"

export class ApiError extends Error {
  status: number
  code: string
  fieldErrors: Record<string, string[]>
  latestSubmission?: SubmissionDetail

  constructor(status: number, body?: ApiErrorBody) {
    super(body?.error.message ?? "The request could not be completed.")
    this.name = "ApiError"
    this.status = status
    this.code = body?.error.code ?? "request_failed"
    this.fieldErrors = body?.error.field_errors ?? {}
    this.latestSubmission = body?.error.latest_submission
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: "include",
  })

  if (response.status === 204) {
    return undefined as T
  }

  const body = (await response.json().catch(() => undefined)) as
    T | ApiErrorBody | undefined
  if (!response.ok) {
    throw new ApiError(response.status, body as ApiErrorBody | undefined)
  }
  return body as T
}
