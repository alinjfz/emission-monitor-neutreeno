/** Dense, sortable desktop representation of submission summaries. */
import type { ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, TriangleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, formatDateTime, inclusiveDuration } from '@/lib/dates'
import { formatDecimal, truncate } from '@/lib/format'
import { isHighEmissions, isHighUncertainty } from '@/lib/risks'
import { UNIT_LABELS } from '@/lib/units'
import type { SortDirection, SortName, Submission } from '@/types/api'

import { StatusBadge } from './status-badge'
import type { FieldVisibility } from './use-field-visibility'

interface SubmissionsTableProps {
  submissions: Submission[]
  visibility: FieldVisibility
  sort: SortName
  direction: SortDirection
  onSort: (sort: SortName) => void
  onSelect: (id: number) => void
  renderReview: (submission: Submission) => ReactNode
}

/** Render a column header that reports and changes its server-side sort state. */
function SortHeader({
  label,
  name,
  activeSort,
  direction,
  onSort,
}: {
  label: string
  name: SortName
  activeSort: SortName
  direction: SortDirection
  onSort: (name: SortName) => void
}) {
  // Clicking the active column toggles direction in the page coordinator.
  const active = name === activeSort
  const Icon = !active ? ArrowUpDown : direction === 'asc' ? ArrowUp : ArrowDown
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-2 h-7 px-2 text-xs text-muted-foreground"
      onClick={() => onSort(name)}
    >
      {label} <Icon className="size-3" aria-hidden="true" />
      <span className="sr-only">{active ? `sorted ${direction}` : 'not sorted'}</span>
    </Button>
  )
}

/** Render a dense queue table using the user's optional-field visibility choices. */
export function SubmissionsTable({
  submissions,
  visibility,
  sort,
  direction,
  onSort,
  onSelect,
  renderReview,
}: SubmissionsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <Table className="min-w-[1180px]">
        <TableHeader>
          <TableRow className="bg-[#fafafa] hover:bg-[#fafafa]">
            <TableHead className="min-w-52"><SortHeader label="Product" name="product" activeSort={sort} direction={direction} onSort={onSort} /></TableHead>
            {visibility.supplier && <TableHead><SortHeader label="Supplier" name="supplier" activeSort={sort} direction={direction} onSort={onSort} /></TableHead>}
            {visibility.status && <TableHead><SortHeader label="Status" name="status" activeSort={sort} direction={direction} onSort={onSort} /></TableHead>}
            {visibility.footprint && <TableHead><SortHeader label="Footprint" name="footprint" activeSort={sort} direction={direction} onSort={onSort} /></TableHead>}
            {visibility.uncertainty && <TableHead><SortHeader label="Uncertainty" name="uncertainty" activeSort={sort} direction={direction} onSort={onSort} /></TableHead>}
            {visibility.period && <TableHead><SortHeader label="Period" name="period_end" activeSort={sort} direction={direction} onSort={onSort} /></TableHead>}
            {visibility.duration && <TableHead><SortHeader label="Duration" name="duration" activeSort={sort} direction={direction} onSort={onSort} /></TableHead>}
            {visibility.submitted && <TableHead><SortHeader label="Submitted" name="submitted_at" activeSort={sort} direction={direction} onSort={onSort} /></TableHead>}
            {visibility.last_modified && <TableHead><SortHeader label="Last modified" name="last_modified_at" activeSort={sort} direction={direction} onSort={onSort} /></TableHead>}
            {visibility.methodology && <TableHead className="min-w-72">Methodology</TableHead>}
            {visibility.latest_review && <TableHead className="min-w-56">Latest review</TableHead>}
            <TableHead className="min-w-[330px]">Review</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission) => (
            <TableRow
              key={submission.id}
              className="align-top"
            >
              <TableCell>
                <button
                  type="button"
                  className="group -m-1 block rounded-sm p-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  aria-label={`Open ${submission.product.name} details`}
                  onClick={() => onSelect(submission.id)}
                >
                  <span className="block font-medium text-foreground group-hover:underline group-hover:underline-offset-2">{submission.product.name}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{submission.product.code}</span>
                </button>
              </TableCell>
              {visibility.supplier && <TableCell className="text-muted-foreground">{submission.supplier.name}</TableCell>}
              {visibility.status && <TableCell><StatusBadge status={submission.status} /></TableCell>}
              {visibility.footprint && (
                <TableCell>
                  <p className="font-medium tabular-nums">{formatDecimal(submission.footprint_value)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{UNIT_LABELS[submission.unit_code]}</p>
                  {isHighEmissions(submission.footprint_value) && (
                    <span className="mt-1 flex items-center gap-1 text-xs font-medium text-[var(--warning-text)]">
                      <TriangleAlert className="size-3" aria-hidden="true" /> High emissions
                    </span>
                  )}
                </TableCell>
              )}
              {visibility.uncertainty && (
                <TableCell>
                  <span className="tabular-nums">{formatDecimal(submission.uncertainty)}%</span>
                  {isHighUncertainty(submission.uncertainty) && (
                    <span className="mt-1 flex items-center gap-1 text-xs font-medium text-[var(--warning-text)]">
                      <TriangleAlert className="size-3" aria-hidden="true" /> High
                    </span>
                  )}
                </TableCell>
              )}
              {visibility.period && <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(submission.period_start)}<br />to {formatDate(submission.period_end)}</TableCell>}
              {visibility.duration && <TableCell className="whitespace-nowrap tabular-nums">{inclusiveDuration(submission.period_start, submission.period_end)} days</TableCell>}
              {visibility.submitted && <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(submission.submitted_at.slice(0, 10))}</TableCell>}
              {visibility.last_modified && <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(submission.last_modified_at)}</TableCell>}
              {visibility.methodology && (
                <TableCell className="max-w-72 whitespace-normal text-muted-foreground">
                  <p className="line-clamp-3 leading-5" title={submission.methodology}>{submission.methodology}</p>
                </TableCell>
              )}
              {visibility.latest_review && (
                <TableCell className="max-w-56 whitespace-normal text-xs text-muted-foreground">
                  {submission.latest_review ? (
                    <div className="space-y-1">
                      <p><span className="font-medium text-foreground capitalize">{submission.latest_review.action}</span> by {submission.latest_review.reviewer.name}</p>
                      <p>{formatDateTime(submission.latest_review.created_at)}</p>
                      {submission.latest_review.comment && <p title={submission.latest_review.comment}>“{truncate(submission.latest_review.comment)}”</p>}
                    </div>
                  ) : (
                    <span aria-label="No review activity">—</span>
                  )}
                </TableCell>
              )}
              <TableCell>{renderReview(submission)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
