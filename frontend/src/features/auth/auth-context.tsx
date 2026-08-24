import { createContext, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react'

import { ApiError } from '@/lib/api-client'
import type { User } from '@/types/api'

import { authApi, type LoginInput, type RegisterInput } from './auth-api'

export interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (input: LoginInput) => Promise<User>
  register: (input: RegisterInput) => Promise<User>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    authApi
      .me()
      .then((currentUser) => active && setUser(currentUser))
      .catch((error: unknown) => {
        if (active && (!(error instanceof ApiError) || error.status !== 401)) {
          console.error('Unable to restore session', error)
        }
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (input: LoginInput) => {
    const currentUser = await authApi.login(input)
    setUser(currentUser)
    return currentUser
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const currentUser = await authApi.register(input)
    setUser(currentUser)
    return currentUser
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
