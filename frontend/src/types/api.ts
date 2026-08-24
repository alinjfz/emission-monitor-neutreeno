export type SubmissionStatus = 'new' | 'pending' | 'approved' | 'rejected'
export type StatusFilter = 'all' | SubmissionStatus
export type UnitCode = 'per_item' | 'per_kg'
export type ReviewAction = 'opened' | 'approved' | 'rejected'
export type DecisionAction = 'approved' | 'rejected'
export type ViewMode = 'table' | 'cards'
export type SortDirection = 'asc' | 'desc'
export type SortName =
  | 'queue'
  | 'product'
  | 'supplier'
  | 'status'
  | 'footprint'
  | 'uncertainty'
  | 'period_start'
  | 'period_end'
  | 'duration'
  | 'submitted_at'
  | 'last_modified_at'

export interface User {
  id: number
  name: string
  email: string
  role: string
}

export interface Product {
  id: number
  name: string
  code: string
}

export interface Supplier {
  id: number
  name: string
}

export interface Reviewer {
  id: number
  name: string
}

export interface ReviewEvent {
  id: number
  action: ReviewAction
  comment: string | null
  created_at: string
  reviewer: Reviewer
}

export interface Submission {
  id: number
  status: SubmissionStatus
  version: number
  product: Product
  supplier: Supplier
  footprint_value: string
  unit_code: UnitCode
  uncertainty: string
  period_start: string
  period_end: string
  methodology: string
  submitted_at: string
  updated_at: string
  last_modified_at: string
  latest_review: ReviewEvent | null
}

export interface SubmissionDetail extends Submission {
  review_history: ReviewEvent[]
}

export interface StatusCounts {
  all: number
  new: number
  pending: number
  approved: number
  rejected: number
}

export interface SubmissionList {
  items: Submission[]
  page: number
  page_size: number
  total: number
  total_pages: number
  status_counts: StatusCounts
}

export interface ApiErrorBody {
  error: {
    code: string
    message: string
    field_errors?: Record<string, string[]>
    latest_submission?: SubmissionDetail
  }
}
