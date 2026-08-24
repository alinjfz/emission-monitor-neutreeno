/** Safe access to the nearest AuthProvider. */
import { useContext } from 'react'

import { AuthContext } from './auth-context'

/** Return authentication state and fail clearly when used outside its provider. */
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return value
}
