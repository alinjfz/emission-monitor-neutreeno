import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { SubmissionDetail } from '@/types/api'

import { SubmissionForm } from './submission-form'
import { submissionsApi } from './submissions-api'

export function CreateSubmissionDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (detail: SubmissionDetail) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add submission</DialogTitle>
          <DialogDescription>Status, review history, timestamps, and version are managed automatically.</DialogDescription>
        </DialogHeader>
        <SubmissionForm
          submitLabel="Add submission"
          onSave={submissionsApi.create}
          onCancel={() => onOpenChange(false)}
          onSaved={(detail) => {
            toast.success('Submission added')
            onCreated(detail)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
