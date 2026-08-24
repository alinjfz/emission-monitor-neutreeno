/** Public routes, authenticated route protection, and session restoration UI. */
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router'

import { AppProviders } from '@/app/providers'
import { Spinner } from '@/components/ui/spinner'
import { LoginPage } from '@/features/auth/login-page'
import { RegisterPage } from '@/features/auth/register-page'
import { useAuth } from '@/features/auth/use-auth'
import { SubmissionsPage } from '@/features/submissions/submissions-page'

/** Gate the submissions route until session restoration finishes. */
function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center" aria-label="Restoring your session">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner /> Restoring session
        </div>
      </main>
    )
  }
  if (!user) {
    // Keep the attempted URL so login can return the user to the same queue state.
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }
  return <SubmissionsPage />
}

/** Render a small fallback for routes outside the application surface. */
function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Page not found</h1>
        <a className="mt-5 inline-block text-sm font-medium underline underline-offset-4" href="/">
          Return to Emissions Monitor
        </a>
      </div>
    </main>
  )
}

/** Define public authentication routes and the protected submission route. */
export function AppRouter() {
  return (
    <BrowserRouter>
      <AppProviders>
        <Routes>
          <Route path="/" element={<Navigate to="/submissions" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/submissions" element={<ProtectedRoute />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppProviders>
    </BrowserRouter>
  )
}
