import { useEffect, useState } from 'react'
import { Inbox, RefreshCw, SearchX } from 'lucide-react'
import { useSearchParams } from 'react-router'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { ApiError } from '@/lib/api-client'
import type {
  SortDirection,
  SortName,
  StatusFilter,
  Submission,
  SubmissionDetail,
  ViewMode,
} from '@/types/api'

import { AppHeader } from './app-header'
import { ListToolbar } from './list-toolbar'
import { PaginationControls } from './pagination-controls'
import { ReviewComposer } from './review-composer'
import { SubmissionDialog } from './submission-dialog'
import { SubmissionsGrid } from './submissions-grid'
import { SubmissionsLoading } from './submissions-loading'
import { SubmissionsTable } from './submissions-table'
import { submissionsApi } from './submissions-api'
import { useFieldVisibility } from './use-field-visibility'
import { useSubmissionsQuery } from './use-submissions-query'

const statusValues: StatusFilter[] = ['all', 'new', 'pending', 'approved', 'rejected']
const sortValues: SortName[] = ['queue', 'product', 'supplier', 'status', 'footprint', 'uncertainty', 'period_start', 'period_end', 'duration', 'submitted_at', 'last_modified_at']

function positiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function SubmissionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const statusParam = searchParams.get('status') as StatusFilter | null
  const sortParam = searchParams.get('sort') as SortName | null
  const directionParam = searchParams.get('direction') as SortDirection | null
  const viewParam = searchParams.get('view') as ViewMode | null
  const status = statusParam && statusValues.includes(statusParam) ? statusParam : 'all'
  const search = (searchParams.get('search') ?? '').slice(0, 100)
  const sort = sortParam && sortValues.includes(sortParam) ? sortParam : 'queue'
  const direction = directionParam === 'desc' ? 'desc' : 'asc'
  const page = Math.min(10_000, positiveInteger(searchParams.get('page'), 1))
  const requestedPageSize = positiveInteger(searchParams.get('page_size'), 10)
  const pageSize = [10, 20, 50, 100].includes(requestedPageSize) ? requestedPageSize : 10
  const mobileDefault = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  const view = viewParam === 'table' || viewParam === 'cards' ? viewParam : mobileDefault ? 'cards' : 'table'
  const selectedValue = positiveInteger(searchParams.get('selected'), 0)
  const selected = selectedValue > 0 ? selectedValue : null

  const [refreshKey, setRefreshKey] = useState(0)
  const [detailRetryKey, setDetailRetryKey] = useState(0)
  const detailRequestKey = `${selected ?? 'closed'}:${detailRetryKey}`
  const [detailState, setDetailState] = useState<{
    key: string
    detail: SubmissionDetail | null
    error: string
  }>({ key: '', detail: null, error: '' })
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [expandedEditors, setExpandedEditors] = useState<Record<string, boolean>>({})
  const { visibility, setFieldVisible } = useFieldVisibility()
  const { data, loading, error, retry } = useSubmissionsQuery(
    { status, search, sort, direction, page, pageSize },
    refreshKey,
  )

  function updateParams(
    updates: Record<string, string | null>,
    { resetPage = true }: { resetPage?: boolean } = {},
  ) {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') next.delete(key)
      else next.set(key, value)
    }
    if (resetPage) next.set('page', '1')
    setSearchParams(next, { replace: true })
  }

  useEffect(() => {
    if (!data || loading) return
    const lastValidPage = Math.max(1, data.total_pages)
    if (page > lastValidPage) {
      const next = new URLSearchParams(searchParams)
      next.set('page', String(lastValidPage))
      setSearchParams(next, { replace: true })
    }
  }, [data, loading, page, searchParams, setSearchParams])

  useEffect(() => {
    if (selected === null) return
    const controller = new AbortController()
    submissionsApi
      .open(selected, controller.signal)
      .then((opened) => {
        setDetailState({ key: detailRequestKey, detail: opened, error: '' })
        setRefreshKey((current) => current + 1)
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === 'AbortError') return
        const message = caught instanceof ApiError ? caught.message : 'Unable to open this submission.'
        setDetailState({ key: detailRequestKey, detail: null, error: message })
      })
    return () => controller.abort()
  }, [selected, detailRetryKey, detailRequestKey])

  function selectSubmission(id: number) {
    updateParams({ selected: String(id) }, { resetPage: false })
  }

  function closeDetail() {
    updateParams({ selected: null }, { resetPage: false })
  }

  function handleSort(nextSort: SortName) {
    if (nextSort === sort && nextSort !== 'queue') {
      updateParams({ direction: direction === 'asc' ? 'desc' : 'asc' })
      return
    }
    updateParams({ sort: nextSort, direction: 'asc' })
  }

  function setDraft(editorKey: string, value: string) {
    setDrafts((current) => ({ ...current, [editorKey]: value }))
  }

  function setExpanded(editorKey: string, value: boolean) {
    setExpandedEditors((current) => ({ ...current, [editorKey]: value }))
  }

  function handleReviewSuccess(reviewed: SubmissionDetail) {
    if (selected === reviewed.id) closeDetail()
    setRefreshKey((current) => current + 1)
  }

  function handleConflict(latest: SubmissionDetail) {
    if (selected === latest.id) setDetailState({ key: detailRequestKey, detail: latest, error: '' })
    setRefreshKey((current) => current + 1)
  }

  function renderReview(submission: Submission, surface: 'list' | 'detail' = 'list') {
    const editorKey = `${surface}:${submission.id}`
    return (
      <ReviewComposer
        submission={submission}
        draft={drafts[editorKey] ?? ''}
        expanded={expandedEditors[editorKey] ?? false}
        onDraftChange={(value) => setDraft(editorKey, value)}
        onExpandedChange={(value) => setExpanded(editorKey, value)}
        onSuccess={handleReviewSuccess}
        onConflict={handleConflict}
      />
    )
  }

  const filtered = status !== 'all' || Boolean(search)

  return (
    <div className="min-h-screen bg-white">
      <AppHeader />
      <main className="mx-auto max-w-[1480px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Footprint submissions</h1>
          </div>
        </div>

        <ListToolbar
          search={search}
          status={status}
          counts={data?.status_counts}
          sort={sort}
          direction={direction}
          view={view}
          visibility={visibility}
          disabled={Boolean(error)}
          onSearchChange={(value) => updateParams({ search: value || null })}
          onStatusChange={(value) => updateParams({ status: value === 'all' ? null : value })}
          onSortChange={handleSort}
          onDirectionChange={(value) => updateParams({ direction: value })}
          onViewChange={(value) => updateParams({ view: value })}
          onVisibilityChange={setFieldVisible}
        />

        <div className="mt-6">
          {error ? (
            <Alert variant="destructive" className="mx-auto max-w-xl py-5 text-left">
              <RefreshCw aria-hidden="true" />
              <AlertTitle>Submissions could not be loaded</AlertTitle>
              <AlertDescription className="mt-1">{error}</AlertDescription>
              <Button variant="outline" size="sm" className="mt-4" onClick={retry}>Try again</Button>
            </Alert>
          ) : loading && !data ? (
            <SubmissionsLoading view={view} />
          ) : data && data.items.length === 0 ? (
            <Empty className="min-h-80 rounded-xl border bg-[#fafafa]">
              <EmptyHeader>
                <EmptyMedia variant="icon">{filtered ? <SearchX /> : <Inbox />}</EmptyMedia>
                <EmptyTitle>{filtered ? 'No submissions match your filters' : 'No submissions yet'}</EmptyTitle>
                <EmptyDescription>{filtered ? 'Try a different search or clear the active status filter.' : 'Submissions will appear here when they are received.'}</EmptyDescription>
              </EmptyHeader>
              {filtered && <EmptyContent><Button variant="outline" onClick={() => updateParams({ search: null, status: null })}>Clear filters</Button></EmptyContent>}
            </Empty>
          ) : data ? (
            <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'} aria-busy={loading}>
              {view === 'table' ? (
                <SubmissionsTable
                  submissions={data.items}
                  visibility={visibility}
                  sort={sort}
                  direction={direction}
                  onSort={handleSort}
                  onSelect={selectSubmission}
                  renderReview={renderReview}
                />
              ) : (
                <SubmissionsGrid submissions={data.items} visibility={visibility} onSelect={selectSubmission} renderReview={renderReview} />
              )}
              <div className="mt-5">
                <PaginationControls
                  page={data.page}
                  pageSize={data.page_size}
                  total={data.total}
                  totalPages={data.total_pages}
                  onPageChange={(value) => updateParams({ page: String(value) }, { resetPage: false })}
                  onPageSizeChange={(value) => updateParams({ page_size: String(value) })}
                />
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <SubmissionDialog
        selected={selected}
        detail={detailState.key === detailRequestKey ? detailState.detail : null}
        loading={selected !== null && detailState.key !== detailRequestKey}
        error={detailState.key === detailRequestKey ? detailState.error : ''}
        onClose={closeDetail}
        onRetry={() => setDetailRetryKey((current) => current + 1)}
        renderReview={(submission) => renderReview(submission, 'detail')}
      />
    </div>
  )
}
