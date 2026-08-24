/** Contract regression for mapping API detail data into editable form values. */
import assert from 'node:assert/strict'
import test from 'node:test'

import { submissionValues } from '../src/features/submissions/submission-values.ts'

test('submission form values include editable fields and exclude system-managed fields', () => {
  const values = submissionValues({
    id: 7,
    status: 'approved',
    version: 3,
    product: { id: 3, name: 'Panel', code: 'P-1' },
    supplier: { id: 4, name: 'Supplier' },
    footprint_value: '12.340000',
    unit_code: 'per_item',
    uncertainty: '8.25',
    period_start: '2026-01-01',
    period_end: '2026-01-31',
    methodology: 'Measured data.',
    submitted_at: '2026-02-01T09:00:00Z',
    updated_at: '2026-02-02T09:00:00Z',
    last_modified_at: '2026-02-03T09:00:00Z',
    latest_review: null,
    review_history: [],
  })

  assert.deepEqual(values, {
    supplier_name: 'Supplier',
    product_name: 'Panel',
    product_code: 'P-1',
    footprint_value: '12.340000',
    unit_code: 'per_item',
    uncertainty: '8.25',
    period_start: '2026-01-01',
    period_end: '2026-01-31',
    methodology: 'Measured data.',
  })
  assert.equal('version' in values, false)
  assert.equal('status' in values, false)
})
