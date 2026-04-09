import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext({
  session: null,
  user: null,
  loading: true,
})

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (!isMounted) return
      if (!error) {
        setSession(data.session)
      }
      setLoading(false)
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
    }),
    [session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
