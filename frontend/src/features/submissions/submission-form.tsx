/** Controlled create/edit form that preserves decimal input as strings end to end. */
import { useState, type FormEvent } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/lib/api-client'
import type { SubmissionDetail, SubmissionWriteInput } from '@/types/api'

const blankValues: SubmissionWriteInput = {
  supplier_name: '',
  product_name: '',
  product_code: '',
  footprint_value: '',
  unit_code: 'per_item',
  uncertainty: '',
  period_start: '',
  period_end: '',
  methodology: '',
}

/** Render the controlled fields shared by submission creation and editing. */
export function SubmissionForm({
  initialValues,
  submitLabel,
  onSave,
  onSaved,
  onCancel,
  onDelete,
}: {
  initialValues?: SubmissionWriteInput
  submitLabel: string
  onSave: (values: SubmissionWriteInput) => Promise<SubmissionDetail>
  onSaved: (detail: SubmissionDetail) => void
  onCancel: () => void
  onDelete?: () => void
}) {
  const [values, setValues] = useState(initialValues ?? blankValues)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  /** Update one typed form field and clear only its stale server error. */
  function setValue<Key extends keyof SubmissionWriteInput>(
    key: Key,
    value: SubmissionWriteInput[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }))
    // Clear only the field the user is correcting; unrelated server errors remain.
    setFieldErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  /** Validate the cross-field period rule and persist the current form values. */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setFieldErrors({})
    if (values.period_end < values.period_start) {
      // ISO date-only strings are lexicographically sortable in chronological order.
      setFieldErrors({ period_end: ['End date must be on or after the start date.'] })
      return
    }

    setSaving(true)
    try {
      onSaved(await onSave(values))
    } catch (caught) {
      if (caught instanceof ApiError) {
        // Pydantic field paths map directly to the controlled input names.
        setError(caught.message)
        setFieldErrors(caught.fieldErrors)
      } else {
        setError('Unable to save the submission. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  /** Collapse all messages for one field into the shared field-error text shape. */
  function fieldError(name: keyof SubmissionWriteInput) {
    return fieldErrors[name]?.join(' ')
  }

  return (
    <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field data-invalid={Boolean(fieldError('product_name'))}>
          <FieldLabel htmlFor="submission-product-name">Product name</FieldLabel>
          <Input id="submission-product-name" required maxLength={160} value={values.product_name} aria-invalid={Boolean(fieldError('product_name'))} onChange={(event) => setValue('product_name', event.target.value)} />
          <FieldError>{fieldError('product_name')}</FieldError>
        </Field>
        <Field data-invalid={Boolean(fieldError('product_code'))}>
          <FieldLabel htmlFor="submission-product-code">Product code</FieldLabel>
          <Input id="submission-product-code" required maxLength={50} value={values.product_code} aria-invalid={Boolean(fieldError('product_code'))} onChange={(event) => setValue('product_code', event.target.value)} />
          <FieldError>{fieldError('product_code')}</FieldError>
        </Field>
        <Field className="sm:col-span-2" data-invalid={Boolean(fieldError('supplier_name'))}>
          <FieldLabel htmlFor="submission-supplier-name">Supplier</FieldLabel>
          <Input id="submission-supplier-name" required maxLength={140} value={values.supplier_name} aria-invalid={Boolean(fieldError('supplier_name'))} onChange={(event) => setValue('supplier_name', event.target.value)} />
          <FieldError>{fieldError('supplier_name')}</FieldError>
        </Field>
        <Field data-invalid={Boolean(fieldError('footprint_value'))}>
          <FieldLabel htmlFor="submission-footprint">Footprint</FieldLabel>
          <Input id="submission-footprint" type="number" required min="0" max="999999999999.999999" step="0.000001" value={values.footprint_value} aria-invalid={Boolean(fieldError('footprint_value'))} onChange={(event) => setValue('footprint_value', event.target.value)} />
          <FieldError>{fieldError('footprint_value')}</FieldError>
        </Field>
        <Field data-invalid={Boolean(fieldError('unit_code'))}>
          <FieldLabel htmlFor="submission-unit">Unit</FieldLabel>
          <Select value={values.unit_code} onValueChange={(value) => setValue('unit_code', value as SubmissionWriteInput['unit_code'])}>
            <SelectTrigger id="submission-unit" className="w-full" aria-invalid={Boolean(fieldError('unit_code'))}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="per_item">kg CO₂e per item</SelectItem>
              <SelectItem value="per_kg">kg CO₂e per kg</SelectItem>
            </SelectContent>
          </Select>
          <FieldError>{fieldError('unit_code')}</FieldError>
        </Field>
        <Field data-invalid={Boolean(fieldError('uncertainty'))}>
          <FieldLabel htmlFor="submission-uncertainty">Uncertainty (%)</FieldLabel>
          <Input id="submission-uncertainty" type="number" required min="0" max="100" step="0.01" value={values.uncertainty} aria-invalid={Boolean(fieldError('uncertainty'))} onChange={(event) => setValue('uncertainty', event.target.value)} />
          <FieldError>{fieldError('uncertainty')}</FieldError>
        </Field>
        <div className="hidden sm:block" aria-hidden="true" />
        <Field data-invalid={Boolean(fieldError('period_start'))}>
          <FieldLabel htmlFor="submission-period-start">Period start</FieldLabel>
          <Input id="submission-period-start" type="date" required value={values.period_start} aria-invalid={Boolean(fieldError('period_start'))} onChange={(event) => setValue('period_start', event.target.value)} />
          <FieldError>{fieldError('period_start')}</FieldError>
        </Field>
        <Field data-invalid={Boolean(fieldError('period_end'))}>
          <FieldLabel htmlFor="submission-period-end">Period end</FieldLabel>
          <Input id="submission-period-end" type="date" required min={values.period_start} value={values.period_end} aria-invalid={Boolean(fieldError('period_end'))} onChange={(event) => setValue('period_end', event.target.value)} />
          <FieldError>{fieldError('period_end')}</FieldError>
        </Field>
        <Field className="sm:col-span-2" data-invalid={Boolean(fieldError('methodology'))}>
          <FieldLabel htmlFor="submission-methodology">Methodology</FieldLabel>
          <Textarea id="submission-methodology" required maxLength={2000} className="min-h-28 resize-y" value={values.methodology} aria-invalid={Boolean(fieldError('methodology'))} onChange={(event) => setValue('methodology', event.target.value)} />
          <FieldError>{fieldError('methodology')}</FieldError>
        </Field>
      </div>
      {fieldErrors.request && <FieldError>{fieldErrors.request.join(' ')}</FieldError>}
      <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center">
        {onDelete && <Button type="button" variant="destructive" disabled={saving} onClick={onDelete}>Delete</Button>}
        <div className="flex flex-1 justify-end gap-2">
          <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            {saving && <Spinner />}
            {saving ? 'Saving…' : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}
