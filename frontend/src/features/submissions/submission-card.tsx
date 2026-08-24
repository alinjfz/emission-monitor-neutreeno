import type { KeyboardEvent, ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { formatDate, formatDateTime, inclusiveDuration } from '@/lib/dates'
import { formatDecimal } from '@/lib/format'
import { isHighEmissions, isHighUncertainty } from '@/lib/risks'
import { UNIT_LABELS } from '@/lib/units'
import type { Submission } from '@/types/api'

import { StatusBadge } from './status-badge'
import type { FieldVisibility } from './use-field-visibility'

interface SubmissionCardProps {
  submission: Submission
  visibility: FieldVisibility
  onSelect: (id: number) => void
  review: ReactNode
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  )
}

export function SubmissionCard({ submission, visibility, onSelect, review }: SubmissionCardProps) {
  function keyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(submission.id)
    }
  }

  return (
    <Card
      tabIndex={0}
      className="h-full cursor-pointer gap-0 border-[#e5e5e5] py-0 shadow-none transition-shadow hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      aria-label={`Open ${submission.product.name} details`}
      onClick={() => onSelect(submission.id)}
      onKeyDown={keyDown}
    >
      <CardHeader className="flex-row items-start justify-between gap-4 border-b px-5 py-4">
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-semibold">{submission.product.name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{submission.product.code}</p>
        </div>
        {visibility.status && <StatusBadge status={submission.status} className="shrink-0" />}
      </CardHeader>
      <CardContent className="flex-1 px-5 py-4">
        <dl className="grid grid-cols-2 gap-x-5 gap-y-4">
          {visibility.supplier && <Fact label="Supplier"><span className="text-muted-foreground">{submission.supplier.name}</span></Fact>}
          {visibility.footprint && (
            <Fact label="Footprint">
              <span className="font-medium tabular-nums">{formatDecimal(submission.footprint_value)}</span>
              <span className="block text-xs text-muted-foreground">{UNIT_LABELS[submission.unit_code]}</span>
              {isHighEmissions(submission.footprint_value) && <span className="mt-1 flex items-center gap-1 text-xs font-medium text-[var(--warning-text)]"><TriangleAlert className="size-3" aria-hidden="true" /> High emissions</span>}
            </Fact>
          )}
          {visibility.uncertainty && (
            <Fact label="Uncertainty">
              <span className="tabular-nums">{formatDecimal(submission.uncertainty)}%</span>
              {isHighUncertainty(submission.uncertainty) && <span className="mt-1 flex items-center gap-1 text-xs font-medium text-[var(--warning-text)]"><TriangleAlert className="size-3" aria-hidden="true" /> High uncertainty</span>}
            </Fact>
          )}
          {visibility.period && <Fact label="Period"><span className="text-muted-foreground">{formatDate(submission.period_start)} – {formatDate(submission.period_end)}</span></Fact>}
          {visibility.duration && <Fact label="Duration"><span className="tabular-nums">{inclusiveDuration(submission.period_start, submission.period_end)} days</span></Fact>}
          {visibility.submitted && <Fact label="Submitted"><span className="text-muted-foreground">{formatDate(submission.submitted_at.slice(0, 10))}</span></Fact>}
          {visibility.last_modified && <Fact label="Last modified"><span className="text-muted-foreground">{formatDateTime(submission.last_modified_at)}</span></Fact>}
        </dl>
        {visibility.methodology && (
          <div className="mt-4 border-t pt-4">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Methodology</p>
            <p className="mt-1 line-clamp-3 text-sm leading-5 text-muted-foreground">{submission.methodology}</p>
          </div>
        )}
        {visibility.latest_review && submission.latest_review && (
          <div className="mt-4 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground capitalize">{submission.latest_review.action}</span> by {submission.latest_review.reviewer.name} · {formatDateTime(submission.latest_review.created_at)}
            {submission.latest_review.comment && <p className="mt-1 line-clamp-2">“{submission.latest_review.comment}”</p>}
          </div>
        )}
      </CardContent>
      <CardFooter className="block border-t px-5 py-4">{review}</CardFooter>
    </Card>
  )
}
