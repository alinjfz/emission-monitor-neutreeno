import { apiFetch } from '@/lib/api-client'
import type { DecisionAction, SubmissionDetail, SubmissionList } from '@/types/api'

export interface ReviewInput {
  action: DecisionAction
  comment?: string
  expected_version: number
}

export const submissionsApi = {
  list: (params: URLSearchParams, signal?: AbortSignal) =>
    apiFetch<SubmissionList>(`/api/submissions?${params.toString()}`, { signal }),
  retrieve: (id: number, signal?: AbortSignal) =>
    apiFetch<SubmissionDetail>(`/api/submissions/${id}`, { signal }),
  open: (id: number, signal?: AbortSignal) =>
    apiFetch<SubmissionDetail>(`/api/submissions/${id}/open`, { method: 'POST', signal }),
  review: (id: number, input: ReviewInput) =>
    apiFetch<SubmissionDetail>(`/api/submissions/${id}/reviews`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
}
