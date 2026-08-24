import { useState } from 'react'
import { ChevronDown, MessageSquareText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { formatDateTime } from '@/lib/dates'
import type { ReviewEvent } from '@/types/api'

import { StatusBadge } from './status-badge'

export function ReviewHistory({ events }: { events: ReviewEvent[] }) {
  const [open, setOpen] = useState(true)
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-t pt-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Review history</h3>
          <p className="mt-1 text-xs text-muted-foreground">{events.length} {events.length === 1 ? 'event' : 'events'}, latest first</p>
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" aria-label={open ? 'Collapse review history' : 'Expand review history'}>
            {open ? 'Hide' : 'Show'} <ChevronDown className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="mt-4 space-y-3">
        {events.length === 0 ? (
          <p className="rounded-lg bg-muted/60 p-4 text-sm text-muted-foreground">No review events yet.</p>
        ) : events.map((event) => (
          <article key={event.id} className="rounded-lg border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {event.action === 'opened' ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--info-text)]"><MessageSquareText className="size-3" /> Opened</span>
              ) : (
                <StatusBadge status={event.action} />
              )}
              <time className="text-xs text-muted-foreground" dateTime={event.created_at}>{formatDateTime(event.created_at)}</time>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{event.reviewer.name}</p>
            {event.comment && <p className="mt-2 text-sm leading-5">{event.comment}</p>}
          </article>
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}
