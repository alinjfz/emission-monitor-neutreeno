/** Review decision control with local drafts and optimistic-conflict recovery. */
import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type MouseEvent } from 'react'
import { Check, X } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/lib/api-client'
import type { DecisionAction, Submission, SubmissionDetail } from '@/types/api'

import { submissionsApi } from './submissions-api'

interface ReviewComposerProps {
  submission: Submission
  draft: string
  expanded: boolean
  onDraftChange: (value: string) => void
  onExpandedChange: (expanded: boolean) => void
  onSuccess: (detail: SubmissionDetail) => void
  onConflict: (detail: SubmissionDetail) => void
  className?: string
}

/**
 * Submit a versioned approval or rejection with an optional comment.
 *
 * A successful decision clears the draft. HTTP 409 replaces stale submission data but
 * deliberately keeps the reviewer's draft so it can be reconsidered and resubmitted.
 */
export function ReviewComposer({
  submission,
  draft,
  expanded,
  onDraftChange,
  onExpandedChange,
  onSuccess,
  onConflict,
  className,
}: ReviewComposerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pendingAction, setPendingAction] = useState<DecisionAction | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!expanded) return

    /** Collapse on an outside pointer without clearing the parent-owned draft. */
    function collapseOnOutsidePointer(event: PointerEvent) {
      if (event.target && !containerRef.current?.contains(event.target as Node)) {
        onExpandedChange(false)
      }
    }

    document.addEventListener('pointerdown', collapseOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', collapseOnOutsidePointer)
  }, [expanded, onExpandedChange])

  /** Keep editor interactions from triggering clickable parent rows or cards. */
  function stopPropagation(event: MouseEvent | KeyboardEvent) {
    event.stopPropagation()
  }

  /** Handle textarea Escape behavior while containing its keyboard events. */
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    stopPropagation(event)
    if (event.key === 'Escape' && !draft) {
      onExpandedChange(false)
    }
  }

  /** Collapse when keyboard focus leaves every control in the composer. */
  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      onExpandedChange(false)
    }
  }

  /** Submit a versioned decision and route conflicts back to the page coordinator. */
  async function decide(action: DecisionAction) {
    const comment = draft.trim() || null
    setError('')
    setPendingAction(action)
    try {
      const detail = await submissionsApi.review(submission.id, {
        action,
        comment: comment ?? undefined,
        expected_version: submission.version,
      })
      onDraftChange('')
      onExpandedChange(false)
      toast.success(action === 'approved' ? 'Submission approved' : 'Submission rejected')
      onSuccess(detail)
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409 && caught.latestSubmission) {
        toast.warning('Another reviewer updated this submission. The latest version is shown.')
        onConflict(caught.latestSubmission)
      } else {
        const message = caught instanceof ApiError ? caught.message : 'Unable to save the review. Please try again.'
        setError(message)
      }
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <div ref={containerRef} className={className} onBlur={handleBlur} onClick={stopPropagation} onKeyDown={stopPropagation}>
      <div className={expanded ? 'space-y-2' : 'space-y-2 sm:flex sm:min-w-[260px] sm:items-center sm:gap-2 sm:space-y-0'}>
        {expanded ? (
          <div className="relative">
            <Textarea
              aria-label={`Comment on ${submission.product.name}`}
              autoFocus
              className="min-h-20 resize-none pr-14"
              maxLength={500}
              placeholder="Add a comment"
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              onKeyDown={handleKeyDown}
            />
            {draft.length >= 400 && (
              <span className="absolute right-2 bottom-2 text-[11px] text-muted-foreground">
                {draft.length}/500
              </span>
            )}
          </div>
        ) : (
          <Input
            aria-label={`Add a comment to ${submission.product.name}`}
            className="h-8 min-w-32 flex-1"
            placeholder="Add a comment"
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            onFocus={() => onExpandedChange(true)}
          />
        )}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <Button
            type="button"
            variant="approve"
            size="sm"
            className="w-full sm:w-auto"
            disabled={pendingAction !== null}
            onClick={() => void decide('approved')}
          >
            {pendingAction === 'approved' ? <Spinner /> : <Check aria-hidden="true" />}
            Approve
          </Button>
          <Button
            type="button"
            variant="reject"
            size="sm"
            className="w-full sm:w-auto"
            disabled={pendingAction !== null}
            onClick={() => void decide('rejected')}
          >
            {pendingAction === 'rejected' ? <Spinner /> : <X aria-hidden="true" />}
            Reject
          </Button>
        </div>
      </div>
      {error && (
        <Alert variant="destructive" className="mt-2 py-2" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
