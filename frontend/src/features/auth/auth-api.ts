/** Typed authentication calls built on the application's single fetch wrapper. */
import { apiFetch } from '@/lib/api-client'
import type { User } from '@/types/api'

export interface RegisterInput {
  name: string
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

export const authApi = {
  me: () => apiFetch<User>('/api/auth/me'),
  login: (payload: LoginInput) =>
    apiFetch<User>('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload: RegisterInput) =>
    apiFetch<User>('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => apiFetch<void>('/api/auth/logout', { method: 'POST' }),
}
