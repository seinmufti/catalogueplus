import { type FormEvent, type ReactNode, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  initAdminPassword,
  isAdminAuthenticated,
  setAdminAuthenticated,
  verifyAdminPassword,
} from '@/lib/adminAuth'
import { cataloguePath, isKnownStoreSlug } from '@/lib/store'
import { supabase } from '@/lib/supabase'

type AdminPasswordGateProps = {
  children: ReactNode
}

export function AdminPasswordGate({ children }: AdminPasswordGateProps) {
  const { storeSlug } = useParams()
  const slug = isKnownStoreSlug(storeSlug) ? storeSlug : 'aksesuaratali'
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(() => isAdminAuthenticated(slug))
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    void initAdminPassword(supabase).finally(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (authed) {
    return <>{children}</>
  }

  if (!ready) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    void verifyAdminPassword(password).then((valid) => {
      setSubmitting(false)
      if (valid) {
        setAdminAuthenticated(slug)
        setAuthed(true)
        setPassword('')
        return
      }
      setError('Incorrect password.')
      setPassword('')
    })
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-6">
      <div className="w-full max-w-sm space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Admin sign in</h1>
        <p className="text-sm text-muted-foreground">Enter the admin password to manage products.</p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-3"
        autoComplete="off"
      >
        <Input
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'admin-password-error' : undefined}
        />
        {error ? (
          <p id="admin-password-error" className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Checking…' : 'Continue'}
        </Button>
      </form>
      <Link to={cataloguePath(slug)} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
        Back to catalogue
      </Link>
    </div>
  )
}
