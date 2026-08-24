import { useState, type FormEvent } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { ApiError } from "@/lib/api-client"

import { AuthLayout } from "./auth-layout"
import { useAuth } from "./use-auth"

export function RegisterPage() {
  const { user, register } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/submissions" replace />

  const requested = (location.state as { from?: string } | null)?.from
  const destination = requested?.startsWith("/") ? requested : "/submissions"

  async function submit(event: FormEvent) {
    event.preventDefault()
    const clientErrors: Record<string, string> = {}
    if (!name.trim()) clientErrors.name = "Enter your name."
    if (!email.trim()) clientErrors.email = "Enter your email address."
    if (password.length < 4)
      clientErrors.password = "Use at least 4 characters."
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors)
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      await register({ name, email, password })
      navigate(destination, { replace: true })
    } catch (caught) {
      if (caught instanceof ApiError) {
        const fields = Object.fromEntries(
          Object.entries(caught.fieldErrors).map(([key, messages]) => [
            key,
            messages[0],
          ])
        )
        setErrors(
          Object.keys(fields).length ? fields : { form: caught.message }
        )
      } else {
        setErrors({ form: "Unable to register. Please try again." })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create an account"
      description="Register as a footprint reviewer."
      footer={
        <>
          Already registered?{" "}
          <Link
            className="font-medium text-foreground underline underline-offset-4"
            to="/login"
            state={location.state}
          >
            Log in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit} noValidate>
        {errors.form && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{errors.form}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name && (
            <p id="name-error" className="text-xs text-destructive">
              {errors.name}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-email">Email</Label>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-xs text-destructive">
              {errors.email}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-password">Password</Label>
          <Input
            id="register-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby="password-help"
          />
          <p
            id="password-help"
            className={
              errors.password
                ? "text-xs text-destructive"
                : "text-xs text-muted-foreground"
            }
          >
            {errors.password ?? "Use at least 4 characters."}
          </p>
        </div>
        <Button className="h-9 w-full" type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Spinner /> Creating account
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </AuthLayout>
  )
}
