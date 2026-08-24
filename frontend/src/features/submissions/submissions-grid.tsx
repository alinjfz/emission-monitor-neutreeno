/** Responsive card-grid collection for the mobile-friendly queue view. */
import type { ReactNode } from 'react'

import type { Submission } from '@/types/api'

import { SubmissionCard } from './submission-card'
import type { FieldVisibility } from './use-field-visibility'

/** Render submission summaries as a responsive collection of cards. */
export function SubmissionsGrid({
  submissions,
  visibility,
  onSelect,
  renderReview,
}: {
  submissions: Submission[]
  visibility: FieldVisibility
  onSelect: (id: number) => void
  renderReview: (submission: Submission) => ReactNode
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {submissions.map((submission) => (
        <SubmissionCard
          key={submission.id}
          submission={submission}
          visibility={visibility}
          onSelect={onSelect}
          review={renderReview(submission)}
        />
      ))}
    </div>
  )
}
