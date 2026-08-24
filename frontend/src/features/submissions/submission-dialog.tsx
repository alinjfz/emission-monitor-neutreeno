import type { ReactNode } from "react"
import {
  CalendarDays,
  Clock3,
  Leaf,
  Package,
  TriangleAlert,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate, formatDateTime, inclusiveDuration } from "@/lib/dates"
import { formatDecimal } from "@/lib/format"
import { isHighEmissions, isHighUncertainty } from "@/lib/risks"
import { UNIT_LABELS } from "@/lib/units"
import type { SubmissionDetail } from "@/types/api"

import { ReviewHistory } from "./review-history"
import { StatusBadge } from "./status-badge"

function DetailLoading() {
  return (
    <div className="space-y-5 py-2" aria-label="Loading submission detail">
      <Skeleton className="h-7 w-2/3" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}

function DetailFact({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Leaf
  label: string
  children: ReactNode
}) {
  return (
    <div className="rounded-lg border p-3">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        <Icon className="size-3" aria-hidden="true" /> {label}
      </dt>
      <dd className="mt-2 text-sm">{children}</dd>
    </div>
  )
}

export function SubmissionDialog({
  selected,
  detail,
  loading,
  error,
  onClose,
  onRetry,
  renderReview,
}: {
  selected: number | null
  detail: SubmissionDetail | null
  loading: boolean
  error: string
  onClose: () => void
  onRetry: () => void
  renderReview: (submission: SubmissionDetail) => ReactNode
}) {
  return (
    <Dialog
      open={selected !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0 max-sm:inset-0 max-sm:top-0 max-sm:left-0 max-sm:h-[100dvh] max-sm:max-h-none max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none sm:max-w-2xl">
        {loading && (
          <div className="p-6">
            <DetailLoading />
          </div>
        )}
        {!loading && error && (
          <div className="p-6">
            <DialogHeader>
              <DialogTitle>Unable to open submission</DialogTitle>
              <DialogDescription>
                The detail could not be loaded.
              </DialogDescription>
            </DialogHeader>
            <Alert variant="destructive" className="mt-5">
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button className="mt-4" variant="outline" onClick={onRetry}>
              Try again
            </Button>
          </div>
        )}
        {!loading && detail && (
          <>
            <DialogHeader className="border-b px-6 py-5 pr-14">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <DialogTitle className="text-xl leading-tight">
                    {detail.product.name}
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    {detail.product.code} · {detail.supplier.name}
                  </DialogDescription>
                </div>
                <StatusBadge status={detail.status} />
              </div>
            </DialogHeader>
            <div className="space-y-6 px-6 py-5">
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailFact icon={Leaf} label="Footprint">
                  <span className="text-lg font-semibold tabular-nums">
                    {formatDecimal(detail.footprint_value)}
                  </span>{" "}
                  <span className="ml-1 text-xs text-muted-foreground">
                    {UNIT_LABELS[detail.unit_code]}
                  </span>
                  {isHighEmissions(detail.footprint_value) && (
                    <span className="mt-2 flex w-fit items-center gap-1 rounded-full bg-[var(--warning-bg)] px-2 py-1 text-xs font-medium text-[var(--warning-text)]">
                      <TriangleAlert className="size-3" aria-hidden="true" />{" "}
                      High emissions
                    </span>
                  )}
                </DetailFact>
                <DetailFact icon={TriangleAlert} label="Uncertainty">
                  <span className="text-lg font-semibold tabular-nums">
                    {formatDecimal(detail.uncertainty)}%
                  </span>
                  {isHighUncertainty(detail.uncertainty) && (
                    <span className="ml-2 rounded-full bg-[var(--warning-bg)] px-2 py-1 text-xs font-medium text-[var(--warning-text)]">
                      High uncertainty
                    </span>
                  )}
                </DetailFact>
                <DetailFact icon={CalendarDays} label="Reporting period">
                  {formatDate(detail.period_start)} –{" "}
                  {formatDate(detail.period_end)}
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {inclusiveDuration(detail.period_start, detail.period_end)}{" "}
                    inclusive days
                  </span>
                </DetailFact>
                <DetailFact icon={Package} label="Submitted">
                  {formatDate(detail.submitted_at.slice(0, 10))}
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Version {detail.version}
                  </span>
                </DetailFact>
                <DetailFact icon={Clock3} label="Last modified">
                  {formatDateTime(detail.last_modified_at)}
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Latest review activity or submission time
                  </span>
                </DetailFact>
              </dl>

              <section>
                <h3 className="text-sm font-semibold">Methodology</h3>
                <p className="mt-2 rounded-lg bg-muted/60 p-4 text-sm leading-6 text-muted-foreground">
                  {detail.methodology}
                </p>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold">
                  Review submission
                </h3>
                {renderReview(detail)}
              </section>

              <ReviewHistory key={detail.id} events={detail.review_history} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
