import type { SubmissionDetail, SubmissionWriteInput } from '@/types/api'

export function submissionValues(detail: SubmissionDetail): SubmissionWriteInput {
  return {
    supplier_name: detail.supplier.name,
    product_name: detail.product.name,
    product_code: detail.product.code,
    footprint_value: detail.footprint_value,
    unit_code: detail.unit_code,
    uncertainty: detail.uncertainty,
    period_start: detail.period_start,
    period_end: detail.period_end,
    methodology: detail.methodology,
  }
}
