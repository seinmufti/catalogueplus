import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type AdminSessionState = {
  /** False until the stored session (if any) has been read. */
  ready: boolean
  signedIn: boolean
  /** True after the user followed a password-reset email link. */
  recovering: boolean
}

export function useAdminSession(): AdminSessionState {
  const [state, setState] = useState<AdminSessionState>({
    ready: !supabase,
    signedIn: false,
    recovering: false,
  })

  useEffect(() => {
    if (!supabase) return
    let cancelled = false

    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setState((prev) => ({ ...prev, ready: true, signedIn: Boolean(data.session) }))
    })

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setState((prev) => ({
        ready: true,
        signedIn: Boolean(session),
        recovering: event === 'PASSWORD_RECOVERY' ? true : session ? prev.recovering : false,
      }))
    })

    return () => {
      cancelled = true
      data.subscription.unsubscribe()
    }
  }, [])

  return state
}
