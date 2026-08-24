/** Typed submission endpoint adapter; UI components do not call fetch directly. */
import { apiFetch } from '@/lib/api-client'
import type {
  DecisionAction,
  SubmissionDetail,
  SubmissionList,
  SubmissionWriteInput,
} from '@/types/api'

export interface ReviewInput {
  action: DecisionAction
  comment?: string
  // Optimistic-concurrency token from the displayed record.
  expected_version: number
}

export const submissionsApi = {
  list: (params: URLSearchParams, signal?: AbortSignal) =>
    apiFetch<SubmissionList>(`/api/submissions?${params.toString()}`, { signal }),
  retrieve: (id: number, signal?: AbortSignal) =>
    apiFetch<SubmissionDetail>(`/api/submissions/${id}`, { signal }),
  create: (input: SubmissionWriteInput) =>
    apiFetch<SubmissionDetail>('/api/submissions', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  update: (id: number, input: SubmissionWriteInput) =>
    apiFetch<SubmissionDetail>(`/api/submissions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  delete: (id: number) =>
    apiFetch<void>(`/api/submissions/${id}`, { method: 'DELETE' }),
  open: (id: number, signal?: AbortSignal) =>
    apiFetch<SubmissionDetail>(`/api/submissions/${id}/open`, { method: 'POST', signal }),
  review: (id: number, input: ReviewInput) =>
    apiFetch<SubmissionDetail>(`/api/submissions/${id}/reviews`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
}
