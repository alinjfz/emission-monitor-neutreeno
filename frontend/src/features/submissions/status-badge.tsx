import { CircleCheck, CircleDashed, CircleX, Clock3 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SubmissionStatus } from '@/types/api'

const statusConfig = {
  new: { label: 'New', icon: CircleDashed, className: 'border-cyan-200 bg-[var(--info-bg)] text-[var(--info-text)]' },
  pending: { label: 'Pending', icon: Clock3, className: 'border-yellow-200 bg-[var(--warning-bg)] text-[var(--warning-text)]' },
  approved: { label: 'Approved', icon: CircleCheck, className: 'border-green-200 bg-[var(--approve-bg)] text-[var(--approve-text)]' },
  rejected: { label: 'Rejected', icon: CircleX, className: 'border-red-200 bg-[var(--reject-bg)] text-[var(--reject-text)]' },
} satisfies Record<SubmissionStatus, { label: string; icon: typeof CircleCheck; className: string }>

export function StatusBadge({ status, className }: { status: SubmissionStatus; className?: string }) {
  const config = statusConfig[status]
  const Icon = config.icon
  return (
    <Badge variant="outline" className={cn('gap-1 rounded-full px-2 py-0.5 font-medium', config.className, className)}>
      <Icon className="size-3" aria-hidden="true" /> {config.label}
    </Badge>
  )
}
