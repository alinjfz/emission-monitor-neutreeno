import { apiFetch } from '@/lib/api-client'

export const developerApi = {
  reseedDatabase: () => apiFetch<void>('/api/debug/reseed', { method: 'POST' }),
}
