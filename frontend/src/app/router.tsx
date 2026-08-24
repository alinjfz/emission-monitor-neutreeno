import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router'

import { AppProviders } from '@/app/providers'
import { Spinner } from '@/components/ui/spinner'
import { LoginPage } from '@/features/auth/login-page'
import { RegisterPage } from '@/features/auth/register-page'
import { useAuth } from '@/features/auth/use-auth'
import { SubmissionsPage } from '@/features/submissions/submissions-page'

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
