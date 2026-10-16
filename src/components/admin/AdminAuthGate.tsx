import { type FormEvent, type ReactNode, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SupabaseConfigNotice } from '@/components/SupabaseConfigNotice'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdminSession } from '@/hooks/useAdminSession'
import {
  MIN_ADMIN_PASSWORD_LENGTH,
  sendPasswordResetEmail,
  setAdminPassword,
  signInAdmin,
  type AuthResult,
} from '@/lib/adminAuth'
import { cataloguePath, isKnownStoreSlug } from '@/lib/store'
import { supabaseConfigured } from '@/lib/supabase'

type AdminAuthGateProps = {
  children: ReactNode
}

function AuthShell({
  title,
  subtitle,
  slug,
  children,
}: {
  title: string
  subtitle: string
  slug: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-6">
      <div className="w-full max-w-sm space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
      <Link to={cataloguePath(slug)} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
        Back to catalogue
      </Link>
    </div>
  )
}

export function AdminAuthGate({ children }: AdminAuthGateProps) {
  const { storeSlug } = useParams()
  const slug = isKnownStoreSlug(storeSlug) ? storeSlug : 'aksesuaratali'
  const { ready, signedIn, recovering } = useAdminSession()
  // When VITE_ADMIN_EMAIL is set, the sign-in form only asks for the password.
  const configuredEmail = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined)?.trim() ?? ''
  const [typedEmail, setTypedEmail] = useState('')
  const email = configuredEmail || typedEmail
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!supabaseConfigured) {
    return (
      <div className="mx-auto w-full max-w-lg px-6 py-12">
        <SupabaseConfigNotice />
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  async function run(action: () => Promise<AuthResult>, onDone?: () => void) {
    setError(null)
    setInfo(null)
    setSubmitting(true)
    try {
      const result = await action()
      if (result.ok) onDone?.()
      else setError(result.error)
    } catch {
      setError('Something went wrong. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (signedIn && recovering) {
    return (
      <AuthShell title="Set a new password" subtitle="Choose a new admin password." slug={slug}>
        <form
          onSubmit={(event: FormEvent) => {
            event.preventDefault()
            void run(
              () => setAdminPassword(password),
              () => {
                // Reload so the app leaves recovery mode and opens the admin page.
                window.location.replace(window.location.pathname)
              },
            )
          }}
          className="flex w-full max-w-sm flex-col gap-3"
        >
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="New password"
            value={password}
            minLength={MIN_ADMIN_PASSWORD_LENGTH}
            required
            onChange={(event) => setPassword(event.target.value)}
          />
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save password'}
          </Button>
        </form>
      </AuthShell>
    )
  }

  if (signedIn) {
    return <>{children}</>
  }

  return (
    <AuthShell title="Admin sign in" subtitle="Sign in to manage products." slug={slug}>
      <form
        onSubmit={(event: FormEvent) => {
          event.preventDefault()
          void run(
            () => signInAdmin(email, password),
            () => setPassword(''),
          )
        }}
        className="flex w-full max-w-sm flex-col gap-3"
      >
        {configuredEmail ? null : (
          <Input
            type="email"
            name="email"
            autoComplete="username"
            placeholder="Email"
            value={typedEmail}
            required
            onChange={(event) => setTypedEmail(event.target.value)}
          />
        )}
        <Input
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          autoFocus={Boolean(configuredEmail)}
          required
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={error ? true : undefined}
        />
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {info ? <p className="text-sm text-muted-foreground">{info}</p> : null}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={submitting || !email.trim()}
          onClick={() =>
            void run(
              () => sendPasswordResetEmail(email),
              () => setInfo('If that email has an account, a reset link is on its way.'),
            )
          }
        >
          Forgot password?
        </Button>
      </form>
    </AuthShell>
  )
}
