import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { setDemoUserScope } from './demoStore'

type AuthState = { user: User | null; loading: boolean }
const AuthContext = createContext<AuthState>({ user: null, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: Boolean(supabase) })
  useEffect(() => {
    if (!supabase) { setState({ user: null, loading: false }); return }
    let alive = true
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      setDemoUserScope(session?.user.id ?? null)
      if (alive) setState({ user: session?.user ?? null, loading: false })
    })
    void supabase.auth.getSession().then(({ data, error }) => {
      setDemoUserScope(error ? null : data.session?.user.id ?? null)
      if (alive) setState({ user: error ? null : data.session?.user ?? null, loading: false })
    })
    return () => { alive = false; listener.subscription.unsubscribe() }
  }, [])
  const value = useMemo(() => state, [state])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() { return useContext(AuthContext) }
