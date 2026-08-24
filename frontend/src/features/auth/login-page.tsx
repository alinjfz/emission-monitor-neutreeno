/** Login form that restores the protected URL the user originally requested. */
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { ApiError } from '@/lib/api-client'

import { AuthLayout } from './auth-layout'
import { useAuth } from './use-auth'

/** Collect credentials, authenticate, and restore the originally requested route. */
export function LoginPage() {
  const { user, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/submissions" replace />

  const requested = (location.state as { from?: string } | null)?.from
  // Ignore unexpected router state; protected routes store an app-relative path here.
  const destination = requested?.startsWith('/') ? requested : '/submissions'

  /** Submit credentials while keeping request and failure state local to the form. */
  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login({ email, password })
      navigate(destination, { replace: true })
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Unable to log in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      description="Log in to review footprint submissions."
      footer={
        <>
          Need an account?{' '}
          <Link className="font-medium text-foreground underline underline-offset-4" to="/register" state={location.state}>
            Register
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit} noValidate>
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </div>
        <Button className="h-9 w-full" type="submit" disabled={submitting}>
          {submitting ? <><Spinner /> Logging in</> : 'Log in'}
        </Button>
        <div className="rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Demo reviewer</p>
          <p className="mt-1">Email: <code>a@a.a</code> · Password: <code>1234</code></p>
          <Button
            className="mt-2 h-auto p-0 text-xs"
            type="button"
            variant="link"
            onClick={() => { setEmail('a@a.a'); setPassword('1234') }}
          >
            Use demo credentials
          </Button>
        </div>
      </form>
    </AuthLayout>
  )
}
